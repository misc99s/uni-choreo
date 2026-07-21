import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { Section } from '../types';

interface Props {
  sections: Section[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onRename: (index: number, name: string) => void;
}

export function SectionBar({ sections, activeIndex, onSelect, onAdd, onDelete, onReorder, onRename }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-3 py-2">
      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {sections.map((section, i) => (
          <div
            key={section.id}
            className={`group flex items-center gap-1 rounded-lg px-1 transition-colors ${
              i === activeIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
            }`}
          >
            <button
              onClick={() => onSelect(i)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                i === activeIndex ? 'text-blue-700' : 'text-slate-600'
              }`}
            >
              {i + 1}. {section.name}
            </button>
            <input
              type="text"
              value={section.name}
              onChange={(e) => onRename(i, e.target.value)}
              className="hidden w-20 rounded border border-slate-300 px-1 py-0.5 text-xs"
              placeholder="Name"
            />
            <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onReorder(i, Math.max(0, i - 1))}
                disabled={i === 0}
                className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                title="Nach oben"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => onReorder(i, Math.min(sections.length - 1, i + 1))}
                disabled={i === sections.length - 1}
                className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                title="Nach unten"
              >
                <ArrowDown size={14} />
              </button>
              {sections.length > 1 && (
                <button
                  onClick={() => onDelete(i)}
                  className="rounded p-0.5 text-slate-400 hover:text-red-600"
                  title="Abschnitt löschen"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
      >
        <Plus size={16} />
        Abschnitt
      </button>
    </div>
  );
}
