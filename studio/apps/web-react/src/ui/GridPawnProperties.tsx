import type { GridEditorController, GridEditorViewModel } from '@game-data/presentation';
import { Field, inputClass } from './ui-kit';

export function GridPawnProperties({ model, editor }: { model: GridEditorViewModel; editor: GridEditorController }) {
  const pawn = model.pawns.find((item) => item.id === model.selectedId);
  return (
    <section aria-labelledby="grid-properties-title" className="rounded-2xl border border-white/[0.07] bg-slate-900/65 p-4">
      <h3 id="grid-properties-title" className="text-sm font-semibold text-white">Propriétés du pion</h3>
      {!pawn ? <p className="mt-3 text-sm leading-6 text-slate-400">Sélectionnez un pion placé pour modifier ses valeurs.</p> : (
        <form className="mt-4 space-y-4" onSubmit={(event) => { event.preventDefault(); editor.save(); }}>
          <p className="break-words text-sm text-amber-200">{pawn.displayName ?? pawn.templateId}</p>
          <p className="text-xs text-slate-400">{pawn.rank} · {pawn.status} · {pawn.footprint.value}<br />Colonne {pawn.position.col}, ligne {pawn.position.row}</p>
          <Field label="Puissance" hint="Entier de 1 à 200">
            <input className={inputClass} type="number" min={1} max={200} step={1} required value={model.powerInput} onChange={(event) => editor.editPower(event.target.value)} />
          </Field>
          {pawn.turnCount === null ? <p className="text-xs text-slate-400">Soldat libre : aucun compteur d’attaque.</p> : (
            <Field label="Compteur d’attaque" hint="Entier de 1 à 9">
              <input className={inputClass} type="number" min={1} max={9} step={1} required value={model.turnCountInput} onChange={(event) => editor.editTurnCount(event.target.value)} />
            </Field>
          )}
          <dl className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between gap-2"><dt>Poids en capacité</dt><dd>{pawn.countPawns}</dd></div>
            <div className="flex justify-between gap-2"><dt>Coût de placement</dt><dd>{pawn.moveCount ?? 'Non défini'}</dd></div>
          </dl>
          <button type="submit" className="w-full rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950">Appliquer les valeurs</button>
          <button type="button" className="w-full rounded-lg border border-slate-600 px-3 py-2 text-sm" onClick={() => editor.beginMove(pawn.id)}>Déplacer vers une case</button>
          <button type="button" className="w-full rounded-lg border border-rose-400/30 px-3 py-2 text-sm text-rose-300" onClick={() => editor.remove()}>Supprimer le pion</button>
        </form>
      )}
    </section>
  );
}
