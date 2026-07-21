import { Undo2, Redo2, Grid3x3, FileImage, FileText, Save, FolderOpen, Plus, Magnet } from 'lucide-react';

interface Props {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNewChoreo: () => void;
  choreoName: string;
  onChoreoNameChange: (name: string) => void;
}

export function Toolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  onExportPNG,
  onExportPDF,
  onSave,
  onLoad,
  onNewChoreo,
  choreoName,
  onChoreoNameChange,
}: Props) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
      <input
        type="text"
        value={choreoName}
        onChange={(e) => onChoreoNameChange(e.target.value)}
        className="w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Choreographie-Name"
      />

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <button onClick={onUndo} disabled={!canUndo} className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30" title="Rückgängig (Ctrl+Z)">
        <Undo2 size={18} />
      </button>
      <button onClick={onRedo} disabled={!canRedo} className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30" title="Wiederherstellen (Ctrl+Y)">
        <Redo2 size={18} />
      </button>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <button
        onClick={onToggleGrid}
        className={`rounded-lg p-2 transition-colors ${showGrid ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
        title="Raster ein/aus"
      >
        <Grid3x3 size={18} />
      </button>
      <button
        onClick={onToggleSnap}
        className={`rounded-lg p-2 transition-colors ${snapToGrid ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
        title="Einrasten ein/aus"
      >
        <Magnet size={18} />
      </button>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <div className="flex items-center gap-1">
        <button onClick={onExportPNG} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" title="Alle Abschnitte als PNG exportieren">
          <FileImage size={16} />
          <span className="hidden md:inline">PNGs</span>
        </button>
        <button onClick={onExportPDF} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" title="Als PDF exportieren">
          <FileText size={16} />
          <span className="hidden md:inline">PDF</span>
        </button>
      </div>
      <button onClick={onSave} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" title="Speichern">
        <Save size={16} />
        <span className="hidden sm:inline">Speichern</span>
      </button>
      <button onClick={onLoad} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" title="Laden">
        <FolderOpen size={16} />
        <span className="hidden sm:inline">Laden</span>
      </button>

      <div className="ml-auto">
        <button
          onClick={onNewChoreo}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} />
          Neu
        </button>
      </div>
    </div>
  );
}
