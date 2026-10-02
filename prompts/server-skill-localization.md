# Serveur : retourner les descriptions françaises et les clés des compétences

Implémente cette évolution dans le projet serveur `2.server-game-node`.
Le client Unity doit recevoir des phrases déjà résolues : aucune gestion des
variables ou mise à jour de son système de traduction n'est demandée pour le moment.

## Changements disponibles dans game-data

Le commit `b52e9ea` du dépôt `3.game-data` ajoute la localisation des 13 compétences.
Commence par vérifier comment le serveur consomme ce package et récupère une
révision contenant ce commit. Ne suppose pas que la version `1.0.16` suffit :
la version du package n'a pas été augmentée par ce changement.

Chaque entrée de `data/skills.json` conserve ses champs existants et ajoute :

- `displayNameKey` : clé du nom traduit ;
- `descriptionKey` : clé de la description ;
- `descriptionParams` : dictionnaire des variables et de leurs sources de données.

Exemple pour `power-growth` :

```json
{
  "id": "power-growth",
  "displayName": "Croissance de Puissance",
  "visualKey": "power-growth",
  "triggerPhase": "decrement",
  "displayNameKey": "skills.power-growth.name",
  "descriptionKey": "skills.power-growth.description",
  "descriptionParams": {
    "powerBonusPerDecrement": "pawn.implicitSkillParams.powerBonusPerDecrement"
  }
}
```

Le nouveau fichier `data/locales/fr.json`, inclus dans le package npm, est un
dictionnaire plat UTF-8. Il contient les noms et descriptions rédigés par le
créateur du jeu. Utilise ces textes tels quels, sans les recopier dans le code.

```json
{
  "skills.power-growth.name": "Croissance de Puissance",
  "skills.power-growth.description": "gagne {powerBonusPerDecrement} points de puissance par tour."
}
```

## Travail attendu

1. Adapter le chargement et les types du catalogue pour conserver les nouveaux
   champs et charger le dictionnaire français.
2. Créer un service de résolution indépendant des transports et des règles de
   combat, réutilisable pour les différents DTO. Le français est la seule langue
   à gérer maintenant ; isoler le choix du catalogue pour faciliter l'ajout de
   langues plus tard, sans construire un système de traduction complet.
3. Résoudre les noms avec `displayNameKey`, les descriptions avec `descriptionKey`,
   puis remplacer toutes les occurrences des variables `{nomDuParametre}`.
4. Enrichir les réponses qui exposent les compétences au client avec les textes
   finaux et leurs clés. Examiner les DTO et leurs usages pour couvrir les
   compétences des pions et les compétences activables du joueur. Conserver les
   champs et contrats existants : notamment, ne pas transformer silencieusement
   un tableau d'identifiants en tableau d'objets.
5. Ajouter des tests ciblés et exécuter les contrôles appropriés du serveur.

Les deux sources actuellement utilisées dans `descriptionParams` sont :

- `pawn.implicitSkillParams.<champ>` : valeur effective du pion concerné ou de sa
  définition pour une fiche de recrutement. Une même compétence peut afficher
  des valeurs différentes pour deux pions ; ne pas mettre en cache une phrase
  uniquement par identifiant de compétence.
- `skill.<champ>` : valeur de l'entrée du catalogue, par exemple
  `skill.chargeBonusPercent`, `skill.freeWallDestructs` ou `skill.extraPawnSlots`.

Les sources sont des chemins de données contrôlés, jamais du code à évaluer.
Si un paramètre est absent, utiliser uniquement le défaut prévu par les règles
métier existantes ; sinon signaler l'erreur selon les conventions du serveur.
Ne pas convertir arbitrairement une valeur absente en zéro. Une clé inconnue ou
une variable non résolue doit être détectée, pas envoyée comme une phrase valide.

Un dictionnaire vide signifie que la description n'a pas de variable. C'est le
cas de `free-recruits` et `tactical-demolition`. Le champ `movementCost` de cette
dernière reste une donnée de gameplay, mais n'apparaît plus dans sa description.
Ne pas injecter automatiquement tous les coûts ou délais dans les textes.

## Informations à exposer au client

Adapter la forme aux DTO existants, en conservant au minimum le nom, la
description résolue et leurs clés. Exemple de résultat pour un pion dont le
bonus de puissance vaut 10 :

```json
{
  "id": "power-growth",
  "displayName": "Croissance de Puissance",
  "displayNameKey": "skills.power-growth.name",
  "description": "gagne 10 points de puissance par tour.",
  "descriptionKey": "skills.power-growth.description",
  "descriptionParams": {
    "powerBonusPerDecrement": 10
  }
}
```

Dans cet exemple de réponse, `descriptionParams` contient les **valeurs résolues**,
alors que dans le catalogue il contient les **chemins des sources**. Utiliser des
types distincts pour éviter la confusion. Ces valeurs peuvent accompagner la
réponse afin de permettre une résolution côté client plus tard ; le client
actuel doit pouvoir afficher directement `description`.

## Vérifications attendues

- `power-growth` pour deux pions avec des bonus différents donne deux phrases
  différentes, avec la même clé de traduction.
- Les charges 30 et 50 utilisent la valeur de leur entrée du catalogue.
- Les compétences activables utilisent leurs paramètres du catalogue.
- Une description sans variable est retournée telle quelle.
- Toutes les occurrences d'une variable répétée sont remplacées ; zéro reste
  une valeur valide lorsqu'il est explicitement fourni.
- Les clés et paramètres manquants sont traités explicitement.
- Les réponses existantes restent compatibles et les nouveaux champs sont
  effectivement présents dans la sérialisation des endpoints concernés.

Ne modifie pas le client Unity ni les règles de gameplay. Termine par un résumé
des endpoints/DTO enrichis, des tests exécutés et d'un exemple de réponse réelle.
