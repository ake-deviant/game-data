import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from 'react';
import skillsData from '../../../skills.json';
import weaponKeysData from '../../../weaponKeys.json';
import {
  createInitialState,
  createPawn,
  parseCommanderJson,
  toCommander,
  validateCommander,
} from './model';
import {
  DEFAULT_PAWN_TYPES,
  MOVEMENT_STRATEGIES,
  PAWN_COLORS,
  PAWN_TYPES,
  type CommanderFormState,
  type DefaultPawnType,
  type MovementStrategy,
  type PawnColor,
  type PawnFormState,
  type PawnType,
  type SkillDefinition,
  type SkillsData,
  type WeaponKeysData,
} from './types';

const typedSkills = skillsData as SkillsData;
const weaponKeys = weaponKeysData as WeaponKeysData;

const colorMeta: Record<PawnColor, { label: string; dot: string; tint: string }> = {
  red: { label: 'Rouge', dot: 'bg-rose-400', tint: 'from-rose-500/12' },
  blue: { label: 'Bleu', dot: 'bg-sky-400', tint: 'from-sky-500/12' },
  green: { label: 'Vert', dot: 'bg-emerald-400', tint: 'from-emerald-500/12' },
};

const sections = [
  ['identity', 'Identité'],
  ['base-stats', 'Statistiques'],
  ['colors', 'Pions standards'],
  ['skills', 'Compétences'],
  ['commanders', 'Pions commandants'],
  ['officers', 'Officiers'],
  ['movement', 'Mouvements'],
] as const;

type IconName =
  | 'spark'
  | 'identity'
  | 'stats'
  | 'colors'
  | 'skills'
  | 'crown'
  | 'shield'
  | 'movement'
  | 'plus'
  | 'trash'
  | 'copy'
  | 'check'
  | 'terminal'
  | 'warning';

function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    spark: <path d="m12 3-1.7 5.3L5 10l5.3 1.7L12 17l1.7-5.3L19 10l-5.3-1.7L12 3Z" />,
    identity: <><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    stats: <><path d="M4 19V9m6 10V5m6 14v-7m4 7H2" /></>,
    colors: <><circle cx="8" cy="8" r="4" /><circle cx="16" cy="8" r="4" /><circle cx="12" cy="15" r="4" /></>,
    skills: <><path d="m12 2 2.2 6.8H21l-5.5 4 2.1 6.7-5.6-4.1-5.6 4.1 2.1-6.7-5.5-4h6.8L12 2Z" /></>,
    crown: <><path d="m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z" /><path d="M5 19h14" /></>,
    shield: <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />,
    movement: <><path d="M5 9 2 12l3 3m14-6 3 3-3 3M9 5l3-3 3 3m-6 14 3 3 3-3" /><path d="M2 12h20M12 2v20" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    terminal: <><path d="m4 17 6-5-6-5m8 10h8" /></>,
    warning: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  };
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

