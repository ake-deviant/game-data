import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import {
  createEmptyPawnDefinitionForm,
  type PawnDefinitionFormModel,
  type UpdatePawnDefinitionController,
  type UpdatePawnDefinitionPresenter,
  type PawnRole,
  type PawnType,
} from '@game-data/presentation';
import skillsData from '../../../../../data/skills.json';
import { Icon, Field, inputClass, Section, SkillPicker } from './ui-kit';
import { WeaponKeySelect } from './WeaponKeySelect';
import { weaponKeyAfterTypeChange } from './weaponKeys';

const pawnSkills = skillsData.pawnSkillVisuals as { id: string; displayName: string }[];

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

interface PawnListItem {
  id: string;
  displayName: string;
  color: 'red' | 'blue' | 'green';
  type: 'melee' | 'ranged';
  role: PawnRole;
  power: number;
  turnCount: number;
  visualKey: string;
  weaponKey: string;
  countPawns?: number;
  moveCount?: number;
  requiredInfluencePoints?: number;
  skills?: string[];
  implicitSkillParams?: {
    powerBonusPerDecrement?: number;
    columnPowerBonusPerDecrement?: number;
    spBonusPerLiaison?: number;
    spBonusPerAttackPawn?: number;
    freeWallDestructsOnDecrement?: number;
    liaisonBonusPercent?: number;
    spGrowthBonus?: number;
  };
}

function itemToForm(item: PawnListItem): PawnDefinitionFormModel {
  const toStr = (v: number | undefined) => v !== undefined ? String(v) : '';
  const ip = item.implicitSkillParams;
  return {
    id: item.id,
    role: item.role,
    color: item.color,
    type: item.type,
    displayName: item.displayName === item.id ? '' : item.displayName,
    power: item.power,
    turnCount: item.turnCount,
    countPawns: item.countPawns ?? 1,
    moveCount: item.moveCount ?? 1,
    visualKey: item.visualKey,
    weaponKey: item.weaponKey,
    requiredInfluencePoints: item.requiredInfluencePoints ?? 0,
    skills: item.skills ?? [],
    implicitSkillParams: {
      powerBonusPerDecrement:       toStr(ip?.powerBonusPerDecrement),
      columnPowerBonusPerDecrement: toStr(ip?.columnPowerBonusPerDecrement),
      spBonusPerLiaison:            toStr(ip?.spBonusPerLiaison),
      spBonusPerAttackPawn:         toStr(ip?.spBonusPerAttackPawn),
      freeWallDestructsOnDecrement: toStr(ip?.freeWallDestructsOnDecrement),
      liaisonBonusPercent:          toStr(ip?.liaisonBonusPercent),
      spGrowthBonus:                toStr(ip?.spGrowthBonus),
    },
  };
}

interface Props {
  readonly role: PawnRole;
  readonly controller: UpdatePawnDefinitionController;
  readonly presenter: UpdatePawnDefinitionPresenter;
}

