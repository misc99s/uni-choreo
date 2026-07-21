import type { StrokeStyle } from '../types';

export function strokeDashArray(style: StrokeStyle, width: number): string | undefined {
  switch (style) {
    case 'solid': return undefined;
    case 'dashed': return `${width * 3} ${width * 2}`;
    case 'dotted': return `${width * 0.1} ${width * 2}`;
    case 'dash-dot': return `${width * 3} ${width * 2} ${width * 0.1} ${width * 2}`;
    default: return undefined;
  }
}

export function strokeDashArraySVG(style: StrokeStyle, width: number): string {
  const da = strokeDashArray(style, width);
  return da ? ` stroke-dasharray="${da}"` : '';
}

export function strokeLinecap(style: StrokeStyle): 'round' | undefined {
  return style === 'dotted' ? 'round' : undefined;
}

export function strokeLinecapSVG(style: StrokeStyle): string {
  const cap = strokeLinecap(style);
  return cap ? ` stroke-linecap="${cap}" stroke-linejoin="${cap}"` : '';
}

export function arrowMarkerId(_color: string, id: string): string {
  return `arrow-${id}`;
}

export function arrowMarkersSVG(color: string, id: string): string {
  const markerId = arrowMarkerId(color, id);
  return `<marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${color}"/></marker>`;
}

export function arrowMarkerRef(start: boolean, end: boolean, color: string, id: string): string {
  let ref = '';
  const markerId = arrowMarkerId(color, id);
  if (start) ref += ` marker-start="url(#${markerId})"`;
  if (end) ref += ` marker-end="url(#${markerId})"`;
  return ref;
}
