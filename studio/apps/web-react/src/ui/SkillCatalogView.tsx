import { useEffect, useState, type FormEvent } from 'react';
import { Field, Section, inputClass } from './ui-kit';

interface SkillLevel {
  level: number;
  skillPointCost?: number;
  requiredInfluencePoints?: number;
  implicitSkillParams?: Record<string, number>;
  [key: string]: unknown;
}

interface Skill {
  id: string;
  displayName: string;
  activationType?: string;
  triggerPhase?: string;
  visualKey: string;
  descriptionParams: Record<string, string>;
  skillDelay?: number | null;
  delayIllimited?: boolean;
  chargeBonusPercent?: number;
  levels?: SkillLevel[];
}

interface SkillCatalog {
  pawnSkillVisuals: Skill[];
  activablePlayerSkills: Skill[];
}

const endpoint = '/api/catalog/skills';
const purchaseFields = ['skillPointCost', 'requiredInfluencePoints'];
const labels: Record<string, string> = {
  skillPointCost: 'Coût en SP',
  requiredInfluencePoints: 'Seuil de points d’influence',
  freeWallDestructs: 'Destructions de défenses',
  movementCost: 'Coût en mouvements',
  freeRecruitThresholdReduction: 'Réduction du seuil de recrues gratuites',
  extraPawnSlots: 'Places de pion supplémentaires',
  defensePowerPerLevelBonus: 'Bonus de puissance des défenses par niveau',
  maxDefenseLevelBonus: 'Bonus au niveau maximal des défenses',
  columnPowerBonusPerDecrement: 'Bonus de puissance de colonne par décrément',
  heavyChargePercent: 'Charge lourde (%)',
  penetratingChargePercent: 'Charge pénétrante (%)',
  frontlineDamageAbsorptionPercent: 'Absorption des dégâts de la frontline (%)',
};

function numericEffects(level: SkillLevel) {
  return Object.entries(level).filter(([key, value]) =>
    key !== 'level' && !purchaseFields.includes(key) && typeof value === 'number',
  ) as [string, number][];
}

async function readCatalog(response: Response): Promise<SkillCatalog> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? 'Erreur HTTP ' + response.status);
  return body;
}

