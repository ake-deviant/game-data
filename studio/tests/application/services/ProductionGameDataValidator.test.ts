import { describe, expect, it } from 'vitest';
import { ProductionGameDataValidator } from '../../../src/application/services/ProductionGameDataValidator';
import { ProductionCommanderCatalogMother } from '../../fixtures/production/ProductionCommanderCatalogMother';
import { ProductionReferenceCatalogsMother } from '../../fixtures/production/ProductionReferenceCatalogsMother';

describe('ProductionGameDataValidator', () => {
  it('accepte un catalogue de Commanders valide', () => {
    // Arrange
    const catalog = ProductionCommanderCatalogMother.valid();
    const validator = new ProductionGameDataValidator();

    // Act
    const validate = () => validator.validate(catalog, ProductionReferenceCatalogsMother.valid());

    // Assert
    expect(validate).not.toThrow();
  });

  it('refuse un Commander sans id', () => {
    const catalog = mutableCatalog();
    catalog[0].id = '';

    expect(() => validate(catalog)).toThrow('commanders[0].id');
  });

  it('refuse deux Commanders avec le même id', () => {
    const catalog = mutableCatalog();
    catalog.push(structuredClone(catalog[0]));

    expect(() => validate(catalog)).toThrow("Duplicate Commander id 'commander-1'");
  });

  it('refuse un Commander qui ne possède pas exactement un soldier de chaque couleur', () => {
    const catalog = mutableCatalog();
    catalog[0].baseStats.soldierPawns[2].color = 'blue';

    expect(() => validate(catalog)).toThrow('exactly one blue soldier');
  });

  it('refuse un soldier sans nonePower', () => {
    const catalog = mutableCatalog();
    delete catalog[0].baseStats.soldierPawns[0].nonePower;

    expect(() => validate(catalog)).toThrow('nonePower');
  });

  it('refuse un pion élite sans countPawns', () => {
    const catalog = mutableCatalog();
    delete catalog[0].baseStats.commanderPawns[0].countPawns;

    expect(() => validate(catalog)).toThrow('countPawns');
  });

  it.each([
    ['négative', -1],
    ['infinie', Number.POSITIVE_INFINITY],
  ])('refuse une statistique de pion %s', (_label, invalidValue) => {
    const catalog = mutableCatalog();
    catalog[0].baseStats.soldierPawns[0].power = invalidValue;

    expect(() => validate(catalog)).toThrow('power');
  });

  it('refuse une couleur de pion inconnue', () => {
    const catalog = mutableCatalog();
    catalog[0].baseStats.soldierPawns[0].color = 'yellow';

    expect(() => validate(catalog)).toThrow('color must be red, blue or green');
  });

  it('refuse un type de pion inconnu', () => {
    const catalog = mutableCatalog();
    catalog[0].baseStats.soldierPawns[0].type = 'magic';

    expect(() => validate(catalog)).toThrow('type must be melee or ranged');
  });

  it('refuse plusieurs skills charge dans une même liste', () => {
    const catalog = mutableCatalog();
    catalog[0].baseStats.soldierPawns[0].skills = ['charge-30', 'charge-50'];

    expect(() => validate(catalog)).toThrow('more than one charge skill');
  });

  it('refuse une skill présente dans skills et innateSkills', () => {
    const catalog = mutableCatalog();
    catalog[0].baseStats.skills = ['tactical-demolition'];
    catalog[0].baseStats.innateSkills = ['tactical-demolition'];

    expect(() => validate(catalog)).toThrow('both activable and innate');
  });

  it('refuse une skill référencée qui n’existe pas', () => {
    const catalog = mutableCatalog();
    catalog[0].baseStats.soldierPawns[0].skills = ['unknown-skill'];

    expect(() => validate(catalog)).toThrow("Unknown skill id 'unknown-skill'");
  });

  it('refuse une arme référencée qui n’existe pas', () => {
    const catalog = mutableCatalog();
    catalog[0].baseStats.soldierPawns[0].weaponKey = 'unknown-weapon';

    expect(() => validate(catalog)).toThrow("Unknown weapon key 'unknown-weapon'");
  });

  it('refuse un wall visual set référencé qui n’existe pas', () => {
    const catalog = mutableCatalog();
    catalog[0].baseStats.wallVisualSet = 'unknown-wall';

    expect(() => validate(catalog)).toThrow("Unknown wall visual set 'unknown-wall'");
  });

  it('refuse un soldier dont nonePower est différent de turnCount', () => {
    const catalog = mutableCatalog();
    catalog[0].baseStats.soldierPawns[0].nonePower = 1;

    expect(() => validate(catalog)).toThrow('nonePower must equal turnCount');
  });
});

function validate(catalog: unknown): void {
  new ProductionGameDataValidator().validate(catalog, ProductionReferenceCatalogsMother.valid());
}

function mutableCatalog(): any[] {
  return structuredClone(ProductionCommanderCatalogMother.valid());
}
