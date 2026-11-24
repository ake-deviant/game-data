import { z } from 'zod';

const skillAssignmentSchema = z.object({
  id: z.string().min(1),
  initialLevel: z.number().int().nonnegative().optional(),
  maxLevel: z.number().int().positive().optional(),
});

export const skillAssignmentsSchema = z.array(z.union([z.string().min(1), skillAssignmentSchema])).optional();

type SkillAssignments = z.infer<typeof skillAssignmentsSchema>;
type SkillLevels = Readonly<Record<string, number>>;

export function readSkillAssignments(
  assignments: SkillAssignments,
  legacyInitial?: SkillLevels,
  legacyMaximum?: SkillLevels,
) {
  const initial = { ...legacyInitial };
  const maximum = { ...legacyMaximum };
  const ids = assignments?.map(assignment => {
    if (typeof assignment === 'string') return assignment;
    const { id, initialLevel, maxLevel } = assignment;
    if (initialLevel !== undefined) initial[id] = initialLevel;
    if (maxLevel !== undefined) maximum[id] = maxLevel;
    return id;
  });
  return {
    ids,
    initial: Object.keys(initial).length ? initial : undefined,
    maximum: Object.keys(maximum).length ? maximum : undefined,
  };
}

export function writeSkillAssignments(
  ids: readonly string[],
  initial?: SkillLevels,
  maximum?: SkillLevels,
): SkillAssignments {
  return ids.length ? ids.map(id => ({ id, initialLevel: initial?.[id], maxLevel: maximum?.[id] })) : undefined;
}
