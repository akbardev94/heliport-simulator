"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { BASE_TYPES, DRAGGABLE_TYPES } from "@/lib/paletteConfig";
import { loadWindconeImage } from "@/lib/windconeArt";

// Fabric is imported dynamically (browser-only).
let fabric = null;

const COLORS = {
  ground: "#7d9b5e",
  safety: "#c9d6bb",
  fato: "#b9bec4",
  tlof: "#8a9097",
  marking: "#f5a623",
};

// Real-world default sizes (metres) for placeable components.
const COMPONENT_M = {
  obstacle: 6, // 6 m x 6 m building/obstacle
  windconePole: 8, // 8 m pole
  approachLen: 30, // 30 m arrow
};

const LayoutCanvas = forwardRef(function LayoutCanvas(
  { dims, onComponentsChange, onSelectInfo },
  ref
) {
  const elRef = useRef(null);
  const canvasRef = useRef(null);
  const scaleRef = useRef(8); // px per metre
  const componentsRef = useRef(new Set());
  const keyHandlerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    addComponent: (type) => addComponent(type),
    addComponentAt: (type, clientX, clientY) =>
      addComponent(type, pointerFromClient(clientX, clientY)),
    removeSelected: () => removeSelected(),
    clearComponents: () => clearComponents(),
    reset: () => resetCanvas(),
    highlightBase: (type) => highlightBase(type),
    getCanvasEl: () => elRef.current,
    getGeometry: () => getGeometry(),
    exportDataURL: () =>
      canvasRef.current
        ? canvasRef.current.toDataURL({ format: "png", multiplier: 2 })
        : null,
  }));

  function baseRect(type) {
    const c = canvasRef.current;
    if (!c) return null;
    const obj = c.getObjects().find((o) => o.heliBase === type);
    return obj ? obj.getBoundingRect(true) : null;
  }

  function getGeometry() {
    const c = canvasRef.current;
    if (!c) return null;
    const s = scaleRef.current;
    const areas = {
      tlof: baseRect("tlof"),
      fato: baseRect("fato"),
      safety: baseRect("safety"),
    };
    const obstacles = [];
    const approaches = [];
    let windcone = false;
    c.getObjects().forEach((o) => {
      if (o.heliType === "obstacle") obstacles.push(o.getBoundingRect(true));
      else if (o.heliType === "approach") approaches.push(o.getBoundingRect(true));
      else if (o.heliType === "windcone") windcone = true;
    });
    return {
      scale: s,
      areas,
      obstacles,
      approaches,
      windcone,
      present: Array.from(componentsRef.current),
    };
  }

  function notify() {
    const c = canvasRef.current;
    const types = new Set();
    if (c) {
      c.getObjects().forEach((o) => {
        if (o.heliType) types.add(o.heliType);
        if (o.heliBase) types.add(o.heliBase);
      });
    }
    componentsRef.current = types;
    onComponentsChange?.(Array.from(types));
  }

  function pointerFromClient(clientX, clientY) {
    const c = canvasRef.current;
    if (!c) return null;
    const rect = c.upperCanvasEl.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function metres(px) {
    return Math.round((px / scaleRef.current) * 10) / 10;
  }

  // emit size info for the currently selected object
  function emitInfo(obj) {
    if (!obj || !onSelectInfo) return onSelectInfo?.(null);
    const wPx = obj.getScaledWidth();
    const hPx = obj.getScaledHeight();
    const baseLabels = { tlof: "TLOF", fato: "FATO", safety: "Safety Area" };
    const typeLabels = {
      obstacle: "Obstacle",
      windcone: "Wind Cone",
      approach: "Approach Path",
    };
    const kind = obj.heliBase || obj.heliType;
    onSelectInfo({
      type: kind,
      label: baseLabels[kind] || typeLabels[kind] || "Komponen",
      w: metres(wPx),
      h: metres(hPx),
    });
  }

  function styleBaseGroup(group) {
    group.set({
      hasControls: false,
      hasBorders: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      cornerColor: "#1f4e9c",
      borderColor: "#1f4e9c",
      transparentCorners: false,
      subTargetCheck: false,
    });
  }

  function canvasCenter() {
    const c = canvasRef.current;
    return { cx: c.getWidth() / 2, cy: c.getHeight() / 2 };
  }

  function drawGround() {
    const c = canvasRef.current;
    if (!c || !fabric) return;
    c.clear();
    c.backgroundColor = COLORS.ground;
    drawScaleBar();
  }

  function resetCanvas() {
    drawGround();
    onSelectInfo?.(null);
    canvasRef.current?.requestRenderAll();
    notify();
  }

  function createBaseGroup(type, at) {
    if (!fabric) return null;
    const center = at || canvasCenter();
    const s = scaleRef.current;
    const safetyD = (dims.fato + 2 * dims.safety) * s;
    const fatoD = dims.fato * s;
    const tlofD = dims.tlof * s;

    const mk = (size, fill, stroke, dash) =>
      new fabric.Rect({
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        fill,
        stroke,
        strokeDashArray: dash,
        strokeWidth: 1.5,
        selectable: false,
        evented: false,
      });

    let children = [];
    if (type === "safety") {
      children = [mk(safetyD, COLORS.safety, "#ffffff", [6, 6])];
    } else if (type === "fato") {
      children = [mk(fatoD, COLORS.fato, "#ffffff", [4, 4])];
    } else if (type === "tlof") {
      const tlof = mk(tlofD, COLORS.tlof, "#cfd4d9", null);
      const circleR = (tlofD / 2) * 0.62;
      const square = new fabric.Rect({
        left: 0,
        top: 0,
        width: circleR * 2.4,
        height: circleR * 2.4,
        originX: "center",
        originY: "center",
        fill: "",
        stroke: COLORS.marking,
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });
      const circle = new fabric.Circle({
        left: 0,
        top: 0,
        radius: circleR,
        originX: "center",
        originY: "center",
        fill: "",
        stroke: COLORS.marking,
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });
      const h = new fabric.Text("H", {
        left: 0,
        top: 0,
        originX: "center",
        originY: "center",
        fontSize: Math.max(22, circleR * 1.15),
        fontWeight: "800",
        fill: "#ffffff",
        fontFamily: "Inter, sans-serif",
        selectable: false,
        evented: false,
      });
      children = [tlof, square, circle, h];
    } else {
      return null;
    }

    const group = new fabric.Group(children, {
      left: center.cx ?? center.x,
      top: center.cy ?? center.y,
      originX: "center",
      originY: "center",
      selectable: true,
      evented: true,
    });
    group.heliBase = type;
    styleBaseGroup(group);
    return group;
  }

  function keepScaleOnTop() {
    const c = canvasRef.current;
    const scale = c?.getObjects().find((o) => o.heliScale);
    scale?.bringToFront();
  }

  function restackBases() {
    const c = canvasRef.current;
    if (!c) return;
    let idx = 0;
    ["safety", "fato", "tlof"].forEach((type) => {
      const obj = c.getObjects().find((o) => o.heliBase === type);
      if (obj) {
        c.moveTo(obj, idx);
        idx += 1;
      }
    });
    keepScaleOnTop();
  }

  function addBaseLayer(type, { silent = false, at = null } = {}) {
    const c = canvasRef.current;
    if (!c || !fabric || !BASE_TYPES.includes(type)) return;
    if (c.getObjects().some((o) => o.heliBase === type)) {
      if (!silent) highlightBase(type);
      return;
    }
    const group = createBaseGroup(type, at);
    if (!group) return;
    c.add(group);
    restackBases();
    if (!silent) {
      c.setActiveObject(group);
      emitInfo(group);
    }
    c.requestRenderAll();
    if (!silent) notify();
  }

  function rebuildForDims() {
    const c = canvasRef.current;
    if (!c || !fabric) return;
    const positions = {};
    BASE_TYPES.forEach((t) => {
      const g = c.getObjects().find((o) => o.heliBase === t);
      if (g) positions[t] = { cx: g.left, cy: g.top };
    });
    const bases = BASE_TYPES.filter((t) => positions[t]);
    const extras = c.getObjects().filter((o) => o.heliType);
    drawGround();
    bases.forEach((t) => addBaseLayer(t, { silent: true, at: positions[t] }));
    extras.forEach((o) => c.add(o));
    keepScaleOnTop();
    c.requestRenderAll();
    notify();
  }

  function highlightBase(type) {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getObjects().find((o) => o.heliBase === type);
    if (!obj) return;
    const rect = obj.type === "group" ? obj.getObjects()[0] : obj;
    if (!rect) return;
    const orig = rect.stroke || "#ffffff";
    const origW = rect.strokeWidth || 1.5;
    rect.set({ stroke: "#f59e0b", strokeWidth: 3 });
    c.requestRenderAll();
    setTimeout(() => {
      if (!canvasRef.current) return;
      rect.set({ stroke: orig, strokeWidth: origW });
      c.requestRenderAll();
    }, 700);
  }

  function drawScaleBar() {
    const c = canvasRef.current;
    if (!c || !fabric) return;
    const s = scaleRef.current;
    const seg = 10 * s;
    const segCount = 5;
    const barW = seg * segCount;
    const barH = 10;
    const x0 = c.getWidth() - barW - 20;
    const y0 = c.getHeight() - 34;
    const parts = [];

    for (let i = 0; i < segCount; i++) {
      parts.push(
        new fabric.Rect({
          left: x0 + i * seg,
          top: y0,
          width: seg,
          height: barH,
          fill: i % 2 === 0 ? "#000000" : "#ffffff",
          stroke: "#000000",
          strokeWidth: 0.5,
        })
      );
    }

    for (let i = 0; i <= segCount; i++) {
      parts.push(
        new fabric.Text(`${i * 10}${i === segCount ? " m" : ""}`, {
          left: x0 + i * seg,
          top: y0 - 11,
          originX: "center",
          fontSize: 11,
          fontWeight: "600",
          fill: "#ffffff",
          fontFamily: "Inter, system-ui, sans-serif",
        })
      );
    }

    const bar = new fabric.Group(parts, { selectable: false, evented: false });
    bar.heliScale = true;
    c.add(bar);
  }

  function placeComponent(obj, pos) {
    const c = canvasRef.current;
    if (!c || !obj) return;
    if (pos) {
      obj.set({
        left: pos.x - obj.getScaledWidth() / 2,
        top: pos.y - obj.getScaledHeight() / 2,
      });
      obj.setCoords();
    }
    obj.cornerColor = "#1f4e9c";
    obj.borderColor = "#1f4e9c";
    obj.transparentCorners = false;
    c.add(obj);
    c.setActiveObject(obj);
    emitInfo(obj);
    c.requestRenderAll();
    notify();
  }

  function addComponent(type, pos) {
    const c = canvasRef.current;
    if (!c || !fabric) return;
    if (BASE_TYPES.includes(type)) {
      const at = pos ? { cx: pos.x, cy: pos.y } : null;
      addBaseLayer(type, { at });
      return;
    }
    const W = c.getWidth();
    const H = c.getHeight();
    const s = scaleRef.current;
    let obj = null;

    if (type === "windcone") {
      loadWindconeImage(fabric, s, (img) => {
        if (!img || canvasRef.current !== c) return;
        if (!pos) img.set({ left: W - 90, top: 60 });
        placeComponent(img, pos);
      });
      return;
    } else if (type === "obstacle") {
      const sizePx = COMPONENT_M.obstacle * s;
      obj = new fabric.Rect({
        left: pos?.x ?? 80,
        top: pos?.y ?? 80,
        width: sizePx,
        height: sizePx,
        fill: "#5b6470",
        stroke: "#2b3038",
        strokeWidth: 2,
        rx: 3,
        ry: 3,
      });
      obj.heliType = "obstacle";
    } else if (type === "approach") {
      const lenPx = COMPONENT_M.approachLen * s;
      const line = new fabric.Line([0, 12, lenPx, 12], {
        stroke: "#1f4e9c",
        strokeWidth: 4,
        strokeDashArray: [10, 6],
      });
      const head = new fabric.Triangle({
        left: lenPx,
        top: 0,
        width: 22,
        height: 24,
        angle: 90,
        fill: "#1f4e9c",
      });
      obj = new fabric.Group([line, head], { left: pos?.x ?? 30, top: pos?.y ?? H / 2 });
      obj.heliType = "approach";
    }

    if (obj) placeComponent(obj, pos);
  }

  function removeSelected() {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObjects().filter((o) => o.heliType);
    if (active.length === 0) return;
    active.forEach((o) => c.remove(o));
    c.discardActiveObject();
    onSelectInfo?.(null);
    c.requestRenderAll();
    notify();
  }

  function clearComponents() {
    const c = canvasRef.current;
    if (!c) return;
    c.getObjects()
      .filter((o) => o.heliType || o.heliBase)
      .forEach((o) => c.remove(o));
    onSelectInfo?.(null);
    c.requestRenderAll();
    notify();
  }

  // init
  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import("fabric");
      fabric = mod.fabric || mod.default || mod;
      if (!mounted || !elRef.current) return;
      const parent = elRef.current.parentElement;
      const width = parent ? parent.clientWidth : 640;
      const height = 420;
      const c = new fabric.Canvas(elRef.current, {
        width,
        height,
        selection: true,
        preserveObjectStacking: true,
      });
      canvasRef.current = c;

      const safetyMetres = dims.fato + 2 * dims.safety || 20;
      scaleRef.current = (Math.min(width, height) * 0.7) / safetyMetres;

      // selection / transform events -> emit live size info
      const handleSel = (e) => emitInfo((e.selected && e.selected[0]) || c.getActiveObject());
      c.on("selection:created", handleSel);
      c.on("selection:updated", handleSel);
      c.on("selection:cleared", () => onSelectInfo?.(null));
      c.on("object:scaling", (e) => emitInfo(e.target));
      c.on("object:modified", (e) => emitInfo(e.target));
      c.on("object:moving", (e) => emitInfo(e.target));

      drawGround();
      notify();

      // Keyboard: Delete / Backspace removes the selected component.
      keyHandlerRef.current = (e) => {
        if (e.key !== "Delete" && e.key !== "Backspace") return;
        const tag = (e.target?.tagName || "").toLowerCase();
        const typing =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          e.target?.isContentEditable;
        if (typing) return; // don't hijack typing in form fields
        const c2 = canvasRef.current;
        if (!c2 || c2.getActiveObjects().length === 0) return;
        e.preventDefault();
        removeSelected();
      };
      window.addEventListener("keydown", keyHandlerRef.current);
    })();
    return () => {
      mounted = false;
      if (keyHandlerRef.current) {
        window.removeEventListener("keydown", keyHandlerRef.current);
        keyHandlerRef.current = null;
      }
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // redraw base when dims change
  useEffect(() => {
    if (!canvasRef.current || !fabric) return;
    const c = canvasRef.current;
    const safetyMetres = dims.fato + 2 * dims.safety || 20;
    scaleRef.current = (Math.min(c.getWidth(), c.getHeight()) * 0.7) / safetyMetres;
    rebuildForDims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.fato, dims.safety, dims.tlof]);

  function onDrop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData("heli/type");
    if (DRAGGABLE_TYPES.includes(type) || BASE_TYPES.includes(type)) {
      addComponent(type, pointerFromClient(e.clientX, e.clientY));
    }
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg ring-1 ring-slate-300"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={(e) => e.preventDefault()}
    >
      <canvas ref={elRef} />
    </div>
  );
});

export default LayoutCanvas;
