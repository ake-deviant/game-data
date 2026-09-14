# Grilles et Player : réponses du serveur et questions à valider

Analyse du 14 septembre 2026. Les numéros reprennent les questions transmises au serveur sur les grilles et le Player.

**Objectif validé :** le studio doit permettre de choisir un commandant, de composer sa grille et de produire un Player complet en JSON copiable depuis l’UI. Les remarques du concepteur sont intégrées ci-dessous ; les dernières ambiguïtés sont regroupées à la fin pour être clarifiées avec l’agent de game-data.

**Périmètre confirmé par le concepteur :** le studio est indépendant et doit, dans un premier temps, permettre de créer un Player avant de composer une Game complète. Le chargement actuel du serveur par Game complète est un point maîtrisé, qui ne constitue pas un obstacle à cette première étape du studio. Les descriptions du contrat de restauration ci-dessous servent uniquement de référence technique.

Périmètre : création indépendante d’un Player dans le studio, en prenant le contrat du jeu local comme référence. La composition d’une Game, son chargement et le déclenchement du tutoriel viendront ensuite. Le serveur et le studio n’ont pas à connaître les transformations d’affichage propres au client Unity. Les modes scénario et online sont hors périmètre.

Les comportements du serveur décrivent l’existant. Les mentions **Décision studio** reprennent les choix du concepteur, qui peuvent être plus restrictifs que le validateur serveur. Les points encore ouverts ne constituent pas des décisions métier.

## Référence au modèle source — questions 1 à 3

1. **Oui**, `templateId?: string` est accepté pour les trois rangs, copié à la reconstruction et exporté à la sauvegarde. Aucun changement du contrat de lecture/sauvegarde n'est nécessaire pour l'ajouter aux soldats. En revanche, la génération et le recrutement de soldats ne le renseignent pas. La transformation en groupe d’attaque recrée les trois membres sans recopier `templateId` : sa conservation pendant le jeu nécessiterait aussi de traiter cette transformation. Exemple accepté : `"templateId": "soldier-source-id"`, sans vérification de l'existence de cet ID.
2. Les champs enregistrés dans chaque pion sont conservés à la reconstruction : puissance, compteur, type, rang, compétences, paramètres implicites, références, etc. Les valeurs par défaut de rang et de visuel peuvent être ajoutées lors de la sérialisation. En revanche, la restauration du Player recharge depuis le commandant : `maxPawns`, `maxHealth`, puissances et compteurs par couleur, `nonePower`, défense, visuels/armes/types par couleur, `freeRecruitThreshold`, `skillsByColor`, `powerBonusPerDecrementByColor`. Les compétences innées sont réactivées. **Décision studio :** il n’est pas demandé de figer les données du catalogue pour garantir un tutoriel identique après modification. Le concepteur prévoit des pions spéciaux pour les tutoriels, distincts des pions de production. Sa remarque « pour le moment on ne sauvegarde pas les data de pions » doit encore être précisée concernant les champs à inclure dans le Player exporté ; elle ne remplace pas à elle seule le contrat JSON décrit ici.
3. Le catalogue brut `soldierPawns` accepté contient exactement un soldat par couleur. Mais le serveur transforme cette liste en tables par couleur et ne conserve pas les IDs des soldats dans ces tables. Aucun remappage automatique n'est effectué à la restauration. **Déduction :** une recherche dans une version connue du catalogue brut peut identifier le modèle de cette version ; `commanderId` + couleur + type ne prouve pas l'origine historique d'un ancien pion. La gestion historique des anciens modèles n’est pas une exigence de cette première étape du studio.

## Priorité 1 — Contrat de grille et placement

### Coordonnées — questions 1 à 4

1. `x = col`, `y = row`, indexés à zéro. Origine en haut à gauche ; `col` augmente vers la droite et `row` vers le bas. La matrice interne est `pawns[col][row]`.

   ```text
                col →
             0     1     2
   row 0   (0,0) (1,0) (2,0)  haut
    ↓  1   (0,1) (1,1) (2,1)
       2   (0,2) (1,2) (2,2)  bas
   ```

