import { useState } from 'react';
import type { GridEditorController, GridEditorViewModel } from '@game-data/presentation';

export function GridSavePanel({ model, editor }: { model: GridEditorViewModel; editor: GridEditorController }) {
  const [copied, setCopied] = useState(false);

  const copyJson = async () => {
    const json = editor.generateJson();
    if (!json) return;
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section aria-labelledby="grid-save-title" className="rounded-2xl border border-white/[0.07] bg-slate-900/65 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/70">Studio</p>
      <h3 id="grid-save-title" className="mt-1 text-lg font-semibold text-white">Enregistrer la grille</h3>
      <p className="mt-1 text-sm text-slate-400">La grille sera conservée dans le repository interne du studio, avec son identifiant et sa description.</p>
      <button
        type="button"
        disabled={!model.ready}
        onClick={() => void copyJson()}
        className="mt-4 w-full rounded-lg border border-white/[0.08] bg-slate-950/50 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copied ? '✓ Copié !' : 'Copier le JSON'}
      </button>
      <form className="mt-3 flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); void editor.saveGrid(); }}>
        <input aria-label="Description de la grille" required minLength={1} value={model.description} disabled={!model.ready || model.saving}
          onChange={(event) => editor.editDescription(event.target.value)} placeholder="Description de la grille"
          className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400/60" />
        <button type="submit" disabled={!model.ready || model.saving || !model.description.trim()}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
          {model.saving ? 'Enregistrement…' : model.savedId ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </form>
      {model.savedId && <p className="mt-3 text-xs text-slate-400">ID interne : <code className="text-amber-300">{model.savedId}</code></p>}
      {model.message && <p role="status" className="mt-3 text-sm text-emerald-300">{model.message}</p>}
    </section>
  );
}
