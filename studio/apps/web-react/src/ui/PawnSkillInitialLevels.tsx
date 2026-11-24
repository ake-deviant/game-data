import skillsData from '../../../../../data/skills.json';

type SkillOption = {
  id: string;
  displayName: string;
  activationType?: string;
  levels?: readonly { level: number; skillPointCost?: number; requiredInfluencePoints?: number }[];
};

export function SkillLevels({
  selected, levels, maxima, onChange, onMaxChange, kind = 'pawn',
}: {
  selected: readonly string[];
  levels: Readonly<Record<string, number>>;
  maxima: Readonly<Record<string, number>>;
  onChange: (levels: Record<string, number>) => void;
  onMaxChange: (levels: Record<string, number>) => void;
  kind?: 'pawn' | 'player';
}) {
  const skills: readonly SkillOption[] = kind === 'pawn' ? skillsData.pawnSkillVisuals : skillsData.activablePlayerSkills;
  const selectClass = 'ml-3 rounded border border-slate-600 bg-slate-900 p-2';
  return <div className="mt-4 space-y-3">{skills.filter(skill => selected.includes(skill.id)).map(skill => {
    const { id } = skill;
    const catalogMax = skill.levels?.length ?? 1;
    const maximum = maxima[id] ?? catalogMax;
    const initial = levels[id] ?? (kind === 'pawn' && skill.activationType !== 'progressive' ? 1 : 0);
    const canBuy = kind === 'player' || skill.levels?.[0]?.skillPointCost !== undefined;
    return <fieldset key={id} className="space-y-2 text-sm text-slate-300">
      <legend>{skill.displayName}</legend>
      <label>Niveau inn?
        <select className={selectClass} value={initial} onChange={event => onChange({ ...levels, [id]: Number(event.target.value) })}>
          {canBuy && <option value={0}>0</option>}
          {Array.from({ length: maximum }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </select>
      </label>
      <label className="ml-3">Niveau maximal
        <select className={selectClass} value={maximum} onChange={event => {
          const nextMax = Number(event.target.value);
          if (initial > nextMax) onChange({ ...levels, [id]: nextMax });
          onMaxChange({ ...maxima, [id]: nextMax });
        }}>
          {Array.from({ length: catalogMax }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </select>
      </label>
    </fieldset>;
  })}</div>;
}
