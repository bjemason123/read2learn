"use client";

import { useEffect } from "react";

export function PrintTrigger() {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <button
      type="button"
      className="print-button"
      onClick={() => window.print()}
    >
      Print / Save as PDF
    </button>
  );
}
