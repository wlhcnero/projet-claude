"use client";

import { useRef, useCallback } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";

interface Props {
  url: string;
  restaurantName: string;
}

export default function QRCodeDisplay({ url, restaurantName }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Add padding around QR code
    const padding = 40;
    const svgSize = 256;
    canvas.width = svgSize + padding * 2;
    canvas.height = svgSize + padding * 2;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding, svgSize, svgSize);

      const link = document.createElement("a");
      link.download = `qrcode-${restaurantName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }, [restaurantName]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={qrRef}
        className="bg-white p-6 rounded-xl shadow-md border"
      >
        <QRCode value={url} size={256} />
      </div>

      <p className="text-sm text-center text-muted-foreground max-w-xs">
        Ce QR code pointe vers :{" "}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {url}
        </a>
      </p>

      <Button onClick={handleDownload} size="lg">
        Télécharger en PNG
      </Button>
    </div>
  );
}
