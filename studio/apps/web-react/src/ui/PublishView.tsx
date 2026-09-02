import { useEffect, useState } from 'react';

interface CommanderItem {
  id: string;
  name: string;
}

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

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function publish() {
    if (selected.size === 0) return;
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch('/api/catalog/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ commanderIds: Array.from(selected) }),
      });
      const body = await response.json() as { published?: { id: string; name: string }[]; error?: string };
      if (!response.ok) {
        setStatus('error');
        setMessage(body.error ?? `Erreur ${response.status}`);
      } else {
        setStatus('success');
        const names = (body.published ?? []).map((p) => p.name).join(', ');
        setMessage(`Publie : ${names}`);
      }
    } catch {
      setStatus('error');
      setMessage('Erreur reseau.');
    }
  }

  return (
    <section>
      <h2>Publier des Commanders</h2>
      {commanders.length === 0 ? (
        <p>Aucun commander dans le catalogue.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {commanders.map((c) => (
            <li key={c.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                />
                {' '}{c.name} <small>({c.id})</small>
              </label>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={publish}
        disabled={selected.size === 0 || status === 'loading'}
      >
        {status === 'loading' ? 'Publication...' : 'Publier la selection'}
      </button>
      {status === 'success' && <p style={{ color: 'green' }}>{message}</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{message}</p>}
    </section>
  );
}
