import type { SceneElement, FormationElement, LineShape, CurveShape } from '../types';
import { getFormationLayout } from '../lib/formations';
import { strokeDashArray, arrowMarkerId, arrowMarkersSVG, strokeLinecap } from '../lib/stroke';

const scaleIconDataUri =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>'
  );

export type PointHandle = 'start' | 'end' | 'control';

interface Props {
  element: SceneElement;
  selected: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onStartDrag: (id: string, e: React.PointerEvent) => void;
  onStartScale: (id: string, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w', e: React.PointerEvent) => void;
  onStartPointDrag: (id: string, handle: PointHandle, e: React.PointerEvent) => void;
}

function FormationRender({ el }: { el: FormationElement }) {
  const { cx, cy, points, connections, rays, connectionIsCircle, ringRadius } = getFormationLayout(el);
  const dash = strokeDashArray(el.strokeStyle, el.strokeWidth);
  const cap = strokeLinecap(el.strokeStyle);
  return (
    <g>
      <defs dangerouslySetInnerHTML={{ __html: arrowMarkersSVG(el.stroke, el.id) }} />
      {el.handHolding && connectionIsCircle && ringRadius !== undefined && (
        <circle
          cx={cx}
          cy={cy}
          r={ringRadius}
          fill="none"
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
          strokeDasharray={dash}
          strokeLinecap={cap}
          strokeLinejoin={cap}
          opacity={0.6}
        />
      )}
      {el.handHolding && !connectionIsCircle && connections.map((c, i) => (
        <line
          key={`conn-${i}`}
          x1={c.x1}
          y1={c.y1}
          x2={c.x2}
          y2={c.y2}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
          strokeDasharray={dash}
          strokeLinecap={cap}
          strokeLinejoin={cap}
          opacity={0.6}
        />
      ))}
      {rays.map((r, i) => (
        <line
          key={`ray-${i}`}
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
          opacity={0.6}
        />
      ))}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={el.personRadius}
          fill={el.fill}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
        />
      ))}
    </g>
  );
}

