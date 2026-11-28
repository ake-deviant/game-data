import { useEffect, useState } from 'react';
import { SkillPicker } from './ui-kit';

type SkillOption = {
  id: string;
  displayName: string;
  activationType?: string;
  levels?: readonly {
    level: number;
    skillPointCost?: number;
    requiredInfluencePoints?: number;
    implicitSkillParams?: Readonly<Record<string, number>>;
  }[];
};

type SkillCatalog = { pawnSkillVisuals: readonly SkillOption[]; activablePlayerSkills: readonly SkillOption[] };

export function SkillAssignmentPicker({
  selected, levels, maxima, onSelect, onChange, onMaxChange, kind = 'pawn',
}: {
  selected: readonly string[];
  onSelect: (ids: readonly string[]) => void;
  levels: Readonly<Record<string, number>>;
  maxima: Readonly<Record<string, number>>;
  onChange: (levels: Record<string, number>) => void;
  onMaxChange: (levels: Record<string, number>) => void;
  kind?: 'pawn' | 'player';
}) {
  const [catalog, setCatalog] = useState<SkillCatalog | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    const request = new AbortController();
    fetch('/api/catalog/skills', { signal: request.signal })
      .then(response => {
        if (!response.ok) throw new Error('Catalogue indisponible');
        return response.json() as Promise<SkillCatalog>;
      })
      .then(setCatalog)
      .catch(() => {
        if (!request.signal.aborted) setLoadFailed(true);
      });
    return () => request.abort();
  }, []);

  if (!catalog) return <p role="status">{loadFailed ? 'Impossible de charger le catalogue des compétences.' : 'Chargement des compétences…'}</p>;

  const skills = kind === 'pawn' ? catalog.pawnSkillVisuals : catalog.activablePlayerSkills;
  const selectClass = 'ml-3 rounded border border-slate-600 bg-slate-900 p-2';
  const skillsById = new Map(skills.map(skill => [skill.id, skill]));
  const isCharge = (id: string) => /^charge-\d+$/.test(id);
  const unavailable = kind === 'pawn' && selected.some(isCharge)
    ? skills.filter(skill => isCharge(skill.id) && !selected.includes(skill.id)).map(skill => skill.id)
    : [];
  return <SkillPicker skills={skills} selected={selected} unavailable={unavailable} onChange={ids => {
    const added = skillsById.get(ids.find(id => !selected.includes(id)) ?? '');
    if (kind === 'pawn' && added) {
      const canBuyFirst = added.levels?.[0]?.skillPointCost !== undefined;
      onChange({ ...levels, [added.id]: added.activationType !== undefined && canBuyFirst ? 0 : 1 });
    }
    if (added) onMaxChange({ ...maxima, [added.id]: maxima[added.id] ?? 1 });
    onSelect(ids);
  }} renderDetails={id => {
    const skill = skillsById.get(id);
    if (!skill) return null;
    const catalogMax = skill.levels?.length ?? 1;
    const canBuy = kind === 'player' || (skill.levels?.[0]?.skillPointCost !== undefined
      && skill.levels[0].requiredInfluencePoints !== undefined);
    const defaultInitial = kind === 'pawn' && skill.activationType === undefined ? 1 : 0;
    const initial = levels[id] ?? defaultInitial;
    const maximum = maxima[id] ?? Math.max(1, initial);
    const initialOptions = Array.from({ length: maximum + 1 }, (_, level) => level)
      .filter(level => level === initial || (level === 0 ? canBuy : true));
    return <fieldset aria-label={skill.displayName} className="flex flex-wrap gap-3 px-3 py-2 text-sm text-slate-300">
      <label>Niveau initial
        <select className={selectClass} value={initial} onChange={event => onChange({ ...levels, [id]: Number(event.target.value) })}>
          {initialOptions.map(level => <option key={level} value={level}>{level === 0 ? '0 · À débloquer' : level}</option>)}
        </select>
      </label>
      {kind === 'pawn' && skill.levels && <ul className="w-full space-y-1 text-xs">
        {skill.levels.filter(level => level.level <= maximum).map(level => (
          <li key={level.level}>
            Niveau {level.level}
            {level.skillPointCost !== undefined && ` · ${level.skillPointCost} SP · ${level.requiredInfluencePoints} influence`}
            {Object.entries(level.implicitSkillParams ?? {}).map(([field, value]) => ` · ${field} = ${value}`)}
          </li>
        ))}
      </ul>}
      <label>Niveau maximal
        <select className={selectClass} value={maximum} onChange={event => {
          const nextMax = Number(event.target.value);
          if (initial > nextMax) onChange({ ...levels, [id]: nextMax });
          onMaxChange({ ...maxima, [id]: nextMax });
        }}>
          {Array.from({ length: catalogMax }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </select>
      </label>
    </fieldset>;
  }} />;
}