2. Le même repère de données s’applique aux deux Players sans inversion dépendant du joueur. **Décision studio :** aucune connaissance de la rotation, de la mise en miroir ou de l’affichage Unity n’est requise. Le studio utilise les coordonnées logiques du serveur.
3. Oui : dans le traitement vertical, `captain` correspond au plus grand `row`, pour les deux joueurs.
4. **Décision studio :** créer uniquement des grilles de **7 rows × 9 cols** pour le moment. Le serveur accepte à la restauration des dimensions entières strictement positives et des cases vides ; cette permissivité n’élargit pas les dimensions proposées par le studio. La règle studio concernant les trous est précisée au point 8.

### Empreintes — questions 5 à 10

5. Soldat ordinaire : `1x1`. Officier : `1x2`, une column et deux rows. Commandant : `2x2`. Le validateur impose ces empreintes aux deux derniers rangs, sans rotation ni changement selon le statut. Le rang `general` existe aussi dans le contrat serveur ; le concepteur demande une explication de son rôle avant toute décision sur sa présence dans le studio.
6. Oui : officier `(x,y)`, `(x,y+1)` ; commandant ajoute `(x+1,y)`, `(x+1,y+1)`. L'ancre est le minimum de row, puis de col.
7. Pour `officer` et `commander`, exporter `footprint` et toutes les `occupiedCells`, avec objets `{ "col": 0, "row": 0 }`. Leur ordre n'est pas imposé par la validation. Le serveur **rejette** une ancre ou un rectangle incohérent ; il ne répare pas le fichier. Pour un soldat, `footprint` et `occupiedCells` peuvent être absents ; une éventuelle cellule doit correspondre à `(x,y)`. La sauvegarde omet l'empreinte `1x1`, tandis que le mapper d'affichage l'explicite.
8. **Décision studio :** ne pas laisser de trous dans la grille et interdire tout dépassement de `pawnMax`. Les chevauchements et dépassements des limites de la grille sont invalides. Le validateur serveur contrôle notamment les coordonnées, IDs et empreintes, mais ne suffit pas à faire respecter ces contraintes supplémentaires du studio.
9. `pawnMax` devient `Player.maxPawns`. Le calcul est `maxPawns - somme(countPawns des pions uniques)`, avec valeur par défaut 1 ; ce n’est ni le nombre de cases, ni nécessairement le nombre d’exemplaires. Le serveur limite les nouveaux placements à un exemplaire par modèle et rang. **Décision studio exprimée :** « un seul exemplaire de officer/commander par grille ». La portée exacte de cette limite — par modèle ou par rang — reste à préciser avec game-data ; ne pas la déduire de la règle serveur.
10. **Décision studio :** choisir d’abord un commandant, puis proposer tous les pions de ce commandant à insérer dans la grille. Le concepteur indique qu’il y a actuellement deux commandants. La palette est donc déterminée par le commandant choisi. Le serveur impose aussi cette appartenance lors des nouveaux placements, même si sa restauration ne la contrôle pas.

### Identité — questions 11 à 13

11. Un UUID est accepté comme string non vide, sans préfixe imposé. Les doublons sont rejetés **dans chaque grille**. La restauration ne vérifie pas l'unicité entre les deux Players ; cela ne prouve pas que des IDs partagés sont souhaitables dans toute la partie. La consigne du concepteur impose déjà un ID unique par exemplaire : produire de nouveaux UUID à chaque duplication respecte cette intention.
12. Le recrutement continue à produire `${player.id}-${player.nextPawnId++}`. Le compteur reste donc nécessaire avec des UUID. La restauration exige seulement `nextPawnId >= 1`, sans recherche de collisions. **Déduction :** si aucun ID n'utilise ce préfixe numérique, 1 ne heurte pas les UUID existants ; s'il en existe, choisir un compteur supérieur à tous leurs suffixes utilisés. Ce calcul n'est pas fourni par le serveur.
13. La restauration serveur conserve `playerId`, les IDs des pions, `attackGroupId` et `sourcePawnId`. Pour le studio, chaque exemplaire créé doit avoir son ID unique. La réutilisation future du même Player des deux côtés d’une Game soulève une question distincte de renouvellement des IDs et de leurs références ; elle n’empêche pas la création du Player seul.

