import { X, FileText, Trash2 } from 'lucide-react';
import type { Choreography } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  choreographies: Choreography[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export function LoadDialog({ open, onClose, choreographies, onLoad, onDelete }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Choreographien</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {choreographies.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Keine gespeicherten Choreographien.</p>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {choreographies
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((c) => (
                <div
                  key={c.id}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <FileText size={20} className="shrink-0 text-slate-400" />
                  <button onClick={() => { onLoad(c.id); onClose(); }} className="flex-1 text-left">
                    <div className="font-medium text-slate-800">{c.name || 'Unbenannt'}</div>
                    <div className="text-xs text-slate-400">
                      {c.sections.length} Abschnitte · {new Date(c.updatedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                    className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    title="Löschen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
