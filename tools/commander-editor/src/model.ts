import type {
  Commander,
  CommanderFormState,
  DefaultPawnType,
  MovementStrategy,
  PawnColor,
  PawnFormState,
  PawnImplicitSkillParams,
  PawnStats,
  PawnType,
  WeaponKeysData,
} from './types';
import weaponKeysData from '../../../weaponKeys.json';
import {
  DEFAULT_PAWN_TYPES,
  MOVEMENT_STRATEGIES,
  PAWN_COLORS,
  PAWN_TYPES,
} from './types';

const IMPLICIT_SKILL_IDS = [
  'power-growth',
  'increase-power-column-when-decrementing',
  'increase-SP-by-attack-linked-when-preparing',
  'increase-SP-by-attack-group-when-spawning',
  'gain-FWD-on-decrement',
  'liaison-power-bonus',
  'sp-growth',
];

const WEAPON_KEYS = weaponKeysData as WeaponKeysData;

function requiredWeaponKey(value: unknown, type: PawnType, label: string): string {
  const key = requiredString(value, label);
  if (!WEAPON_KEYS[type].includes(key)) {
    throw new Error(`${label} doit être une arme disponible pour le type ${type}.`);
  }
  return key;
}

let sequence = 0;

export function createPawn(): PawnFormState {
  sequence += 1;
  return {
    key: `pawn-${Date.now()}-${sequence}`,
    id: '',
    displayName: '',
    color: 'red',
    type: 'melee',
    turnCount: 1,
    power: 0,
    countPawns: 1,
    moveCount: 1,
    visualKey: '',
    weaponKey: '',
    requiredInfluencePoints: '',
    skills: [],
    powerBonusPerDecrement: '',
    columnPowerBonusPerDecrement: '',
    spBonusPerLiaison: '',
    spBonusPerAttackPawn: '',
    freeWallDestructsOnDecrement: '',
    liaisonBonusPercent: '',
    spGrowthBonus: '',
  };
}

export function createInitialState(): CommanderFormState {
  return {
    id: '',
    name: '',
    description: '',
    icon: '',
    pawnMax: 45,
    health: 100,
    maxDefenseLevel: 3,
    defensePowerPerLevel: 5,
    movementsPerTurn: 3,
    attackPowerByColor: { red: 0, blue: 0, green: 0 },
    attackTurnCountByColor: { red: 1, blue: 1, green: 1 },
    nonePowerByColor: { red: 0, blue: 0, green: 0 },
    pawnTypeByColor: { red: 'melee', blue: 'melee', green: 'melee' },
    pawnVisualKeyByColor: { red: '', blue: '', green: '' },
    pawnWeaponKeyByColor: { red: '', blue: '', green: '' },
    commanderPawns: [],
    officerPawns: [],
    skills: [],
    innateSkills: [],
    freeRecruitThreshold: '',
    skillsByColor: { red: [], blue: [], green: [] },
    powerBonusPerDecrementByColor: { red: '', blue: '', green: '' },
    movementBonusStrategies: { place: '', remove: '' },
  };
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} doit être un objet.`);
  }
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} doit être une chaîne non vide.`);
  }
  return value;
}

function optionalString(value: unknown, label: string): string {
  if (value === undefined) return '';
  if (typeof value !== 'string') throw new Error(`${label} doit être une chaîne.`);
  return value;
}

function requiredNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} doit être un nombre.`);
  }
  return value;
}

function optionalNumber(value: unknown, label: string): number | '' {
  if (value === undefined) return '';
  return requiredNumber(value, label);
}

function stringArray(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${label} doit être un tableau de chaînes.`);
  }
  const chargeSkills = value.filter((item) => /^charge-\d+$/.test(item));
  if (chargeSkills.length > 1) {
    throw new Error(
      `${label} ne peut contenir qu'une seule compétence de charge (${chargeSkills.join(', ')}).`,
    );
  }
  return value;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${label} doit être l'une des valeurs : ${allowed.join(', ')}.`);
  }
  return value as T;
}

function colorRecord<T>(
  value: unknown,
  label: string,
  reader: (entry: unknown, entryLabel: string) => T,
): Record<PawnColor, T> {
  assertRecord(value, label);
  return Object.fromEntries(
    PAWN_COLORS.map((color) => [
      color,
      reader(value[color], `${label}.${color}`),
    ]),
  ) as Record<PawnColor, T>;
}