const sectionIcons: Record<(typeof sections)[number][0], IconName> = {
  identity: 'identity',
  'base-stats': 'stats',
  colors: 'colors',
  skills: 'skills',
  commanders: 'crown',
  officers: 'shield',
  movement: 'movement',
};

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function Field({ label, hint, required, children, className = '' }: FieldProps) {
  return (
    <label className={`group block ${className}`}>
      <span className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
        {required && <span className="text-amber-400">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/[0.08] bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-white/[0.14] focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10';

function NumberInput({
  value,
  onChange,
  min = 0,
}: {
  value: number | '';
  onChange: (value: number | '') => void;
  min?: number;
}) {
  return (
    <input
      className={inputClass}
      min={min}
      onChange={(event) =>
        onChange(event.target.value === '' ? '' : event.target.valueAsNumber)
      }
      type="number"
      value={value}
    />
  );
}

function Section({
  id,
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/65 shadow-2xl shadow-black/10" id={id}>
      <div className="flex items-start gap-4 border-b border-white/[0.06] px-6 py-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-300/15 bg-amber-400/10 text-amber-300">
          <Icon name={icon} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/70">{eyebrow}</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function SkillPicker({
  skills,
  selected,
  unavailable = [],
  compact = false,
  onChange,
}: {
  skills: SkillDefinition[];
  selected: string[];
  unavailable?: string[];
  compact?: boolean;
  onChange: (skills: string[]) => void;
}) {
  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {skills.map((skill) => {
        const active = selected.includes(skill.id);
        const disabled = unavailable.includes(skill.id);
        return (
          <button
            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
              active
                ? 'border-amber-400/35 bg-amber-400/10 text-amber-100'
                : disabled
                  ? 'cursor-not-allowed border-white/[0.04] bg-slate-950/20 text-slate-600 opacity-55'
                : 'border-white/[0.07] bg-slate-950/45 text-slate-400 hover:border-white/[0.14] hover:text-slate-200'
            }`}
            disabled={disabled}
            key={skill.id}
            onClick={() =>
              onChange(
                active
                  ? selected.filter((id) => id !== skill.id)
                  : [...selected, skill.id],
              )
            }
            type="button"
          >
            <span className={`grid size-5 shrink-0 place-items-center rounded-md border ${active ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'}`}>
              {active && <Icon className="size-3.5" name="check" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{skill.displayName}</span>
              <span className="block truncate text-[11px] text-slate-500">{skill.id}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PassiveSkillPicker({
  skills,
  selected,
  compact = false,
  onChange,
}: {
  skills: SkillDefinition[];
  selected: string[];
  compact?: boolean;
  onChange: (skills: string[]) => void;
}) {
  const IMPLICIT_SKILL_IDS = [
    'power-growth',
    'increase-power-column-when-decrementing',
    'increase-SP-by-attack-linked-when-preparing',
    'increase-SP-by-attack-group-when-spawning',
    'gain-FWD-on-decrement',
    'liaison-power-bonus',
    'sp-growth',
  ];
  const selectableSkills = skills.filter((skill) => !IMPLICIT_SKILL_IDS.includes(skill.id));
  const chargeSkills = selectableSkills.filter((skill) => /^charge-\d+$/.test(skill.id));
  const otherSkills = selectableSkills.filter((skill) => !/^charge-\d+$/.test(skill.id));
  const selectedCharge = selected.find((skill) => /^charge-\d+$/.test(skill)) ?? '';
  const selectedOthers = selected.filter((skill) => !/^charge-\d+$/.test(skill));

  return (
    <div className="space-y-3">
      {otherSkills.length > 0 && (
        <SkillPicker
          compact={compact}
          onChange={(nextSkills) =>
            onChange(selectedCharge ? [...nextSkills, selectedCharge] : nextSkills)
          }
          selected={selectedOthers}
          skills={otherSkills}
        />
      )}
      {chargeSkills.length > 0 && (
        <Field label="Charge">
          <select
            className={inputClass}
            onChange={(event) =>
              onChange(
                event.target.value
                  ? [...selectedOthers, event.target.value]
                  : selectedOthers,
              )
            }
            value={selectedCharge}
          >
            <option value="">Aucune charge</option>
            {chargeSkills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.displayName} · {skill.id}
              </option>
            ))}
          </select>
        </Field>
      )}
      <p className="rounded-lg border border-violet-400/10 bg-violet-400/[0.04] px-3 py-2 text-[10px] leading-4 text-violet-200/60">
        Les compétences liées aux paramètres implicites (bonus par décrément, SP, FWD, liaison…) sont accordées automatiquement si leur valeur est &gt; 0.
      </p>
    </div>
  );
}

function PawnCard({
  pawn,
  index,
  kind,
  passiveSkills,
  onChange,
  onRemove,
}: {
  pawn: PawnFormState;
  index: number;
  kind: 'Commandant' | 'Officier';
  passiveSkills: SkillDefinition[];
  onChange: (pawn: PawnFormState) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const update = <K extends keyof PawnFormState>(key: K, value: PawnFormState[K]) =>
    onChange({ ...pawn, [key]: value });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/45">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          <span className={`size-2.5 shrink-0 rounded-full ${colorMeta[pawn.color].dot}`} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-100">
              {pawn.displayName || `${kind} ${index + 1}`}
            </span>
            <span className="block truncate text-xs text-slate-500">
              {pawn.id || 'Identifiant à renseigner'} · {pawn.type}
            </span>
          </span>
        </button>
        <button
          aria-label={`Supprimer ${kind.toLowerCase()} ${index + 1}`}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
          onClick={onRemove}
          type="button"
        >
          <Icon className="size-4" name="trash" />
        </button>
        <button
          aria-label={expanded ? 'Replier' : 'Déplier'}
          className={`rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white ${expanded ? 'rotate-180' : ''}`}
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06] p-4">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Identifiant" required>
              <input className={inputClass} onChange={(e) => update('id', e.target.value)} placeholder="commander-5-1" value={pawn.id} />
            </Field>
            <Field label="Nom affiché">
              <input className={inputClass} onChange={(e) => update('displayName', e.target.value)} placeholder="Lancier pourpre" value={pawn.displayName} />
            </Field>
            <Field label="Clé visuelle" required>
              <input className={inputClass} onChange={(e) => update('visualKey', e.target.value)} placeholder="commander_melee_red" value={pawn.visualKey} />
            </Field>
            <Field label="Clé d'arme" required>
              <select className={inputClass} onChange={(e) => update('weaponKey', e.target.value)} value={pawn.weaponKey}>
                <option value="">Sélectionner une arme</option>
                {weaponKeys[pawn.type].map((weaponKey) => <option key={weaponKey} value={weaponKey}>{weaponKey}</option>)}
              </select>
            </Field>
            <Field label="Couleur" required>
              <select className={inputClass} onChange={(e) => update('color', e.target.value as PawnColor)} value={pawn.color}>
                {PAWN_COLORS.map((color) => <option key={color} value={color}>{colorMeta[color].label}</option>)}
              </select>
            </Field>
            <Field label="Type" required>
              <select className={inputClass} onChange={(e) => update('type', e.target.value as PawnType)} value={pawn.type}>
                {PAWN_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="Nombre de tours" required>
              <NumberInput onChange={(value) => update('turnCount', value === '' ? 0 : value)} value={pawn.turnCount} />
            </Field>
            <Field label="Puissance" required>
              <NumberInput onChange={(value) => update('power', value === '' ? 0 : value)} value={pawn.power} />
            </Field>
            <Field label="Nombre de pions" required>
              <NumberInput onChange={(value) => update('countPawns', value === '' ? 0 : value)} value={pawn.countPawns} />
            </Field>
            <Field label="Mouvements" required>
              <NumberInput onChange={(value) => update('moveCount', value === '' ? 0 : value)} value={pawn.moveCount} />
            </Field>
            <Field label="Influence requise">
              <NumberInput onChange={(value) => update('requiredInfluencePoints', value)} value={pawn.requiredInfluencePoints} />
            </Field>
            <Field label="Puissance / décrément">
              <NumberInput onChange={(value) => update('powerBonusPerDecrement', value)} value={pawn.powerBonusPerDecrement} />
            </Field>
            <Field label="Bonus colonne / décrément">
              <NumberInput onChange={(value) => update('columnPowerBonusPerDecrement', value)} value={pawn.columnPowerBonusPerDecrement} />
            </Field>
            <Field label="SP / liaison">
              <NumberInput onChange={(value) => update('spBonusPerLiaison', value)} value={pawn.spBonusPerLiaison} />
            </Field>
            <Field label="SP / capitaine (pose)">
              <NumberInput onChange={(value) => update('spBonusPerAttackPawn', value)} value={pawn.spBonusPerAttackPawn} />
            </Field>
            <Field label="FWD / décrément">
              <NumberInput onChange={(value) => update('freeWallDestructsOnDecrement', value)} value={pawn.freeWallDestructsOnDecrement} />
            </Field>
            <Field label="% bonus liaison">
              <NumberInput onChange={(value) => update('liaisonBonusPercent', value)} value={pawn.liaisonBonusPercent} />
            </Field>
            <Field label="SP / décrément" hint="sp-growth — valeur ≥ 1 pour activer">
              <NumberInput onChange={(value) => update('spGrowthBonus', value)} value={pawn.spGrowthBonus} />
            </Field>
          </div>
          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Compétences passives</p>
            <PassiveSkillPicker onChange={(value) => update('skills', value)} selected={pawn.skills} skills={passiveSkills} />
          </div>
        </div>
      )}
    </div>
  );
}

function PawnList({
  pawns,
  kind,
  passiveSkills,
  onChange,
}: {
  pawns: PawnFormState[];
  kind: 'Commandant' | 'Officier';
  passiveSkills: SkillDefinition[];
  onChange: (pawns: PawnFormState[]) => void;
}) {
  return (
    <div>
      {pawns.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-slate-950/25 px-6 py-10 text-center">
          <div className="grid size-11 place-items-center rounded-xl bg-white/[0.04] text-slate-500">
            <Icon name={kind === 'Commandant' ? 'crown' : 'shield'} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-300">Aucun pion {kind.toLowerCase()}</p>
          <p className="mt-1 text-xs text-slate-500">Ajoutez-en un pour commencer à configurer cette unité.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pawns.map((pawn, index) => (
            <PawnCard
              index={index}
              key={pawn.key}
              kind={kind}
              onChange={(nextPawn) => onChange(pawns.map((item) => item.key === pawn.key ? nextPawn : item))}
              onRemove={() => onChange(pawns.filter((item) => item.key !== pawn.key))}
              passiveSkills={passiveSkills}
              pawn={pawn}
            />
          ))}
        </div>
      )}
      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400/25 bg-amber-400/[0.04] px-4 py-3 text-sm font-semibold text-amber-300 transition hover:border-amber-400/45 hover:bg-amber-400/[0.08]"
        onClick={() => onChange([...pawns, createPawn()])}
        type="button"
      >
        <Icon className="size-4" name="plus" />
        Ajouter un {kind.toLowerCase()}
      </button>
    </div>
  );
}

function JsonPanel({
  json,
  errors,
  copied,
  activeTab,
  importJson,
  importError,
  importSuccess,
  onCopy,
  onClose,
  onImportJsonChange,
  onLoadCommander,
  onTabChange,
}: {
  json: string;
  errors: string[];
  copied: boolean;
  activeTab: 'import' | 'output';
  importJson: string;
  importError: string;
  importSuccess: string;
  onCopy: () => void;
  onClose: () => void;
  onImportJsonChange: (value: string) => void;
  onLoadCommander: () => void;
  onTabChange: (tab: 'import' | 'output') => void;
}) {
  return (
    <aside
      aria-label="Sortie JSON"
      className="fixed inset-y-0 right-0 z-50 w-[520px] min-w-0 overflow-hidden border-l border-white/[0.1] bg-[#080c16] shadow-[-24px_0_80px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-400"><Icon className="size-4" name="terminal" /></span>
          <div>
            <p className="text-xs font-semibold text-slate-200">Sortie JSON</p>
            <p className="text-[10px] text-slate-500">Un seul Commander</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'output' && <button
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-2 text-xs font-medium text-slate-400 transition enabled:hover:border-white/[0.15] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!json}
            onClick={onCopy}
            type="button"
          >
            <Icon className="size-3.5" name={copied ? 'check' : 'copy'} />
            {copied ? 'Copié' : 'Copier'}
          </button>}
          <button
            aria-label="Fermer la sortie JSON"
            className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <svg className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 border-b border-white/[0.07] bg-slate-950/35 p-1.5">
        <button
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${activeTab === 'import' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => onTabChange('import')}
          type="button"
        >
          Importer
        </button>
        <button
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${activeTab === 'output' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => onTabChange('output')}
          type="button"
        >
          Sortie JSON
        </button>
      </div>
      <div className="h-[calc(100%-106px)] overflow-auto">
        {activeTab === 'import' ? (
          <div className="p-5">
            <div className="mb-5">
              <p className="text-sm font-semibold text-slate-200">Charger un commandant</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Collez un seul objet Commander pour préremplir le formulaire.
              </p>
            </div>
            <Field label="Objet Commander JSON">
              <textarea
                className={`${inputClass} min-h-[420px] resize-y font-mono text-xs leading-5`}
                onChange={(event) => onImportJsonChange(event.target.value)}
                placeholder={'{\n  "id": "5",\n  "name": "Crimson Warden",\n  "baseStats": { ... }\n}'}
                spellCheck={false}
                value={importJson}
              />
            </Field>
            {importError && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400/15 bg-rose-500/[0.06] p-3 text-xs leading-5 text-rose-300">
                <Icon className="mt-0.5 size-4 shrink-0" name="warning" />
                {importError}
              </p>
            )}
            {importSuccess && (
              <p className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-3 text-xs text-emerald-300">
                <Icon className="size-4 shrink-0" name="check" />
                {importSuccess}
              </p>
            )}
            <button
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-300"
              onClick={onLoadCommander}
              type="button"
            >
              <Icon className="size-4" name="terminal" />
              Charger dans le formulaire
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-slate-600">
              Le formulaire actuel ne sera remplacé que si le JSON est valide.
            </p>
          </div>
        ) : errors.length > 0 ? (
          <div className="m-4 rounded-xl border border-rose-400/20 bg-rose-500/[0.07] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-300">
              <Icon className="size-4" name="warning" />
              {errors.length} erreur{errors.length > 1 ? 's' : ''} à corriger
            </div>
            <ul className="mt-3 space-y-2">
              {errors.map((error) => <li className="text-xs leading-5 text-rose-200/70" key={error}>— {error}</li>)}
            </ul>
          </div>
        ) : json ? (
          <pre className="json-output p-5 text-xs leading-6 text-slate-300"><code>{json}</code></pre>
        ) : (
          <div className="grid h-full place-items-center px-8 text-center">
            <div>
              <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-slate-600">
                <Icon className="size-6" name="terminal" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-400">Prêt à générer</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Complétez le formulaire puis utilisez le bouton de génération.</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function App() {
  const [form, setForm] = useState<CommanderFormState>(createInitialState);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [json, setJson] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [jsonPanelOpen, setJsonPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'import' | 'output'>('import');
  const formRef = useRef<HTMLFormElement>(null);

  const allExistingSkills = useMemo(
    () => [...typedSkills.activablePlayerSkills, ...typedSkills.pawnSkillVisuals],
    [],
  );

  const setField = <K extends keyof CommanderFormState>(
    key: K,
    value: CommanderFormState[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const setColorField = <
    K extends 'attackPowerByColor' | 'attackTurnCountByColor' | 'nonePowerByColor' | 'pawnTypeByColor' | 'pawnVisualKeyByColor' | 'pawnWeaponKeyByColor' | 'skillsByColor' | 'powerBonusPerDecrementByColor',
  >(
    field: K,
    color: PawnColor,
    value: CommanderFormState[K][PawnColor],
  ) => setForm((current) => ({
    ...current,
    [field]: { ...current[field], [color]: value },
  }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateCommander(form);
    setErrors(validationErrors);
    setCopied(false);
    setJsonPanelOpen(true);
    setPanelTab('output');
    if (validationErrors.length > 0) {
      setJson('');
      return;
    }
    const output = JSON.stringify(toCommander(form), null, 2);
    setJson(output);
    console.log(output);
  };

  const copyJson = async () => {
    if (!json) return;
    await navigator.clipboard.writeText(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const loadCommander = () => {
    setImportError('');
    setImportSuccess('');
    if (!importJson.trim()) {
      setImportError('Collez un objet Commander JSON avant de le charger.');
      return;
    }
    try {
      const loadedForm = parseCommanderJson(importJson);
      setForm(loadedForm);
      setJson('');
      setErrors([]);
      setCopied(false);
      setImportSuccess(`« ${loadedForm.name} » a été chargé dans le formulaire.`);
      setJsonPanelOpen(false);
      window.setTimeout(() => {
        document.getElementById('identity')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Le commandant n'a pas pu être chargé.",
      );
    }
  };

  const resetForm = () => {
    if (!window.confirm('Réinitialiser tous les champs du formulaire ?')) return;
    setForm(createInitialState());
    setImportJson('');
    setImportError('');
    setImportSuccess('');
    setJson('');
    setErrors([]);
    setJsonPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#090d18] text-slate-200">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.08),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(56,189,248,0.05),transparent_24%)]" />
      <header className="relative border-b border-white/[0.06] bg-[#090d18]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1720px] items-center justify-between px-7">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/15">
              <Icon name="spark" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Commander Forge</h1>
              <p className="text-xs text-slate-500">Game Data · Outil local</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="mr-2 flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" />
              Génération locale
            </span>
            <button className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white" onClick={resetForm} type="button">Réinitialiser</button>
            <button
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                jsonPanelOpen
                  ? 'border-sky-400/30 bg-sky-400/10 text-sky-200'
                  : 'border-white/[0.08] text-slate-400 hover:border-white/[0.16] hover:text-white'
              }`}
              onClick={() => setJsonPanelOpen((open) => !open)}
              type="button"
            >
              <Icon className="size-4" name="terminal" />
              Importer / JSON
            </button>
            <button
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/15 transition hover:bg-amber-300 active:translate-y-px"
              onClick={() => formRef.current?.requestSubmit()}
              type="button"
            >
              <Icon className="size-4" name="spark" />
              Générer le JSON
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-[1480px] grid-cols-[190px_minmax(650px,1fr)] gap-6 px-7 py-6">
        <nav className="sticky top-6 h-fit py-2">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Configuration</p>
          <div className="space-y-1">
            {sections.map(([id, label], index) => (
              <a className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200" href={`#${id}`} key={id}>
                <span className="grid size-7 place-items-center rounded-lg border border-white/[0.05] bg-white/[0.02] text-slate-600 transition group-hover:border-amber-400/15 group-hover:text-amber-400">
                  <Icon className="size-3.5" name={sectionIcons[id]} />
                </span>
                <span>{label}</span>
                <span className="ml-auto text-[10px] text-slate-700">0{index + 1}</span>
              </a>
            ))}
          </div>
          <div className="mt-7 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
            <p className="text-xs font-semibold text-slate-400">Champs obligatoires</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-600">Ils sont signalés par une étoile <span className="text-amber-400">*</span>.</p>
          </div>
        </nav>

        <form className="min-w-0 space-y-5" onSubmit={handleSubmit} ref={formRef}>
          <Section description="Les informations qui identifient le commandant dans le jeu et dans les données partagées." eyebrow="Profil" icon="identity" id="identity" title="Identité du commandant">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Identifiant" hint="Doit être unique dans commanders.json" required>
                <input className={inputClass} onChange={(e) => setField('id', e.target.value)} placeholder="5" value={form.id} />
              </Field>
              <Field label="Nom" required>
                <input className={inputClass} onChange={(e) => setField('name', e.target.value)} placeholder="Crimson Warden" value={form.name} />
              </Field>
              <Field className="col-span-2" label="Description">
                <textarea className={`${inputClass} min-h-24 resize-y leading-6`} onChange={(e) => setField('description', e.target.value)} placeholder="Décrivez brièvement son rôle et son style de jeu…" value={form.description} />
              </Field>
              <Field label="Icône" hint="Clé de ressource utilisée par les clients">
                <input className={inputClass} onChange={(e) => setField('icon', e.target.value)} placeholder="shield" value={form.icon} />
              </Field>
            </div>
          </Section>

          <Section description="Les valeurs fondamentales appliquées au commandant au début d'une partie." eyebrow="Équilibrage" icon="stats" id="base-stats" title="Statistiques principales">
            <div className="grid grid-cols-5 gap-4">
              {([
                ['pawnMax', 'Maximum de pions'],
                ['health', 'Points de vie'],
                ['maxDefenseLevel', 'Défense max.'],
                ['defensePowerPerLevel', 'Puissance / niveau'],
                ['movementsPerTurn', 'Mouvements / tour'],
              ] as const).map(([key, label]) => (
                <Field key={key} label={label} required>
                  <NumberInput onChange={(value) => setField(key, value === '' ? 0 : value)} value={form[key]} />
                </Field>
              ))}
            </div>
            <div className="mt-5 max-w-[calc(20%-0.8rem)]">
              <Field label="Seuil recrues gratuites" hint="Laisser vide pour désactiver">
                <NumberInput onChange={(value) => setField('freeRecruitThreshold', value)} value={form.freeRecruitThreshold} />
              </Field>
            </div>
          </Section>

          <Section description="Configurez les caractéristiques du pion standard associé à chaque couleur." eyebrow="Par couleur" icon="colors" id="colors" title="Pions standards">
            <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
              <div className="grid grid-cols-[130px_repeat(6,minmax(100px,1fr))] bg-slate-950/50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Couleur</span><span>Attaque</span><span>Tours</span><span>Puiss. neutre</span><span>Type</span><span>Clé visuelle</span><span>Clé d'arme</span>
              </div>
              {PAWN_COLORS.map((color) => (
                <div className={`grid grid-cols-[130px_repeat(6,minmax(100px,1fr))] items-center gap-3 border-t border-white/[0.06] bg-gradient-to-r ${colorMeta[color].tint} to-transparent px-4 py-4`} key={color}>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                    <span className={`size-2.5 rounded-full ${colorMeta[color].dot}`} />{colorMeta[color].label}
                  </div>
                  <NumberInput onChange={(value) => setColorField('attackPowerByColor', color, value === '' ? 0 : value)} value={form.attackPowerByColor[color]} />
                  <NumberInput onChange={(value) => setColorField('attackTurnCountByColor', color, value === '' ? 0 : value)} value={form.attackTurnCountByColor[color]} />
                  <NumberInput onChange={(value) => setColorField('nonePowerByColor', color, value === '' ? 0 : value)} value={form.nonePowerByColor[color]} />
                  <select className={inputClass} onChange={(e) => setColorField('pawnTypeByColor', color, e.target.value as DefaultPawnType)} value={form.pawnTypeByColor[color]}>
                    {DEFAULT_PAWN_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <input className={inputClass} onChange={(e) => setColorField('pawnVisualKeyByColor', color, e.target.value)} placeholder={`pawn_default_${color}`} value={form.pawnVisualKeyByColor[color]} />
                  <select className={inputClass} onChange={(e) => setColorField('pawnWeaponKeyByColor', color, e.target.value)} value={form.pawnWeaponKeyByColor[color]}>
                    <option value="">Sélectionner une arme</option>
                    {(form.pawnTypeByColor[color] === 'melee' || form.pawnTypeByColor[color] === 'ranged') && weaponKeys[form.pawnTypeByColor[color]].map((weaponKey) => <option key={weaponKey} value={weaponKey}>{weaponKey}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </Section>

          <Section description="Distinguez les capacités activables manuellement de celles appliquées automatiquement dès la création du joueur." eyebrow="Capacités" icon="skills" id="skills" title="Compétences">
            <div className="grid grid-cols-2 gap-5">
              <div className="rounded-2xl border border-white/[0.07] bg-slate-950/25 p-4">
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-200">Compétences activables</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">Déclenchées manuellement contre des points de compétence.</p>
                </div>
                <SkillPicker
                  onChange={(value) => setField('skills', value)}
                  selected={form.skills}
                  skills={typedSkills.activablePlayerSkills}
                  unavailable={form.innateSkills}
                />
              </div>
              <div className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.035] p-4">
                <div className="mb-4">
                  <p className="text-xs font-semibold text-violet-200">Compétences innées</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">Actives dès le début et impossibles à déclencher manuellement.</p>
                </div>
                <SkillPicker
                  onChange={(value) => setField('innateSkills', value)}
                  selected={form.innateSkills}
                  skills={typedSkills.activablePlayerSkills}
                  unavailable={form.skills}
                />
              </div>
            </div>
            <div className="mt-6 border-t border-white/[0.06] pt-6">
              <p className="mb-4 text-xs font-semibold text-slate-300">Compétences passives et bonus par couleur</p>
              <div className="grid grid-cols-3 gap-3">
                {PAWN_COLORS.map((color) => (
                  <div className={`rounded-2xl border border-white/[0.07] bg-gradient-to-b ${colorMeta[color].tint} to-transparent p-4`} key={color}>
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <span className={`size-2.5 rounded-full ${colorMeta[color].dot}`} />{colorMeta[color].label}
                    </div>
                    <PassiveSkillPicker
                      compact
                      onChange={(value) => setColorField('skillsByColor', color, value)}
                      selected={form.skillsByColor[color]}
                      skills={typedSkills.pawnSkillVisuals}
                    />
                    <Field className="mt-4" label="Puissance / décrément">
                      <NumberInput onChange={(value) => setColorField('powerBonusPerDecrementByColor', color, value)} value={form.powerBonusPerDecrementByColor[color]} />
                    </Field>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-600">{allExistingSkills.length} compétences chargées depuis skills.json.</p>
            </div>
          </Section>

          <Section description="Unités spéciales directement rattachées à ce commandant." eyebrow="Unités majeures" icon="crown" id="commanders" title="Pions commandants">
            <PawnList kind="Commandant" onChange={(value) => setField('commanderPawns', value)} passiveSkills={typedSkills.pawnSkillVisuals} pawns={form.commanderPawns} />
          </Section>

          <Section description="Unités de soutien disponibles dans la composition de ce commandant." eyebrow="Unités de soutien" icon="shield" id="officers" title="Pions officiers">
            <PawnList kind="Officier" onChange={(value) => setField('officerPawns', value)} passiveSkills={typedSkills.pawnSkillVisuals} pawns={form.officerPawns} />
          </Section>

          <Section description="Définissez quand les mouvements bonus sont attribués lors du placement et du retrait." eyebrow="Stratégies" icon="movement" id="movement" title="Bonus de mouvement">
            <div className="grid grid-cols-2 gap-5">
              {(['place', 'remove'] as const).map((key) => (
                <Field key={key} label={key === 'place' ? 'Au placement' : 'Au retrait'} hint="Optionnel">
                  <select className={inputClass} onChange={(e) => setField('movementBonusStrategies', { ...form.movementBonusStrategies, [key]: e.target.value as MovementStrategy | '' })} value={form.movementBonusStrategies[key]}>
                    <option value="">Aucune stratégie</option>
                    {MOVEMENT_STRATEGIES.map((strategy) => <option key={strategy} value={strategy}>{strategy}</option>)}
                  </select>
                </Field>
              ))}
            </div>
          </Section>

          <div className="flex items-center justify-between rounded-2xl border border-amber-400/15 bg-gradient-to-r from-amber-400/[0.07] to-transparent p-5">
            <div>
              <p className="text-sm font-semibold text-slate-200">Configuration terminée ?</p>
              <p className="mt-1 text-xs text-slate-500">Le JSON sera validé, affiché à droite et écrit dans la console.</p>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300" type="submit">
              <Icon className="size-4" name="spark" />Générer le JSON
            </button>
          </div>
        </form>

      </div>

      {jsonPanelOpen && (
        <>
          <button
            aria-label="Fermer la sortie JSON"
            className="fixed inset-0 z-40 cursor-default bg-black/35 backdrop-blur-[2px]"
            onClick={() => setJsonPanelOpen(false)}
            type="button"
          />
          <JsonPanel
            activeTab={panelTab}
            copied={copied}
            errors={errors}
            importError={importError}
            importJson={importJson}
            importSuccess={importSuccess}
            json={json}
            onClose={() => setJsonPanelOpen(false)}
            onCopy={copyJson}
            onImportJsonChange={(value) => {
              setImportJson(value);
              setImportError('');
              setImportSuccess('');
            }}
            onLoadCommander={loadCommander}
            onTabChange={setPanelTab}
          />
        </>
      )}
    </div>
  );
}
