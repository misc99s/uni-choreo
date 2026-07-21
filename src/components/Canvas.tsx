import { useRef, useState, useCallback, useEffect } from 'react';
import type { Section, SceneElement } from '../types';
import { ElementView, type PointHandle } from './ElementView';

interface Props {
  section: Section;
  selectedIds: string[];
  onSelect: (ids: string[], additive: boolean) => void;
  onUpdateElement: (id: string, patch: Partial<SceneElement>) => void;
  onCanvasClick: () => void;
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (z: number) => void;
  onPanChange: (p: { x: number; y: number }) => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export function Canvas({
  section,
  selectedIds,
  onSelect,
  onUpdateElement,
  onCanvasClick,
  snapToGrid,
  gridSize,
  showGrid,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    elemStart: { x: number; y: number; width: number; height: number; x2?: number; y2?: number; cx?: number; cy?: number };
    mode: 'move' | 'scale' | 'point';
    handle?: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
    pointHandle?: PointHandle;
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const longPressTimer = useRef<number | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  void isLongPress;
  const pointerStart = useRef({ x: 0, y: 0, time: 0 });

  const sortedElements = [...section.elements].sort((a, b) => a.layer - b.layer);

  const toSvgCoords = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left - pan.x) / zoom / rect.width) * CANVAS_WIDTH;
      const y = ((clientY - rect.top - pan.y) / zoom / rect.height) * CANVAS_HEIGHT;
      return { x, y };
    },
    [pan, zoom]
  );

  const snap = useCallback(
    (v: number) => (snapToGrid ? Math.round(v / gridSize) * gridSize : v),
    [snapToGrid, gridSize]
  );

  const startDrag = useCallback(
    (id: string, e: React.PointerEvent) => {
      const el = section.elements.find((x) => x.id === id);
      if (!el || el.locked) return;
      const pt = toSvgCoords(e.clientX, e.clientY);
      setDragState({
        id,
        startX: pt.x,
        startY: pt.y,
        elemStart: { x: el.x, y: el.y, width: el.width, height: el.height, x2: (el as any).x2, y2: (el as any).y2, cx: (el as any).cx, cy: (el as any).cy },
        mode: 'move',
      });
    },
    [section.elements, toSvgCoords]
  );

  const startScale = useCallback(
    (id: string, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w', e: React.PointerEvent) => {
      e.stopPropagation();
      const el = section.elements.find((x) => x.id === id);
      if (!el || el.locked) return;
      const pt = toSvgCoords(e.clientX, e.clientY);
      setDragState({
        id,
        startX: pt.x,
        startY: pt.y,
        elemStart: { x: el.x, y: el.y, width: el.width, height: el.height, x2: (el as any).x2, y2: (el as any).y2, cx: (el as any).cx, cy: (el as any).cy },
        mode: 'scale',
        handle,
      });
    },
    [section.elements, toSvgCoords]
  );

  const startPointDrag = useCallback(
    (id: string, handle: PointHandle, e: React.PointerEvent) => {
      e.stopPropagation();
      const el = section.elements.find((x) => x.id === id);
      if (!el || el.locked) return;
      const pt = toSvgCoords(e.clientX, e.clientY);
      setDragState({
        id,
        startX: pt.x,
        startY: pt.y,
        elemStart: { x: el.x, y: el.y, width: el.width, height: el.height, x2: (el as any).x2, y2: (el as any).y2, cx: (el as any).cx, cy: (el as any).cy },
        mode: 'point',
        pointHandle: handle,
      });
    },
    [section.elements, toSvgCoords]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragState) {
        const pt = toSvgCoords(e.clientX, e.clientY);
        const dx = pt.x - dragState.startX;
        const dy = pt.y - dragState.startY;
        const el = section.elements.find((x) => x.id === dragState.id);
        if (!el) return;
        if (dragState.mode === 'move') {
          onUpdateElement(el.id, {
            x: snap(dragState.elemStart.x + dx),
            y: snap(dragState.elemStart.y + dy),
          });
        } else if (dragState.mode === 'scale') {
          const h = dragState.handle!;
          const s = dragState.elemStart;
          let { x, y, width, height } = s;
          const isCorner = h.length === 2;
          if (h.includes('e')) width = Math.max(20, s.width + dx);
          if (h.includes('w')) { width = Math.max(20, s.width - dx); x = s.x + (s.width - width); }
          if (h.includes('s')) height = Math.max(20, s.height + dy);
          if (h.includes('n')) { height = Math.max(20, s.height - dy); y = s.y + (s.height - height); }
          // 1:1 for corners
          if (isCorner) {
            const maxDelta = Math.max(Math.abs(width - s.width), Math.abs(height - s.height));
            const wDir = width >= s.width ? 1 : -1;
            const hDir = height >= s.height ? 1 : -1;
            width = s.width + maxDelta * wDir;
            height = s.height + maxDelta * hDir;
            if (h.includes('w')) x = s.x + (s.width - width);
            if (h.includes('n')) y = s.y + (s.height - height);
          }
          const patch: Record<string, number> = { x: snap(x), y: snap(y), width: snap(width), height: snap(height) };
          // For line/curve elements, scale x2/y2 proportionally
          if (s.x2 !== undefined && s.y2 !== undefined) {
            const sx = s.width !== 0 ? width / s.width : 1;
            const sy = s.height !== 0 ? height / s.height : 1;
            patch.x2 = snap(s.x + (s.x2 - s.x) * sx);
            patch.y2 = snap(s.y + (s.y2 - s.y) * sy);
          }
          // For curve elements, scale control point proportionally
          if (s.cx !== undefined && s.cy !== undefined) {
            const sx = s.width !== 0 ? width / s.width : 1;
            const sy = s.height !== 0 ? height / s.height : 1;
            patch.cx = snap(s.x + (s.cx - s.x) * sx);
            patch.cy = snap(s.y + (s.cy - s.y) * sy);
          }
          onUpdateElement(el.id, patch as Partial<SceneElement>);
        } else if (dragState.mode === 'point') {
          const ph = dragState.pointHandle!;
          const s = dragState.elemStart;
          const patch: Record<string, number> = {};
          if (ph === 'start') {
            patch.x = snap(s.x + dx);
            patch.y = snap(s.y + dy);
          } else if (ph === 'end') {
            patch.x2 = snap((s.x2 ?? s.x) + dx);
            patch.y2 = snap((s.y2 ?? s.y) + dy);
          } else if (ph === 'control') {
            patch.cx = snap((s.cx ?? s.x) + dx);
            patch.cy = snap((s.cy ?? s.y) + dy);
          }
          onUpdateElement(el.id, patch as Partial<SceneElement>);
        }
      } else if (isPanning) {
        onPanChange({
          x: e.clientX - panStart.current.x + panStart.current.panX,
          y: e.clientY - panStart.current.y + panStart.current.panY,
        });
      }
    },
    [dragState, isPanning, toSvgCoords, snap, section.elements, onUpdateElement, onPanChange]
  );

  const handlePointerUp = useCallback(() => {
    setDragState(null);
    setIsPanning(false);
    setIsLongPress(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1 || (e.button === 0 && (e.altKey || e.metaKey))) {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        e.preventDefault();
        return;
      }
      pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      onCanvasClick();
    },
    [pan, onCanvasClick]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        const newZoom = Math.min(3, Math.max(0.3, zoom + delta));
        onZoomChange(newZoom);
      }
    },
    [zoom, onZoomChange]
  );

  useEffect(() => {
    const preventDefault = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    const svg = svgRef.current;
    svg?.addEventListener('wheel', preventDefault, { passive: false });
    return () => svg?.removeEventListener('wheel', preventDefault);
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden bg-slate-100">
      <svg
        ref={svgRef}
        className="h-full w-full touch-none"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="grid-pattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={0.5}
            />
          </pattern>
        </defs>
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#ffffff"
            className="shadow-lg"
            rx={8}
          />
          {showGrid && (
            <rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="url(#grid-pattern)"
              rx={8}
            />
          )}
          <g
            clipPath="inset(0 0 0 0 round 8px)"
          >
            {sortedElements.map((el) => (
              <ElementView
                key={el.id}
                element={el}
                selected={selectedIds.includes(el.id)}
                onSelect={(id, additive) => {
                  if (additive) {
                    if (selectedIds.includes(id)) {
                      onSelect(selectedIds.filter((x) => x !== id), false);
                    } else {
                      onSelect([...selectedIds, id], false);
                    }
                  } else {
                    onSelect([id], false);
                  }
                }}
                onStartDrag={startDrag}
                onStartScale={startScale}
                onStartPointDrag={startPointDrag}
              />
            ))}
          </g>
        </g>
      </svg>

      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-md">
        <button
          className="text-slate-600 hover:text-slate-900"
          onClick={() => onZoomChange(Math.max(0.3, zoom - 0.1))}
        >
          −
        </button>
        <span className="w-12 text-center text-sm font-medium text-slate-700">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="text-slate-600 hover:text-slate-900"
          onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
        >
          +
        </button>
        <button
          className="ml-1 text-xs text-slate-500 hover:text-slate-800"
          onClick={() => {
            onZoomChange(1);
            onPanChange({ x: 0, y: 0 });
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