## Priorité 2 — Initialiser et modifier les pions

1. **Décision studio :** les officiers et commandants sont toujours en `attack`. Ne pas proposer `selected`, ni `cross` pour le moment. Un soldat libre est en `none` dans le moteur ; les groupes d’attaque sont décrits plus bas. Le serveur accepte aussi `defense` pour les murs. L’édition avancée des murs n’est pas décidée par ces remarques.
2. Pour tous : `id`, `color`, `status`, `turnCount`, `power`, `x`, `y` sont requis par `PawnData`. Les autres champs sont optionnels, sous les contraintes d'empreinte décrites plus haut. Les multi-cellules doivent avoir un rang élevé et ne doivent contenir **ni `pawnRole`, ni `attackGroupId`**, même `pawnRole: "none"`. Il n'existe pas de validation exhaustive des combinaisons par statut. L'absence et `null` ne sont pas interchangeables : `turnCount` accepte `null`, mais son absence échoue ; `templateId: null`, `rank: null` ou `skills: null` échouent. Les types n'autorisent pas `null` pour les autres champs optionnels.
3. Soldat en `none` : puissance issue de `nonePowerByColor`, compteur `null`. Le serveur dérive cette puissance de `soldierPawns[].nonePower`. Au match vertical, la puissance du capitaine vient de `attackPowerByColor` et le compteur des trois membres de `attackTurnCountByColor`, sans addition des puissances des soldats libres. Officier/commandant : `power` et `turnCount` du modèle, directement.
4. **Décision studio :** les valeurs saisies de `power` sont des entiers de **1 à 200**, et celles de `turnCount` des entiers de **1 à 9**, sans décimales. Le serveur accepte plus largement une puissance finie ≥ 0 et un compteur entier ≥ 0 ou `null`, et conserve les valeurs à la reconstruction. **Point à clarifier :** les soldats libres utilisent `turnCount: null`, les membres `second/third` ont une puissance de 0 à la formation, et un compteur d’attaque peut atteindre 0. L’application des bornes de saisie à ces champs dérivés ou états avancés reste à préciser ; ne pas remplacer ces valeurs automatiquement.
5. `countPawns` est le poids utilisé pour calculer la capacité disponible. `moveCount` est notamment le coût en mouvements pris dans le modèle lors du placement d’un officier/commandant ; ce n’est pas un compteur de mouvements déjà effectués. **Décision studio :** ces deux valeurs restent issues du modèle et ne sont pas éditables. Le déplacement en jeu débite 1 mouvement, sans utiliser `pawn.moveCount`.
6. Pour officier/commandant, le serveur concatène les compétences explicites du modèle et celles dérivées de ses paramètres implicites, **sans dédoublonnage**. Les paramètres positifs ajoutent notamment `power-growth`, `sp-growth`, `gain-FWD-on-decrement` et les autres IDs correspondant aux paramètres implicites. Pour un groupe de soldats, le capitaine reçoit `player.skillsByColor[color]` et éventuellement `powerBonusPerDecrement`; les deux autres membres n'en reçoivent pas dans cette transformation. Les compétences innées du commandant sont activées sur Player séparément.
7. La lecture ne reconstruit ni `skills`, ni `implicitSkillParams`, ni `registeredPawnSkills`. Les deux premiers sont copiés s'ils existent ; le troisième est repris ou vaut `[]`. Pour les compétences de liaison, le serveur ajoute une entrée si `spBonusPerLiaison > 0`; le traitement des liaisons additionne les entrées enregistrées. Une entrée dupliquée double donc sa contribution. Un registre vide omet cette contribution même si le pion porte le paramètre.

Exemples **minimaux acceptés par la validation de grille**, à insérer séparément dans une grille assez grande. Les valeurs numériques illustrent le contrat et ne sont pas des statistiques officielles du catalogue. Les factories de jeu produisent aussi les visuels, armes, coûts et références du modèle.

