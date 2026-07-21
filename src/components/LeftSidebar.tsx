import { useState } from 'react';
import { Circle, Minus, Square, Type, Users, ChevronLeft, Spline } from 'lucide-react';
import type { SceneElement, FormationKind } from '../types';
import { FORMATION_PRESETS, createFormation } from '../lib/formations';
import { createElementDefaults, uid } from '../lib/storage';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  onAdd: (el: SceneElement) => void;
}

type AddCategory = 'formation' | 'shape' | 'text';

export function LeftSidebar({ collapsed, onToggle, onAdd }: Props) {
  const [category, setCategory] = useState<AddCategory>('formation');
  const [formationKind, setFormationKind] = useState<FormationKind>('kreis');
  const [personCount, setPersonCount] = useState(6);
  const [handHolding, setHandHolding] = useState(true);
  const [outerCount, setOuterCount] = useState(1);

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex h-full w-12 items-center justify-center border-r border-slate-200 bg-white transition-colors hover:bg-slate-50"
        title="Panel einblenden"
      >
        <ChevronLeft size={20} className="rotate-180 text-slate-500" />
      </button>
    );
  }

  const handleAddFormation = () => {
    const el = createFormation(formationKind, personCount, handHolding, outerCount);
    onAdd(el);
  };

  const handleAddCircle = () => {
    const d = createElementDefaults();
    onAdd({ ...d, id: uid(), type: 'circle', name: 'Kreis' });
  };

  const handleAddLine = () => {
    const d = createElementDefaults();
    onAdd({
      ...d,
      id: uid(),
      type: 'line',
      name: 'Linie',
      x2: d.x + d.width,
      y2: d.y,
      arrowStart: false,
      arrowEnd: false,
      fill: 'transparent',
      strokeWidth: 4,
    });
  };

  const handleAddCurve = () => {
    const d = createElementDefaults();
    onAdd({
      ...d,
      id: uid(),
      type: 'curve',
      name: 'Kurve',
      x2: d.x + d.width,
      y2: d.y,
      cx: d.x + d.width / 2,
      cy: d.y - 80,
      arrowStart: false,
      arrowEnd: false,
      fill: 'transparent',
      strokeWidth: 4,
    });
  };

  const handleAddRect = () => {
    const d = createElementDefaults();
    onAdd({ ...d, id: uid(), type: 'rectangle', cornerRadius: 0, name: 'Rechteck' });
  };

  const handleAddText = () => {
    const d = createElementDefaults();
    onAdd({
      ...d,
      id: uid(),
      type: 'text',
      name: 'Text',
      text: 'Neuer Text',
      fontSize: 24,
      fontWeight: 400,
      fontFamily: 'sans-serif',
      align: 'left',
      fill: '#1e293b',
      stroke: 'transparent',
      strokeWidth: 0,
      width: 200,
      height: 30,
    });
  };

  const preset = FORMATION_PRESETS[formationKind];

  return (
    <div className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Hinzufügen</h2>
        <button
          onClick={onToggle}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Panel ausblenden"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-200 px-3 py-2">
        <TabButton active={category === 'formation'} onClick={() => setCategory('formation')} icon={<Users size={16} />} label="Formation" />
        <TabButton active={category === 'shape'} onClick={() => setCategory('shape')} icon={<Square size={16} />} label="Form" />
        <TabButton active={category === 'text'} onClick={() => setCategory('text')} icon={<Type size={16} />} label="Text" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {category === 'formation' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Formation</label>
              <select
                value={formationKind}
                onChange={(e) => {
                  const k = e.target.value as FormationKind;
                  setFormationKind(k);
                  const p = FORMATION_PRESETS[k];
                  setPersonCount(p.defaultPersons);
                  setHandHolding(p.defaultHandHolding);
                  setOuterCount(p.defaultOuter);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.values(FORMATION_PRESETS).map((p) => (
                  <option key={p.kind} value={p.kind}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Personenanzahl: <span className="font-bold text-slate-800">{personCount}</span>
              </label>
              <input
                type="range"
                min={preset.minPersons}
                max={preset.maxPersons}
                value={personCount}
                onChange={(e) => setPersonCount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{preset.minPersons}</span>
                <span>{preset.maxPersons}</span>
              </div>
            </div>

            {preset.handHoldingOptional && (
              <div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={handHolding}
                    onChange={(e) => setHandHolding(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm text-slate-700">Handhaltung</span>
                </label>
                <p className="mt-1 text-xs text-slate-400">
                  {preset.kind === 'linie'
                    ? 'Verbindungslinie zwischen benachbarten Personen'
                    : 'Verbindungslinie als großer Kreis'}
                </p>
              </div>
            )}

            {!preset.handHoldingOptional && (
              <p className="text-xs text-slate-400">
                Strahlen vom Mittelpunkt zu jeder Person
              </p>
            )}

            {preset.hasOuterCount && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Personen außen (pro Strahl): <span className="font-bold text-slate-800">{outerCount}</span>
                </label>
                <input
                  type="range"
                  min={preset.minOuter}
                  max={preset.maxOuter}
                  value={outerCount}
                  onChange={(e) => setOuterCount(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Gesamt: {personCount + outerCount * personCount} Personen
                </p>
              </div>
            )}

            <button
              onClick={handleAddFormation}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              {preset.name} hinzufügen
            </button>
          </div>
        )}

        {category === 'shape' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Einfache Formen hinzufügen</p>
            <ShapeButton onClick={handleAddCircle} icon={<Circle size={20} />} label="Kreis" />
            <ShapeButton onClick={handleAddLine} icon={<Minus size={20} />} label="Linie" />
            <ShapeButton onClick={handleAddCurve} icon={<Spline size={20} />} label="Kurve" />
            <ShapeButton onClick={handleAddRect} icon={<Square size={20} />} label="Rechteck" />
          </div>
        )}

        {category === 'text' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Textfeld hinzufügen</p>
            <button
              onClick={handleAddText}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              Text hinzufügen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
        active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ShapeButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
    >
      {icon}
      {label}
    </button>
  );
}
