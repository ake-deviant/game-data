import { useState } from 'react';
import type { GridEditorViewModel } from '@game-data/presentation';
import type { GridEditorController } from '@game-data/presentation';
import type { GridCatalogViewModel } from '@game-data/presentation';

const roleLabels = { soldier: 'Soldat · none', officer: 'Officier · attack', commander: 'Commandant · attack' };
const colorLabels = { red: 'Rouge', blue: 'Bleu', green: 'Vert' };
const colorClasses = { red: 'bg-rose-400', blue: 'bg-sky-400', green: 'bg-emerald-400' };
type PawnFilter = 'all' | 'soldier' | 'officer' | 'commander';

const filterButtons: { id: Exclude<PawnFilter, 'all'>; label: string }[] = [
  { id: 'soldier', label: 'Troop' },
  { id: 'officer', label: 'Officer' },
  { id: 'commander', label: 'Commander' },
];

interface GridPawnPaletteProps {
  filterId: string;
  model: GridEditorViewModel;
  editor: GridEditorController;
  pawns: GridCatalogViewModel['pawns'];
  commander?: { name: string; pawnMax: number; pawnsCount: number };
}

export function GridPawnPalette({ filterId, model, editor, pawns, commander }: GridPawnPaletteProps) {
  const [pawnFilter, setPawnFilter] = useState<PawnFilter>('all');
  const filtered = pawns.filter((pawn) => pawnFilter === 'all' || pawn.role === pawnFilter);

  return (
    <section aria-labelledby={`${filterId}-title`} className="rounded-2xl border border-white/[0.07] bg-slate-900/65 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 id={`${filterId}-title`} className="text-sm font-semibold text-white">Pions disponibles</h3>
        {commander && (
          <div className="shrink-0 rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-400/[0.14] via-amber-400/[0.06] to-transparent px-4 py-2.5 text-right shadow-lg shadow-amber-500/10">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.28em] text-amber-400/60">Commandant</p>
            <p className="mt-0.5 text-base font-bold tracking-tight text-white">{commander.name}</p>
            <div className="mt-2 h-px bg-gradient-to-r from-transparent to-amber-400/40" />
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-amber-300">Capacité : {model.pawnMax} · Reste : {model.remainingCapacity}</p>
      <div className="mt-4 flex gap-1.5">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setPawnFilter((f) => f === btn.id ? 'all' : btn.id)}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${pawnFilter === btn.id ? 'border-amber-400/40 bg-amber-400/[0.12] text-amber-300' : 'border-white/[0.07] bg-slate-950/40 text-slate-400 hover:text-slate-200'}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2" aria-label="Pions du commandant">
        {filtered.map((pawn) => {
          const key = `${pawn.role}:${pawn.id}`;
          const isActive = model.activeTemplateKey === key;
          return (
            <li key={key}>
              <button
                type="button"
                draggable
                aria-pressed={isActive}
                className={`w-full cursor-grab rounded-xl border p-2.5 text-left ${isActive ? 'border-amber-300 bg-amber-400/10' : 'border-white/[0.07] bg-slate-950/45 hover:border-amber-300/50'}`}
                onClick={() => editor.chooseTemplate(key)}
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', key); e.dataTransfer.effectAllowed = 'copy'; editor.chooseTemplate(key); }}
                onDragEnd={() => editor.cancel()}
              >
                {pawn.displayName !== pawn.id && <p className="break-words text-xs font-medium text-slate-100 leading-snug">{pawn.displayName}</p>}
                <p className="mt-1 text-[11px] text-slate-400">{roleLabels[pawn.role]}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${colorClasses[pawn.color]}`} />
                  {colorLabels[pawn.color]}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">{pawn.type === 'melee' ? 'Mêlée' : 'Distance'}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
