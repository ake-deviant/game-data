# Textes localisés

Les fichiers `<langue>.json` sont des dictionnaires plats UTF-8, distribués dans le
package npm. `fr.json` est le catalogue de référence initial. Les textes `XXX`
sont à rédiger ; les variables présentes indiquent les paramètres disponibles.

## Compétences

Chaque entrée de `data/skills.json` contient :

- `displayNameKey` : clé du nom traduit ;
- `descriptionKey` : clé du modèle de description ;
- `descriptionParams` : correspondance entre chaque variable et sa source.

`displayName` reste disponible pour les consommateurs existants. Lors d'un
changement de nom français, mettre également à jour cette valeur de compatibilité.
Les clés sont stables et ne doivent pas changer lors d'une modification du texte.

Exemple de métadonnées :

```json
{
  "descriptionKey": "skills.power-growth.description",
  "descriptionParams": {
    "powerBonusPerDecrement": "pawn.implicitSkillParams.powerBonusPerDecrement"
  }
}
```

Le texte français contient `{powerBonusPerDecrement}`. Le consommateur fournit
la valeur du pion concerné, par exemple `10`. Pour une charge, la source est
`skill.chargeBonusPercent`, lue dans l'entrée de la compétence elle-même.
Un dictionnaire vide signifie que le texte n'a pas de variable.

## Contrat de résolution côté serveur

Le remplacement n'est pas exécuté par ce dépôt : il reste à intégrer au serveur.

1. Choisir le catalogue de la langue demandée (français par défaut).
2. Lire le texte via `descriptionKey`.
3. Construire les paramètres à partir des sources déclarées, en appliquant les
   mêmes valeurs par défaut que les règles du jeu si nécessaire.
4. Remplacer toutes les occurrences de `{nomDuParametre}` par leur valeur.

Les sources sont des chemins de données limités à `skill.<champ numérique>` et
`pawn.implicitSkillParams.<champ>`, jamais des expressions exécutables.
Une valeur manquante ne doit pas être remplacée silencieusement par zéro : le
serveur doit appliquer sa règle métier ou signaler l'absence de valeur.
La syntaxe actuelle ne gère ni pluriels, ni expressions, ni balises de mise en forme.

Pour permettre une résolution ultérieure côté client, le serveur pourra retourner
la clé et les paramètres résolus en plus de la description finale.

## Validation et ajout d'une langue

`npm run validate:data` contrôle tous les fichiers JSON de ce dossier : textes non
vides, clés de compétences présentes, correspondance exacte des variables avec les
métadonnées, sources connues et valeurs numériques des paramètres du catalogue.
Les textes `XXX` sont acceptés pendant la rédaction.

Pour ajouter une langue, copier `fr.json` vers `<langue>.json` et traduire les
valeurs sans modifier les clés ni les variables. Les nouveaux fichiers sont inclus
automatiquement dans le package npm et dans la validation. D'autres familles de
textes peuvent utiliser leurs propres préfixes ; une future UI pourra éditer ces
mêmes fichiers. Aucun composant React n'est nécessaire à ce format.
