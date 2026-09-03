# Vérification serveur — `movementBonusStrategies`

## Destinataire : serveur du jeu

Nous devons vérifier l'utilisation réelle du champ `movementBonusStrategies` provenant de `data/commanders.json` avant d'envisager toute modification de son schéma.

Ce champ peut être présent dans `baseStats` sous cette forme :

```json
{
  "baseStats": {
    "movementBonusStrategies": {
      "place": "after-first-match",
      "remove": "1-match-1-move"
    }
  }
}
```

Les propriétés `place` et `remove` sont facultatives. Leurs valeurs possibles sont actuellement :

- `after-first-match`
- `1-match-1-move`

Merci de vérifier dans le code du serveur et de répondre précisément aux questions suivantes :

1. Le serveur lit-il `baseStats.movementBonusStrategies` depuis `commanders.json` ?
2. Si oui, où est-il lu et quel comportement de jeu contrôle-t-il pour `place` et `remove` ?
3. Une valeur définie par `movementBonusStrategies.remove` est-elle remplacée ou modifiée par la compétence `tactical-demolition`, notamment lorsqu'elle est présente dans `skills` ou `innateSkills` ?
4. Que fait le serveur lorsque `movementBonusStrategies`, `place` ou `remove` est absent ?
5. La suppression future de ce champ casserait-elle le chargement des données, une validation ou un comportement en partie ?

Merci d'indiquer les fichiers et classes concernés dans la réponse. Aucune suppression ni modification de ce champ ne sera faite avant votre validation explicite.
