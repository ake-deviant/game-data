import { SkillPicker } from './ui-kit';
import skillsData from '../../../../../data/skills.json';

type SkillOption = {
  id: string;
  displayName: string;
  activationType?: string;
  levels?: readonly { level: number; skillPointCost?: number; requiredInfluencePoints?: number }[];
};

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
  const skills: readonly SkillOption[] = kind === 'pawn' ? skillsData.pawnSkillVisuals : skillsData.activablePlayerSkills;
  const selectClass = 'ml-3 rounded border border-slate-600 bg-slate-900 p-2';
  const skillsById = new Map(skills.map(skill => [skill.id, skill]));
  return <SkillPicker skills={skills} selected={selected} onChange={onSelect} renderDetails={id => {
    const skill = skillsById.get(id);
    if (!skill) return null;
    const catalogMax = skill.levels?.length ?? 1;
    const maximum = maxima[id] ?? catalogMax;
    const initial = levels[id] ?? (kind === 'pawn' && skill.activationType !== 'progressive' ? 1 : 0);
    const canBuy = kind === 'player' || skill.levels?.[0]?.skillPointCost !== undefined;
    return <fieldset aria-label={skill.displayName} className="flex flex-wrap gap-3 px-3 py-2 text-sm text-slate-300">
      <label>Niveau initial
        <select className={selectClass} value={initial} onChange={event => onChange({ ...levels, [id]: Number(event.target.value) })}>
          {canBuy && <option value={0}>0</option>}
          {Array.from({ length: maximum }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </select>
      </label>
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
