import difflib
import threading
from pathlib import Path
from typing import Optional

import cv2
import imagehash
import numpy as np
from PIL import Image

LOGOS_DIR = Path(r"C:\Users\bdalr\Desktop\images\Images")

# Authorised email domains per company — a posting user must have one of these domains
COMPANY_DOMAINS: dict[str, list[str]] = {
    "Conquer Properties":   ["conquerproperties.com", "conquer.eg"],
    "Green Home":           ["greenhome.com", "green-home.eg"],
    "New Avenue":           ["newavenue.com", "newavenue.eg"],
    "Property Hills":       ["propertyhills.com", "propertyhills.eg"],
    "Summit Real Estate":   ["summitrealestate.com", "summit-re.eg"],
}

LOGO_DETECTION_THRESHOLD = 0.2   # confidence above this → a logo was found
ORB_FEATURES = 500
LOWE_RATIO = 0.75
CONFIDENCE_SCALE = 60
HASH_SIMILARITY_THRESHOLD = 15
TEMPLATE_SCALES = [0.15, 0.25, 0.4, 0.6, 0.85, 1.0]
TEMPLATE_THRESHOLD = 0.5
OCR_NAME_SIMILARITY = 0.6   # difflib ratio to accept a company name match from OCR text
FRAUD_CONFIDENCE_THRESHOLD = 0.2


