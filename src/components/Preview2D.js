"use client";

import { useEffect, useState } from "react";

/** Read-only snapshot of the Fabric layout canvas for the results panel. */
export default function Preview2D({ canvasRef }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    const capture = () => {
      const url = canvasRef?.current?.exportDataURL?.();
      if (url) setSrc(url);
    };
    capture();
    const t = setTimeout(capture, 200);
    return () => clearTimeout(t);
  }, [canvasRef]);

  if (!src) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Layout 2D belum tersedia
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <img
        src={src}
        alt="Pratinjau layout heliport 2D"
        className="h-[320px] w-full object-contain bg-[#eef2f7]"
      />
    </div>
  );
}
