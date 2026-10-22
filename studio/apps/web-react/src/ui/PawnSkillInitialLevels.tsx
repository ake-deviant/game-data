import skillsData from '../../../../../data/skills.json';

export function PawnSkillInitialLevels({ selected, levels, onChange }: {
  selected: readonly string[];
  levels: Readonly<Record<string, number>>;
  onChange: (levels: Record<string, number>) => void;
}) {
  const skills = skillsData.pawnSkillVisuals as Array<{ id: string; displayName: string; activationType?: string; levels?: Array<{ level: number }> }>;
  return <div className="mt-4 space-y-3">{skills.filter(skill => skill.activationType === 'progressive' && selected.includes(skill.id)).map(skill =>
    <label key={skill.id} className="block text-sm text-slate-300">
      {skill.displayName} : niveau inné
      <select className="ml-3 rounded border border-slate-600 bg-slate-900 p-2" value={levels[skill.id] ?? 0}
        onChange={event => onChange({ ...levels, [skill.id]: Number(event.target.value) })}>
        <option value={0}>Aucun : N1 à acheter</option>
        {skill.levels?.map(level => <option key={level.level} value={level.level}>N{level.level} acquis au départ</option>)}
      </select>
    </label>)}</div>;
}
