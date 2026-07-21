import { useState, useCallback, useRef, useEffect } from 'react';
import type { Choreography, Section, SceneElement } from './types';
import {
  loadChoreographies,
  saveChoreographies,
  loadActiveId,
  saveActiveId,
  uid,
  createSection,
} from './lib/storage';

import { exportSectionsAsPNG, exportSectionsAsPDF } from './lib/export';

import { Canvas } from './components/Canvas';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { SectionBar } from './components/SectionBar';
import { Toolbar } from './components/Toolbar';
import { LoadDialog } from './components/LoadDialog';

function createEmptyChoreo(name: string): Choreography {
  return {
    id: uid(),
    name,
    sections: [createSection('Einleitung')],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function App() {
  const [choreo, setChoreo] = useState<Choreography>(() => {
    const all = loadChoreographies();
    const activeId = loadActiveId();
    const active = all.find((c) => c.id === activeId);
    return active ?? createEmptyChoreo('Neue Choreographie');
  });
  const [activeSection, setActiveSection] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loadOpen, setLoadOpen] = useState(false);
  const [allChoreos, setAllChoreos] = useState<Choreography[]>(() => loadChoreographies());

  // Undo/Redo
  const historyRef = useRef<Choreography[]>([]);
  const futureRef = useRef<Choreography[]>([]);
  const choreoRef = useRef<Choreography>(choreo);
  choreoRef.current = choreo;
  const [historyVersion, setHistoryVersion] = useState(0);

  const pushHistory = useCallback(() => {
    historyRef.current.push(JSON.parse(JSON.stringify(choreoRef.current)));
    if (historyRef.current.length > 50) historyRef.current.shift();
    futureRef.current = [];
    setHistoryVersion((v) => v + 1);
  }, []);

  const updateChoreo = useCallback(
    (updater: (c: Choreography) => Choreography, recordHistory = true) => {
      if (recordHistory) pushHistory();
      setChoreo((prev) => {
        const next = updater(prev);
        next.updatedAt = Date.now();
        return next;
      });
    },
    [pushHistory]
  );

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) {
      futureRef.current.push(JSON.parse(JSON.stringify(choreoRef.current)));
      setChoreo(prev);
      setSelectedIds([]);
      setHistoryVersion((v) => v + 1);
    }
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (next) {
      historyRef.current.push(JSON.parse(JSON.stringify(choreoRef.current)));
      setChoreo(next);
      setSelectedIds([]);
      setHistoryVersion((v) => v + 1);
    }
  }, []);

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;
  void historyVersion;

  // Section helpers
  const currentSection = choreo.sections[Math.min(activeSection, choreo.sections.length - 1)];

  const updateSection = useCallback(
    (sectionIdx: number, updater: (s: Section) => Section) => {
      updateChoreo((c) => ({
        ...c,
        sections: c.sections.map((s, i) => (i === sectionIdx ? updater(s) : s)),
      }));
    },
    [updateChoreo]
  );

  // Element operations
  const addElement = useCallback(
    (el: SceneElement) => {
      updateSection(activeSection, (s) => ({
        ...s,
        elements: [...s.elements, { ...el, layer: s.elements.length }],
      }));
      setSelectedIds([el.id]);
    },
    [activeSection, updateSection]
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<SceneElement>) => {
      updateSection(activeSection, (s) => ({
        ...s,
        elements: s.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as SceneElement) : e)),
      }));
    },
    [activeSection, updateSection]
  );

  const deleteElements = useCallback(
    (ids: string[]) => {
      updateSection(activeSection, (s) => ({
        ...s,
        elements: s.elements.filter((e) => !ids.includes(e.id)),
      }));
      setSelectedIds([]);
    },
    [activeSection, updateSection]
  );

  const duplicateElements = useCallback(
    (ids: string[]) => {
      const newIds: string[] = [];
      updateSection(activeSection, (s) => {
        const toDup = s.elements.filter((e) => ids.includes(e.id));
        const copies = toDup.map((e) => {
          const copy = { ...JSON.parse(JSON.stringify(e)), id: uid(), x: e.x + 20, y: e.y + 20, layer: s.elements.length + newIds.length };
          newIds.push(copy.id);
          return copy as SceneElement;
        });
        return { ...s, elements: [...s.elements, ...copies] };
      });
      setSelectedIds(newIds);
    },
    [activeSection, updateSection]
  );

  const groupElements = useCallback(
    (ids: string[]) => {
      if (ids.length < 2) return;
      const groupId = uid();
      updateSection(activeSection, (s) => {
        const children = s.elements.filter((e) => ids.includes(e.id));
        if (children.length < 2) return s;
        const minX = Math.min(...children.map((e) => e.x));
        const minY = Math.min(...children.map((e) => e.y));
        const maxX = Math.max(...children.map((e) => e.x + e.width));
        const maxY = Math.max(...children.map((e) => e.y + e.height));
        const group: SceneElement = {
          id: groupId,
          type: 'group',
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          rotation: 0,
          fill: 'transparent',
          stroke: '#94a3b8',
          strokeWidth: 1,
          layer: s.elements.length,
          visible: true,
          locked: false,
          name: 'Gruppe',
          childIds: ids,
        } as SceneElement;
        return { ...s, elements: [...s.elements, group] };
      });
      setSelectedIds([groupId]);
    },
    [activeSection, updateSection]
  );

  const ungroupElement = useCallback(
    (id: string) => {
      updateSection(activeSection, (s) => {
        const group = s.elements.find((e) => e.id === id);
        if (!group || group.type !== 'group') return s;
        return {
          ...s,
          elements: s.elements.filter((e) => e.id !== id),
        };
      });
      setSelectedIds([]);
    },
    [activeSection, updateSection]
  );

  const changeLayer = useCallback(
    (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
      updateSection(activeSection, (s) => {
        const els = [...s.elements];
        const idx = els.findIndex((e) => e.id === id);
        if (idx === -1) return s;
        const sorted = [...els].sort((a, b) => a.layer - b.layer);
        const sIdx = sorted.findIndex((e) => e.id === id);
        if (sIdx === -1) return s;
        if (direction === 'up' && sIdx < sorted.length - 1) {
          [sorted[sIdx], sorted[sIdx + 1]] = [sorted[sIdx + 1], sorted[sIdx]];
        } else if (direction === 'down' && sIdx > 0) {
          [sorted[sIdx], sorted[sIdx - 1]] = [sorted[sIdx - 1], sorted[sIdx]];
        } else if (direction === 'top') {
          const [item] = sorted.splice(sIdx, 1);
          sorted.push(item);
        } else if (direction === 'bottom') {
          const [item] = sorted.splice(sIdx, 1);
          sorted.unshift(item);
        }
        sorted.forEach((e, i) => (e.layer = i));
        return { ...s, elements: sorted };
      });
    },
    [activeSection, updateSection]
  );

  // Section operations
  const addSection = useCallback(() => {
    updateChoreo((c) => ({
      ...c,
      sections: [...c.sections, createSection(`Abschnitt ${c.sections.length + 1}`)],
    }));
    setActiveSection(choreo.sections.length);
  }, [updateChoreo, choreo.sections.length]);

  const deleteSection = useCallback(
    (idx: number) => {
      if (choreo.sections.length <= 1) return;
      updateChoreo((c) => ({
        ...c,
        sections: c.sections.filter((_, i) => i !== idx),
      }));
      if (activeSection >= idx && activeSection > 0) {
        setActiveSection(activeSection - 1);
      }
    },
    [choreo.sections.length, activeSection, updateChoreo]
  );

  const reorderSection = useCallback(
    (from: number, to: number) => {
      updateChoreo((c) => {
        const sections = [...c.sections];
        const [moved] = sections.splice(from, 1);
        sections.splice(to, 0, moved);
        return { ...c, sections };
      });
      setActiveSection(to);
    },
    [updateChoreo]
  );

  const renameSection = useCallback(
    (idx: number, name: string) => {
      updateSection(idx, (s) => ({ ...s, name }));
    },
    [updateSection]
  );

  // Choreography operations
  const saveChoreo = useCallback(() => {
    setAllChoreos((prev) => {
      const filtered = prev.filter((c) => c.id !== choreo.id);
      const updated = [...filtered, { ...choreo, updatedAt: Date.now() }];
      saveChoreographies(updated);
      return updated;
    });
    saveActiveId(choreo.id);
  }, [choreo]);

  const loadChoreo = useCallback((id: string) => {
    const all = loadChoreographies();
    const found = all.find((c) => c.id === id);
    if (found) {
      historyRef.current = [];
      futureRef.current = [];
      setChoreo(found);
      setActiveSection(0);
      setSelectedIds([]);
      saveActiveId(id);
    }
  }, []);

  const deleteChoreo = useCallback((id: string) => {
    setAllChoreos((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveChoreographies(updated);
      return updated;
    });
  }, []);

  const newChoreo = useCallback(() => {
    const c = createEmptyChoreo('Neue Choreographie');
    historyRef.current = [];
    futureRef.current = [];
    setChoreo(c);
    setActiveSection(0);
    setSelectedIds([]);
    saveActiveId(c.id);
  }, []);

  // Export
  const exportPNG = useCallback(async () => {
    await exportSectionsAsPNG(choreo, showGrid);
  }, [choreo, showGrid]);

  const exportPDF = useCallback(async () => {
    await exportSectionsAsPDF(choreo, showGrid);
  }, [choreo, showGrid]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedIds.length > 0) duplicateElements(selectedIds);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        if (selectedIds.length > 1) groupElements(selectedIds);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveChoreo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteElements(selectedIds);
        }
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, duplicateElements, groupElements, saveChoreo, deleteElements, selectedIds]);

  const selectedElements = currentSection
    ? currentSection.elements.filter((e) => selectedIds.includes(e.id))
    : [];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <Toolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid((v) => !v)}
        onExportPNG={exportPNG}
        onExportPDF={exportPDF}
        onSave={saveChoreo}
        onLoad={() => { setAllChoreos(loadChoreographies()); setLoadOpen(true); }}
        onNewChoreo={newChoreo}
        choreoName={choreo.name}
        onChoreoNameChange={(name) => setChoreo((c) => ({ ...c, name }))}
      />

      <SectionBar
        sections={choreo.sections}
        activeIndex={activeSection}
        onSelect={(i) => { setActiveSection(i); setSelectedIds([]); }}
        onAdd={addSection}
        onDelete={deleteSection}
        onReorder={reorderSection}
        onRename={renameSection}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          collapsed={leftCollapsed}
          onToggle={() => setLeftCollapsed((v) => !v)}
          onAdd={addElement}
        />

        {currentSection && (
          <Canvas
            section={currentSection}
            selectedIds={selectedIds}
            onSelect={(ids, _additive) => setSelectedIds(ids)}
            onUpdateElement={updateElement}
            onCanvasClick={() => setSelectedIds([])}
            snapToGrid={snapToGrid}
            gridSize={20}
            showGrid={showGrid}
            zoom={zoom}
            pan={pan}
            onZoomChange={setZoom}
            onPanChange={setPan}
          />
        )}

        <RightSidebar
          collapsed={rightCollapsed}
          onToggle={() => setRightCollapsed((v) => !v)}
          selectedElements={selectedElements}
          section={currentSection}
          onUpdate={updateElement}
          onDelete={deleteElements}
          onDuplicate={duplicateElements}
          onGroup={groupElements}
          onUngroup={ungroupElement}
          onLayerChange={changeLayer}
        />
      </div>

      <LoadDialog
        open={loadOpen}
        onClose={() => setLoadOpen(false)}
        choreographies={allChoreos}
        onLoad={loadChoreo}
        onDelete={deleteChoreo}
      />
    </div>
  );
}
