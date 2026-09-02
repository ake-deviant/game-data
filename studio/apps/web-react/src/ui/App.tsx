import { useState } from 'react';
import { createCommanderComposition } from '../composition/createCommanderComposition';
import { updateCommanderComposition } from '../composition/updateCommanderComposition';
import { CommanderForm } from './CommanderForm';
import { EditCommanderForm } from './EditCommanderForm';
import { PawnList } from './PawnList';
import { PublishView } from './PublishView';

type View = 'create' | 'edit' | 'pawns' | 'publish';

export function App() {
  const [createComposition] = useState(createCommanderComposition);
  const [editComposition] = useState(updateCommanderComposition);
  const [view, setView] = useState<View>('create');

  return (
    <main>
      <h1>Game Data Studio</h1>
      <nav>
        <button type="button" onClick={() => setView('create')}>Créer un Commander</button>
        <button type="button" onClick={() => setView('edit')}>Modifier un Commander</button>
        <button type="button" onClick={() => setView('pawns')}>Voir les pions</button>
        <button type="button" onClick={() => setView('publish')}>Publier</button>
      </nav>
      {view === 'create' && <CommanderForm {...createComposition} />}
      {view === 'edit' && <EditCommanderForm {...editComposition} />}
      {view === 'pawns' && <PawnList />}
      {view === 'publish' && <PublishView />}
    </main>
  );
}
