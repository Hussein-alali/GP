"use client";
import React from "react";
import Navbar from "@/components/Navbar";
import PricePrediction from "./PricePrediction";

export default function PricePredictionPage() {
  return (
    <div style={{ backgroundColor: "#f4f7f9", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ paddingTop: 120, paddingBottom: 60, paddingLeft: 20, paddingRight: 20 }}>
        <PricePrediction />
      </main>
    </div>
  );
}
