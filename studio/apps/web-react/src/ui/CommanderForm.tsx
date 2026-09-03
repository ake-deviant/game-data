import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import { createEmptyCommanderForm, type CommanderFormModel, type CreateCommanderController, type CreateCommanderPresenter } from '@game-data/presentation';
import skillsData from '../../../../../data/skills.json';
import { Icon, Field, inputClass, Section, SkillPicker } from './ui-kit';

const colors = ['red', 'blue', 'green'] as const;
type Color = typeof colors[number];
type Role = 'soldier' | 'officer' | 'commander';
type Pawn = { id: string; displayName: string; color: string; role: Role };

const playerSkills = skillsData.activablePlayerSkills as { id: string; displayName: string }[];

const colorMeta: Record<Color, { label: string; dot: string; tint: string }> = {
  red:   { label: 'Rouge', dot: 'bg-rose-400',    tint: 'from-rose-500/10' },
  blue:  { label: 'Bleu',  dot: 'bg-sky-400',     tint: 'from-sky-500/10' },
  green: { label: 'Vert',  dot: 'bg-emerald-400', tint: 'from-emerald-500/10' },
};

interface Props { readonly controller: CreateCommanderController; readonly presenter: CreateCommanderPresenter; }

export function CommanderForm({ controller, presenter }: Props) {
  const [form, setForm] = useState<CommanderFormModel>(createEmptyCommanderForm);
  const [pawns, setPawns] = useState<readonly Pawn[]>([]);
  const [wallVisualSets, setWallVisualSets] = useState<readonly string[]>([]);
  const viewModel = useSyncExternalStore(presenter.subscribe, presenter.getViewModel);

  useEffect(() => { fetch('/api/catalog/pawns').then((r) => r.json()).then(setPawns); }, []);
  useEffect(() => { fetch('/api/catalog/wall-visual-sets').then((r) => r.json()).then(setWallVisualSets); }, []);

  const setField = <K extends keyof CommanderFormModel>(field: K, value: CommanderFormModel[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent) => { event.preventDefault(); await controller.submit(form); };

  return (
    <form className="space-y-5" onSubmit={submit}>

      <Section eyebrow="Profil" icon="identity" title="Identité du commandant" description="Informations qui identifient le commandant dans le jeu et dans les données partagées.">
        <div className="grid grid-cols-2 gap-5">
          <Field label="Identifiant" required hint="Doit être unique dans commanders.json">
            <input className={inputClass} placeholder="5" value={form.id} onChange={(e) => setField('id', e.target.value)} />
          </Field>
          <Field label="Nom" required>
            <input className={inputClass} placeholder="Crimson Warden" value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </Field>
          <Field label="Description" className="col-span-2">
            <textarea className={`${inputClass} min-h-20 resize-y leading-6`} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Décrivez brièvement son rôle et son style de jeu…" />
          </Field>
          <Field label="Icône" hint="Clé de ressource utilisée par les clients">
            <input className={inputClass} placeholder="shield" value={form.icon} onChange={(e) => setField('icon', e.target.value)} />
          </Field>
          <Field label="Lot visuel de mur" required>
            <select className={inputClass} value={form.wallVisualSet} onChange={(e) => setField('wallVisualSet', e.target.value)}>
              <option value="">Sélectionner</option>
              {wallVisualSets.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section eyebrow="Équilibrage" icon="stats" title="Statistiques" description="Valeurs fondamentales appliquées au commandant au début d'une partie.">
        <div className="grid grid-cols-5 gap-4">
          <Field label="Max pions" required>
            <input className={inputClass} type="number" min="0" value={form.pawnMax} onChange={(e) => setField('pawnMax', e.target.valueAsNumber)} />
          </Field>
          <Field label="Points de vie" required>
            <input className={inputClass} type="number" min="0" value={form.health} onChange={(e) => setField('health', e.target.valueAsNumber)} />
          </Field>
          <Field label="Défense max." required>
            <input className={inputClass} type="number" min="0" value={form.maxDefenseLevel} onChange={(e) => setField('maxDefenseLevel', e.target.valueAsNumber)} />
          </Field>
          <Field label="Puissance / niv." required>
            <input className={inputClass} type="number" min="0" value={form.defensePowerPerLevel} onChange={(e) => setField('defensePowerPerLevel', e.target.valueAsNumber)} />
          </Field>
          <Field label="Mvt / tour" required>
            <input className={inputClass} type="number" min="0" value={form.movementsPerTurn} onChange={(e) => setField('movementsPerTurn', e.target.valueAsNumber)} />
          </Field>
        </div>
        <div className="mt-4 max-w-xs">
          <Field label="Seuil recrues gratuites" hint="Laisser vide pour désactiver">
            <input className={inputClass} type="number" min="0" value={form.freeRecruitThreshold ?? ''} onChange={(e) => setField('freeRecruitThreshold', e.target.value === '' ? undefined : e.target.valueAsNumber)} />
          </Field>
        </div>
      </Section>

      <Section eyebrow="Pions standards" icon="colors" title="Soldats par couleur" description="Définissez le pion soldat associé à chaque couleur de joueur.">
        <div className="grid grid-cols-3 gap-4">
          {colors.map((color) => (
            <div key={color} className={`rounded-2xl border border-white/[0.07] bg-gradient-to-b ${colorMeta[color].tint} to-transparent p-4`}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <span className={`size-2.5 rounded-full ${colorMeta[color].dot}`} />
                {colorMeta[color].label}
              </div>
              <Field label="Pion soldat" required>
                <select className={inputClass} value={form.pawnDefinitionIdByColor[color]} onChange={(e) => setField('pawnDefinitionIdByColor', { ...form.pawnDefinitionIdByColor, [color]: e.target.value })}>
                  <option value="">Sélectionner</option>
                  {pawns.filter((p) => p.role === 'soldier' && p.color === color).map((p) => (
                    <option key={p.id} value={p.id}>{p.displayName}</option>
                  ))}
                </select>
              </Field>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Unités majeures" icon="crown" title="Pions commandants" description="Unités spéciales directement rattachées à ce commandant.">
        <PawnMultiSelector role="commander" value={form.commanderPawnDefinitionIds} pawns={pawns} onChange={(v) => setField('commanderPawnDefinitionIds', v)} />
      </Section>

      <Section eyebrow="Unités de soutien" icon="shield" title="Pions officiers" description="Unités de soutien disponibles dans la composition de ce commandant.">
        <PawnMultiSelector role="officer" value={form.officerPawnDefinitionIds} pawns={pawns} onChange={(v) => setField('officerPawnDefinitionIds', v)} />
      </Section>

      <Section eyebrow="Capacités" icon="skills" title="Compétences" description="Distinguez les capacités activables manuellement de celles actives dès le départ.">
        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/[0.07] bg-slate-950/25 p-4">
            <p className="mb-1 text-xs font-semibold text-slate-200">Compétences activables</p>
            <p className="mb-4 text-[11px] leading-5 text-slate-500">Déclenchées manuellement contre des points de compétence.</p>
            <SkillPicker skills={playerSkills} selected={form.skills ?? []} unavailable={form.innateSkills ?? []} onChange={(v) => setField('skills', v)} />
          </div>
          <div className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.035] p-4">
            <p className="mb-1 text-xs font-semibold text-violet-200">Compétences innées</p>
            <p className="mb-4 text-[11px] leading-5 text-slate-500">Actives dès le début, impossibles à déclencher manuellement.</p>
            <SkillPicker skills={playerSkills} selected={form.innateSkills ?? []} unavailable={form.skills ?? []} onChange={(v) => setField('innateSkills', v)} />
          </div>
        </div>
      </Section>

      <div className="flex items-center justify-between rounded-2xl border border-amber-400/15 bg-gradient-to-r from-amber-400/[0.07] to-transparent p-5">
        <div>
          <p className="text-sm font-semibold text-slate-200">Prêt à enregistrer ?</p>
          {viewModel.message && (
            <p className={`mt-1 text-xs ${viewModel.status === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {viewModel.message}
            </p>
          )}
        </div>
        <button
          className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/15 transition hover:bg-amber-300 active:translate-y-px disabled:opacity-50"
          disabled={viewModel.status === 'saving'}
          type="submit"
        >
          <Icon className="size-4" name="spark" />
          {viewModel.status === 'saving' ? 'Enregistrement…' : 'Créer le commander'}
        </button>
      </div>
    </form>
  );
}

function PawnMultiSelector({ role, value, pawns, onChange }: {
  role: Role;
  value: readonly string[];
  pawns: readonly Pawn[];
  onChange: (value: readonly string[]) => void;
}) {
  const [candidate, setCandidate] = useState('');
  const options = pawns.filter((p) => p.role === role && !value.includes(p.id));
  const label = role === 'commander' ? 'commandant' : 'officier';

  return (
    <div>
      {value.length === 0 ? (
        <div className="mb-4 grid place-items-center rounded-2xl border border-dashed border-white/10 bg-slate-950/25 py-10 text-center">
          <div className="grid size-11 place-items-center rounded-xl bg-white/[0.04] text-slate-500">
            <Icon name={role === 'commander' ? 'crown' : 'shield'} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-300">Aucun pion {label}</p>
          <p className="mt-1 text-xs text-slate-500">Ajoutez-en un ci-dessous.</p>
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          {value.map((id) => {
            const pawn = pawns.find((p) => p.id === id);
            return (
              <div key={id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-slate-950/45 px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-slate-200">{pawn?.displayName ?? id}</span>
                  <span className="ml-2 text-[11px] text-slate-500">{id}</span>
                </div>
                <button
                  aria-label="Retirer"
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                  onClick={() => onChange(value.filter((item) => item !== id))}
                  type="button"
                >
                  <Icon className="size-4" name="trash" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <select className={`${inputClass} flex-1`} value={candidate} onChange={(e) => setCandidate(e.target.value)}>
          <option value="">Sélectionner un pion {label}…</option>
          {options.map((p) => <option key={p.id} value={p.id}>{p.displayName} ({p.color})</option>)}
        </select>
        <button
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:border-amber-400/45 hover:bg-amber-400/[0.12] disabled:opacity-40"
          disabled={!candidate}
          onClick={() => { onChange([...value, candidate]); setCandidate(''); }}
          type="button"
        >
          <Icon className="size-4" name="plus" />
          Ajouter
        </button>
      </div>
    </div>
  );
}
