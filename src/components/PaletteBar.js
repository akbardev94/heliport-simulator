"use client";

import { useRef } from "react";
import { Icon } from "@iconify/react";
import { PALETTE_ITEMS } from "@/lib/paletteConfig";
import { makeWindconeDragGhost } from "@/lib/windconeArt";
import { PALETTE_CUSTOM_ICONS } from "@/components/paletteIcons";

export default function PaletteBar({ onAdd, onDelete, onHighlightBase }) {
  const ghostRef = useRef(null);

  function handleDragStart(e, item) {
    if (!item.draggable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("heli/type", item.type);
    e.dataTransfer.effectAllowed = "copy";

    if (ghostRef.current) ghostRef.current.remove();

    let ghost;
    if (item.type === "windcone") {
      ghost = makeWindconeDragGhost();
      e.dataTransfer.setDragImage(ghost, 36, 40);
    } else {
      const clone = e.currentTarget.cloneNode(true);
      clone.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:80px;" +
        "opacity:0.95;pointer-events:none;z-index:9999;";
      document.body.appendChild(clone);
      ghost = clone;
      e.dataTransfer.setDragImage(clone, 40, 40);
    }
    ghostRef.current = ghost;
  }

  function handleDragEnd() {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
  }

  function handleClick(item) {
    onAdd?.(item.type);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE_ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          draggable={item.draggable}
          onClick={() => handleClick(item)}
          onDragStart={(e) => handleDragStart(e, item)}
          onDragEnd={handleDragEnd}
          title={item.hint}
          className={`flex w-20 flex-col items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] font-medium text-slate-600 hover:border-brand hover:bg-white ${
            item.draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
          }`}
        >
          {(() => {
            const Custom = PALETTE_CUSTOM_ICONS[item.type];
            if (Custom) return <Custom />;
            return (
              <Icon
                icon={item.icon}
                width={22}
                height={22}
                {...(item.colorIcon
                  ? {}
                  : { style: { color: item.color }, className: item.className })}
              />
            );
          })()}
          {item.label}
        </button>
      ))}

      <button
        type="button"
        onClick={onDelete}
        title="Hapus komponen terpilih (Delete / Backspace)"
        className="flex w-20 flex-col items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-[11px] font-medium text-red-600 hover:bg-red-100"
      >
        <Icon icon="mdi:trash-can-outline" width={22} height={22} className="text-red-500" />
        Hapus
      </button>
    </div>
  );
}