export function EditPawnForm({ role, controller, presenter }: Props) {
  const [allPawns, setAllPawns] = useState<readonly PawnListItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<PawnDefinitionFormModel | null>(null);
  const viewModel = useSyncExternalStore(presenter.subscribe, presenter.getViewModel);

  useEffect(() => {
    fetch('/api/catalog/pawns')
      .then((r) => r.json())
      .then((data: PawnListItem[]) => setAllPawns(data));
  }, []);

  const pawns = allPawns.filter((p) => p.role === role);

  const select = (id: string) => {
    setSelectedId(id);
    const item = pawns.find((p) => p.id === id);
    setForm(item ? itemToForm(item) : null);
  };

  const setField = <K extends keyof PawnDefinitionFormModel>(field: K, value: PawnDefinitionFormModel[K]) =>
    setForm((prev) => prev ? { ...prev, [field]: value } : null);

  const setImplicit = (key: ImplicitKey, value: string) =>
    setForm((prev) => prev ? { ...prev, implicitSkillParams: { ...prev.implicitSkillParams, [key]: value } } : null);

  const setType = (type: PawnType) =>
    setForm((prev) => prev ? {
      ...prev,
      type,
      weaponKey: weaponKeyAfterTypeChange(prev.weaponKey, type),
    } : null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    await controller.submit(form);
  };

  const isSoldier = role === 'soldier';
  const roleLabel = role === 'soldier' ? 'soldat' : role === 'officer' ? 'officier' : 'commandant';

  return (
    <div className="space-y-6">
      {/* Pawn picker */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/65 shadow-2xl shadow-black/10">
        <div className="flex items-start gap-4 border-b border-white/[0.06] px-6 py-5">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-300/15 bg-amber-400/10 text-amber-300">
            <Icon name="identity" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/70">Sélection</p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">Modifier un pion {roleLabel}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">Choisissez un pion existant pour éditer sa configuration.</p>
          </div>
        </div>
        <div className="p-6">
          {pawns.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun pion {roleLabel} dans le catalogue.</p>
          ) : (
            <Field label="Pion à modifier">
              <select className={inputClass} value={selectedId} onChange={(e) => select(e.target.value)}>
                <option value="">Sélectionner un pion…</option>
                {pawns.map((p) => (
                  <option key={p.id} value={p.id}>{p.displayName} — {p.color} ({p.id})</option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </div>

      {/* Edit form */}
      {form && (
        <form className="space-y-6" onSubmit={handleSubmit}>

          <Section icon="identity" eyebrow="Identité" title="Informations de base" description="L'identifiant est fixe. Modifiez le nom affiché, la couleur et le type.">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Identifiant">
                <input className={`${inputClass} opacity-40`} disabled value={form.id} />
              </Field>
              <Field label="Nom affiché">
                <input className={inputClass} value={form.displayName} placeholder={form.id}
                  onChange={(e) => setField('displayName', e.target.value)} />
              </Field>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Couleur" required>
                <div className="flex gap-1.5">
                  {(['red', 'blue', 'green'] as const).map((c) => {
                    const dots: Record<string, string> = { red: 'bg-rose-400', blue: 'bg-sky-400', green: 'bg-emerald-400' };
                    const labels: Record<string, string> = { red: 'Rouge', blue: 'Bleu', green: 'Vert' };
                    const active = form.color === c;
                    return (
                      <button key={c} type="button" onClick={() => setField('color', c)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${active ? 'border-amber-400/40 bg-amber-400/15 text-amber-200' : 'border-white/[0.07] bg-slate-950/40 text-slate-400 hover:border-white/[0.14] hover:text-slate-200'}`}>
                        <span className={`size-2 rounded-full ${dots[c]}`} />
                        {labels[c]}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Type" required>
                <div className="flex gap-1.5">
                  {(['melee', 'ranged'] as const).map((t) => {
                    const active = form.type === t;
                    return (
                      <button key={t} type="button" onClick={() => setType(t)}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${active ? 'border-amber-400/40 bg-amber-400/15 text-amber-200' : 'border-white/[0.07] bg-slate-950/40 text-slate-400 hover:border-white/[0.14] hover:text-slate-200'}`}>
                        {t === 'melee' ? 'Mêlée' : 'Distance'}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </Section>

          <Section icon="stats" eyebrow="Statistiques" title="Puissance & tour"
            description={isSoldier ? 'Soldat individuel — nonePower est automatiquement égal à la durée.' : 'Groupe de pions.'}>
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
            {!isSoldier && (
              <div className="mt-4 grid grid-cols-2 gap-4">
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
              </div>
            )}
          </Section>

          <Section icon="shield" eyebrow="Visuel" title="Clés visuelles" description="Référence au modèle 3D et à l'arme équipée.">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Visual Key" required>
                <input className={inputClass} value={form.visualKey}
                  onChange={(e) => setField('visualKey', e.target.value)} />
              </Field>
              <Field label="Weapon Key" required>
                <WeaponKeySelect type={form.type} value={form.weaponKey} onChange={(weaponKey) => setField('weaponKey', weaponKey)} />
              </Field>
            </div>
          </Section>

          {!isSoldier && (
            <>
              <Section icon="crown" eyebrow="Recrutement" title="Coût en influence" description="Points d'influence requis pour jouer ce pion.">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Points d'influence requis">
                    <input className={inputClass} type="number" min={0} value={form.requiredInfluencePoints}
                      onChange={(e) => setField('requiredInfluencePoints', Number(e.target.value))} />
                  </Field>
                </div>
              </Section>

              <Section icon="stats" eyebrow="Paramètres implicites" title="Bonus calculés automatiquement" description="Laisser vide les champs non utilisés — ils seront exclus du JSON.">
                <div className="grid grid-cols-2 gap-4">
                  {implicitFields.map(({ key, label, hint }) => (
                    <Field key={key} label={label} hint={hint}>
                      <input className={inputClass} type="number" min={0} placeholder="—"
                        value={form.implicitSkillParams[key]}
                        onChange={(e) => setImplicit(key, e.target.value)} />
                    </Field>
                  ))}
                </div>
              </Section>

              <Section icon="skills" eyebrow="Compétences" title="Skills passifs" description="Compétences passives visuelles du pion (pawnSkillVisuals).">
                <SkillPicker
                  skills={pawnSkills}
                  selected={form.skills as string[]}
                  onChange={(skills) => setField('skills', skills)}
                />
              </Section>
            </>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-amber-400/15 bg-gradient-to-r from-amber-400/[0.07] to-transparent p-5">
            <div>
              <p className="text-sm font-semibold text-slate-200">Mettre à jour ce pion ?</p>
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
              {viewModel.status === 'saving' ? 'Enregistrement…' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
