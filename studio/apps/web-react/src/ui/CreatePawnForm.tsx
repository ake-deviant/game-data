import { useState, useSyncExternalStore, type FormEvent } from 'react';
import {
  createEmptyPawnDefinitionForm,
  type PawnDefinitionFormModel,
  type CreatePawnDefinitionController,
  type CreatePawnDefinitionPresenter,
  type PawnRole,
  type PawnColor,
  type PawnType,
} from '@game-data/presentation';
import skillsData from '../../../../../data/skills.json';
import { Icon, Field, inputClass, Section, SkillPicker } from './ui-kit';

const pawnSkills = skillsData.pawnSkillVisuals as { id: string; displayName: string }[];

const colors: { id: PawnColor; label: string; dot: string }[] = [
  { id: 'red',   label: 'Rouge', dot: 'bg-rose-400' },
  { id: 'blue',  label: 'Bleu',  dot: 'bg-sky-400' },
  { id: 'green', label: 'Vert',  dot: 'bg-emerald-400' },
];

const types: { id: PawnType; label: string }[] = [
  { id: 'melee',  label: 'Mêlée' },
  { id: 'ranged', label: 'Distance' },
];

type ImplicitKey = keyof PawnDefinitionFormModel['implicitSkillParams'];

const implicitFields: { key: ImplicitKey; label: string; hint: string }[] = [
  { key: 'powerBonusPerDecrement',       label: 'Bonus puissance / décrément',        hint: 'powerBonusPerDecrement' },
  { key: 'columnPowerBonusPerDecrement', label: 'Bonus puissance colonne / décrément', hint: 'columnPowerBonusPerDecrement' },
  { key: 'spBonusPerLiaison',            label: 'Bonus SP / liaison',                  hint: 'spBonusPerLiaison' },
  { key: 'spBonusPerAttackPawn',         label: 'Bonus SP / pion attaqué',             hint: 'spBonusPerAttackPawn' },
  { key: 'freeWallDestructsOnDecrement', label: 'Destructions mur gratuites',          hint: 'freeWallDestructsOnDecrement' },
  { key: 'liaisonBonusPercent',          label: 'Bonus liaison (%)',                   hint: 'liaisonBonusPercent' },
  { key: 'spGrowthBonus',               label: 'Bonus croissance SP',                 hint: 'spGrowthBonus' },
];

const toggleClass = (active: boolean) =>
  `rounded-xl border px-3 py-2 text-sm font-semibold transition ${
    active
      ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
      : 'border-white/[0.07] bg-slate-950/40 text-slate-400 hover:border-white/[0.14] hover:text-slate-200'
  }`;

interface Props {
  readonly role: PawnRole;
  readonly controller: CreatePawnDefinitionController;
  readonly presenter: CreatePawnDefinitionPresenter;
}

