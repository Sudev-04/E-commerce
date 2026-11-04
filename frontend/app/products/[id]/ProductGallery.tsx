"use client";

import Image from "next/image";
import { useState } from "react";

// Main image + clickable thumbnails. Thumbnails only appear when there is more
// than one photo, and the selected one is highlighted, so the strip acts as a
// picker instead of repeating the main image.
export default function ProductGallery({ images, name, discount }: { images: string[]; name: string; discount: number }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
        {current ? (
          <Image
            key={current}
            src={current}
            alt={images.length > 1 ? `${name}, photo ${active + 1} of ${images.length}` : name}
            fill
            sizes="(max-width: 768px) calc(100vw - 32px), 600px"
            className="object-cover"
            priority={active === 0}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl" aria-hidden="true">📦</div>
        )}
        {discount > 0 && (
          <div className="absolute top-4 left-4 badge bg-sale text-white text-sm px-3 py-1">{discount}% off</div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2" role="group" aria-label="Product photos">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
              className={`relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border-2 transition-colors ${
                i === active ? "border-primary-600 ring-2 ring-primary-200" : "border-gray-200 hover:border-primary-300 opacity-80 hover:opacity-100"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