function optionalColorSkills(value: unknown): Record<PawnColor, string[]> {
  if (value === undefined) return { red: [], blue: [], green: [] };
  assertRecord(value, 'baseStats.skillsByColor');
  return Object.fromEntries(
    PAWN_COLORS.map((color) => [
      color,
      stringArray(value[color], `baseStats.skillsByColor.${color}`),
    ]),
  ) as Record<PawnColor, string[]>;
}

function optionalColorNumbers(
  value: unknown,
): Record<PawnColor, number | ''> {
  if (value === undefined) return { red: '', blue: '', green: '' };
  assertRecord(value, 'baseStats.powerBonusPerDecrementByColor');
  return Object.fromEntries(
    PAWN_COLORS.map((color) => [
      color,
      optionalNumber(
        value[color],
        `baseStats.powerBonusPerDecrementByColor.${color}`,
      ),
    ]),
  ) as Record<PawnColor, number | ''>;
}

function fromImplicitSkillParams(value: unknown, label: string): Pick<PawnFormState,
  'powerBonusPerDecrement' | 'columnPowerBonusPerDecrement' | 'spBonusPerLiaison' |
  'spBonusPerAttackPawn' | 'freeWallDestructsOnDecrement' | 'liaisonBonusPercent' | 'spGrowthBonus'
> {
  if (value === undefined) {
    return {
      powerBonusPerDecrement: '',
      columnPowerBonusPerDecrement: '',
      spBonusPerLiaison: '',
      spBonusPerAttackPawn: '',
      freeWallDestructsOnDecrement: '',
      liaisonBonusPercent: '',
      spGrowthBonus: '',
    };
  }
  assertRecord(value, label);
  return {
    powerBonusPerDecrement: optionalNumber(value.powerBonusPerDecrement, `${label}.powerBonusPerDecrement`),
    columnPowerBonusPerDecrement: optionalNumber(value.columnPowerBonusPerDecrement, `${label}.columnPowerBonusPerDecrement`),
    spBonusPerLiaison: optionalNumber(value.spBonusPerLiaison, `${label}.spBonusPerLiaison`),
    spBonusPerAttackPawn: optionalNumber(value.spBonusPerAttackPawn, `${label}.spBonusPerAttackPawn`),
    freeWallDestructsOnDecrement: optionalNumber(value.freeWallDestructsOnDecrement, `${label}.freeWallDestructsOnDecrement`),
    liaisonBonusPercent: optionalNumber(value.liaisonBonusPercent, `${label}.liaisonBonusPercent`),
    spGrowthBonus: optionalNumber(value.spGrowthBonus, `${label}.spGrowthBonus`),
  };
}

function fromPawn(value: unknown, label: string): PawnFormState {
  assertRecord(value, label);
  const implicitParams = fromImplicitSkillParams(value.implicitSkillParams, `${label}.implicitSkillParams`);
  const skills = stringArray(value.skills, `${label}.skills`).filter(
    (skill) => !IMPLICIT_SKILL_IDS.includes(skill),
  );
  const type = enumValue(value.type, PAWN_TYPES, `${label}.type`) as PawnType;
  return {
    key: createPawn().key,
    id: requiredString(value.id, `${label}.id`),
    displayName: optionalString(value.displayName, `${label}.displayName`),
    color: enumValue(value.color, PAWN_COLORS, `${label}.color`),
    type,
    turnCount: requiredNumber(value.turnCount, `${label}.turnCount`),
    power: requiredNumber(value.power, `${label}.power`),
    countPawns: requiredNumber(value.countPawns, `${label}.countPawns`),
    moveCount: requiredNumber(value.moveCount, `${label}.moveCount`),
    visualKey: requiredString(value.visualKey, `${label}.visualKey`),
    weaponKey: requiredWeaponKey(value.weaponKey, type, `${label}.weaponKey`),
    requiredInfluencePoints: optionalNumber(
      value.requiredInfluencePoints,
      `${label}.requiredInfluencePoints`,
    ),
    skills,
    ...implicitParams,
  };
}

function pawnArray(value: unknown, label: string): PawnFormState[] {
  if (!Array.isArray(value)) throw new Error(`${label} doit être un tableau.`);
  return value.map((pawn, index) => fromPawn(pawn, `${label}[${index}]`));
}

