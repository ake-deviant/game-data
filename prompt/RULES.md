# Règles de travail du projet

## Fiabilité

1. Ne jamais présenter une supposition comme un fait.
2. Vérifier le code, les données et les contrats existants avant toute conclusion.
3. Signaler explicitement toute information manquante.
4. Demander validation avant toute décision structurante qui n'est pas déjà établie.
5. Ne pas exclure un concept d'une couche sans avoir vérifié son rôle métier, son usage et son contrat de production.

## Architecture

1. Respecter strictement la Clean Architecture et la programmation orientée objet demandées.
2. Maintenir quatre couches clairement séparées : Domain, Application, Infrastructure et Presentation.
3. React est un adaptateur externe ; il ne constitue pas la couche Presentation.
4. Le Domain ne dépend d'aucun framework, format de stockage ou détail technique.
5. L'Infrastructure implémente les accès techniques ; elle ne porte pas les règles métier.
6. Ne créer aucun placeholder artificiel comme `DOMAIN_LAYER`.
7. Chaque classe, interface ou fichier doit répondre à un besoin réel et identifié.
8. Les dépendances entre couches doivent toujours pointer vers l'intérieur.

## Données

1. Distinguer strictement le catalogue interne des données exportées pour la production du jeu.
2. La création ou la modification d'un élément du catalogue ne doit jamais l'injecter automatiquement en production.
3. Toute publication vers la production doit passer par un cas d'usage explicite, validé et protégé.
4. Un concept présent dans le contrat de production peut appartenir au Domain même si sa persistance actuelle est un fichier JSON.
5. Le JSON est un format d'entrée ou de sortie géré aux frontières ; il ne définit pas à lui seul le modèle métier.

## Modifications

1. Préserver l'existant pendant la migration sauf demande explicite contraire.
2. Ne pas importer, cloner ou copier un autre projet dans ce dépôt.
3. Lire les références externes uniquement sans les introduire dans le workspace.
4. Garder les changements limités au périmètre explicitement demandé.
5. Vérifier chaque modification avec les contrôles adaptés avant de la déclarer terminée.

## Communication

1. Répondre brièvement, en quelques lignes, sauf demande explicite de détail.
2. Avancer étape par étape et attendre la validation des choix structurants.
3. Exposer clairement les faits vérifiés, les incertitudes et les décisions à prendre.
4. Ne pas ajouter de complexité, de dépendance ou d'abstraction sans justification métier ou technique vérifiée.
