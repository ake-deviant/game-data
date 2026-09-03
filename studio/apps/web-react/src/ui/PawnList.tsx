import { useEffect, useState } from 'react';
import { Icon } from './ui-kit';

type Pawn = {
  id: string;
  displayName: string;
  color: string;
  type: string;
  role: string;
  power: number;
  turnCount: number;
  weaponKey: string;
};

const roleMeta: Record<string, { label: string; color: string }> = {
  soldier:   { label: 'Soldat',      color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
  commander: { label: 'Commandant',  color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  officer:   { label: 'Officier',    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
};

const colorDot: Record<string, string> = {
  red:   'bg-rose-400',
  blue:  'bg-sky-400',
  green: 'bg-emerald-400',
};

export function PawnList() {
  const [pawns, setPawns] = useState<readonly Pawn[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch('/api/catalog/pawns')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setPawns)
      .catch(() => setError('Impossible de charger les pions.'));
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/65 shadow-2xl shadow-black/10">
      <div className="flex items-start gap-4 border-b border-white/[0.06] px-6 py-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-300/15 bg-amber-400/10 text-amber-300">
          <Icon name="shield" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/70">Catalogue</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">Pions existants</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{pawns.length} pion{pawns.length !== 1 ? 's' : ''} chargé{pawns.length !== 1 ? 's' : ''} depuis le store.</p>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 m-6 rounded-xl border border-rose-400/20 bg-rose-500/[0.07] p-4 text-sm text-rose-300">
          <Icon className="size-4 shrink-0" name="warning" />
          {error}
        </div>
      ) : pawns.length === 0 ? (
        <div className="grid place-items-center py-16 text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-white/[0.04] text-slate-600">
            <Icon name="shield" />
          </div>
          <p className="mt-4 text-sm text-slate-400">Aucun pion dans le catalogue.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-slate-950/30">
                {['Nom', 'Rôle', 'Couleur', 'Type', 'Puissance', 'Arme'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {pawns.map((pawn) => (
                <tr key={pawn.id} className="transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{pawn.displayName}</div>
                    <div className="text-[11px] text-slate-500">{pawn.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${roleMeta[pawn.role]?.color ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
                      {roleMeta[pawn.role]?.label ?? pawn.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${colorDot[pawn.color] ?? 'bg-slate-500'}`} />
                      <span className="text-slate-300 capitalize">{pawn.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{pawn.type}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{pawn.power}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{pawn.weaponKey}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
