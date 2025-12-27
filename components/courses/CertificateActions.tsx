"use client";

import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { useEffect } from "react";

export function CertificateActions() {
  useEffect(() => {
    // Add print media query styles for better quality
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleDownload = () => {
    // Trigger print dialog which allows saving as PDF
    window.print();
  };

  const handlePrint = () => {
    // Trigger print dialog
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleDownload}
      >
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
      <Button
        variant="outline"
        className="gap-2"
        onClick={handlePrint}
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>
    </div>
  );
}
