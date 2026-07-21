import { ChevronRight, Copy, Trash2, Group, Ungroup, Lock, Unlock, Eye, EyeOff, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import type { SceneElement, Section } from '../types';
import { FORMATION_PRESETS } from '../lib/formations';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  selectedElements: SceneElement[];
  section: Section;
  onUpdate: (id: string, patch: Partial<SceneElement>) => void;
  onDelete: (ids: string[]) => void;
  onDuplicate: (ids: string[]) => void;
  onGroup: (ids: string[]) => void;
  onUngroup: (id: string) => void;
  onLayerChange: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
}

const COLOR_PRESETS = [
  '#1e3a8a', '#2563eb', '#3b82f6', '#06b6d4', '#0891b2',
  '#059669', '#16a34a', '#65a30d', '#ca8a04', '#d97706',
  '#dc2626', '#be185d', '#9333ea', '#475569', '#1e293b',
  '#ffffff', 'transparent',
];

export function RightSidebar({
  collapsed,
  onToggle,
  selectedElements,
  section,
  onUpdate,
  onDelete,
  onDuplicate,
  onGroup,
  onUngroup,
  onLayerChange,
}: Props) {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex h-full w-12 items-center justify-center border-l border-slate-200 bg-white transition-colors hover:bg-slate-50"
        title="Panel einblenden"
      >
        <ChevronRight size={20} className="rotate-180 text-slate-500" />
      </button>
    );
  }

  if (selectedElements.length === 0) {
    return (
      <div className="flex h-full w-72 flex-col border-l border-slate-200 bg-white">
        <Header onToggle={onToggle} title="Bearbeiten" />
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-sm text-slate-400">Kein Element ausgewählt. Tippe auf ein Element, um es zu bearbeiten.</p>
        </div>
      </div>
    );
  }

  const single = selectedElements.length === 1 ? selectedElements[0] : null;

  return (
    <div className="flex h-full w-72 flex-col border-l border-slate-200 bg-white">
      <Header onToggle={onToggle} title={single ? single.name || single.type : `${selectedElements.length} Elemente`} />

      <div className="flex-1 overflow-y-auto p-4">
        {/* Action buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          <ActionButton icon={<Copy size={15} />} label="Duplizieren" onClick={() => onDuplicate(selectedElements.map((e) => e.id))} />
          <ActionButton icon={<Trash2 size={15} />} label="Löschen" danger onClick={() => onDelete(selectedElements.map((e) => e.id))} />
          {selectedElements.length > 1 && (
            <ActionButton icon={<Group size={15} />} label="Gruppieren" onClick={() => onGroup(selectedElements.map((e) => e.id))} />
          )}
          {single?.type === 'group' && (
            <ActionButton icon={<Ungroup size={15} />} label="Gruppe auflösen" onClick={() => onUngroup(single.id)} />
          )}
        </div>

        {single ? (
          <SingleElementEditor
            element={single}
            section={section}
            onUpdate={onUpdate}
            onLayerChange={onLayerChange}
          />
        ) : (
          <MultiElementEditor
            elements={selectedElements}
            onUpdate={onUpdate}
          />
        )}
      </div>
    </div>
  );
}

function Header({ onToggle, title }: { onToggle: () => void; title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <h2 className="truncate text-sm font-semibold text-slate-800">{title}</h2>
      <button
        onClick={onToggle}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        title="Panel ausblenden"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function ActionButton({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        danger
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-slate-300"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className="h-5 w-5 rounded border border-slate-200 transition-transform hover:scale-110"
            style={{ background: c === 'transparent' ? 'repeating-conic-gradient(#cbd5e1 0% 25%, #fff 0% 50%) 50% / 8px 8px' : c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

const STROKE_STYLES: { value: import('../types').StrokeStyle; label: string; dash: string }[] = [
  { value: 'solid', label: 'Solid', dash: '' },
  { value: 'dashed', label: 'Gestrichelt', dash: '8 4' },
  { value: 'dotted', label: 'Gepunktet', dash: '1 4' },
  { value: 'dash-dot', label: 'Punkt-Strich', dash: '8 4 1 4' },
];

function StrokeStyleField({ value, onChange }: { value: import('../types').StrokeStyle; onChange: (v: import('../types').StrokeStyle) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">Kontur-Stil</label>
      <div className="grid grid-cols-2 gap-1.5">
        {STROKE_STYLES.map((s) => (
          <button
            key={s.value}
            onClick={() => onChange(s.value)}
            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
              value === s.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg width="24" height="2">
              <line x1="0" y1="1" x2="24" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray={s.dash || undefined} />
            </svg>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ArrowToggles({ arrowStart, arrowEnd, onChange }: { arrowStart: boolean; arrowEnd: boolean; onChange: (patch: { arrowStart?: boolean; arrowEnd?: boolean }) => void }) {
  return (
    <div className="flex gap-3">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={arrowStart}
          onChange={(e) => onChange({ arrowStart: e.target.checked })}
          className="h-4 w-4 accent-blue-600"
        />
        <span className="text-sm text-slate-700">Pfeil Anfang</span>
      </label>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={arrowEnd}
          onChange={(e) => onChange({ arrowEnd: e.target.checked })}
          className="h-4 w-4 accent-blue-600"
        />
        <span className="text-sm text-slate-700">Pfeil Ende</span>
      </label>
    </div>
  );
}

function SingleElementEditor({
  element,
  section,
  onUpdate,
  onLayerChange,
}: {
  element: SceneElement;
  section: Section;
  onUpdate: (id: string, patch: Partial<SceneElement>) => void;
  onLayerChange: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
}) {
  const update = (patch: Partial<SceneElement>) => onUpdate(element.id, patch);
  const maxLayer = Math.max(...section.elements.map((e) => e.layer), 0);

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
        <input
          type="text"
          value={element.name}
          onChange={(e) => update({ name: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Position */}
      <Section title="Position & Größe">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={Math.round(element.x)} onChange={(v) => update({ x: v })} />
          <NumberField label="Y" value={Math.round(element.y)} onChange={(v) => update({ y: v })} />
          {element.type !== 'line' && (
            <>
              <NumberField label="Breite" value={Math.round(element.width)} onChange={(v) => update({ width: Math.max(10, v) })} />
              <NumberField label="Höhe" value={Math.round(element.height)} onChange={(v) => update({ height: Math.max(10, v) })} />
            </>
          )}
          <NumberField label="Winkel°" value={Math.round(element.rotation)} onChange={(v) => update({ rotation: v })} />
        </div>
      </Section>

      {/* Line specific */}
      {element.type === 'line' && (
        <Section title="Linien-Endpunkt">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="X2" value={Math.round(element.x2)} onChange={(v) => update({ x2: v } as Partial<SceneElement>)} />
            <NumberField label="Y2" value={Math.round(element.y2)} onChange={(v) => update({ y2: v } as Partial<SceneElement>)} />
          </div>
          <div className="mt-3">
            <ArrowToggles
              arrowStart={element.arrowStart}
              arrowEnd={element.arrowEnd}
              onChange={(p) => update(p as Partial<SceneElement>)}
            />
          </div>
        </Section>
      )}

      {/* Curve specific */}
      {element.type === 'curve' && (
        <Section title="Kurve">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Endpunkt X" value={Math.round(element.x2)} onChange={(v) => update({ x2: v } as Partial<SceneElement>)} />
            <NumberField label="Endpunkt Y" value={Math.round(element.y2)} onChange={(v) => update({ y2: v } as Partial<SceneElement>)} />
            <NumberField label="Wegpunkt X" value={Math.round(element.cx)} onChange={(v) => update({ cx: v } as Partial<SceneElement>)} />
            <NumberField label="Wegpunkt Y" value={Math.round(element.cy)} onChange={(v) => update({ cy: v } as Partial<SceneElement>)} />
          </div>
          <div className="mt-3">
            <ArrowToggles
              arrowStart={element.arrowStart}
              arrowEnd={element.arrowEnd}
              onChange={(p) => update(p as Partial<SceneElement>)}
            />
          </div>
        </Section>
      )}

      {/* Formation specific */}
      {element.type === 'formation' && (() => {
        const preset = FORMATION_PRESETS[element.formationKind];
        return (
          <Section title="Formation">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                {preset.hasOuterCount ? 'Personen innen' : 'Personenanzahl'}: <span className="font-bold">{element.personCount}</span>
              </label>
              <input
                type="range"
                min={preset.minPersons}
                max={preset.maxPersons}
                value={element.personCount}
                onChange={(e) => update({ personCount: Number(e.target.value) } as Partial<SceneElement>)}
                className="w-full accent-blue-600"
              />
            </div>
            {preset.hasOuterCount && (
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Personen außen (pro Strahl): <span className="font-bold">{element.outerCount}</span>
                </label>
                <input
                  type="range"
                  min={preset.minOuter}
                  max={preset.maxOuter}
                  value={element.outerCount}
                  onChange={(e) => update({ outerCount: Number(e.target.value) } as Partial<SceneElement>)}
                  className="w-full accent-blue-600"
                />
                <p className="mt-1 text-xs text-slate-400">Gesamt: {element.personCount + element.outerCount * element.personCount} Personen</p>
              </div>
            )}
            {preset.handHoldingOptional && (
              <div className="mt-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={element.handHolding}
                    onChange={(e) => update({ handHolding: e.target.checked } as Partial<SceneElement>)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm text-slate-700">Handhaltung</span>
                </label>
              </div>
            )}
            <div className="mt-3">
              <NumberField label="Personen-Radius" value={element.personRadius} min={5} max={30} onChange={(v) => update({ personRadius: v } as Partial<SceneElement>)} />
            </div>
          </Section>
        );
      })()}

      {/* Rectangle specific */}
      {element.type === 'rectangle' && (
        <Section title="Rechteck">
          <NumberField label="Eckradius" value={element.cornerRadius} min={0} onChange={(v) => update({ cornerRadius: v } as Partial<SceneElement>)} />
        </Section>
      )}

      {/* Text specific */}
      {element.type === 'text' && (
        <Section title="Text">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Inhalt</label>
            <textarea
              value={element.text}
              onChange={(e) => update({ text: e.target.value } as Partial<SceneElement>)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberField label="Schriftgröße" value={element.fontSize} min={8} max={72} onChange={(v) => update({ fontSize: v } as Partial<SceneElement>)} />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Gewicht</label>
              <select
                value={element.fontWeight}
                onChange={(e) => update({ fontWeight: Number(e.target.value) } as Partial<SceneElement>)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value={300}>Leicht</option>
                <option value={400}>Normal</option>
                <option value={600}>Halbfett</option>
                <option value={700}>Fett</option>
              </select>
            </div>
          </div>
          <div className="mt-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Ausrichtung</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => update({ align: a } as Partial<SceneElement>)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                    element.align === a ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {a === 'left' ? 'Links' : a === 'center' ? 'Mitte' : 'Rechts'}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <ColorField label="Schriftfarbe" value={element.fill} onChange={(v) => update({ fill: v })} />
          </div>
        </Section>
      )}

      {/* Colors */}
      {element.type !== 'text' && element.type !== 'line' && element.type !== 'curve' && (
        <Section title="Farben">
          <ColorField label="Füllfarbe" value={element.fill} onChange={(v) => update({ fill: v })} />
          <div className="mt-3">
            <ColorField label="Konturfarbe" value={element.stroke} onChange={(v) => update({ stroke: v })} />
          </div>
          <div className="mt-3">
            <NumberField label="Konturstärke" value={element.strokeWidth} min={0} max={20} onChange={(v) => update({ strokeWidth: v })} />
          </div>
          <div className="mt-3">
            <StrokeStyleField value={element.strokeStyle} onChange={(v) => update({ strokeStyle: v } as Partial<SceneElement>)} />
          </div>
        </Section>
      )}

      {(element.type === 'line' || element.type === 'curve') && (
        <Section title="Farben">
          <ColorField label="Linienfarbe" value={element.stroke} onChange={(v) => update({ stroke: v })} />
          <div className="mt-3">
            <NumberField label="Linienstärke" value={element.strokeWidth} min={1} max={20} onChange={(v) => update({ strokeWidth: v })} />
          </div>
          <div className="mt-3">
            <StrokeStyleField value={element.strokeStyle} onChange={(v) => update({ strokeStyle: v } as Partial<SceneElement>)} />
          </div>
        </Section>
      )}

      {/* Layer */}
      <Section title="Ebene">
        <div className="flex items-center gap-2">
          <button onClick={() => onLayerChange(element.id, 'bottom')} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title="Ganz nach unten">
            <ChevronsDown size={16} />
          </button>
          <button onClick={() => onLayerChange(element.id, 'down')} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title="Eine Ebene nach unten">
            <ArrowDown size={16} />
          </button>
          <button onClick={() => onLayerChange(element.id, 'up')} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title="Eine Ebene nach oben">
            <ArrowUp size={16} />
          </button>
          <button onClick={() => onLayerChange(element.id, 'top')} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title="Ganz nach oben">
            <ChevronsUp size={16} />
          </button>
          <span className="ml-auto text-xs text-slate-400">Ebene {element.layer}/{maxLayer}</span>
        </div>
      </Section>

      {/* Visibility & Lock */}
      <Section title="Sichtbarkeit">
        <div className="flex gap-2">
          <button
            onClick={() => update({ visible: !element.visible })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {element.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            {element.visible ? 'Sichtbar' : 'Versteckt'}
          </button>
          <button
            onClick={() => update({ locked: !element.locked })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {element.locked ? <Lock size={15} /> : <Unlock size={15} />}
            {element.locked ? 'Gesperrt' : 'Entsperrt'}
          </button>
        </div>
      </Section>
    </div>
  );
}

function MultiElementEditor({
  elements,
  onUpdate,
}: {
  elements: SceneElement[];
  onUpdate: (id: string, patch: Partial<SceneElement>) => void;
}) {
  const updateAll = (patch: Partial<SceneElement>) => {
    elements.forEach((e) => onUpdate(e.id, patch));
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">{elements.length} Elemente ausgewählt. Änderungen wirken auf alle.</p>
      <Section title="Farben">
        <ColorField label="Füllfarbe" value={elements[0].fill} onChange={(v) => updateAll({ fill: v })} />
        <div className="mt-3">
          <ColorField label="Konturfarbe" value={elements[0].stroke} onChange={(v) => updateAll({ stroke: v })} />
        </div>
        <div className="mt-3">
          <NumberField label="Konturstärke" value={elements[0].strokeWidth} min={0} max={20} onChange={(v) => updateAll({ strokeWidth: v })} />
        </div>
      </Section>
      <Section title="Sichtbarkeit">
        <button
          onClick={() => updateAll({ visible: !elements[0].visible })}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {elements[0].visible ? <Eye size={15} /> : <EyeOff size={15} />}
          {elements[0].visible ? 'Alle verstecken' : 'Alle zeigen'}
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  );
}
