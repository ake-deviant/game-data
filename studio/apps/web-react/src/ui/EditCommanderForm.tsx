import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import {
  type CommanderFormModel,
  type UpdateCommanderController,
  type UpdateCommanderPresenter,
} from '@game-data/presentation';
import type { CommanderListItem } from '@game-data/application';
import skillsData from '../../../../../data/skills.json';

type Role = 'soldier' | 'officer' | 'commander';
type Pawn = { id: string; displayName: string; color: string; role: Role };
const colors = ['red', 'blue', 'green'] as const;
const playerSkills = skillsData.activablePlayerSkills as { id: string; displayName: string }[];
const innateSkills = skillsData.pawnSkillVisuals as { id: string; displayName: string }[];

interface Props {
  readonly controller: UpdateCommanderController;
  readonly presenter: UpdateCommanderPresenter;
}

function itemToForm(item: CommanderListItem): CommanderFormModel {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    icon: item.icon ?? '',
    pawnMax: item.pawnMax,
    health: item.health,
    maxDefenseLevel: item.maxDefenseLevel,
    wallVisualSet: item.wallVisualSet,
    defensePowerPerLevel: item.defensePowerPerLevel,
    pawnDefinitionIdByColor: item.pawnDefinitionIdByColor,
    commanderPawnDefinitionIds: item.commanderPawnDefinitionIds,
    officerPawnDefinitionIds: item.officerPawnDefinitionIds,
    movementsPerTurn: item.movementsPerTurn,
    skills: item.skills ?? [],
    innateSkills: item.innateSkills ?? [],
  };
}

export function EditCommanderForm({ controller, presenter }: Props) {
  const [commanders, setCommanders] = useState<readonly CommanderListItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<CommanderFormModel | null>(null);
  const [pawns, setPawns] = useState<readonly Pawn[]>([]);
  const [wallVisualSets, setWallVisualSets] = useState<readonly string[]>([]);
  const viewModel = useSyncExternalStore(presenter.subscribe, presenter.getViewModel);

  useEffect(() => {
    fetch('/api/catalog/commanders').then((r) => r.json()).then(setCommanders);
    fetch('/api/catalog/pawns').then((r) => r.json()).then(setPawns);
    fetch('/api/catalog/wall-visual-sets').then((r) => r.json()).then(setWallVisualSets);
  }, []);

  const selectCommander = (id: string) => {
    setSelectedId(id);
    const item = commanders.find((c) => c.id === id);
    setForm(item ? itemToForm(item) : null);
  };

  const setField = <K extends keyof CommanderFormModel>(field: K, value: CommanderFormModel[K]) =>
    setForm((current) => current ? { ...current, [field]: value } : null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form) await controller.submit(form);
  };

  return (
    <div>
      <h2>Modifier un Commander</h2>
      <label>
        <span>Commander à modifier</span>
        <select value={selectedId} onChange={(e) => selectCommander(e.target.value)}>
          <option value="">Sélectionner</option>
          {commanders.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      {form && (
        <form onSubmit={submit}>
          <div className="grid">
            <Field label="Identifiant"><input disabled value={form.id} /></Field>
            <Field label="Nom"><input required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field>
            <Field label="Description"><input value={form.description} onChange={(e) => setField('description', e.target.value)} /></Field>
            <Field label="Icône"><input value={form.icon} onChange={(e) => setField('icon', e.target.value)} /></Field>
            <NumberField label="Maximum de pions" value={form.pawnMax} onChange={(v) => setField('pawnMax', v)} />
            <NumberField label="Points de vie" value={form.health} onChange={(v) => setField('health', v)} />
            <NumberField label="Défense maximale" value={form.maxDefenseLevel} onChange={(v) => setField('maxDefenseLevel', v)} />
            <NumberField label="Puissance de défense" value={form.defensePowerPerLevel} onChange={(v) => setField('defensePowerPerLevel', v)} />
            <NumberField label="Mouvements par tour" value={form.movementsPerTurn} onChange={(v) => setField('movementsPerTurn', v)} />
            <Field label="Wall visual set">
              <select required value={form.wallVisualSet} onChange={(e) => setField('wallVisualSet', e.target.value)}>
                <option value="">Sélectionner</option>
                {wallVisualSets.map((id) => <option key={id} value={id}>{id}</option>)}
              </select>
            </Field>
          </div>
          <h3>Soldiers</h3>
          <div className="grid">
            {colors.map((color) => (
              <Field key={color} label={`Soldier ${color}`}>
                <select required value={form.pawnDefinitionIdByColor[color]} onChange={(e) => setField('pawnDefinitionIdByColor', { ...form.pawnDefinitionIdByColor, [color]: e.target.value })}>
                  <option value="">Sélectionner</option>
                  {pawns.filter((p) => p.role === 'soldier' && p.color === color).map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                </select>
              </Field>
            ))}
          </div>
          <PawnMultiSelector role="commander" value={form.commanderPawnDefinitionIds} pawns={pawns} onChange={(v) => setField('commanderPawnDefinitionIds', v)} />
          <PawnMultiSelector role="officer" value={form.officerPawnDefinitionIds} pawns={pawns} onChange={(v) => setField('officerPawnDefinitionIds', v)} />
          <SkillSelector label="Skills activables" skills={playerSkills} value={form.skills ?? []} onChange={(v) => setField('skills', v)} />
          <SkillSelector label="Skills innés" skills={innateSkills} value={form.innateSkills ?? []} onChange={(v) => setField('innateSkills', v)} />
          <button disabled={viewModel.status === 'saving'} type="submit">
            {viewModel.status === 'saving' ? 'Enregistrement…' : 'Mettre à jour'}
          </button>
          {viewModel.message && <p role="status">{viewModel.message}</p>}
        </form>
      )}
    </div>
  );
}

function PawnMultiSelector({ role, value, pawns, onChange }: { role: Role; value: readonly string[]; pawns: readonly Pawn[]; onChange: (value: readonly string[]) => void }) {
  const [candidate, setCandidate] = useState('');
  const options = pawns.filter((p) => p.role === role && !value.includes(p.id));
  return <section><h3>{role === 'commander' ? 'Commander pawns' : 'Officer pawns'}</h3><select value={candidate} onChange={(e) => setCandidate(e.target.value)}><option value="">Sélectionner un pion</option>{options.map((p) => <option key={p.id} value={p.id}>{p.displayName} ({p.color})</option>)}</select> <button type="button" disabled={!candidate} onClick={() => { onChange([...value, candidate]); setCandidate(''); }}>Ajouter</button><ul>{value.map((id) => <li key={id}>{pawns.find((p) => p.id === id)?.displayName ?? id} <button type="button" onClick={() => onChange(value.filter((item) => item !== id))}>Retirer</button></li>)}</ul></section>;
}

function SkillSelector({ label, skills, value, onChange }: { label: string; skills: readonly { id: string; displayName: string }[]; value: readonly string[]; onChange: (value: readonly string[]) => void }) {
  return <section><h3>{label}</h3><div>{skills.map((skill) => <label key={skill.id}><input type="checkbox" checked={value.includes(skill.id)} onChange={(event) => onChange(event.target.checked ? [...value, skill.id] : value.filter((id) => id !== skill.id))} /> {skill.displayName}</label>)}</div></section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span>{label}</span>{children}</label>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <Field label={label}><input min="0" required type="number" value={value} onChange={(e) => onChange(e.target.valueAsNumber)} /></Field>; }
