# Générateur de grille — résumé métier

## Qu'est-ce que c'est ?

Un outil de composition tactique lié à un commandant. L'utilisateur positionne des pions sur une grille pour préparer des configurations utilisées dans des tutoriels ou des formations.

## Structure de la grille

- Dimensions fixes : **7 lignes × 9 colonnes**
- Toujours rattachée à un **commandant** (`commanderId`)
- Chaque commandant a une **capacité max** (`pawnMax`) : nombre total de pions qu'on peut placer (la somme des `countPawns` de chaque pion placé)

## Les pions

Trois rangs, avec des empreintes différentes sur la grille :

| Rang | Empreinte | Status initial | `turnCount` |
|------|-----------|----------------|-------------|
| Troop (soldat) | 1×1 | `none` | toujours `null` |
| Officer | 1×2 | `attack` | entier 1–9 |
| Commander | 2×2 | `attack` | entier 1–9 |

- La **puissance** (`power`) doit être un entier de **1 à 200**
- Un soldat démarre à `nonePower` (la puissance en mode none, plus faible), les autres au `power` du template
- Chaque pion placé reçoit un **UUID propre**, distinct de l'ID du template

## Règles de palette (qui peut placer quoi)

Définies par `GridPalettePolicy` selon la sélection du commandant :

- **Soldier** : un seul modèle par couleur (`pawnDefinitionIdByColor`). L'ID du template doit correspondre à la couleur du pion.
- **Officer** : autorisé si l'ID figure dans `officerPawnDefinitionIds` du commandant
- **Commander** : autorisé si l'ID figure dans `commanderPawnDefinitionIds` du commandant

## Règles de placement

1. **Hors limites** — l'empreinte entière doit tenir dans la grille
2. **Collision** — aucune case occupée par un autre pion
3. **Unicité template** — un officer ou commander ne peut être placé qu'en un seul exemplaire (les soldiers n'ont pas cette contrainte)
4. **Capacité** — `consumedCapacity + countPawns ≤ pawnMax`
5. **UUID unique** — chaque pion placé a un UUID distinct de tous les autres et de son template

## Cycle de vie dans le studio

- **Nouvelle** : choisir un commandant → grille vierge en mémoire
- **Gérer** : liste des grilles sauvegardées, filtrables par commandant → charger ou supprimer
- Le contrôleur garde en **mémoire de session** la grille par commandant (`sessions` map) : revenir sur un commandant déjà visité restaure la composition en cours

## Format de sérialisation (`GridDocument`)

```ts
{ rows: 7, cols: 9, pawns: GridPawnDocument[] }
```

Chaque `GridPawnDocument` contient : `id`, `templateId`, `rank`, `status`, `color`, `type`, `power`, `turnCount`, `countPawns`, `moveCount`, `x`, `y`, `footprint`, `occupiedCells`, `visualKey`, `weaponKey`, `skills`, `implicitSkillParams`.