export function parseCommanderJson(json: string): CommanderFormState {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JSON invalide';
    throw new Error(`JSON invalide : ${message}`);
  }

  assertRecord(value, 'Commander');
  assertRecord(value.baseStats, 'baseStats');
  const stats = value.baseStats;

  let movementBonusStrategies: CommanderFormState['movementBonusStrategies'] = {
    place: '',
    remove: '',
  };
  if (stats.movementBonusStrategies !== undefined) {
    assertRecord(
      stats.movementBonusStrategies,
      'baseStats.movementBonusStrategies',
    );
    const strategies = stats.movementBonusStrategies;
    movementBonusStrategies = {
      place:
        strategies.place === undefined
          ? ''
          : enumValue(
              strategies.place,
              MOVEMENT_STRATEGIES,
              'baseStats.movementBonusStrategies.place',
            ) as MovementStrategy,
      remove:
        strategies.remove === undefined
          ? ''
          : enumValue(
              strategies.remove,
              MOVEMENT_STRATEGIES,
              'baseStats.movementBonusStrategies.remove',
            ) as MovementStrategy,
    };
  }

  const activatableSkills = stringArray(stats.skills, 'baseStats.skills');
  const innateSkills = stringArray(
    stats.innateSkills,
    'baseStats.innateSkills',
  );
  const overlappingSkill = activatableSkills.find((skill) =>
    innateSkills.includes(skill),
  );
  if (overlappingSkill) {
    throw new Error(
      `La compétence « ${overlappingSkill} » ne peut pas être à la fois activable et innée.`,
    );
  }
  const powerBonusPerDecrementByColor = optionalColorNumbers(
    stats.powerBonusPerDecrementByColor,
  );
  const skillsByColor = optionalColorSkills(stats.skillsByColor);
  PAWN_COLORS.forEach((color) => {
    const bonus = powerBonusPerDecrementByColor[color];
    if (bonus !== '' && bonus > 0) {
      skillsByColor[color] = skillsByColor[color].filter(
        (skill) => skill !== 'power-growth',
      );
    }
  });

  const pawnTypeByColor = colorRecord(
    stats.pawnTypeByColor,
    'baseStats.pawnTypeByColor',
    (entry, label) =>
      enumValue(entry, DEFAULT_PAWN_TYPES, label) as DefaultPawnType,
  );

  return {
    id: requiredString(value.id, 'id'),
    name: requiredString(value.name, 'name'),
    description: optionalString(value.description, 'description'),
    icon: optionalString(value.icon, 'icon'),
    pawnMax: requiredNumber(stats.pawnMax, 'baseStats.pawnMax'),
    health: requiredNumber(stats.health, 'baseStats.health'),
    maxDefenseLevel: requiredNumber(
      stats.maxDefenseLevel,
      'baseStats.maxDefenseLevel',
    ),
    defensePowerPerLevel: requiredNumber(
      stats.defensePowerPerLevel,
      'baseStats.defensePowerPerLevel',
    ),
    movementsPerTurn: requiredNumber(
      stats.movementsPerTurn,
      'baseStats.movementsPerTurn',
    ),
    attackPowerByColor: colorRecord(
      stats.attackPowerByColor,
      'baseStats.attackPowerByColor',
      requiredNumber,
    ),
    attackTurnCountByColor: colorRecord(
      stats.attackTurnCountByColor,
      'baseStats.attackTurnCountByColor',
      requiredNumber,
    ),
    nonePowerByColor: colorRecord(
      stats.nonePowerByColor,
      'baseStats.nonePowerByColor',
      requiredNumber,
    ),
    pawnTypeByColor,
    pawnVisualKeyByColor: colorRecord(
      stats.pawnVisualKeyByColor,
      'baseStats.pawnVisualKeyByColor',
      requiredString,
    ),
    pawnWeaponKeyByColor: colorRecord(
      stats.pawnWeaponKeyByColor,
      'baseStats.pawnWeaponKeyByColor',
      (entry, label) => {
        const color = PAWN_COLORS.find((candidate) => label.endsWith(`.${candidate}`));
        const type = color && pawnTypeByColor[color];
        if (type !== 'melee' && type !== 'ranged') {
          throw new Error(`${label} ne peut pas référencer d'arme pour le type ${type}.`);
        }
        return requiredWeaponKey(entry, type, label);
      },
    ),
    commanderPawns: pawnArray(
      stats.commanderPawns,
      'baseStats.commanderPawns',
    ),
    officerPawns: pawnArray(stats.officerPawns, 'baseStats.officerPawns'),
    skills: activatableSkills,
    innateSkills,
    freeRecruitThreshold: optionalNumber(
      stats.freeRecruitThreshold,
      'baseStats.freeRecruitThreshold',
    ),
    skillsByColor,
    powerBonusPerDecrementByColor,
    movementBonusStrategies,
  };
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toImplicitSkillParams(pawn: PawnFormState): PawnImplicitSkillParams | undefined {
  const params: PawnImplicitSkillParams = {};
  if (pawn.powerBonusPerDecrement !== '') params.powerBonusPerDecrement = pawn.powerBonusPerDecrement;
  if (pawn.columnPowerBonusPerDecrement !== '') params.columnPowerBonusPerDecrement = pawn.columnPowerBonusPerDecrement;
  if (pawn.spBonusPerLiaison !== '') params.spBonusPerLiaison = pawn.spBonusPerLiaison;
  if (pawn.spBonusPerAttackPawn !== '') params.spBonusPerAttackPawn = pawn.spBonusPerAttackPawn;
  if (pawn.freeWallDestructsOnDecrement !== '') params.freeWallDestructsOnDecrement = pawn.freeWallDestructsOnDecrement;
  if (pawn.liaisonBonusPercent !== '') params.liaisonBonusPercent = pawn.liaisonBonusPercent;
  if (pawn.spGrowthBonus !== '') params.spGrowthBonus = pawn.spGrowthBonus;
  return Object.keys(params).length > 0 ? params : undefined;
}

