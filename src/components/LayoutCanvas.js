"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { BASE_TYPES, DRAGGABLE_TYPES, TLOF_TYPES, isTlofType } from "@/lib/paletteConfig";
import { loadWindconeImage } from "@/lib/windconeArt";
import {
  loadObstacleImage,
  isObstacleType,
  obstacleKindFromType,
} from "@/lib/obstacleArt";
import {
  createWeatherLabel,
  defaultWeatherPosition,
  isWeatherType,
} from "@/lib/weatherLabelArt";
import { loadMarshalerImage } from "@/lib/marshalerArt";

// Fabric is imported dynamically (browser-only).
let fabric = null;

const COLORS = {
  ground: "#7d9b5e",
  safety: "#c9d6bb",
  fato: "#b9bec4",
  tlof: "#4f6868",
  marking: "#f0c931",
  markingCorner: "#c99200",
};

// Real-world default sizes (metres) for placeable components.
const COMPONENT_M = {
  windconePole: 8, // 8 m pole
  approachLen: 30, // 30 m arrow
};

const MIN_VIEW_ZOOM = 0.5;
const MAX_VIEW_ZOOM = 3;
const VIEW_ZOOM_STEP = 1.15;

const LayoutCanvas = forwardRef(function LayoutCanvas(
  { dims, onComponentsChange, onSelectInfo, selectInfo },
  ref
) {
  const elRef = useRef(null);
  const canvasRef = useRef(null);
  const scaleRef = useRef(8); // px per metre
  const viewZoomRef = useRef(1);
  const baseSizeRef = useRef({ w: 640, h: 420 });
  const componentsRef = useRef(new Set());
  const keyHandlerRef = useRef(null);
  const wheelHandlerRef = useRef(null);
  const [viewZoomPct, setViewZoomPct] = useState(100);

  useImperativeHandle(ref, () => ({
    addComponent: (type) => addComponent(type),
    addComponentAt: (type, clientX, clientY) =>
      addComponent(type, pointerFromClient(clientX, clientY)),
    removeSelected: () => removeSelected(),
    clearComponents: () => clearComponents(),
    reset: () => resetCanvas(),
    highlightBase: (type) => highlightBase(type),
    zoomIn: () => zoomByFactor(VIEW_ZOOM_STEP),
    zoomOut: () => zoomByFactor(1 / VIEW_ZOOM_STEP),
    resetZoom: () => resetViewZoom(),
    getCanvasEl: () => elRef.current,
    getGeometry: () => getGeometry(),
    exportDataURL: () => exportCanvasDataURL(),
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
      tlof: baseRect("tlof") || baseRect("tlof-rooftop"),
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
        if (o.heliBase) {
          types.add(o.heliBase);
          if (isTlofType(o.heliBase)) types.add("tlof");
        }
      });
    }
    componentsRef.current = types;
    onComponentsChange?.(Array.from(types));
  }

  function pointerFromClient(clientX, clientY) {
    const c = canvasRef.current;
    if (!c) return null;
    const pointer = c.getPointer({ clientX, clientY });
    return { x: pointer.x, y: pointer.y };
  }

  function clampViewZoom(zoom) {
    return Math.min(MAX_VIEW_ZOOM, Math.max(MIN_VIEW_ZOOM, zoom));
  }

  function setViewZoom(zoom, point) {
    const c = canvasRef.current;
    if (!c || !fabric) return;
    const next = clampViewZoom(zoom);
    const anchor =
      point ||
      new fabric.Point(baseSizeRef.current.w / 2, baseSizeRef.current.h / 2);
    c.zoomToPoint(anchor, next);
    viewZoomRef.current = next;
    setViewZoomPct(Math.round(next * 100));
    c.requestRenderAll();
  }

  function zoomByFactor(factor, point) {
    setViewZoom(viewZoomRef.current * factor, point);
  }

  function resetViewZoom() {
    const c = canvasRef.current;
    if (!c) return;
    c.setViewportTransform([1, 0, 0, 1, 0, 0]);
    viewZoomRef.current = 1;
    setViewZoomPct(100);
    c.requestRenderAll();
  }

  function exportCanvasDataURL() {
    const c = canvasRef.current;
    if (!c) return null;
    const savedTransform = c.viewportTransform.slice();
    const savedZoom = viewZoomRef.current;
    c.setViewportTransform([1, 0, 0, 1, 0, 0]);
    c.setZoom(1);
    const url = c.toDataURL({ format: "png", multiplier: 2 });
    c.setViewportTransform(savedTransform);
    c.setZoom(savedZoom);
    return url;
  }

  function metres(px) {
    return Math.round((px / scaleRef.current) * 10) / 10;
  }

  // emit size info for the currently selected object
  function emitInfo(obj) {
    if (!obj || !onSelectInfo) return onSelectInfo?.(null);
    const wPx = obj.getScaledWidth();
    const hPx = obj.getScaledHeight();
    const baseLabels = {
      tlof: "TLOF",
      "tlof-rooftop": "TLOF Atap",
      fato: "FATO",
      safety: "Safety Area",
    };
    const typeLabels = {
      obstacle: "Obstacle",
      gedung: "Gedung",
      pohon: "Pohon",
      windcone: "Wind Cone",
      imc: "IMC",
      vmc: "VMC",
      marshaler: "Marshaler",
      approach: "Approach Path",
    };
    const kind = obj.heliBase || obj.heliObstacleKind || obj.heliType;
    onSelectInfo({
      type: kind,
      label: typeLabels[kind] || baseLabels[kind] || "Komponen",
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
    const { w, h } = baseSizeRef.current;
    return { cx: w / 2, cy: h / 2 };
  }

  function drawGround() {
    const c = canvasRef.current;
    if (!c || !fabric) return;
    c.clear();
    c.backgroundColor = COLORS.ground;
    drawScaleBar();
  }

  function resetCanvas() {
    resetViewZoom();
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
      const half = tlofD / 2;
      const markW = Math.max(3, tlofD * 0.028);
      const cornerSize = Math.max(6, tlofD * 0.1);
      const circleR = half * 0.84;

      const pad = new fabric.Rect({
        left: -half,
        top: -half,
        width: tlofD,
        height: tlofD,
        fill: COLORS.tlof,
        selectable: false,
        evented: false,
      });

      const square = new fabric.Rect({
        left: -half,
        top: -half,
        width: tlofD,
        height: tlofD,
        fill: "",
        stroke: COLORS.marking,
        strokeWidth: markW,
        selectable: false,
        evented: false,
      });

      const cornerPositions = [
        { x: -half, y: -half },
        { x: half - cornerSize, y: -half },
        { x: -half, y: half - cornerSize },
        { x: half - cornerSize, y: half - cornerSize },
      ];
      const corners = cornerPositions.map(
        ({ x, y }) =>
          new fabric.Rect({
            left: x,
            top: y,
            width: cornerSize,
            height: cornerSize,
            fill: COLORS.markingCorner,
            selectable: false,
            evented: false,
          })
      );

      const circle = new fabric.Circle({
        left: 0,
        top: 0,
        radius: circleR,
        originX: "center",
        originY: "center",
        fill: "",
        stroke: COLORS.marking,
        strokeWidth: markW,
        selectable: false,
        evented: false,
      });

      const h = new fabric.Text("H", {
        left: 0,
        top: 0,
        originX: "center",
        originY: "center",
        fontSize: Math.max(20, circleR * 1.05),
        fontWeight: "900",
        fill: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
        selectable: false,
        evented: false,
      });

      children = [pad, square, ...corners, circle, h];
    } else if (type === "tlof-rooftop") {
      const half = tlofD / 2;
      const red = "#d8161f";
      const white = "#ffffff";
      const borderW = Math.max(2, tlofD * 0.012);
      const armW = tlofD * 0.2;
      const armLen = tlofD * 0.82;

      const pad = new fabric.Rect({
        left: -half,
        top: -half,
        width: tlofD,
        height: tlofD,
        fill: red,
        selectable: false,
        evented: false,
      });

      const border = new fabric.Rect({
        left: -half,
        top: -half,
        width: tlofD,
        height: tlofD,
        fill: "",
        stroke: white,
        strokeWidth: borderW,
        selectable: false,
        evented: false,
      });

      const vArm = new fabric.Rect({
        left: -armW / 2,
        top: -armLen / 2,
        width: armW,
        height: armLen,
        fill: white,
        selectable: false,
        evented: false,
      });

      const hArm = new fabric.Rect({
        left: -armLen / 2,
        top: -armW / 2,
        width: armLen,
        height: armW,
        fill: white,
        selectable: false,
        evented: false,
      });

      const h = new fabric.Text("H", {
        left: 0,
        top: 0,
        originX: "center",
        originY: "center",
        fontSize: Math.max(18, armW * 1.1),
        fontWeight: "900",
        fill: red,
        fontFamily: "Arial, Helvetica, sans-serif",
        selectable: false,
        evented: false,
      });

      children = [pad, border, vArm, hArm, h];
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
    ["safety", "fato", ...TLOF_TYPES].forEach((type) => {
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

    if (isTlofType(type)) {
      c.getObjects()
        .filter((o) => isTlofType(o.heliBase) && o.heliBase !== type)
        .forEach((o) => c.remove(o));
    }

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
    const x0 = baseSizeRef.current.w - barW - 20;
    const y0 = baseSizeRef.current.h - 34;
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
    const W = baseSizeRef.current.w;
    const H = baseSizeRef.current.h;
    const s = scaleRef.current;
    let obj = null;

    if (type === "windcone") {
      loadWindconeImage(fabric, s, (img) => {
        if (!img || canvasRef.current !== c) return;
        if (!pos) img.set({ left: W - 90, top: 60 });
        placeComponent(img, pos);
      });
      return;
    } else if (isObstacleType(type)) {
      const kind = obstacleKindFromType(type);
      loadObstacleImage(fabric, kind, s, (img) => {
        if (!img || canvasRef.current !== c) return;
        if (!pos) img.set({ left: 80, top: 80 });
        placeComponent(img, pos);
      });
      return;
    } else if (type === "marshaler") {
      loadMarshalerImage(fabric, s, (img) => {
        if (!img || canvasRef.current !== c) return;
        if (!pos) {
          img.set({
            left: W / 2 - img.getScaledWidth() / 2,
            top: H / 2 - img.getScaledHeight() / 2,
          });
        }
        placeComponent(img, pos);
      });
      return;
    } else if (isWeatherType(type)) {
      const existing = c.getObjects().find((o) => o.heliType === type);
      if (existing) {
        c.setActiveObject(existing);
        emitInfo(existing);
        c.requestRenderAll();
        return;
      }
      obj = createWeatherLabel(fabric, type, s);
      if (!pos) defaultWeatherPosition(c, obj, type);
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
    const active = c.getActiveObjects().filter((o) => o.heliType || o.heliBase);
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
    let canvasEl = null;
    (async () => {
      const mod = await import("fabric");
      fabric = mod.fabric || mod.default || mod;
      if (!mounted || !elRef.current) return;
      const parent = elRef.current.parentElement;
      const width = parent ? parent.clientWidth : 640;
      const height = 420;
      baseSizeRef.current = { w: width, h: height };
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

      canvasEl = elRef.current;
      wheelHandlerRef.current = (e) => {
        if (!canvasRef.current) return;
        e.preventDefault();
        const pointer = canvasRef.current.getPointer(e);
        const factor = e.deltaY < 0 ? VIEW_ZOOM_STEP : 1 / VIEW_ZOOM_STEP;
        zoomByFactor(factor, new fabric.Point(pointer.x, pointer.y));
      };
      canvasEl?.addEventListener("wheel", wheelHandlerRef.current, {
        passive: false,
      });

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
      if (wheelHandlerRef.current && canvasEl) {
        canvasEl.removeEventListener("wheel", wheelHandlerRef.current);
        wheelHandlerRef.current = null;
      }
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
    const { w, h } = baseSizeRef.current;
    const safetyMetres = dims.fato + 2 * dims.safety || 20;
    scaleRef.current = (Math.min(w, h) * 0.7) / safetyMetres;
    rebuildForDims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.fato, dims.safety, dims.tlof]);

  function onDrop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData("heli/type");
    if (DRAGGABLE_TYPES.includes(type) || BASE_TYPES.includes(type) || isObstacleType(type) || isWeatherType(type)) {
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
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md bg-white/95 p-1 shadow ring-1 ring-slate-200">
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded text-sm font-bold text-slate-600 hover:bg-slate-100"
          onClick={() => zoomByFactor(1 / VIEW_ZOOM_STEP)}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="min-w-[3rem] rounded px-1 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
          onClick={resetViewZoom}
          title="Reset zoom"
        >
          {viewZoomPct}%
        </button>
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded text-sm font-bold text-slate-600 hover:bg-slate-100"
          onClick={() => zoomByFactor(VIEW_ZOOM_STEP)}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      {selectInfo && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow">
          {selectInfo.label}: {selectInfo.w} × {selectInfo.h} m
        </div>
      )}
      <p className="pointer-events-none absolute bottom-2 left-3 z-10 text-[10px] text-white/80 drop-shadow">
        Scroll untuk zoom
      </p>
    </div>
  );
});

export default LayoutCanvas;
