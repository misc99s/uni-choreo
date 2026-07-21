import type { Choreography, Section, SceneElement } from '../types';

const STORAGE_KEY = 'unicycle-choreo-data';
const ACTIVE_KEY = 'unicycle-choreo-active';

export function loadChoreographies(): Choreography[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Choreography[];
  } catch {
    return [];
  }
}

export function saveChoreographies(choreos: Choreography[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(choreos));
}

export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function createSection(name: string): Section {
  return { id: uid(), name, elements: [] };
}

export function createElementDefaults(): Pick<
  SceneElement,
  'id' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'fill' | 'stroke' | 'strokeWidth' | 'strokeStyle' | 'layer' | 'visible' | 'locked' | 'name'
> {
  return {
    id: uid(),
    x: 200,
    y: 200,
    width: 150,
    height: 150,
    rotation: 0,
    fill: '#3b82f6',
    stroke: '#1e40af',
    strokeWidth: 2,
    strokeStyle: 'solid',
    layer: 0,
    visible: true,
    locked: false,
    name: '',
  };
}
