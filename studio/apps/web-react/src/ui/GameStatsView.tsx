import { Fragment, useEffect, useState, useSyncExternalStore } from 'react';
import type { gameStatsComposition } from '../composition/gameStatsComposition';
import type { RecordedGame, GameMode, GameStatus } from '@game-data/application';
import { Icon, inputClass, Field } from './ui-kit';

type Composition = ReturnType<typeof gameStatsComposition>;

const MODE_LABELS: Record<GameMode, string> = {
  'bot-vs-bot': 'IA contre IA',
  'human-vs-bot': 'Humain contre IA',
  online: 'Humains en ligne',
  local: 'Humains en local',
  tutorial: 'Tutoriel',
  restored: 'Partie restaurée',
  unknown: 'Mode inconnu',
};

const STATUS_LABELS: Record<GameStatus, string> = {
  'in-progress': 'En cours',
  finished: 'Terminée',
  interrupted: 'Interrompue',
};

const STATUS_COLORS: Record<GameStatus, string> = {
  'in-progress': 'text-sky-300 bg-sky-400/10 border-sky-400/20',
  finished: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  interrupted: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
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

function StatusBadge({ status }: { status: GameStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function GameDetail({ game, onClose }: { game: RecordedGame; onClose: () => void }) {
  const winResult = game.result?.outcome === 'win' ? game.result : null;
  const winner = winResult ? game.players.find((p) => p.playerId === winResult.winnerId) : null;

  return (
    <tr>
      <td colSpan={7} className="bg-slate-900/80 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 flex-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Identifiant</p>
              <p className="mt-1 font-mono text-xs text-slate-300 break-all">{game.gameId}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Début</p>
              <p className="mt-1 text-xs text-slate-300">{formatDate(game.startedAt)}</p>
            </div>
            {game.endedAt && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Fin</p>
                <p className="mt-1 text-xs text-slate-300">{formatDate(game.endedAt)}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Durée</p>
              <p className="mt-1 text-xs text-slate-300">{formatDuration(game.durationMinutes)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Tours</p>
              <p className="mt-1 text-xs text-slate-300">{game.turnCount}</p>
            </div>
            {game.reason && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Raison</p>
                <p className="mt-1 text-xs capitalize text-slate-300">{game.reason}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Résultat</p>
              <p className="mt-1 text-xs text-slate-300">
                {game.result === null
                  ? '—'
                  : game.result.outcome === 'draw'
                    ? 'Égalité'
                    : winner
                      ? `Victoire de ${winner.botId ?? winner.playerId} (${winner.healthPoints} PV)`
                      : 'Victoire'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/[0.08] p-1.5 text-slate-500 hover:border-white/[0.16] hover:text-slate-300 transition"
            aria-label="Fermer le détail"
          >
            <Icon name="plus" className="size-4 rotate-45" />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {game.players.map((p, i) => {
            const isWinner = game.result?.outcome === 'win' && p.playerId === game.result.winnerId;
            return (
              <div key={p.playerId} className={`rounded-xl border p-3 ${isWinner ? 'border-amber-400/25 bg-amber-400/[0.06]' : 'border-white/[0.06] bg-slate-950/40'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Joueur {i + 1}</span>
                  {isWinner && <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-400">Gagnant</span>}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-200">{p.botId ?? p.playerId}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>Commandant : <span className="text-slate-300">{p.commanderName ?? p.commanderId}</span></span>
                  <span>Contrôle : <span className="text-slate-300">{p.controller}</span></span>
                  <span>PV : <span className="text-slate-300">{p.healthPoints}</span></span>
                  {p.rawHealthPoints !== null && <span>PV bruts : <span className="text-slate-300">{p.rawHealthPoints}</span></span>}
                </div>
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

function GameRow({ game, isSelected, onToggle }: { game: RecordedGame; isSelected: boolean; onToggle: () => void }) {
  const winResult = game.result?.outcome === 'win' ? game.result : null;
  const winner = winResult ? game.players.find((p) => p.playerId === winResult.winnerId) : null;

  return (
    <tr
      className={`cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.02] ${isSelected ? 'bg-amber-400/[0.04]' : ''}`}
      onClick={onToggle}
    >
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(game.startedAt)}</td>
      <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">{MODE_LABELS[game.mode]}</td>
      <td className="px-4 py-3 text-xs">
        {game.players.map((p) => (
          <div key={p.playerId} className="max-w-[14rem]">
            <div className="truncate text-slate-300">
              {p.botId ?? p.playerId}
              <span className="ml-1 text-slate-600">({p.controller})</span>
            </div>
            <div className="truncate text-slate-500">{p.commanderName ?? p.commanderId}</div>
          </div>
        ))}
      </td>
      <td className="px-4 py-3"><StatusBadge status={game.status} /></td>
      <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
        {game.result === null
          ? '—'
          : game.result.outcome === 'draw'
            ? 'Égalité'
            : winner
              ? `${winner.botId ?? winner.playerId} — ${winner.healthPoints} PV`
              : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{game.turnCount} tours</td>
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDuration(game.durationMinutes)}</td>
    </tr>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/[0.16] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Précédent
      </button>
      <span className="text-xs text-slate-500">Page {page} / {totalPages}</span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/[0.16] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Suivant
      </button>
    </div>
  );
}

export function GameStatsView({ statsController, statsPresenter }: Pick<Composition, 'statsController' | 'statsPresenter'>) {
  const model = useSyncExternalStore(statsPresenter.subscribe, statsPresenter.getViewModel);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [modeFilter, setModeFilter] = useState<GameMode | ''>('');
  const [statusFilter, setStatusFilter] = useState<GameStatus | ''>('');

  useEffect(() => {
    if (model.status === 'idle') void statsController.load({ page: 1, pageSize: 50 });
  }, [statsController, model.status]);

  useEffect(() => {
    if (model.detailStatus === 'idle') setSelectedId(null);
  }, [model.detailStatus]);

  const applyFilters = (mode: GameMode | '', status: GameStatus | '') => {
    void statsController.load({
      page: 1,
      pageSize: 50,
      ...(mode ? { mode } : {}),
      ...(status ? { status } : {}),
    });
    setSelectedId(null);
  };

  const handleModeChange = (value: GameMode | '') => {
    setModeFilter(value);
    applyFilters(value, statusFilter);
  };

  const handleStatusChange = (value: GameStatus | '') => {
    setStatusFilter(value);
    applyFilters(modeFilter, value);
  };

  const handlePageChange = (page: number) => {
    void statsController.load({ ...model.filters, page });
    setSelectedId(null);
  };

  const toggleDetail = (gameId: string) => {
    if (selectedId === gameId) {
      setSelectedId(null);
      statsController.clearDetail();
    } else {
      setSelectedId(gameId);
      void statsController.select(gameId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Mode" className="w-48">
          <select className={inputClass} value={modeFilter} onChange={(e) => handleModeChange(e.target.value as GameMode | '')}>
            <option value="">Tous les modes</option>
            {(Object.keys(MODE_LABELS) as GameMode[]).map((m) => (
              <option key={m} value={m}>{MODE_LABELS[m]}</option>
            ))}
          </select>
        </Field>
        <Field label="Statut" className="w-44">
          <select className={inputClass} value={statusFilter} onChange={(e) => handleStatusChange(e.target.value as GameStatus | '')}>
            <option value="">Tous les statuts</option>
            {(Object.keys(STATUS_LABELS) as GameStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          onClick={() => void statsController.refresh()}
          disabled={model.status === 'loading'}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3.5 py-2.5 text-sm text-slate-400 transition hover:border-white/[0.16] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="upload" className="size-4 rotate-180" />
          Actualiser
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/65 shadow-2xl shadow-black/10">
        {(model.status === 'idle' || model.status === 'loading') && (
          <div className="grid place-items-center py-20">
            <p role="status" className="text-sm text-slate-400">Chargement des parties…</p>
          </div>
        )}

        {model.status === 'error' && (
          <div className="grid place-items-center gap-3 py-20">
            <Icon name="warning" className="size-8 text-rose-400/60" />
            <p role="alert" className="text-sm text-rose-300">{model.error}</p>
            <button
              type="button"
              onClick={() => void statsController.refresh()}
              className="rounded-lg border border-amber-400/30 px-3 py-2 text-sm text-amber-300 hover:border-amber-400/50 transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {model.status === 'ready' && model.games.length === 0 && (
          <div className="grid place-items-center py-20">
            <p className="text-sm text-slate-500">Aucune partie enregistrée avec ces filtres.</p>
          </div>
        )}

        {model.status === 'ready' && model.games.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Date', 'Mode', 'Joueurs', 'Statut', 'Résultat', 'Tours', 'Durée'].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.games.map((game) => (
                    <Fragment key={game.gameId}>
                      <GameRow
                        game={game}
                        isSelected={selectedId === game.gameId}
                        onToggle={() => toggleDetail(game.gameId)}
                      />
                      {selectedId === game.gameId && model.detailStatus === 'loading' && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-xs text-slate-500 bg-slate-900/80">
                            Chargement du détail…
                          </td>
                        </tr>
                      )}
                      {selectedId === game.gameId && model.detailStatus === 'error' && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-slate-900/80">
                            <p className="text-xs text-rose-300">{model.detailError}</p>
                          </td>
                        </tr>
                      )}
                      {selectedId === game.gameId && model.selectedGame && (
                        <GameDetail
                          game={model.selectedGame}
                          onClose={() => { setSelectedId(null); statsController.clearDetail(); }}
                        />
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2">
              <span className="text-xs text-slate-500">{model.pagination.total} partie{model.pagination.total !== 1 ? 's' : ''}</span>
              <Pagination
                page={model.pagination.page}
                totalPages={model.pagination.totalPages}
                onChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
