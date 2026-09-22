import type { DragEvent, MouseEvent } from 'react';
import type { GridEditorController, GridEditorViewModel } from '@game-data/presentation';

const pawnColors = {
  red: 'border-rose-300/70 bg-rose-950 text-rose-100',
  blue: 'border-sky-300/70 bg-sky-950 text-sky-100',
  green: 'border-emerald-300/70 bg-emerald-950 text-emerald-100',
  defense: 'border-slate-400/60 bg-slate-800 text-slate-200',
};
const rankLabels = { troop: 'Soldat', officer: 'Officier', commander: 'Commandant' };

export function GridBoard({ model, editor }: { model: GridEditorViewModel; editor: GridEditorController }) {
  const active = !!(model.activeTemplateKey || model.movingId);
  const coordinates = (event: MouseEvent<HTMLDivElement> | DragEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { col: Math.floor((event.clientX - rect.left) / rect.width * model.cols), row: Math.floor((event.clientY - rect.top) / rect.height * model.rows) };
  };
  return (
    <section aria-labelledby="grid-workspace-title" className="min-w-0 rounded-2xl border border-white/[0.07] bg-slate-900/65 p-4">
      {!model.ready ? <p className="py-24 text-center text-sm text-slate-400">Choisissez un commandant pour composer sa grille.</p> : (
        <>
          <div className="overflow-auto pb-12 pr-10 pt-4">
            <div className="min-w-[360px]">
              <div className="mb-1 grid text-center text-[10px] text-slate-500" style={{ gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))` }} aria-hidden="true">
                {Array.from({ length: model.cols }, (_, col) => <span key={col}>{col}</span>)}
              </div>
              <div className="relative grid rounded-lg border border-slate-600 bg-slate-950"
                aria-label="Grille de placement, origine en haut à gauche"
                style={{ aspectRatio: `${model.cols} / ${model.rows}`, gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${model.rows}, minmax(0, 1fr))` }}
                onMouseMove={(event) => { if (active) { const p = coordinates(event); editor.hover(p.col, p.row); } }}
                onMouseLeave={() => editor.leave()}
                onDragOver={(event) => {
                  if (!active) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = model.movingId ? 'move' : 'copy';
                  const p = coordinates(event); editor.hover(p.col, p.row);
                }}
                onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) editor.leave(); }}
                onDrop={(event) => { event.preventDefault(); const p = coordinates(event); editor.drop(p.col, p.row); }}>
                {Array.from({ length: model.rows * model.cols }, (_, index) => {
                  const col = index % model.cols;
                  const row = Math.floor(index / model.cols);
                  return <button key={index} type="button" className="min-h-0 min-w-0 border border-slate-800 text-[9px] text-slate-600 hover:bg-slate-800 focus:z-10 focus:outline-2 focus:outline-amber-300"
                    aria-label={`Colonne ${col}, ligne ${row}`} onFocus={() => editor.hover(col, row)} onClick={() => editor.drop(col, row)}>
                    {col === 0 && <span aria-hidden="true">{row}</span>}
                  </button>;
                })}
                {model.pawns.map((pawn) => (
                  <button key={pawn.id} type="button" draggable
                    aria-label={`${pawn.displayName ?? rankLabels[pawn.rank]}, colonne ${pawn.position.col}, ligne ${pawn.position.row}, puissance ${pawn.power}`}
                    aria-pressed={model.selectedId === pawn.id}
                    title={`${pawn.displayName ?? pawn.templateId} · ${rankLabels[pawn.rank]} · ${pawn.status}`}
                    className={`absolute z-10 flex cursor-grab flex-col items-center justify-center overflow-hidden rounded-md border-2 p-0.5 text-center active:cursor-grabbing ${pawn.status === 'defense' ? pawnColors.defense : pawnColors[pawn.color]} ${model.selectedId === pawn.id ? 'ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-950' : ''}`}
                    style={{ left: `calc(${pawn.position.col / model.cols * 100}% + 2px)`, top: `calc(${pawn.position.row / model.rows * 100}% + 2px)`, width: `calc(${pawn.footprint.cols / model.cols * 100}% - 4px)`, height: `calc(${pawn.footprint.rows / model.rows * 100}% - 4px)` }}
                    onClick={() => editor.selectPawn(pawn.id)}
                    onDragStart={(event) => { event.dataTransfer.setData('text/plain', pawn.id); event.dataTransfer.effectAllowed = 'move'; editor.beginMove(pawn.id); }}
                    onDragEnd={() => editor.cancel()}>
                    <span className="max-w-full truncate text-[9px] font-semibold">{pawn.status === 'defense' ? `Mur` : rankLabels[pawn.rank]}</span>
                    <span className="text-sm font-bold leading-tight">{pawn.power}</span>
                    {pawn.status === 'defense' && pawn.defenseLevel !== undefined && <span className="text-[10px]">niv. {pawn.defenseLevel}</span>}
                    {pawn.turnCount !== null && <span className="text-[10px]">{pawn.turnCount} tours</span>}
                  </button>
                ))}
                {model.preview?.cells.map((cell) => <div key={`${cell.col}:${cell.row}`} aria-hidden="true"
                  className={`pointer-events-none absolute z-20 border-2 border-dashed ${model.preview?.valid ? 'border-emerald-300 bg-emerald-400/25' : 'border-rose-300 bg-rose-500/30'}`}
                  style={{ left: `${cell.col / model.cols * 100}%`, top: `${cell.row / model.rows * 100}%`, width: `${100 / model.cols}%`, height: `${100 / model.rows}%` }} />)}
              </div>
            </div>
          </div>
          <div className="min-h-12 text-sm" role="status" aria-live="polite">
            {model.preview ? <p className={model.preview.valid ? 'text-emerald-300' : 'text-rose-300'}>{model.preview.valid ? 'Placement autorisé.' : model.preview.message}</p>
              : active ? <p className="text-amber-300">{model.movingId ? 'Choisissez la nouvelle ancre du pion.' : 'Choisissez la case de dépôt.'}</p>
                : <p className="text-slate-400">{model.message ?? `${model.pawns.length} pions placés.`}</p>}
          </div>
          {active && <button type="button" className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300" onClick={() => editor.cancel()}>Annuler le placement (Échap)</button>}
        </>
      )}
    </section>
  );
}