function toPawn(pawn: PawnFormState): PawnStats {
  const skills = pawn.skills.filter(
    (skill) => !IMPLICIT_SKILL_IDS.includes(skill),
  );
  const implicitSkillParams = toImplicitSkillParams(pawn);
  return {
    id: pawn.id.trim(),
    ...(optionalText(pawn.displayName) && { displayName: pawn.displayName.trim() }),
    color: pawn.color,
    type: pawn.type,
    turnCount: pawn.turnCount,
    power: pawn.power,
    countPawns: pawn.countPawns,
    moveCount: pawn.moveCount,
    visualKey: pawn.visualKey.trim(),
    weaponKey: pawn.weaponKey.trim(),
    ...(pawn.requiredInfluencePoints !== '' && {
      requiredInfluencePoints: pawn.requiredInfluencePoints,
    }),
    ...(skills.length > 0 && { skills }),
    ...(implicitSkillParams && { implicitSkillParams }),
  };
}

export function toCommander(state: CommanderFormState): Commander {
  const skillsByColor = Object.fromEntries(
    PAWN_COLORS.map((color) => {
      const bonus = state.powerBonusPerDecrementByColor[color];
      const skills = state.skillsByColor[color].filter(
        (skill) =>
          !(skill === 'power-growth' && bonus !== '' && bonus > 0),
      );
      return [color, skills] as const;
    }).filter(([, skills]) => skills.length > 0),
  );
  const bonusesByColor = Object.fromEntries(
    PAWN_COLORS.filter(
      (color) => state.powerBonusPerDecrementByColor[color] !== '',
    ).map((color) => [color, state.powerBonusPerDecrementByColor[color]]),
  );
  const movementStrategies = Object.fromEntries(
    Object.entries(state.movementBonusStrategies).filter(([, value]) => value !== ''),
  );

  return {
    id: state.id.trim(),
    name: state.name.trim(),
    ...(optionalText(state.description) && { description: state.description.trim() }),
    ...(optionalText(state.icon) && { icon: state.icon.trim() }),
    baseStats: {
      pawnMax: state.pawnMax,
      health: state.health,
      maxDefenseLevel: state.maxDefenseLevel,
      defensePowerPerLevel: state.defensePowerPerLevel,
      attackPowerByColor: state.attackPowerByColor,
      attackTurnCountByColor: state.attackTurnCountByColor,
      nonePowerByColor: state.nonePowerByColor,
      pawnTypeByColor: state.pawnTypeByColor,
      pawnVisualKeyByColor: Object.fromEntries(
        PAWN_COLORS.map((color) => [
          color,
          state.pawnVisualKeyByColor[color].trim(),
        ]),
      ) as Commander['baseStats']['pawnVisualKeyByColor'],
      pawnWeaponKeyByColor: Object.fromEntries(
        PAWN_COLORS.map((color) => [
          color,
          state.pawnWeaponKeyByColor[color].trim(),
        ]),
      ) as Commander['baseStats']['pawnWeaponKeyByColor'],
      commanderPawns: state.commanderPawns.map(toPawn),
      officerPawns: state.officerPawns.map(toPawn),
      movementsPerTurn: state.movementsPerTurn,
      ...(state.skills.length > 0 && { skills: state.skills }),
      ...(state.innateSkills.length > 0 && { innateSkills: state.innateSkills }),
      ...(state.freeRecruitThreshold !== '' && {
        freeRecruitThreshold: state.freeRecruitThreshold,
      }),
      ...(Object.keys(skillsByColor).length > 0 && { skillsByColor }),
      ...(Object.keys(bonusesByColor).length > 0 && {
        powerBonusPerDecrementByColor: bonusesByColor,
      }),
      ...(Object.keys(movementStrategies).length > 0 && {
        movementBonusStrategies: movementStrategies,
      }),
    },
  } as Commander;
}

