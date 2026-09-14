import { useEffect, useState, useSyncExternalStore } from 'react';
import type { gridCatalogComposition } from '../composition/gridCatalogComposition';
import { Field, inputClass } from './ui-kit';
import { GridBoard } from './GridBoard';
import { GridPawnProperties } from './GridPawnProperties';
import { GridSavePanel } from './GridSavePanel';
import { GridPawnPalette } from './GridPawnPalette';

export function GridStudioView({ controller, presenter, editor, editorPresenter, view = 'new' }: ReturnType<typeof gridCatalogComposition> & { view?: 'new' | 'load' }) {
  const model = useSyncExternalStore(presenter.subscribe, presenter.getViewModel);
  const editing = useSyncExternalStore(editorPresenter.subscribe, editorPresenter.getViewModel);
  const [commanderFilter, setCommanderFilter] = useState('');
  const [gridLoaded, setGridLoaded] = useState(false);
  useEffect(() => { if (presenter.getViewModel().status === 'idle') void controller.load(); }, [controller, presenter]);
  useEffect(() => { setGridLoaded(false); }, [view]);

  const restoreSavedGrid = (id: string) => {
    const saved = editing.savedGrids.find((item) => item.id === id);
    if (!saved) return;
    if (model.selectedCommander?.id !== saved.commanderId) controller.select(saved.commanderId);
    const current = presenter.getViewModel();
    if (current.selectedCommander) {
      editor.restoreSaved(id, current.selectedCommander, current.pawns);
      setGridLoaded(true);
    }
  };

  const editorLayout = (filterId: string) => (
    <div className="grid items-start gap-4 xl:grid-cols-[26rem_minmax(0,1fr)_15rem]">
      <GridPawnPalette filterId={filterId} model={editing} editor={editor} pawns={model.pawns} commander={model.selectedCommander ? { name: model.selectedCommander.name, pawnMax: model.selectedCommander.pawnMax, pawnsCount: model.pawns.length } : undefined} />
      <div className="sticky top-[5.5rem]"><GridBoard model={editing} editor={editor} /></div>
      <div className="space-y-4">
        <GridPawnProperties model={editing} editor={editor} />
        <GridSavePanel model={editing} editor={editor} />
      </div>
    </div>
  );

  if (view === 'new') {
    return (
      <section className="space-y-6" onKeyDown={(event) => { if (event.key === 'Escape') editor.cancel(); }}>
        <div className="max-w-sm space-y-4">
          {(model.status === 'idle' || model.status === 'loading') && <p role="status" className="text-sm text-slate-400">Chargement du catalogue…</p>}
          {model.status === 'error' && (
            <div className="space-y-2">
              <p role="alert" className="text-sm text-rose-300">{model.message}</p>
              <button type="button" className="rounded-lg border border-amber-400/30 px-3 py-2 text-sm text-amber-300" onClick={() => void controller.load()}>Réessayer</button>
            </div>
          )}
          {model.status === 'ready' && !editing.ready && (
            <Field label="Commandant">
              <select className={inputClass} value={model.selectedCommander?.id ?? ''} onChange={(e) => controller.select(e.target.value)}>
                <option value="">Choisir un commandant</option>
                {model.commanders.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
        </div>
        {editing.ready && editorLayout('grid-new-pawn-filter')}
      </section>
    );
  }

  if (view === 'load') {
    const commanderName = (id: string) => model.commanders.find((c) => c.id === id)?.name ?? id;
    const filtered = editing.savedGrids.filter((g) => !commanderFilter || g.commanderId === commanderFilter);

    if (gridLoaded && editing.ready) {
      return (
        <section className="space-y-6" onKeyDown={(event) => { if (event.key === 'Escape') editor.cancel(); }}>
          <button type="button" onClick={() => setGridLoaded(false)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
            <span>←</span> Charger une autre grille
          </button>
          {editorLayout('grid-load-pawn-filter')}
        </section>
      );
    }

    return (
      <section aria-labelledby="grid-load-title" className="max-w-2xl space-y-6">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/70">Grilles</p>
          <h2 id="grid-load-title" className="mt-1 text-2xl font-semibold tracking-tight text-white">Charger une grille</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Sélectionnez une grille enregistrée pour l'ouvrir dans l'éditeur.</p>
        </header>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2" htmlFor="load-commander-filter">
            Filtrer par commandant
          </label>
          <select id="load-commander-filter" className={inputClass} value={commanderFilter} onChange={(e) => setCommanderFilter(e.target.value)}>
            <option value="">Tous les commandants</option>
            {model.commanders.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {editing.savedGrids.length === 0 && (
          <p className="text-sm text-slate-400">Aucune grille enregistrée dans le studio.</p>
        )}
        {editing.savedGrids.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-slate-400">Aucune grille pour ce commandant.</p>
        )}

        <ul className="space-y-3">
          {filtered.map((saved) => (
            <li key={saved.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-slate-900/65 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">{saved.description}</p>
                <p className="mt-0.5 text-xs text-slate-400">{commanderName(saved.commanderId)}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{new Date(saved.updatedAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <button
                type="button"
                disabled={model.status !== 'ready'}
                onClick={() => restoreSavedGrid(saved.id)}
                className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Charger
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return null;
}
