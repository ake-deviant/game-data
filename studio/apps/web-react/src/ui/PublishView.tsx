import { useEffect, useState } from 'react';
import { Icon } from './ui-kit';

interface CommanderItem { id: string; name: string; }
type PublishStatus = 'idle' | 'loading' | 'success' | 'error';

export function PublishView() {
  const [commanders, setCommanders] = useState<CommanderItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<PublishStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/catalog/commanders')
      .then((r) => r.json())
      .then((data: CommanderItem[]) => setCommanders(data))
      .catch(() => setCommanders([]));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === commanders.length ? new Set() : new Set(commanders.map((c) => c.id)));
  };

  const publish = async () => {
    if (selected.size === 0) return;
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch('/api/catalog/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ commanderIds: Array.from(selected) }),
      });
      const body = await response.json() as {
        prepared?: { id: string; name: string }[];
        branchName?: string;
        error?: string;
        errors?: string[];
      };
      if (!response.ok) {
        setStatus('error');
        setMessage(body.errors?.join('\n') ?? body.error ?? `Erreur ${response.status}`);
      } else {
        setStatus('success');
        setMessage(
          `Proposition créée sur ${body.branchName ?? 'la branche distante'} pour ${(body.prepared ?? []).length} commander(s). La pull request va être ouverte automatiquement.`,
        );
      }
    } catch {
      setStatus('error');
      setMessage('Erreur réseau.');
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/65 shadow-2xl shadow-black/10">
      <div className="flex items-start gap-4 border-b border-white/[0.06] px-6 py-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-300/15 bg-amber-400/10 text-amber-300">
          <Icon name="upload" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/70">Export</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">Préparer une pull request</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">Sélectionnez les commandants à proposer dans les données de production.</p>
        </div>
      </div>

      <div className="p-6">
        {commanders.length === 0 ? (
          <div className="grid place-items-center py-12 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-white/[0.04] text-slate-600">
              <Icon name="upload" />
            </div>
            <p className="mt-4 text-sm text-slate-400">Aucun commandant dans le catalogue.</p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <button
                className="text-xs font-semibold text-slate-500 transition hover:text-slate-300"
                onClick={toggleAll}
                type="button"
              >
                {selected.size === commanders.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              <span className="text-xs text-slate-600">
                {selected.size} / {commanders.length} sélectionné{selected.size !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="mb-5 space-y-2">
              {commanders.map((c) => {
                const isSelected = selected.has(c.id);
                return (
                  <button
                    key={c.id}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? 'border-amber-400/35 bg-amber-400/10'
                        : 'border-white/[0.07] bg-slate-950/45 hover:border-white/[0.14]'
                    }`}
                    onClick={() => toggle(c.id)}
                    type="button"
                  >
                    <span className={`grid size-5 shrink-0 place-items-center rounded-md border ${isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'}`}>
                      {isSelected && <Icon className="size-3.5" name="check" />}
                    </span>
                    <span>
                      <span className={`block text-sm font-medium ${isSelected ? 'text-amber-100' : 'text-slate-300'}`}>{c.name}</span>
                      <span className="block text-[11px] text-slate-500">{c.id}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {status === 'success' && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-3 text-xs text-emerald-300">
                <Icon className="size-4 shrink-0" name="check" />
                <span className="whitespace-pre-line">{message}</span>
              </div>
            )}
            {status === 'error' && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-400/15 bg-rose-500/[0.06] p-3 text-xs text-rose-300">
                <Icon className="size-4 shrink-0" name="warning" />
                {message}
              </div>
            )}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/15 transition hover:bg-amber-300 active:translate-y-px disabled:opacity-50"
              disabled={selected.size === 0 || status === 'loading'}
              onClick={publish}
              type="button"
            >
              <Icon className="size-4" name="upload" />
              {status === 'loading' ? 'Préparation…' : `Préparer la pull request ${selected.size > 0 ? `(${selected.size})` : ''}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
