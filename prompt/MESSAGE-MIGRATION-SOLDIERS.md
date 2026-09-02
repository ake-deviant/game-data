# Message de migration — structure des soldiers

## Destinataires : serveur et client du jeu

Une modification cassante est prévue dans le contrat des données des Commanders.

Actuellement, les soldiers sont décrits par des champs aplatis dans `baseStats` :

- `attackPowerByColor`
- `attackTurnCountByColor`
- `nonePowerByColor`
- `pawnTypeByColor`
- `pawnVisualKeyByColor`
- `pawnWeaponKeyByColor`

La future structure regroupera explicitement les soldiers dans une liste de définitions complètes, au même niveau conceptuel que `commanderPawns` et `officerPawns` :

```json
"soldierPawns": [
  {
    "id": "soldier-1-red",
    "color": "red",
    "type": "melee",
    "turnCount": 2,
    "power": 8,
    "nonePower": 2,
    "visualKey": "pawn_default_melee_red",
    "weaponKey": "spear"
  }
]
```

Règle métier : chaque Commander doit contenir exactement un soldier rouge, un bleu et un vert.

Le serveur et le client devront adapter leur lecture et leur validation de `commanders.json`. L’ancien format ne doit pas être supprimé avant la migration coordonnée et la publication d’une version compatible.

Cette modification concerne uniquement le contrat de données ; aucune injection automatique dans les données de production ne doit être faite depuis le catalogue interne.
