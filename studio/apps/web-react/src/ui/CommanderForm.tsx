import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import { createEmptyCommanderForm, type CommanderFormModel, type CreateCommanderController, type CreateCommanderPresenter } from '@game-data/presentation';
import skillsData from '../../../../../data/skills.json';

type Role = 'soldier' | 'officer' | 'commander';
type Pawn = { id: string; displayName: string; color: string; role: Role };
const colors = ['red', 'blue', 'green'] as const;
const playerSkills = skillsData.activablePlayerSkills as { id: string; displayName: string }[];
const innateSkills = skillsData.pawnSkillVisuals as { id: string; displayName: string }[];
interface Props { readonly controller: CreateCommanderController; readonly presenter: CreateCommanderPresenter; }

export function CommanderForm({ controller, presenter }: Props) {
  const [form, setForm] = useState<CommanderFormModel>(createEmptyCommanderForm);
  const [pawns, setPawns] = useState<readonly Pawn[]>([]);
  const [wallVisualSets, setWallVisualSets] = useState<readonly string[]>([]);
  const viewModel = useSyncExternalStore(presenter.subscribe, presenter.getViewModel);
  useEffect(() => { fetch('/api/catalog/pawns').then((response) => response.json()).then(setPawns); }, []);
  useEffect(() => { fetch('/api/catalog/wall-visual-sets').then((r) => r.json()).then(setWallVisualSets); }, []);
  const setField = <K extends keyof CommanderFormModel>(field: K, value: CommanderFormModel[K]) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent) => { event.preventDefault(); await controller.submit(form); };
  return <form onSubmit={submit}>
    <h2>Créer un Commander</h2>
    <div className="grid">
      <Field label="Identifiant"><input required value={form.id} onChange={(e) => setField('id', e.target.value)} /></Field>
      <Field label="Nom"><input required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field>
      <Field label="Description"><input value={form.description} onChange={(e) => setField('description', e.target.value)} /></Field>
      <Field label="Icône"><input value={form.icon} onChange={(e) => setField('icon', e.target.value)} /></Field>
      <NumberField label="Maximum de pions" value={form.pawnMax} onChange={(v) => setField('pawnMax', v)} />
      <NumberField label="Points de vie" value={form.health} onChange={(v) => setField('health', v)} />
      <NumberField label="Défense maximale" value={form.maxDefenseLevel} onChange={(v) => setField('maxDefenseLevel', v)} />
      <NumberField label="Puissance de défense" value={form.defensePowerPerLevel} onChange={(v) => setField('defensePowerPerLevel', v)} />
      <NumberField label="Mouvements par tour" value={form.movementsPerTurn} onChange={(v) => setField('movementsPerTurn', v)} />
      <Field label="Wall visual set"><select required value={form.wallVisualSet} onChange={(e) => setField('wallVisualSet', e.target.value)}><option value="">Sélectionner</option>{wallVisualSets.map((id) => <option key={id} value={id}>{id}</option>)}</select></Field>
    </div>
    <h3>Soldiers</h3><div className="grid">{colors.map((color) => <Field key={color} label={`Soldier ${color}`}><select required value={form.pawnDefinitionIdByColor[color]} onChange={(e) => setField('pawnDefinitionIdByColor', { ...form.pawnDefinitionIdByColor, [color]: e.target.value })}><option value="">Sélectionner</option>{pawns.filter((p) => p.role === 'soldier' && p.color === color).map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}</select></Field>)}</div>
    <PawnMultiSelector role="commander" value={form.commanderPawnDefinitionIds} pawns={pawns} onChange={(v) => setField('commanderPawnDefinitionIds', v)} />
    <PawnMultiSelector role="officer" value={form.officerPawnDefinitionIds} pawns={pawns} onChange={(v) => setField('officerPawnDefinitionIds', v)} />
    <SkillSelector label="Skills activables" skills={playerSkills} value={form.skills ?? []} onChange={(v) => setField('skills', v)} />
    <SkillSelector label="Skills innés" skills={innateSkills} value={form.innateSkills ?? []} onChange={(v) => setField('innateSkills', v)} />
    <button disabled={viewModel.status === 'saving'} type="submit">{viewModel.status === 'saving' ? 'Enregistrement…' : 'Créer'}</button>
    {viewModel.message && <p role="status">{viewModel.message}</p>}
  </form>;
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