export function CreatePawnForm({ role, controller, presenter }: Props) {
  const [form, setForm] = useState<PawnDefinitionFormModel>(() => ({ ...createEmptyPawnDefinitionForm(), role }));
  const viewModel = useSyncExternalStore(presenter.subscribe, presenter.getViewModel);

  const setField = <K extends keyof PawnDefinitionFormModel>(field: K, value: PawnDefinitionFormModel[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setImplicit = (key: ImplicitKey, value: string) =>
    setForm((prev) => ({ ...prev, implicitSkillParams: { ...prev.implicitSkillParams, [key]: value } }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await controller.submit(form);
    if (presenter.getViewModel().status === 'success') setForm({ ...createEmptyPawnDefinitionForm(), role });
  };

  const isSoldier = form.role === 'soldier';

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>

      {/* Identity */}
      <Section
        icon="identity"
        eyebrow="Identité"
        title="Informations de base"
        description="Identifiant unique, nom affiché, rôle, couleur et type de déplacement."
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Identifiant" required>
            <input
              className={inputClass}
              placeholder="ex : soldier-red-axe"
              value={form.id}
              onChange={(e) => setField('id', e.target.value)}
            />
          </Field>
          <Field label="Nom affiché">
            <input
              className={inputClass}
              placeholder="ex : Soldat à la hache"
              value={form.displayName}
              onChange={(e) => setField('displayName', e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Couleur" required>
            <div className="flex gap-1.5">
              {colors.map((c) => (
                <button key={c.id} type="button" onClick={() => setField('color', c.id)}
                  className={`flex items-center gap-2 ${toggleClass(form.color === c.id)}`}>
                  <span className={`size-2 rounded-full ${c.dot}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Type" required>
            <div className="flex gap-1.5">
              {types.map((t) => (
                <button key={t.id} type="button" onClick={() => setField('type', t.id)} className={toggleClass(form.type === t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* Stats */}
      <Section
        icon="stats"
        eyebrow="Statistiques"
        title="Puissance & tour"
        description={isSoldier
          ? 'Soldat individuel — nonePower = dégâts infligés au commandant adverse.'
          : 'Groupe de pions — countPawns × puissance placés sur le plateau.'}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Puissance" required>
            <input className={inputClass} type="number" min={0} value={form.power}
              onChange={(e) => setField('power', Number(e.target.value))} />
          </Field>
          <Field label="Durée (tours)" required>
            <input className={inputClass} type="number" min={0} value={form.turnCount}
              onChange={(e) => setField('turnCount', Number(e.target.value))} />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {isSoldier ? (
            <Field label="nonePower" hint="Dégâts infligés au commandant adverse.">
              <input className={inputClass} type="number" min={0} value={form.nonePower}
                onChange={(e) => setField('nonePower', Number(e.target.value))} />
            </Field>
          ) : (
            <>
              <Field label="Nombre de pions (countPawns)" required>
                <input className={inputClass} type="number" min={0} value={form.countPawns}
                  onChange={(e) => setField('countPawns', Number(e.target.value))} />
              </Field>
              <Field label="Déplacements (moveCount)" required>
                <input className={inputClass} type="number" min={0} value={form.moveCount}
                  onChange={(e) => setField('moveCount', Number(e.target.value))} />
              </Field>
            </>
          )}
        </div>
      </Section>

      {/* Visual */}
      <Section
        icon="shield"
        eyebrow="Visuel"
        title="Clés visuelles"
        description="Référence au modèle 3D (visualKey) et à l'arme équipée (weaponKey)."
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Visual Key" required>
            <input className={inputClass} placeholder="ex : soldier_axe" value={form.visualKey}
              onChange={(e) => setField('visualKey', e.target.value)} />
          </Field>
          <Field label="Weapon Key" required>
            <input className={inputClass} placeholder="ex : woodcutter_poleaxe" value={form.weaponKey}
              onChange={(e) => setField('weaponKey', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Elite-only sections */}
      {!isSoldier && (
        <>
          {/* Required influence points */}
          <Section
            icon="crown"
            eyebrow="Recrutement"
            title="Coût en influence"
            description="Points d'influence requis pour jouer ce pion. Mettre 0 si aucun coût."
          >
            <div className="grid grid-cols-2 gap-4">
              <Field label="Points d'influence requis">
                <input className={inputClass} type="number" min={0} value={form.requiredInfluencePoints}
                  onChange={(e) => setField('requiredInfluencePoints', Number(e.target.value))} />
              </Field>
            </div>
          </Section>

          {/* Implicit skill params */}
          <Section
            icon="stats"
            eyebrow="Paramètres implicites"
            title="Bonus calculés automatiquement"
            description="Laisser vide les champs non utilisés — ils seront exclus du JSON."
          >
            <div className="grid grid-cols-2 gap-4">
              {implicitFields.map(({ key, label, hint }) => (
                <Field key={key} label={label} hint={hint}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    placeholder="—"
                    value={form.implicitSkillParams[key]}
                    onChange={(e) => setImplicit(key, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          </Section>

          {/* Passive skills */}
          <Section
            icon="skills"
            eyebrow="Compétences"
            title="Skills passifs"
            description="Compétences passives visuelles du pion (pawnSkillVisuals)."
          >
            <SkillPicker
              skills={pawnSkills}
              selected={form.skills as string[]}
              onChange={(skills) => setField('skills', skills)}
            />
          </Section>
        </>
      )}

      {/* Feedback & submit */}
      <div className="space-y-3">
        {viewModel.status === 'success' && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-3 text-xs text-emerald-300">
            <Icon className="size-4 shrink-0" name="check" />
            {viewModel.message}
          </div>
        )}
        {viewModel.status === 'error' && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-400/15 bg-rose-500/[0.06] p-3 text-xs text-rose-300">
            <Icon className="size-4 shrink-0" name="warning" />
            {viewModel.message}
          </div>
        )}

        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/15 transition hover:bg-amber-300 active:translate-y-px disabled:opacity-50"
          disabled={viewModel.status === 'saving'}
          type="submit"
        >
          <Icon className="size-4" name="plus" />
          {viewModel.status === 'saving' ? 'Enregistrement…' : 'Ajouter au catalogue'}
        </button>
      </div>
    </form>
  );
}