export function SkillCatalogView() {
  const [catalog, setCatalog] = useState<SkillCatalog>();
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<SkillLevel[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string }>();

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal })
      .then(readCatalog)
      .then(data => {
        if (controller.signal.aborted) return;
        const first = data.pawnSkillVisuals[0] ?? data.activablePlayerSkills[0];
        setCatalog(data);
        setSelected(first?.id ?? '');
        setDraft(structuredClone(first?.levels ?? []));
      })
      .catch(error => {
        if (!controller.signal.aborted) setFeedback({ error: true, message: error.message });
      });
    return () => controller.abort();
  }, []);

  const pawn = catalog?.pawnSkillVisuals.find(skill => skill.id === selected);
  const skill = pawn ?? catalog?.activablePlayerSkills.find(skill => skill.id === selected);
  const purchaseRequired = !pawn;
  const canAddLevel = skill?.activationType === 'progressive'
    || Boolean(pawn?.levels?.[0] && Object.keys(pawn.levels[0].implicitSkillParams ?? {}).length);

  function select(id: string) {
    const entry = catalog?.pawnSkillVisuals.find(skill => skill.id === id)
      ?? catalog?.activablePlayerSkills.find(skill => skill.id === id);
    setSelected(id);
    setDraft(structuredClone(entry?.levels ?? []));
    setFeedback(undefined);
  }

  function changeNumber(index: number, key: string, value: number | undefined, implicit = false) {
    setDraft(levels => levels.map((level, current) => {
      if (current !== index) return level;
      if (implicit) return { ...level, implicitSkillParams: { ...level.implicitSkillParams, [key]: value ?? NaN } };
      return { ...level, [key]: value };
    }));
    setFeedback(undefined);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFeedback(undefined);
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: selected,
          expectedLevelCount: skill?.levels?.length,
          levels: draft.map(level => ({
            level: level.level,
            values: {
              skillPointCost: level.skillPointCost ?? null,
              requiredInfluencePoints: level.requiredInfluencePoints ?? null,
              ...Object.fromEntries(numericEffects(level)),
            },
            implicitSkillParams: level.implicitSkillParams ?? {},
          })),
        }),
      });
      const updated = await readCatalog(response);
      const saved = updated.pawnSkillVisuals.find(skill => skill.id === selected)
        ?? updated.activablePlayerSkills.find(skill => skill.id === selected);
      setCatalog(updated);
      setDraft(structuredClone(saved?.levels ?? []));
      setFeedback({ error: false, message: 'Compétence enregistrée.' });
    } catch (error) {
      setFeedback({ error: true, message: error instanceof Error ? error.message : 'Enregistrement impossible.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section icon="skills" eyebrow="Catalogue" title="Compétences"
      description="Modifiez les coûts, les seuils d’influence et les effets configurés par niveau.">
      {!catalog && !feedback && <p role="status" className="text-sm text-slate-400">Chargement du catalogue…</p>}
      {catalog && (
        <div className="grid gap-6 md:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">
          <aside className="space-y-3">
            <Field label="Rechercher une compétence">
              <input className={inputClass} type="search" value={query} onChange={event => setQuery(event.target.value)} />
            </Field>
            {([
              ['Compétences de pion', catalog.pawnSkillVisuals],
              ['Compétences joueur', catalog.activablePlayerSkills],
            ] as const).map(([label, entries]) => {
              const matches = entries.filter(entry =>
                (entry.displayName + ' ' + entry.id).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
              );
              if (!matches.length) return null;
              return (
                <div key={label}>
                  <h3 className="mb-2 text-sm font-semibold text-slate-300">{label}</h3>
                  <ul className="space-y-1">
                    {matches.map(entry => (
                      <li key={entry.id}>
                        <button type="button" disabled={saving} aria-pressed={selected === entry.id}
                          className={'w-full rounded-lg px-3 py-2 text-left text-sm ' + (selected === entry.id
                            ? 'bg-amber-400/15 text-amber-200' : 'text-slate-300 hover:bg-white/5')}
                          onClick={() => select(entry.id)}>
                          {entry.displayName}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </aside>
          <div className="min-w-0">
            {skill && (
              <>
                <h3 className="text-lg font-semibold text-slate-100">{skill.displayName}</h3>
                <p className="mb-3 break-all text-xs text-slate-400">{skill.id}</p>
                <dl className="grid gap-2 rounded-xl border border-white/10 p-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-slate-400">Clé visuelle</dt><dd className="break-all">{skill.visualKey}</dd></div>
                  {skill.triggerPhase && <div><dt className="text-slate-400">Phase de déclenchement</dt><dd>{skill.triggerPhase}</dd></div>}
                  {skill.skillDelay != null && <div><dt className="text-slate-400">Délai</dt><dd>{skill.skillDelay} tour(s)</dd></div>}
                  {skill.delayIllimited && <div><dt className="text-slate-400">Durée</dt><dd>Illimitée</dd></div>}
                  {skill.chargeBonusPercent !== undefined && <div><dt className="text-slate-400">Bonus de charge</dt><dd>{skill.chargeBonusPercent} %</dd></div>}
                </dl>
              </>
            )}
            {skill && draft.length > 0 && (
              <form onSubmit={save} className="mt-5 space-y-4">
                {pawn && !purchaseRequired && (
                  <p className="text-sm text-slate-400">Renseignez le coût et le seuil pour rendre un niveau achetable en partie. Un niveau sans coût peut être attribué comme niveau de départ.</p>
                )}
                {draft.map((level, index) => (
                  <fieldset key={level.level} disabled={saving} className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2">
                    <legend className="px-2 text-sm font-semibold text-slate-200">Niveau {level.level}</legend>
                    {[...purchaseFields.map(key => [key, level[key]] as const), ...numericEffects(skill.levels?.[index] ?? skill.levels?.at(-1) ?? level).map(([key]) => [key, level[key]] as const)].map(([key, value]) => (
                      <Field key={key} label={labels[key] ?? key}>
                        <input className={inputClass} type="number" min="0" step="any" value={typeof value === 'number' ? value : ''}
                          required={!purchaseFields.includes(key) || purchaseRequired}
                          onChange={event => changeNumber(index, key, event.target.value === '' ? undefined : event.target.valueAsNumber)} />
                      </Field>
                    ))}
                    {Object.entries(level.implicitSkillParams ?? {}).map(([key, value]) => (
                      <Field key={key} label={labels[key] ?? key}>
                        <input className={inputClass} type="number" min="0" step="any" value={Number.isFinite(value) ? value : ''} required
                          onChange={event => changeNumber(index, key, event.target.valueAsNumber, true)} />
                      </Field>
                    ))}
                  </fieldset>
                ))}
                {canAddLevel && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={saving} className="rounded-lg border border-slate-600 px-3 py-2 text-sm"
                      onClick={() => {
                        setDraft(levels => [...levels, { ...structuredClone(levels.at(-1)!), level: levels.length + 1 }]);
                        setFeedback(undefined);
                      }}>
                      Ajouter un niveau
                    </button>
                    <button type="button" disabled={saving || draft.length <= 1}
                      className="rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:opacity-50"
                      onClick={() => {
                        setDraft(levels => levels.slice(0, -1));
                        setFeedback(undefined);
                      }}>
                      Supprimer le dernier niveau
                    </button>
                  </div>
                )}
                {!canAddLevel && (
                  <p className="text-sm text-slate-400">
                    {pawn ? 'Cette compétence a un effet fixe. Les niveaux supplémentaires nécessitent un effet réglable par niveau.'
                      : 'Cette compétence du joueur utilise une activation à niveau unique.'}
                  </p>
                )}
                <button type="submit" disabled={saving} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </form>
            )}
            {skill && draft.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucun niveau défini pour cette compétence.</p>}
          </div>
        </div>
      )}
      {feedback && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'mt-4 whitespace-pre-line text-sm text-rose-400' : 'mt-4 text-sm text-emerald-400'}>{feedback.message}</p>}
    </Section>
  );
}
