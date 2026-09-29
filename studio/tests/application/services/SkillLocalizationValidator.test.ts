import { describe, expect, it } from 'vitest';
import { PawnSkill, SkillId } from '@game-data/domain';
import { SkillLocalizationValidator } from '../../../src/application/services/SkillLocalizationValidator';

const makeSkill = (descriptionParams = { powerBonusPerDecrement: 'pawn.implicitSkillParams.powerBonusPerDecrement' }) => new PawnSkill({
  id: new SkillId('power-growth'),
  displayName: 'Croissance de Puissance',
  displayNameKey: 'skills.power-growth.name',
  descriptionKey: 'skills.power-growth.description',
  descriptionParams,
  visualKey: 'power-growth',
  triggerPhase: 'decrement',
});

const catalog = (description = 'Gagne {powerBonusPerDecrement} points de puissance.') => ({
  'skills.power-growth.name': 'Croissance de Puissance',
  'skills.power-growth.description': description,
});

describe('SkillLocalizationValidator', () => {
  const validator = new SkillLocalizationValidator();

  it('accepte un catalogue et les variables répétées, indépendamment de la langue', () => {
    expect(() => validator.validate([makeSkill()], catalog())).not.toThrow();
    expect(() => validator.validate([makeSkill()], catalog('Gain {powerBonusPerDecrement}, again {powerBonusPerDecrement}.'))).not.toThrow();
  });

  it('refuse une traduction manquante ou vide', () => {
    expect(() => validator.validate([makeSkill()], {})).toThrow('Missing translation');
    expect(() => validator.validate([makeSkill()], catalog(' '))).toThrow('non-empty string');
  });

  it.each(['Gagne {wrong}.', 'Gagne de la puissance.', 'Gagne {{powerBonusPerDecrement}}.'])(
    'refuse les variables absentes, inconnues ou mal formées : %s', (description) => {
      expect(() => validator.validate([makeSkill()], catalog(description))).toThrow();
    },
  );

  it('refuse une source inconnue ou une valeur de compétence absente', () => {
    for (const source of ['pawn.implicitSkillParams.typo', 'skill.chargeBonusPercent', 'skill.displayName']) {
      expect(() => validator.validate([makeSkill({ powerBonusPerDecrement: source })], catalog())).toThrow('Invalid source');
    }
  });

  it('accepte un paramètre provenant du catalogue de compétences', () => {
    const skill = new PawnSkill({
      id: new SkillId('charge-30'), displayName: 'Charge 30%', visualKey: 'charge-30',
      displayNameKey: 'charge.name', descriptionKey: 'charge.description',
      descriptionParams: { chargeBonusPercent: 'skill.chargeBonusPercent' },
      triggerPhase: 'attack', chargeBonusPercent: 30,
    });
    expect(() => validator.validate([skill], {
      'charge.name': 'Charge 30%', 'charge.description': 'XXX {chargeBonusPercent}',
    })).not.toThrow();
  });
});
