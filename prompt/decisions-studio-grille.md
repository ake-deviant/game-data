# Studio de grille — décisions encore ouvertes

Référence : [reponses-serveur-et-questions.md](reponses-serveur-et-questions.md).

Périmètre actuel : choisir un commandant, composer une grille de 7 lignes × 9 colonnes et produire un Player complet en JSON copiable depuis l’UI.

## 1. Limite des officiers et commandants

« Un seul exemplaire de officer/commander par grille » signifie-t-il :

- Un exemplaire de chaque modèle d’officier et de commandant ? OUI
- Ou au maximum un officier et un commandant dans toute la grille, tous modèles confondus ? NON

Décision :

## 2. Rang `general`

Le contrat serveur accepte aussi le rang `general`, mais son rôle métier n’est pas expliqué dans la réponse.

À préciser côté serveur : que représente ce rang, comment est-il créé et en quoi diffère-t-il de `commander` ?
ccc: ouiblie general pour le moment, ca n'existe pas !!! 

Décision ensuite : doit-il être proposé dans le studio dès cette première étape ? NON

Réponse serveur / décision :

## 3. Bornes de saisie et valeurs dérivées

Les bornes de saisie validées sont `power: 1..200` et `turnCount: 1..9`, avec des entiers uniquement. Certains états du moteur nécessitent toutefois :

- `turnCount: null` pour un soldat libre ; ccc: pour un pion non attack !!
- `power: 0` pour les membres `second` et `third` d’un groupe ;
- `turnCount: 0` pour une attaque prête. turncount > 0 pour les attacks pour notre génération de grille, donc au moins 1

Ces valeurs doivent-elles être calculées et non éditables selon le statut et le rôle ?
Comment ca calculés ?? non je veux pouvoir choisir depuis l'UI le turncount et power !!!! il peut etre différent de power de base du pion !!! idem pour turncount, je choisis moi meme !!!!!!!!

 L’état d’attaque prête doit-il être accessible maintenant ou réservé à l’édition avancée ?
 maintenant

Décision :

## 4. Données des pions dans l’export

Que signifie exactement « pour le moment on ne sauvegarde pas les data de pions » ?

Le contrat Player contient les caractéristiques de chaque pion placé, pas seulement sa référence `templateId`. Le serveur ne recharge pas automatiquement toutes ces caractéristiques depuis le modèle.

Confirmer si l’intention est de ne pas créer de stockage supplémentaire ni de copie figée du catalogue, tout en incluant les caractéristiques nécessaires dans le JSON Player copiable. Sinon, préciser les champs attendus et l’adaptation nécessaire du contrat.

Ma demande est simple, on retourne le json de grid dans l'UI, JE veux pas de déploiement ou de sauvegarde dans le studio !!

Décision :

## 5. Construction des compétences à l’export

Le serveur ne reconstruit pas ces ensembles au chargement :

- `skills` : identifiants des compétences du pion ;
- `implicitSkillParams` : paramètres numériques des compétences ;
- `registeredPawnSkills` : effets enregistrés sur le Player avec leur `sourcePawnId`.

À préciser côté serveur : fournir la correspondance complète entre paramètres implicites et compétences, ainsi que les règles de création des entrées du registre.

Décision à valider : le studio doit-il construire automatiquement ces ensembles à partir des modèles et des pions placés, puis maintenir le registre lors des ajouts et suppressions ? Quel comportement adopter si une compétence explicite est aussi dérivée d’un paramètre implicite, puisque le serveur concatène actuellement les listes sans dédoublonnage ?

Réponse serveur / décision :

Je comprends pas grand chose de ce que tu me racontes !!! juste au moment de générer la grille, tu fais en sorte que le studio ajoute ces valeurs selon le modele, en quoi c'est compliqué !!! ne viens pas compliquer les choses, ma demande est simple

## 6. Sens de « sans trous » et comportement de l’éditeur

La règle interdisant les trous est confirmée, mais sa définition et son application dans l’UI restent à préciser.

- Les cases vides au-dessus d’une pile et les colonnes entièrement vides sont-elles autorisées ? La règle signifie-t-elle que chaque pile doit reposer sur le bas de la grille ?
- Comment traiter les espaces sous une partie d’un commandant `2x2` ?
- Après un placement, déplacement ou une suppression, faut-il refuser l’action, compacter automatiquement les pions, ou autoriser temporairement une grille invalide et bloquer seulement l’export ?
- Si un compactage est souhaité, comment déplacer les pions multi-cellules et les groupes d’attaque indivisibles ? La règle exacte doit être fournie avant de reproduire une gravité dans le studio.

Décision : oublie l'histoire de trous, pas de vérif coté studio pour les trous !!! 

## 7. Réutilisation d’un Player — étape ultérieure

Si le même Player est utilisé des deux côtés d’une future Game, faut-il renouveler les identifiants de la seconde copie et mettre à jour `attackGroupId` et `sourcePawnId` ?

Ce point ne bloque pas le périmètre actuel : chaque exemplaire créé dans le studio reçoit déjà un identifiant unique. Il sera à trancher lors de la composition d’une Game.

Décision ultérieure : C'est pas ton probleme