class BrandProtectionService:
    def __init__(self):
        self.orb = cv2.ORB_create(nfeatures=ORB_FEATURES)
        self.matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        self.references: dict[str, dict] = {}
        self._ocr_reader = None
        self._ocr_lock = threading.Lock()
        self._load_references()

    # ------------------------------------------------------------------
    # Reference logo loading
    # ------------------------------------------------------------------

    def _load_references(self):
        if not LOGOS_DIR.exists():
            return
        for company_dir in sorted(LOGOS_DIR.iterdir()):
            if not company_dir.is_dir():
                continue
            logo_path = company_dir / "logo.png"
            if not logo_path.exists():
                continue
            bgr = cv2.imread(str(logo_path))
            if bgr is None:
                continue
            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
            _, des = self.orb.detectAndCompute(gray, None)
            pil = Image.open(str(logo_path)).convert("RGB")
            self.references[company_dir.name] = {
                "bgr": bgr,
                "gray": gray,
                "descriptors": des,
                "phash": imagehash.phash(pil),
            }

    # ------------------------------------------------------------------
    # Lazy OCR reader (first call downloads EasyOCR model weights)
    # ------------------------------------------------------------------

    def _get_ocr(self):
        if self._ocr_reader is None:
            with self._ocr_lock:
                if self._ocr_reader is None:
                    import easyocr
                    # verbose=False suppresses the download progress bar that uses Unicode
                    # block chars incompatible with Windows cp1252 terminals
                    self._ocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        return self._ocr_reader

    # ------------------------------------------------------------------
    # Individual scoring methods
    # ------------------------------------------------------------------

    def _orb_score(self, des_query: Optional[np.ndarray], des_ref: Optional[np.ndarray]) -> int:
        if des_query is None or des_ref is None or len(des_query) < 2 or len(des_ref) < 2:
            return 0
        matches = self.matcher.knnMatch(des_query, des_ref, k=2)
        return sum(
            1 for pair in matches
            if len(pair) == 2 and pair[0].distance < LOWE_RATIO * pair[1].distance
        )

    def _template_score(self, scene_gray: np.ndarray, logo_gray: np.ndarray) -> float:
        """Multi-scale template matching — finds logo watermark inside a larger scene."""
        sh, sw = scene_gray.shape
        lh, lw = logo_gray.shape
        best = 0.0
        for scale in TEMPLATE_SCALES:
            tw = max(8, int(lw * scale))
            th = max(8, int(lh * scale))
            if tw > sw or th > sh:
                continue
            template = cv2.resize(logo_gray, (tw, th))
            res = cv2.matchTemplate(scene_gray, template, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, _ = cv2.minMaxLoc(res)
            if max_val > best:
                best = max_val
        return best

    @staticmethod
    def _fuzzy_word_match(word: str, text_words: list[str], threshold: float = 0.75) -> bool:
        """Return True if `word` fuzzy-matches any token in text_words."""
        for tw in text_words:
            if difflib.SequenceMatcher(None, word, tw).ratio() >= threshold:
                return True
        return False

    def _ocr_score(self, image_bgr: np.ndarray) -> dict[str, float]:
        """
        Run OCR on the image and match extracted text against known company names.
        Uses fuzzy word matching to handle common OCR character errors (e.g. 'HLLS' → 'HILLS').
        Returns {company_name: similarity_score} for matches above threshold.
        """
        reader = self._get_ocr()
        results = reader.readtext(image_bgr, detail=0, paragraph=True)
        full_text = " ".join(results).lower()
        text_words = full_text.split()

        scores: dict[str, float] = {}
        for company in self.references:
            name_lower = company.lower()

            # Exact substring match
            if name_lower in full_text:
                scores[company] = 1.0
                continue

            # Fuzzy word-coverage: fraction of company's meaningful words found
            words = [w for w in name_lower.split() if len(w) > 3]
            if not words:
                continue

            hits = sum(1 for w in words if self._fuzzy_word_match(w, text_words))
            word_coverage = hits / len(words)

            # Sequence similarity against the full OCR text
            seq_ratio = difflib.SequenceMatcher(None, name_lower, full_text).ratio()

            combined = word_coverage * 0.8 + seq_ratio * 0.2
            if word_coverage >= 0.5 and combined >= OCR_NAME_SIMILARITY:
                scores[company] = combined

        return scores

    # ------------------------------------------------------------------
    # Combined matching
    # ------------------------------------------------------------------

    def _best_match(
        self,
        scene_bgr: np.ndarray,
        scene_gray: np.ndarray,
        des_query: Optional[np.ndarray],
        pil_query: Image.Image,
    ) -> tuple[Optional[str], float]:
        best_company: Optional[str] = None
        best_score = 0.0

        ocr_scores = self._ocr_score(scene_bgr)

        for company, ref in self.references.items():
            orb = self._orb_score(des_query, ref["descriptors"])
            dist = imagehash.phash(pil_query) - ref["phash"]
            hash_score = max(0, HASH_SIMILARITY_THRESHOLD - dist) * 2

            tmpl_raw = self._template_score(scene_gray, ref["gray"])
            tmpl_score = int(tmpl_raw * 40) if tmpl_raw >= TEMPLATE_THRESHOLD else 0

            # OCR text match carries strong weight
            ocr = int(ocr_scores.get(company, 0.0) * 50)

            combined = orb + hash_score + tmpl_score + ocr
            if combined > best_score:
                best_score = combined
                best_company = company

        confidence = min(best_score / CONFIDENCE_SCALE, 1.0) if best_score > 0 else 0.0
        return best_company, round(confidence, 4)

    def _decode(self, image_bytes: bytes) -> tuple[Optional[np.ndarray], Optional[np.ndarray], Optional[Image.Image]]:
        nparr = np.frombuffer(image_bytes, np.uint8)
        bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if bgr is None:
            return None, None, None
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        pil = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
        return bgr, gray, pil

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def detect(self, image_bytes: bytes) -> dict:
        bgr, gray, pil = self._decode(image_bytes)
        if bgr is None:
            return {
                "company_name": None,
                "confidence_score": 0.0,
                "is_fraudulent": True,
                "reason": "Could not decode image",
            }

        # Images smaller than 16×16 can't be processed by ORB/template matching
        if bgr.shape[0] < 16 or bgr.shape[1] < 16:
            return {
                "company_name": None,
                "confidence_score": 0.0,
                "is_fraudulent": False,
                "reason": "Image too small for logo detection",
            }

        try:
            _, des = self.orb.detectAndCompute(gray, None)
        except Exception:
            des = None
        company, confidence = self._best_match(bgr, gray, des, pil)

        is_fraudulent = confidence < FRAUD_CONFIDENCE_THRESHOLD
        reason = (
            f"Logo matches '{company}' (confidence {confidence:.0%})"
            if not is_fraudulent
            else "No recognizable company logo detected — listing may be fraudulent"
        )

        return {
            "company_name": company if not is_fraudulent else None,
            "confidence_score": confidence,
            "is_fraudulent": is_fraudulent,
            "reason": reason,
        }

    def validate(self, image_bytes: bytes, claimed_company: str) -> dict:
        result = self.detect(image_bytes)
        detected = result["company_name"]
        confidence = result["confidence_score"]

        if result["is_fraudulent"]:
            return {"claimed_company": claimed_company, **result}

        names_match = detected and detected.lower() == claimed_company.strip().lower()
        is_fraudulent = not names_match
        reason = (
            f"Logo matches claimed company '{claimed_company}'"
            if names_match
            else f"Logo matches '{detected}' but listing claims '{claimed_company}' — possible fraud"
        )

        return {
            "claimed_company": claimed_company,
            "company_name": detected,
            "confidence_score": confidence,
            "is_fraudulent": is_fraudulent,
            "reason": reason,
        }

    def list_companies(self) -> list[str]:
        return list(self.references.keys())

    def check_owner(self, image_bytes: bytes, user_email: str) -> dict:
        """
        Detect any company logo in the image and verify the poster's email domain
        is authorised to post listings for that company.

        Returns:
          blocked       – True when a logo is found but the domain doesn't match
          company_detected – name of the matched company (or None)
          confidence    – detection confidence
          user_domain   – extracted email domain
          reason        – human-readable explanation
        """
        try:
            result = self.detect(image_bytes)
        except Exception:
            return {
                "blocked": False,
                "company_detected": None,
                "confidence": 0.0,
                "user_domain": None,
                "reason": "Brand detection skipped (processing error)",
            }
        company   = result["company_name"]
        confidence = result["confidence_score"]

        # No recognisable company logo → anyone may post
        if not company or confidence < LOGO_DETECTION_THRESHOLD:
            return {
                "blocked": False,
                "company_detected": None,
                "confidence": confidence,
                "user_domain": None,
                "reason": "No company logo detected — listing is allowed",
            }

        user_domain = user_email.split("@")[-1].lower() if "@" in user_email else ""
        allowed     = [d.lower() for d in COMPANY_DOMAINS.get(company, [])]
        authorised  = any(
            user_domain == d or user_domain.endswith("." + d)
            for d in allowed
        )

        if authorised:
            reason = (
                f"Logo belongs to '{company}' and your domain ({user_domain}) is authorised — listing allowed"
            )
        else:
            reason = (
                f"Logo detected for '{company}' but your email domain ({user_domain}) is not authorised. "
                f"Only accounts with domains {allowed} may post listings containing this company's logo."
            )

        return {
            "blocked": not authorised,
            "company_detected": company,
            "confidence": confidence,
            "user_domain": user_domain,
            "expected_domains": allowed,
            "reason": reason,
        }
