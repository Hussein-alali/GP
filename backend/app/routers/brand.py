from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.brand_protection import BrandProtectionService

router = APIRouter()
_service = BrandProtectionService()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 10


def _validate_upload(image: UploadFile) -> bytes:
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are accepted")
    data = image.file.read()
    if len(data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image must be under {MAX_SIZE_MB} MB")
    return data


@router.get("/companies")
def list_companies():
    """Return all registered company names."""
    return {"companies": _service.list_companies()}


@router.post("/detect")
async def detect_logo(image: UploadFile = File(..., description="Property listing image")):
    """
    Detect which company logo is present in the uploaded image.

    Returns company_name, confidence_score, is_fraudulent, and a reason string.
    """
    data = _validate_upload(image)
    return _service.detect(data)


@router.post("/validate")
async def validate_listing(
    image: UploadFile = File(..., description="Property listing image"),
    company_name: str = Form(..., description="Company name claimed by the listing"),
):
    """
    Validate that the detected logo matches the company name claimed in a listing.

    Flags as fraudulent when detected logo belongs to a different company.
    """
    data = _validate_upload(image)
    return _service.validate(data, company_name)


@router.post("/check-owner")
async def check_owner(
    image: UploadFile = File(..., description="Property listing image"),
    user_email: str = Form(..., description="Email address of the posting user"),
):
    """
    Detect any company logo in the image and check whether the poster's email
    domain is authorised to post for that company.

    Returns blocked=True when a logo is found but the domain does not match.
    """
    data = _validate_upload(image)
    return _service.check_owner(data, user_email)
