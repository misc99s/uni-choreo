import type { FormationKind, FormationElement } from '../types';
import { createElementDefaults, uid } from './storage';

export interface FormationPreset {
  kind: FormationKind;
  name: string;
  description: string;
  minPersons: number;
  maxPersons: number;
  defaultPersons: number;
  defaultHandHolding: boolean;
  handHoldingOptional: boolean;
  hasOuterCount: boolean;
  minOuter: number;
  maxOuter: number;
  defaultOuter: number;
}

export const FORMATION_PRESETS: Record<FormationKind, FormationPreset> = {
  kreis: {
    kind: 'kreis',
    name: 'Kreis',
    description: 'Personen im Kreis angeordnet',
    minPersons: 3,
    maxPersons: 16,
    defaultPersons: 6,
    defaultHandHolding: true,
    handHoldingOptional: true,
    hasOuterCount: false,
    minOuter: 0,
    maxOuter: 0,
    defaultOuter: 0,
  },
  linie: {
    kind: 'linie',
    name: 'Linie',
    description: 'Personen horizontal nebeneinander',
    minPersons: 2,
    maxPersons: 16,
    defaultPersons: 5,
    defaultHandHolding: true,
    handHoldingOptional: true,
    hasOuterCount: false,
    minOuter: 0,
    maxOuter: 0,
    defaultOuter: 0,
  },
  stern: {
    kind: 'stern',
    name: 'Stern',
    description: 'Personen kreisförmig, Strahlen zum Mittelpunkt',
    minPersons: 3,
    maxPersons: 6,
    defaultPersons: 4,
    defaultHandHolding: true,
    handHoldingOptional: false,
    hasOuterCount: true,
    minOuter: 0,
    maxOuter: 2,
    defaultOuter: 1,
  },
};

export function createFormation(
  kind: FormationKind,
  personCount?: number,
  handHolding?: boolean,
  outerCount?: number
): FormationElement {
  const preset = FORMATION_PRESETS[kind];
  const defaults = createElementDefaults();
  return {
    ...defaults,
    id: uid(),
    type: 'formation',
    formationKind: kind,
    personCount: personCount ?? preset.defaultPersons,
    handHolding: handHolding ?? preset.defaultHandHolding,
    outerCount: outerCount ?? preset.defaultOuter,
    personRadius: 10,
    fill: '#1e3a8a',
    stroke: '#1e3a8a',
    name: preset.name,
  };
}

export interface FormationLayout {
  cx: number;
  cy: number;
  ringRadius?: number;
  points: { x: number; y: number }[];
  /** Connection lines between consecutive points (for ring/line hand-holding) */
  connections: { x1: number; y1: number; x2: number; y2: number }[];
  /** Rays from center to each point (for star) */
  rays: { x1: number; y1: number; x2: number; y2: number }[];
  /** Whether to draw connections as a circle arc rather than straight lines */
  connectionIsCircle: boolean;
}

export function getFormationLayout(el: FormationElement): FormationLayout {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const pad = el.personRadius + 6;
  const ringRadius = Math.min(el.width, el.height) / 2 - pad;

  if (el.formationKind === 'linie') {
    const count = el.personCount;
    const spacing = (el.width - pad * 2) / Math.max(1, count - 1);
    const startX = el.x + pad;
    const y = cy;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      points.push({ x: startX + spacing * i, y });
    }
    const connections: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      connections.push({ x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y });
    }
    return { cx, cy, points, connections, rays: [], connectionIsCircle: false };
  }

  if (el.formationKind === 'stern') {
    const inner = el.personCount;
    const outer = el.outerCount;
    // outermost person sits at ringRadius (touching frame like kreis)
    const outerRadius = ringRadius;
    // inner persons spaced to avoid overlap: innerRadius = outerRadius - (outer+1) * 2 * personRadius
    // but ensure innerRadius is at least personRadius away from center
    const innerRadius = Math.max(
      el.personRadius + 4,
      outerRadius - (outer + 1) * (el.personRadius * 2 + 2)
    );
    const points: { x: number; y: number }[] = [];
    const rays: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const endR = outer > 0 ? outerRadius : innerRadius;
    for (let i = 0; i < inner; i++) {
      const angle = (i / inner) * Math.PI * 2 - Math.PI / 2;
      const ix = cx + Math.cos(angle) * innerRadius;
      const iy = cy + Math.sin(angle) * innerRadius;
      points.push({ x: ix, y: iy });
      // Outer persons evenly spaced between inner and outer radius
      for (let o = 1; o <= outer; o++) {
        const r = innerRadius + (outerRadius - innerRadius) * (o / (outer + 1));
        const ox = cx + Math.cos(angle) * r;
        const oy = cy + Math.sin(angle) * r;
        points.push({ x: ox, y: oy });
      }
      // Ray from center to last person on this ray
      rays.push({
        x1: cx,
        y1: cy,
        x2: cx + Math.cos(angle) * endR,
        y2: cy + Math.sin(angle) * endR,
      });
    }
    return { cx, cy, points, connections: [], rays, connectionIsCircle: false };
  }

  // kreis (default)
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < el.personCount; i++) {
    const angle = (i / el.personCount) * Math.PI * 2 - Math.PI / 2;
    points.push({
      x: cx + Math.cos(angle) * ringRadius,
      y: cy + Math.sin(angle) * ringRadius,
    });
  }
  return { cx, cy, points, connections: [], rays: [], connectionIsCircle: true, ringRadius };
}