```json
[
  { "id": "troop-example", "rank": "troop", "color": "red", "status": "none", "x": 0, "y": 0, "power": 1, "turnCount": null },
  { "id": "officer-example", "rank": "officer", "color": "red", "status": "attack", "x": 0, "y": 0, "power": 10, "turnCount": 2, "footprint": "1x2", "occupiedCells": [{ "col": 0, "row": 0 }, { "col": 0, "row": 1 }] },
  { "id": "commander-example", "rank": "commander", "color": "red", "status": "attack", "x": 0, "y": 0, "power": 20, "turnCount": 3, "footprint": "2x2", "occupiedCells": [{ "col": 0, "row": 0 }, { "col": 1, "row": 0 }, { "col": 0, "row": 1 }, { "col": 1, "row": 1 }] }
]
```

## Priorité 3 — Exporter un Player complet

1. Le contrat sauvegardé est un état de Player, dont la structure est illustrée ci-dessous ; le serveur le sérialise puis reconstruit le Player et sa grille à la lecture. Ce n'est pas la sérialisation directe de l'entité `Player`, qui comporte davantage de caractéristiques. La sauvegarde d’exemple analysée contient tous les champs du contrat de Player sauvegardé, mais ses grilles échouent à la validation actuelle : voir contrôles. Le mapper destiné à l'affichage n'exporte notamment pas les `skills`/paramètres des pions ; ne pas le prendre comme contrat de sauvegarde.
2. **Décision studio :** produire d’abord un Player complet indépendant, en JSON copiable depuis l’UI. La composition d’une Game et sa restauration ne sont pas des prérequis à cette étape. Le format serveur de restauration d’une Game complète est connu et maîtrisé ; aucune évolution de ce chargement n’est demandée ici.
3. Au démarrage local, `healthPoints = commander.baseStats.health`, les deux valeurs de mouvements viennent de `movementsPerTurn`, et `skillPoints = influencePoints = 0` par défaut du constructeur. La restauration utilise les valeurs enregistrées pour ces ressources/mouvements, mais recharge `maxHealth` depuis le catalogue. Les limites métier de personnalisation ne sont pas exhaustivement validées : le contrôle Player se limite notamment à santé ≥ 0, mouvements par tour ≥ 1 et compteur d'ID ≥ 1, sans validateur JSON complet.
4. Avant compétences innées : `freeWallDestructs = 0`, `pendingFreeWallDestructs = 0`, `skillCooldowns = {}`, `firstBloodScored = false`. Le schéma des cooldowns est `Record<string, number>`, clé = ID de compétence : par exemple `{ "skill-example": 2 }` pour deux tours restants ; `-1` signifie activation permanente. Les cooldowns positifs décrémentent au nouveau tour. Attention : les compétences innées sont réappliquées après construction ; la compétence de destruction gratuite des murs peut, par exemple, fixer `freeWallDestructs` à 4.
5. Non, le registre n'est pas reconstruit. Son entrée actuellement produite est illustrée ci-dessous. Lors d'une duplication, sa référence doit suivre le nouvel ID ; lors d'une suppression, le serveur supprime les entrées liées à l'ancien ID. L'enregistrement n'est pas idempotent : reconstruire un registre doit éviter de réajouter les entrées déjà présentes. La construction de ce registre dans l’export reste à clarifier avec game-data.

   ```json
   {
     "skillId": "increase-SP-by-attack-linked-when-preparing",
     "triggerMoment": "onLiaisonFormed",
     "params": { "spBonusPerLiaison": 2 },
     "sourcePawnId": "officer-example"
   }
   ```

