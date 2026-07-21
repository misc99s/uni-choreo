export type ElementType = 'formation' | 'circle' | 'line' | 'curve' | 'rectangle' | 'text' | 'group';

export type FormationKind = 'kreis' | 'linie' | 'stern';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted' | 'dash-dot';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  layer: number;
  visible: boolean;
  locked: boolean;
  name: string;
}

export interface FormationElement extends BaseElement {
  type: 'formation';
  formationKind: FormationKind;
  personCount: number;
  handHolding: boolean;
  personRadius: number;
  outerCount: number;
}

export interface CircleShape extends BaseElement {
  type: 'circle';
}

export interface LineShape extends BaseElement {
  type: 'line';
  x2: number;
  y2: number;
  arrowStart: boolean;
  arrowEnd: boolean;
}

export interface CurveShape extends BaseElement {
  type: 'curve';
  /** Control point (waypoint) for quadratic bezier */
  cx: number;
  cy: number;
  x2: number;
  y2: number;
  arrowStart: boolean;
  arrowEnd: boolean;
}

export interface RectangleShape extends BaseElement {
  type: 'rectangle';
  cornerRadius: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
}

export interface GroupElement extends BaseElement {
  type: 'group';
  childIds: string[];
}

export type SceneElement =
  | FormationElement
  | CircleShape
  | LineShape
  | CurveShape
  | RectangleShape
  | TextElement
  | GroupElement;

export interface Section {
  id: string;
  name: string;
  elements: SceneElement[];
}

export interface Choreography {
  id: string;
  name: string;
  sections: Section[];
  createdAt: number;
  updatedAt: number;
}

export interface Marker {
  id: string;
  x: number;
  y: number;
  label: string;
}
