import { jsPDF } from 'jspdf';
import type { Choreography, SceneElement, LineShape, CurveShape } from '../types';
import { getFormationLayout } from './formations';
import { strokeDashArraySVG, arrowMarkersSVG, arrowMarkerRef, strokeLinecapSVG } from './stroke';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const GRID_SIZE = 20;

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function renderElementSVG(el: SceneElement): string {
  if (!el.visible) return '';
  const { x, y, width, height, rotation, fill, stroke, strokeWidth } = el;
  const transform = rotation !== 0 ? `transform="rotate(${rotation} ${x + width / 2} ${y + height / 2})"` : '';

  let content = '';
  switch (el.type) {
    case 'formation': {
      const layout = getFormationLayout(el);
      const dashAttr = strokeDashArraySVG(el.strokeStyle, el.strokeWidth);
      const capAttr = strokeLinecapSVG(el.strokeStyle);
      if (el.handHolding && layout.connectionIsCircle) {
        content += `<circle cx="${layout.cx}" cy="${layout.cy}" r="${(layout as any).ringRadius}" fill="none" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"${dashAttr}${capAttr} opacity="0.6"/>`;
      }
      if (el.handHolding && !layout.connectionIsCircle) {
        layout.connections.forEach((c) => {
          content += `<line x1="${c.x1}" y1="${c.y1}" x2="${c.x2}" y2="${c.y2}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"${dashAttr}${capAttr} opacity="0.6"/>`;
        });
      }
      layout.rays.forEach((r) => {
        content += `<line x1="${r.x1}" y1="${r.y1}" x2="${r.x2}" y2="${r.y2}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" opacity="0.6"/>`;
      });
      // Persons always solid stroke
      layout.points.forEach((p) => {
        content += `<circle cx="${p.x}" cy="${p.y}" r="${el.personRadius}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>`;
      });
      break;
    }
    case 'circle':
      content = `<circle cx="${x + width / 2}" cy="${y + height / 2}" r="${Math.min(width, height) / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${strokeDashArraySVG(el.strokeStyle, el.strokeWidth)}${strokeLinecapSVG(el.strokeStyle)}/>`;
      break;
    case 'line': {
      const lineEl = el as LineShape;
      const markers = (lineEl.arrowStart || lineEl.arrowEnd) ? arrowMarkersSVG(stroke, el.id) : '';
      content = `${markers ? `<defs>${markers}</defs>` : ''}<line x1="${x}" y1="${y}" x2="${lineEl.x2}" y2="${lineEl.y2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"${strokeDashArraySVG(el.strokeStyle, el.strokeWidth)}${arrowMarkerRef(lineEl.arrowStart, lineEl.arrowEnd, stroke, el.id)}/>`;
      break;
    }
    case 'curve': {
      const curveEl = el as CurveShape;
      const markers = (curveEl.arrowStart || curveEl.arrowEnd) ? arrowMarkersSVG(stroke, el.id) : '';
      content = `${markers ? `<defs>${markers}</defs>` : ''}<path d="M ${x} ${y} Q ${curveEl.cx} ${curveEl.cy} ${curveEl.x2} ${curveEl.y2}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"${strokeDashArraySVG(el.strokeStyle, el.strokeWidth)}${arrowMarkerRef(curveEl.arrowStart, curveEl.arrowEnd, stroke, el.id)}/>`;
      break;
    }
    case 'rectangle':
      content = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${el.cornerRadius}" ry="${el.cornerRadius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${strokeDashArraySVG(el.strokeStyle, el.strokeWidth)}${strokeLinecapSVG(el.strokeStyle)}/>`;
      break;
    case 'text':
      content = `<text x="${x}" y="${y + el.fontSize}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" font-size="${el.fontSize}" font-weight="${el.fontWeight}" font-family="${el.fontFamily}" text-anchor="${el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start'}">${escapeXml(el.text)}</text>`;
      break;
    case 'group':
      content = '';
      break;
  }

  return `<g ${transform}>${content}</g>`;
}

function sectionToSVG(section: { name: string; elements: SceneElement[] }, showGrid: boolean): string {
  const sorted = [...section.elements].sort((a, b) => a.layer - b.layer);
  const gridDef = showGrid
    ? `<defs><pattern id="grid" width="${GRID_SIZE}" height="${GRID_SIZE}" patternUnits="userSpaceOnUse"><path d="M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}" fill="none" stroke="#cbd5e1" stroke-width="0.5"/></pattern></defs>`
    : '';
  const gridRect = showGrid ? `<rect x="0" y="0" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#grid)"/>` : '';
  const elements = sorted.map((el) => renderElementSVG(el)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">${gridDef}<rect x="0" y="0" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="#ffffff"/>${gridRect}${elements}</svg>`;
}

function svgToImage(svgStr: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

async function svgToCanvas(svgStr: string, scale = 2): Promise<HTMLCanvasElement> {
  const img = await svgToImage(svgStr);
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH * scale;
  canvas.height = CANVAS_HEIGHT * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_') || 'choreo';
}

export async function exportSectionsAsPNG(choreo: Choreography, showGrid: boolean) {
  const base = sanitizeFilename(choreo.name);
  for (let i = 0; i < choreo.sections.length; i++) {
    const section = choreo.sections[i];
    const svg = sectionToSVG(section, showGrid);
    const canvas = await svgToCanvas(svg, 2);
    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    downloadBlob(blob, `${base}_${i + 1}_${sanitizeFilename(section.name)}.png`);
  }
}

export async function exportSectionsAsPDF(choreo: Choreography, showGrid: boolean) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [CANVAS_WIDTH, CANVAS_HEIGHT] });
  for (let i = 0; i < choreo.sections.length; i++) {
    const section = choreo.sections[i];
    const svg = sectionToSVG(section, showGrid);
    const canvas = await svgToCanvas(svg, 2);
    const imgData = canvas.toDataURL('image/png');
    if (i > 0) pdf.addPage([CANVAS_WIDTH, CANVAS_HEIGHT], 'landscape');
    pdf.addImage(imgData, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`${i + 1}. ${section.name}`, 12, CANVAS_HEIGHT - 8);
  }
  pdf.save(`${sanitizeFilename(choreo.name)}.pdf`);
}
