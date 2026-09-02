import { useEffect, useState } from 'react';

type Pawn = { id: string; displayName: string; color: string; type: string; role: string; power: number; turnCount: number; weaponKey: string };

export function PawnList() {
  const [pawns, setPawns] = useState<readonly Pawn[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch('/api/catalog/pawns')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setPawns)
      .catch(() => setError('Impossible de charger les pions.'));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  return (
    <section>
      <h2>Pions existants</h2>
      <table>
        <thead><tr><th>Nom</th><th>Rôle</th><th>Couleur</th><th>Type</th><th>Puissance</th><th>Arme</th></tr></thead>
        <tbody>{pawns.map((pawn) => (
          <tr key={pawn.id}>
            <td>{pawn.displayName}</td><td>{pawn.role}</td><td>{pawn.color}</td>
            <td>{pawn.type}</td><td>{pawn.power}</td><td>{pawn.weaponKey}</td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  );
}