6. `metricsProgress` est optionnel. Son absence initialise les valeurs suivantes : phase `movement`, deux ensembles de variations à zéro pour santé, mouvements restants, SP, IP et les deux compteurs de destruction gratuite. Un objet fourni est conservé ; il n'est pas automatiquement remis à zéro. Le contrat des phases est `movement | turnEnd | setupAttack | attack | newTurn`.
7. La reconstruction serveur de la grille ne lance aucune mécanique ; la restauration ne lance ni gravité ni matchs, mais réactive les compétences innées du commandant. **Décision studio :** le rendu initial en jeu et le moment de déclenchement du tutoriel sont hors périmètre. Le résultat attendu à cette étape est le Player complet en JSON copiable.
8. **Décision studio :** prévoir des tests sur le schéma du JSON de Player copiable. Le validateur serveur de grille ne vérifie pas tout le Player ni les relations de groupe ou de compétences ; sa seule acceptation ne suffit donc pas à tester le contrat complet de sortie. Aucun endpoint serveur de validation n’est requis par cette décision.
9. **Décision studio :** aucun emplacement de stockage ou de distribution des grilles dans le package n’est demandé pour le moment. Le livrable est un Player en JSON copiable depuis l’UI ; aucune enveloppe de Game n’est à ajouter à cet export.
10. **Décision studio :** les tests portent sur le schéma de sortie copiable. Le parcours est de choisir un commandant puis d’accéder à tous ses pions ; aucune sélection de fixtures officielles ou correction de l’ancienne sauvegarde n’est demandée. Les exemples ci-dessous illustrent la structure serveur, sans constituer des valeurs par défaut de catalogue ni une validation complète des règles du studio.

Exemple minimal conforme à la **structure du Player sauvegardé**. `commanderId` doit être remplacé par un ID réellement chargé dans le catalogue pour une restauration ; les nombres ne sont pas des valeurs officielles. Cet exemple illustre le contrat serveur ; le studio doit appliquer en plus ses règles de composition.

```json
{
  "playerId": "studio-player-1",
  "commanderId": "ID_EXISTANT_DU_CATALOGUE",
  "grid": { "rows": 7, "cols": 9, "pawns": [] },
  "healthPoints": 100,
  "skillPoints": 0,
  "influencePoints": 0,
  "movementsRemaining": 3,
  "movementsPerTurn": 3,
  "nextPawnId": 1
}
```

## Groupes et situations avancées — questions 1 à 6

1. Le traitement serveur des cascades applique la gravité puis détecte et transforme les matchs, en boucle. La reconstruction seule laisse trois soldats alignés en `none` inchangés. **Décision studio :** le déclenchement pédagogique de cette transformation dans le jeu n’est pas à traiter pour produire le Player JSON.
2. Le détecteur exige des pions `none`, `1x1`, de même couleur ; il ne compare ni type, ni modèle, ni explicitement rang `troop`. Avec 4, 5 ou 6 pions verticaux consécutifs, il choisit **les trois plus bas par passe**. Les autres restent disponibles pour les passes suivantes. Pour 6, une nouvelle formation peut suivre ; si son type est `melee`, le traitement de fusion melee peut fusionner les groupes de cette column. Les pions déjà `attack/cross` ne font pas partie du match et interrompent l'alignement détecté. Le type du groupe créé est repris depuis Player par couleur.
3. Oui, pour les groupes produits par la transformation des matchs, `attackGroupId` est l'ID du capitaine sur les trois membres. `third` en haut, `second` au milieu, `captain` en bas ; même couleur, statut `attack` ou `cross` dans le moteur, type du Player par couleur, même compteur initial. **Décision studio :** utiliser `attack`, puisque `cross` n’est pas proposé pour le moment. Puissance initiale 0 sur `third/second`, puissance d'attaque par couleur sur le capitaine ; celle-ci peut ensuite évoluer, notamment par fusion. Ces relations ne sont pas vérifiées par le validateur de grille.
4. **Décision studio :** une attaque de trois `troop` est **indivisible**. Déplacer ou supprimer un membre doit agir sur le groupe entier. Conserver les trois membres, leurs rôles, leur position relative et leur référence de groupe lors du déplacement ; supprimer les trois lors d’une suppression du groupe. Le studio ne doit pas produire un groupe incomplet à la suite de ces actions.
5. Les officiers/commandants apparaissent directement en `attack` et constituent chacun un objet multi-cellules, sans `pawnRole`/`attackGroupId`. Le serveur reconnaît comme leaders d’attaque les capitaines et ces pions. Les liaisons de préparation regroupent les leaders `attack/cross` de même couleur et même `turnCount` non nul au sens `!== null`, à partir d'au moins deux leaders. Ces relations sont calculées depuis la grille ; aucun `liaisonId` persistant n'est requis dans les données d’un pion. Les bonus de puissance d'attaque ont leur calcul propre pour `turnCount === 0`.
6. Les murs sont des pions dans `grid.pawns`, `status: "defense"`, rang `troop`, une cellule. `defenseLevel` indique le niveau ; les créations ordinaires de niveau 1 prennent `player.defensePowerPerLevel`, puis les augmentations calculent `defenseLevel * defensePowerPerLevel`. Le visuel est résolu depuis `wallVisualSet`. Exemple structurel : `{ "id": "wall-example", "rank": "troop", "color": "red", "status": "defense", "x": 0, "y": 6, "turnCount": null, "power": 5, "defenseLevel": 1 }`. La valeur 5 est illustrative.

