import { useEffect, useState, useSyncExternalStore } from 'react';
import type { gameStatsComposition } from '../composition/gameStatsComposition';
import type { RecordedGame, GameStatus, BotStats } from '@game-data/application';
import { Icon, inputClass, Field } from './ui-kit';

type Composition = ReturnType<typeof gameStatsComposition>;

const STATUS_LABELS: Record<GameStatus, string> = {
  'in-progress': 'En cours',
  finished: 'Terminée',
  interrupted: 'Interrompue',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  const totalSeconds = Math.round(minutes * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s} s`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} s`;
}

function formatRate(value: number | null): string {
  return value === null ? '—' : `${value} %`;
}

function BotStatsCard({ stats, isFirst }: { stats: BotStats; isFirst: boolean }) {
  return (
    <div className={`flex-1 rounded-xl border p-4 ${isFirst ? 'border-amber-400/20 bg-amber-400/[0.05]' : 'border-white/[0.07] bg-slate-950/40'}`}>
      <p className="text-xs font-bold text-slate-200">{stats.botId}</p>
      <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4">
        <Stat label="Victoires" value={String(stats.wins)} />
        <Stat label="Défaites" value={String(stats.losses)} />
        <Stat label="Taux victoire" value={formatRate(stats.winRatePercent)} />
        <Stat label="Taux décisif" value={formatRate(stats.decisiveWinRatePercent)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}

function MatchRow({ game }: { game: RecordedGame }) {
  const winResult = game.result?.outcome === 'win' ? game.result : null;
  const winner = winResult ? game.players.find((p) => p.playerId === winResult.winnerId) : null;

  return (
    <tr className="border-b border-white/[0.04]">
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(game.startedAt)}</td>
      <td className="px-4 py-3 text-xs">
        {game.players.map((p) => (
          <div key={p.playerId} className="max-w-[12rem]">
            <div className="truncate text-slate-300">{p.botId ?? p.playerId}</div>
            <div className="truncate text-slate-500">{p.commanderName ?? p.commanderId}</div>
          </div>
        ))}
      </td>
      <td className="px-4 py-3 text-xs">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
          game.status === 'finished' ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20'
          : game.status === 'in-progress' ? 'text-sky-300 bg-sky-400/10 border-sky-400/20'
          : 'text-slate-400 bg-slate-400/10 border-slate-400/20'
        }`}>
          {STATUS_LABELS[game.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
        {game.result === null
          ? '—'
          : game.result.outcome === 'draw'
            ? 'Égalité'
            : winner
              ? `${winner.botId ?? winner.playerId} — ${winner.healthPoints} PV`
              : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{game.turnCount} tours</td>
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDuration(game.durationMinutes)}</td>
    </tr>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/[0.16] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30">
        Précédent
      </button>
      <span className="text-xs text-slate-500">Page {page} / {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}
        className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/[0.16] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30">
        Suivant
      </button>
    </div>
  );
}

export function BotComparisonView({ comparisonController, comparisonPresenter }: Pick<Composition, 'comparisonController' | 'comparisonPresenter'>) {
  const model = useSyncExternalStore(comparisonPresenter.subscribe, comparisonPresenter.getViewModel);
  const [botAInput, setBotAInput] = useState(model.botA);
  const [botBInput, setBotBInput] = useState(model.botB);
  const [matchesOnlyFinished, setMatchesOnlyFinished] = useState(false);

  useEffect(() => {
    setBotAInput(model.botA);
    setBotBInput(model.botB);
  }, [model.botA, model.botB]);

  useEffect(() => {
    if (model.comparisonStatus === 'idle') {
      void comparisonController.compare(model.botA, model.botB);
      void comparisonController.loadMatches(1, matchesOnlyFinished ? 'finished' : undefined);
    }
  }, [comparisonController, model.botA, model.botB, model.comparisonStatus, matchesOnlyFinished]);

  const handleCompare = () => {
    const a = botAInput.trim();
    const b = botBInput.trim();
    if (!a || !b || a === b) return;
    void comparisonController.compare(a, b);
    void comparisonController.loadMatches(1, matchesOnlyFinished ? 'finished' : undefined);
  };

  const handleStatusToggle = (finished: boolean) => {
    setMatchesOnlyFinished(finished);
    void comparisonController.loadMatches(1, finished ? 'finished' : undefined);
  };

  const handlePageChange = (page: number) => {
    void comparisonController.loadMatches(page, matchesOnlyFinished ? 'finished' : undefined);
  };

  const { comparison } = model;

  return (
    <div className="space-y-6">
      {/* Bot selector */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/65 shadow-2xl shadow-black/10">
        <div className="flex items-start gap-4 border-b border-white/[0.06] px-6 py-5">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-300/15 bg-amber-400/10 text-amber-300">
            <Icon name="stats" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/70">Comparaison</p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">IA contre IA</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">Confrontez deux versions de bot sur l'ensemble de leurs parties enregistrées.</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Bot A" className="w-52">
              <input
                className={inputClass}
                value={botAInput}
                onChange={(e) => setBotAInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCompare(); }}
                placeholder="heuristic-v1"
              />
            </Field>
            <Field label="Bot B" className="w-52">
              <input
                className={inputClass}
                value={botBInput}
                onChange={(e) => setBotBInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCompare(); }}
                placeholder="heuristic-v2"
              />
            </Field>
            <button
              type="button"
              onClick={handleCompare}
              disabled={!botAInput.trim() || !botBInput.trim() || botAInput.trim() === botBInput.trim() || model.comparisonStatus === 'loading'}
              className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:border-amber-400/50 hover:bg-amber-400/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="stats" className="size-4" />
              Comparer
            </button>
            <button
              type="button"
              onClick={() => void comparisonController.refresh()}
              disabled={model.comparisonStatus === 'loading'}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3.5 py-2.5 text-sm text-slate-400 transition hover:border-white/[0.16] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="upload" className="size-4 rotate-180" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Comparison stats */}
      {model.comparisonStatus === 'loading' && (
        <p role="status" className="text-sm text-slate-400">Chargement de la comparaison…</p>
      )}
      {model.comparisonStatus === 'error' && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.05] px-4 py-3">
          <Icon name="warning" className="size-5 shrink-0 text-rose-400/70" />
          <p className="text-sm text-rose-300">{model.comparisonError}</p>
        </div>
      )}
      {model.comparisonStatus === 'ready' && comparison && comparison.totalGames > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/65 shadow-2xl shadow-black/10">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
              <span>Total : <span className="font-semibold text-slate-200">{comparison.totalGames}</span></span>
              <span>Terminées : <span className="font-semibold text-slate-200">{comparison.finishedGames}</span></span>
              <span>Décisives : <span className="font-semibold text-slate-200">{comparison.decidedGames}</span></span>
              <span>Égalités : <span className="font-semibold text-slate-200">{comparison.draws}</span></span>
              {comparison.inProgressGames > 0 && <span>En cours : <span className="font-semibold text-sky-300">{comparison.inProgressGames}</span></span>}
              {comparison.interruptedGames > 0 && <span>Interrompues : <span className="font-semibold text-slate-400">{comparison.interruptedGames}</span></span>}
            </div>
          </div>
          <div className="flex gap-4 p-6">
            {comparison.bots.map((bot, i) => (
              <BotStatsCard key={bot.botId} stats={bot} isFirst={i === 0} />
            ))}
          </div>
        </div>
      )}
      {model.comparisonStatus === 'ready' && comparison && comparison.totalGames === 0 && (
        <p className="text-sm text-slate-500">Aucune confrontation enregistrée entre ces deux bots.</p>
      )}

      {/* Matches list */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/65 shadow-2xl shadow-black/10">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-sm font-semibold text-white">Confrontations</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Afficher :</span>
            {(['', 'finished'] as const).map((val) => {
              const active = (val === 'finished') === matchesOnlyFinished;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleStatusToggle(val === 'finished')}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${active ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  {val === 'finished' ? 'Terminées' : 'Toutes'}
                </button>
              );
            })}
          </div>
        </div>

        {model.matchesStatus === 'loading' && (
          <div className="grid place-items-center py-12">
            <p role="status" className="text-sm text-slate-400">Chargement des confrontations…</p>
          </div>
        )}
        {model.matchesStatus === 'error' && (
          <div className="grid place-items-center gap-3 py-12">
            <Icon name="warning" className="size-6 text-rose-400/60" />
            <p className="text-sm text-rose-300">{model.matchesError}</p>
          </div>
        )}
        {model.matchesStatus === 'ready' && model.matches.length === 0 && (
          <div className="grid place-items-center py-12">
            <p className="text-sm text-slate-500">Aucune confrontation enregistrée.</p>
          </div>
        )}
        {model.matchesStatus === 'ready' && model.matches.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Date', 'Joueurs', 'Statut', 'Résultat', 'Tours', 'Durée'].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.matches.map((game) => <MatchRow key={game.gameId} game={game} />)}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2">
              <span className="text-xs text-slate-500">{model.matchesPagination.total} confrontation{model.matchesPagination.total !== 1 ? 's' : ''}</span>
              <Pagination
                page={model.matchesPagination.page}
                totalPages={model.matchesPagination.totalPages}
                onChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