export function validateCommander(state: CommanderFormState): string[] {
  const errors: string[] = [];
  if (!state.id.trim()) errors.push("L'identifiant du commandant est obligatoire.");
  if (!state.name.trim()) errors.push('Le nom du commandant est obligatoire.');

  const requiredNumbers: Array<[string, number]> = [
    ['Maximum de pions', state.pawnMax],
    ['Points de vie', state.health],
    ['Niveau de défense maximal', state.maxDefenseLevel],
    ['Puissance de défense par niveau', state.defensePowerPerLevel],
    ['Mouvements par tour', state.movementsPerTurn],
  ];
  requiredNumbers.forEach(([label, value]) => {
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`${label} doit être un nombre positif ou nul.`);
    }
  });

  PAWN_COLORS.forEach((color) => {
    if (!state.pawnVisualKeyByColor[color].trim()) {
      errors.push(`La clé visuelle du pion ${color} est obligatoire.`);
    }
    if (!state.pawnWeaponKeyByColor[color].trim()) {
      errors.push(`La clé d'arme du pion ${color} est obligatoire.`);
    } else {
      const type = state.pawnTypeByColor[color];
      if (type === 'melee' || type === 'ranged') {
        if (!WEAPON_KEYS[type].includes(state.pawnWeaponKeyByColor[color])) {
          errors.push(`La clé d'arme du pion ${color} n'est pas disponible pour le type ${type}.`);
        }
      } else {
        errors.push(`Aucune clé d'arme n'est disponible pour le type ${type}.`);
      }
    }
  });

  const pawns = [...state.commanderPawns, ...state.officerPawns];
  pawns.forEach((pawn, index) => {
    const label = pawn.displayName.trim() || `Pion ${index + 1}`;
    if (!pawn.id.trim()) errors.push(`${label} : l'identifiant est obligatoire.`);
    if (!pawn.visualKey.trim()) errors.push(`${label} : la clé visuelle est obligatoire.`);
    if (!pawn.weaponKey.trim()) errors.push(`${label} : la clé d'arme est obligatoire.`);
    else if (!WEAPON_KEYS[pawn.type].includes(pawn.weaponKey)) {
      errors.push(`${label} : la clé d'arme n'est pas disponible pour le type ${pawn.type}.`);
    }
    const values = [
      pawn.turnCount,
      pawn.power,
      pawn.countPawns,
      pawn.moveCount,
    ];
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      errors.push(`${label} : les valeurs numériques doivent être positives ou nulles.`);
    }
  });

  const ids = pawns.map((pawn) => pawn.id.trim()).filter(Boolean);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  duplicateIds.forEach((id) => errors.push(`L'identifiant de pion « ${id} » est dupliqué.`));

  const duplicatedSkills = state.skills.filter((skill) =>
    state.innateSkills.includes(skill),
  );
  duplicatedSkills.forEach((skill) =>
    errors.push(
      `La compétence « ${skill} » ne peut pas être à la fois activable et innée.`,
    ),
  );

  const validateChargeSkills = (skills: string[], label: string) => {
    const chargeSkills = skills.filter((skill) => /^charge-\d+$/.test(skill));
    if (chargeSkills.length > 1) {
      errors.push(
        `${label} ne peut contenir qu'une seule compétence de charge.`,
      );
    }
  };

  validateChargeSkills(state.skills, 'Les compétences activables');
  validateChargeSkills(state.innateSkills, 'Les compétences innées');
  PAWN_COLORS.forEach((color) =>
    validateChargeSkills(
      state.skillsByColor[color],
      `Les compétences de la couleur ${color}`,
    ),
  );
  state.commanderPawns.forEach((pawn, index) =>
    validateChargeSkills(
      pawn.skills,
      `Le pion commandant ${pawn.displayName || index + 1}`,
    ),
  );
  state.officerPawns.forEach((pawn, index) =>
    validateChargeSkills(
      pawn.skills,
      `Le pion officier ${pawn.displayName || index + 1}`,
    ),
  );

  return errors;
}
