import type { PawnImplicitSkillParams, Skill } from '@game-data/domain';

const pawnParameters = {
  powerBonusPerDecrement: true,
  columnPowerBonusPerDecrement: true,
  spBonusPerLiaison: true,
  spBonusPerAttackPawn: true,
  freeWallDestructsOnDecrement: true,
  liaisonBonusPercent: true,
  spGrowthBonus: true,
} satisfies Record<keyof PawnImplicitSkillParams, true>;

const skillParameters = new Set([
  'chargeBonusPercent', 'skillPointCost', 'skillDelay', 'requiredInfluencePoints',
  'freeWallDestructs', 'movementCost', 'extraPawnSlots',
]);

/** Validates any locale without coupling the catalog to a language or UI. */
export class SkillLocalizationValidator {
  public validate(skills: readonly Skill[], catalog: unknown): void {
    if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
      throw new Error('Translation catalog must be an object.');
    }
    const translations = catalog as Record<string, unknown>;
    for (const [key, value] of Object.entries(translations)) {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`Translation '${key}' must be a non-empty string.`);
      }
    }

    for (const skill of skills) {
      this.validateText(translations, skill.displayNameKey, []);
      this.validateText(translations, skill.descriptionKey, Object.keys(skill.descriptionParams));
      for (const [parameter, source] of Object.entries(skill.descriptionParams)) {
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(parameter)) {
          throw new Error(`Invalid parameter '${parameter}' for '${skill.id.value}'.`);
        }
        if (source.startsWith('pawn.implicitSkillParams.')) {
          const field = source.slice('pawn.implicitSkillParams.'.length);
          if (Object.hasOwn(pawnParameters, field)) continue;
        } else if (source.startsWith('skill.')) {
          const field = source.slice('skill.'.length);
          const value = Reflect.get(skill, field);
          if (skillParameters.has(field) && typeof value === 'number' && Number.isFinite(value)) continue;
        }
        throw new Error(`Invalid source '${source}' for '${skill.id.value}.${parameter}'.`);
      }
    }
  }

  private validateText(catalog: Record<string, unknown>, key: string, parameters: string[]): void {
    const text = catalog[key];
    if (typeof text !== 'string' || !text.trim()) throw new Error(`Missing translation '${key}'.`);
    const pattern = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;
    const actual = new Set([...text.matchAll(pattern)].map((match) => match[1]));
    if (/[{}]/.test(text.replace(pattern, ''))) throw new Error(`Invalid placeholders in '${key}'.`);
    if (actual.size !== parameters.length || parameters.some((parameter) => !actual.has(parameter))) {
      throw new Error(`Parameters do not match translation '${key}'.`);
    }
  }
}
