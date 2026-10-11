# Ajouter une skill Player de fusion melee dans 3.game-data

## Objectif et périmètre

Ce document est destiné à l'agent travaillant dans `C:/WORKSPACE/1.SBA/3.game-data`.
Lire les instructions applicables de ce dépôt avant toute modification.

Ajouter au catalogue une compétence **activable de Player** permettant au serveur
d'autoriser la fusion des attacks basiques melee de couleurs différentes.
La compétence doit pouvoir être attribuée aux commanders par les outils existants.
L'implémentation de son effet et sa persistance dans le Player relèvent du dépôt
`2.server-game-node`, pas de cette tâche dans game-data.

## Règles métier établies

- Une attack basique est un groupe de trois pions.
- Sans skill, les attacks de même couleur fusionnent dans la même column,
  qu'elles soient melee ou ranged.
- La nouvelle skill ajoute la possibilité de fusionner deux attacks melee
  de couleurs différentes. Elle conserve la règle de base.
- Elle n'autorise ni deux attacks ranged de couleurs différentes, ni une fusion
  entre une attack melee et une attack ranged de couleurs différentes.
- La détection reste déclenchée à la formation d'une nouvelle attack dans la cascade.
  L'activation de la skill n'est pas une demande de fusion immédiate des attacks présentes.
- Les fusions donnent 3 SP en melee et 2 SP en ranged. Ces gains sont gérés par le serveur,
  indépendamment du coût d'activation de la skill.
- Le compteur `fusionCount` vaut compteur A + compteur B + 1 après fusion.
  Ce mécanisme existe déjà côté serveur et ne nécessite aucun ajout dans le catalogue.

## Paramètres à établir avant de finaliser l'entrée

Les informations suivantes n'ont pas été fixées dans la demande utilisateur :

- identifiant stable de la skill et nom affiché ;
- `visualKey` correspondant à l'asset client ;
- coût en SP, seuil d'influence et éventuel coût en mouvements ;
- disponibilité par commander ;
- caractère permanent ou durée de l'effet, et éventuel délai de réactivation.

Chercher d'abord ces décisions dans la documentation et les données actuelles de game-data.
Si elles ne sont pas définies, les demander au créateur du jeu ; ne pas inventer des
valeurs d'équilibrage et ne pas enregistrer de placeholders dans les données de production.
Communiquer l'identifiant retenu à l'agent serveur : son handler sera enregistré sous cet ID exact.

Attention : côté serveur, `skillDelay` est un délai de **réactivation**, pas une durée d'effet.
Si l'effet est confirmé permanent, le modèle existant utilise `skillDelay: null`
et `delayIllimited: true`. Un effet temporaire exigerait également un mécanisme serveur
d'expiration, qui n'est pas implémenté par ces seuls champs.

## Changements attendus dans game-data

1. Ajouter une entrée dans `data/skills.json`, tableau `activablePlayerSkills`.
   Ne pas l'ajouter dans `pawnSkillVisuals` : c'est une skill Player.
2. Respecter le schéma de `studio/src/infrastructure/json/JsonSkillCatalogRepository.ts` :
   `id`, `displayName`, `visualKey`, `skillPointCost`, `skillDelay`,
   `requiredInfluencePoints`, `displayNameKey`, `descriptionKey`, `descriptionParams` ;
   renseigner `movementCost` et `delayIllimited` selon les décisions établies.
3. Ajouter les traductions correspondantes dans `data/locales/*.json`, en suivant
   `data/locales/README.md`. Garder `displayName` cohérent avec le nom français.
   Utiliser `descriptionParams: {}` si le texte ne comporte aucun paramètre variable.
4. Lorsque les commanders concernés sont définis, ajouter l'ID à leur `baseStats.skills`.
   Utiliser la source de catalogue et le flux d'export actuels pour ne pas perdre
   l'attribution au prochain export. Ne pas placer cette skill dans `innateSkills` :
   la demande porte sur une activation par le joueur.
5. Vérifier que la compétence apparaît dans les sélecteurs de skills Player des éditeurs.
   Ils lisent déjà `activablePlayerSkills` ; éviter une liste supplémentaire codée en dur.

Texte de description proposé, à adapter au vocabulaire éditorial du projet :
« Permet aux attacks basiques melee de couleurs différentes de fusionner dans la même column. »

## Fonctionnement actuel vérifié

Lors de l'analyse, `data/skills.json` était un catalogue lu par les éditeurs.
`JsonSkillCatalogRepository` expose une lecture `findAll()` ; aucun générateur de ce
fichier n'a été identifié dans les flux examinés. Vérifier l'état actuel du dépôt avant
de modifier le fichier directement si un nouvel outil d'édition a été ajouté depuis.

Le flux `GitProductionGameDataProposalGateway.create()` publie `data/commanders.json`
et le catalogue interne du Studio. Il ne faut pas supposer qu'il publie également
les changements de `skills.json` et des traductions : vérifier leur inclusion dans
la livraison finale de game-data.

Le package distribue déjà `data/skills.json` et `data/locales/*.json` via son champ `files`.
Une modification dans le dépôt voisin n'actualise pas automatiquement le package
`game-data` installé dans le serveur.

## Coordination avec le serveur

Aucun champ JSON décrivant une fonction ou une stratégie exécutable n'est nécessaire
pour cette première skill. Le système actuel associe un ID de skill à un handler serveur.
`tactical-demolition` constitue un exemple : son handler change une règle du Player.

Les briques de fusion disponibles dans le serveur sont :

- `sameColorAttackFusion` : règle de base ;
- `meleeAttackFusion` : autorisation melee indépendamment de la couleur ;
- `anyAttackFusionStrategy` : composition des règles ;
- `AttackFusionService` : sélection du groupe compatible et exécution de la fusion.

L'agent serveur devra encore ajouter un handler, conserver les règles actives sur le Player,
les sauvegarder/restaurer et transmettre leur composition à la cascade.
Ajouter l'entrée au catalogue ne suffit pas à activer l'effet : sans handler enregistré,
`ActivateSkillUseCase` retourne `SKILL_HANDLER_NOT_REGISTERED`.
L'ID doit aussi appartenir à `baseStats.skills` du commander pour être activable.

Ne pas créer maintenant la future skill de fusion ranged entre couleurs différentes.
La composition serveur permettra de l'ajouter séparément sans supprimer l'extension melee.

## Validation et livraison attendues

- Exécuter `npm.cmd run validate:data` à la racine de game-data pour vérifier le catalogue,
  les références des commanders et les traductions.
- Exécuter les contrôles de types/build pertinents si du code d'éditeur est modifié.
- Fournir l'entrée JSON finale, les clés de traduction et les commanders associés.
- Signaler les décisions métier encore manquantes et les validations non exécutées.
- Indiquer comment le package actualisé devra être consommé par le serveur.
  Ne pas publier, pousser ou mettre à jour un autre dépôt sans autorisation correspondante.

Le contrat Unity existant `attackFusionOperations`, ses gains SP et son champ `fusionCount`
ne changent pas avec cette nouvelle entrée de catalogue.