## Points restant à clarifier avec l’agent de game-data

Les remarques du concepteur sont intégrées aux réponses précédentes. Les points suivants conservent les ambiguïtés sans choisir de règle à sa place.

1. **Limite d’officiers et commandants :** « un seul exemplaire de officer/commander par grille » signifie-t-il un exemplaire de chaque modèle, ou au maximum un officier et un commandant, tous modèles confondus ?
2. **Rang `general` :** expliquer au concepteur ce que représente ce rang avant de décider s’il doit apparaître dans le studio. Son existence dans le contrat serveur ne suffit pas à définir son usage métier.
3. **Compétences à exporter :** `skills` contient les identifiants des compétences du pion ; `implicitSkillParams` leurs paramètres numériques ; `registeredPawnSkills` contient les effets enregistrés au niveau du Player avec l’ID du pion source. Le serveur ne reconstruit pas ces ensembles au chargement. Préciser comment game-data les produit dans le JSON final, sans entrée oubliée ou dupliquée.
4. **Bornes de saisie et valeurs dérivées :** préciser comment appliquer `power: 1..200` et `turnCount: 1..9` aux soldats libres (`turnCount: null`), aux membres `second/third` (puissance 0) et aux attaques prêtes (compteur 0). Les bornes de saisie sont validées ; le traitement de ces cas particuliers ne l’est pas.
5. **Données des pions dans le JSON :** le concepteur ne souhaite pas figer les données du catalogue et prévoit des pions distincts pour les tutoriels. Préciser le sens de « on ne sauvegarde pas les data de pions » pour l’export : le contrat serveur décrit ici contient les caractéristiques des pions, pas seulement leurs références. La composition d’un Player complet reste l’objectif.
6. **Identité lors d’une réutilisation future :** si un même Player est utilisé deux fois dans une Game, faut-il créer de nouveaux IDs pour la seconde copie et mettre à jour `attackGroupId` et `sourcePawnId` ? Ce point concerne l’assemblage ultérieur ; pour la création actuelle, chaque exemplaire placé possède déjà un ID unique.

## Contrôles de l’analyse serveur et limites

- Contrôles effectués lors de l’analyse serveur initiale, avant intégration des remarques du concepteur ; ils ne valident pas une implémentation du studio.
- `npx.cmd tsc --noEmit` : réussi. La variante `npx` était bloquée par la politique PowerShell ; l'exécutable `.cmd` a permis le contrôle sans changer cette politique.
- `npx.cmd jest --runInBand` : **3 suites, 3 tests réussis**. Cela ne constitue pas une couverture du contrat d'import/export.
- Appel direct, en lecture seule, du validateur de grille sur les deux Players de la sauvegarde d’exemple analysée : rejet du Player 1 pour `Duplicate pawn id 1-1003`, du Player 2 pour `Duplicate pawn id local-player-2-1068`. Le validateur s'arrête à la première erreur ; ces messages ne recensent pas toutes les incohérences du fichier.
- Les types et les traitements de production et de consommation des données ont été examinés. Pas de lancement Unity, pas de test d'intégration `startScene`, pas de test complet de restauration/sauvegarde exécuté, pas d'analyse du mode scénario/online.
- Ce document est le seul fichier créé pour cette demande. Aucune implémentation ni correction des données existantes n'a été effectuée.