export function ElementView({ element, selected, onSelect, onStartDrag, onStartScale, onStartPointDrag }: Props) {
  if (!element.visible) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (element.locked) {
      onSelect(element.id, e.shiftKey);
      return;
    }
    onSelect(element.id, e.shiftKey);
    onStartDrag(element.id, e);
  };

  const commonProps = {
    onPointerDown: handlePointerDown,
    style: { cursor: element.locked ? 'default' : 'move' },
  };

  let content: React.ReactNode = null;
  const { x, y, width, height, rotation, fill, stroke, strokeWidth, strokeStyle } = element;
  const dash = strokeDashArray(strokeStyle, strokeWidth);
  const cap = strokeLinecap(strokeStyle);
  const markerId = arrowMarkerId(stroke, element.id);
  const isLineLike = element.type === 'line' || element.type === 'curve';

  switch (element.type) {
    case 'formation':
      content = <FormationRender el={element} />;
      break;
    case 'circle':
      content = (
        <circle
          cx={x + width / 2}
          cy={y + height / 2}
          r={Math.min(width, height) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinecap={cap}
          strokeLinejoin={cap}
        />
      );
      break;
    case 'line': {
      const lineEl = element as LineShape;
      content = (
        <g>
          <defs dangerouslySetInnerHTML={{ __html: arrowMarkersSVG(stroke, element.id) }} />
          <line
            x1={x}
            y1={y}
            x2={lineEl.x2}
            y2={lineEl.y2}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={dash}
            markerStart={lineEl.arrowStart ? `url(#${markerId})` : undefined}
            markerEnd={lineEl.arrowEnd ? `url(#${markerId})` : undefined}
          />
        </g>
      );
      break;
    }
    case 'curve': {
      const curveEl = element as CurveShape;
      content = (
        <g>
          <defs dangerouslySetInnerHTML={{ __html: arrowMarkersSVG(stroke, element.id) }} />
          <path
            d={`M ${x} ${y} Q ${curveEl.cx} ${curveEl.cy} ${curveEl.x2} ${curveEl.y2}`}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={dash}
            markerStart={curveEl.arrowStart ? `url(#${markerId})` : undefined}
            markerEnd={curveEl.arrowEnd ? `url(#${markerId})` : undefined}
          />
        </g>
      );
      break;
    }
    case 'rectangle':
      content = (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={element.cornerRadius}
          ry={element.cornerRadius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinecap={cap}
          strokeLinejoin={cap}
        />
      );
      break;
    case 'text':
      content = (
        <text
          x={x}
          y={y + element.fontSize}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fontSize={element.fontSize}
          fontWeight={element.fontWeight}
          fontFamily={element.fontFamily}
          textAnchor={element.align === 'center' ? 'middle' : element.align === 'right' ? 'end' : 'start'}
        >
          {element.text}
        </text>
      );
      break;
    case 'group':
      content = null;
      break;
  }

  const transform = rotation !== 0
    ? `rotate(${rotation} ${x + width / 2} ${y + height / 2})`
    : undefined;

  // Point handles for line/curve
  let pointHandles: React.ReactNode = null;
  if (selected && isLineLike) {
    const handles: { h: PointHandle; cx: number; cy: number }[] = [
      { h: 'start', cx: x, cy: y },
      { h: 'end', cx: (element as any).x2, cy: (element as any).y2 },
    ];
    if (element.type === 'curve') {
      handles.push({ h: 'control', cx: (element as CurveShape).cx, cy: (element as CurveShape).cy });
    }
    pointHandles = handles.map((hd) => (
      <circle
        key={hd.h}
        cx={hd.cx}
        cy={hd.cy}
        r={6}
        fill="white"
        stroke="#2563eb"
        strokeWidth={2}
        style={{ cursor: 'grab' }}
        onPointerDown={(e) => onStartPointDrag(element.id, hd.h, e)}
      />
    ));
  }

  // Frame + scale handles for non-line elements
  let frameHandles: React.ReactNode = null;
  if (selected && !isLineLike) {
    frameHandles = (
      <>
        <rect
          x={x - 4}
          y={y - 4}
          width={width + 8}
          height={height + 8}
          fill="none"
          stroke="#2563eb"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
        {([
          { h: 'n', cx: x + width / 2, cy: y - 4, cursor: 'ns-resize' },
          { h: 's', cx: x + width / 2, cy: y + height + 4, cursor: 'ns-resize' },
          { h: 'w', cx: x - 4, cy: y + height / 2, cursor: 'ew-resize' },
          { h: 'e', cx: x + width + 4, cy: y + height / 2, cursor: 'ew-resize' },
        ] as const).map((handle) => (
          <rect
            key={handle.h}
            x={handle.cx - 6}
            y={handle.cy - 6}
            width={12}
            height={12}
            rx={2}
            fill="white"
            stroke="#2563eb"
            strokeWidth={1.5}
            style={{ cursor: handle.cursor }}
            onPointerDown={(e) => onStartScale(element.id, handle.h, e)}
          />
        ))}
        {([
          { h: 'nw', cx: x - 4, cy: y - 4 },
          { h: 'ne', cx: x + width + 4, cy: y - 4 },
          { h: 'sw', cx: x - 4, cy: y + height + 4 },
          { h: 'se', cx: x + width + 4, cy: y + height + 4 },
        ] as const).map((handle) => (
          <g
            key={handle.h}
            onPointerDown={(e) => onStartScale(element.id, handle.h, e)}
            style={{ cursor: 'nwse-resize' }}
          >
            <rect
              x={handle.cx - 7}
              y={handle.cy - 7}
              width={14}
              height={14}
              rx={2}
              fill="white"
              stroke="#2563eb"
              strokeWidth={1.5}
            />
            <image
              href={scaleIconDataUri}
              x={handle.cx - 5}
              y={handle.cy - 5}
              width={10}
              height={10}
              pointerEvents="none"
            />
          </g>
        ))}
      </>
    );
  }

  return (
    <g transform={transform} {...commonProps}>
      {content}
      {frameHandles}
      {pointHandles}
    </g>
  );
}
