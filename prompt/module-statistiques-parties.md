# Consigne pour le studio : module Statistiques des parties

## Objectif

Dans le projet `3.game-data`, ajouter au Game Data Studio un module web
« Statistiques » pour consulter les parties enregistrées par le serveur de jeu
et comparer les performances de deux bots, notamment `heuristic-v1` et
`heuristic-v2`.

Le serveur expose déjà les endpoints décrits ci-dessous. Le studio doit les
consommer en HTTP. Les résultats restent dans MongoDB côté serveur et ne font
pas partie des exports JSON ni du package npm de données de jeu.

## Intégration dans l'architecture existante du studio

Le studio concerné est `studio/apps/web-react`, avec ses couches sous
`studio/src`. La navigation actuelle est dans `src/ui/App.tsx` et les adaptateurs
HTTP dans `src/adapters` de l'application React.

Reprendre le fonctionnement existant : port de lecture et cas d'usage dans la
couche application, controller/presenter et modèles de vue dans la présentation,
adaptateur HTTP et composition dans l'application React. Ajouter les vues React
du module à la navigation. Respecter les consignes propres au dépôt du studio.

Configurer l'adresse du serveur pour pouvoir consulter l'environnement local
ou Railway. Le serveur local tourne directement avec Node.js sur
`http://localhost:3000` ; MongoDB seul tourne dans Docker. Le studio n'a pas à
connaître l'adresse de MongoDB.

Pour le développement local, ajouter un proxy ciblé dans le `vite.config.ts`
existant, en conservant les plugins et les autres routes API du studio :

```ts
server: {
  host: '127.0.0.1',
  port: 5174,
  proxy: {
    '/api/game-stats': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

Le `target` doit être configurable pour viser Railway. L'adaptateur du studio
peut alors utiliser `fetch('/api/game-stats?...')`. Ne pas rediriger tout `/api`,
car les catalogues, grilles et exports sont déjà servis par le studio lui-même.
Si le studio est déployé ailleurs que sous Vite en développement, prévoir le
proxy correspondant dans son hébergement ; un build statique ne fournit pas ce
serveur de développement.

## 1. Liste des parties et filtres

```http
GET /api/game-stats?page=1&pageSize=50
GET /api/game-stats?mode=bot-vs-bot
GET /api/game-stats?mode=human-vs-bot
GET /api/game-stats?mode=online
GET /api/game-stats?mode=local
```

| Paramètre | Contrat |
| --- | --- |
| `page` | Entier positif ; défaut `1` |
| `pageSize` | Entier de `1` à `100` ; défaut `50` |
| `mode` | Optionnel ; valeurs ci-dessous |
| `status` | Optionnel : `in-progress`, `finished`, `interrupted` |
| `botA`, `botB` | Optionnels, mais fournis ensemble ; identifiants distincts |

| Libellé UI | Valeur `mode` |
| --- | --- |
| Tous les modes | Omettre le paramètre |
| IA contre IA | `bot-vs-bot` |
| Humain contre IA | `human-vs-bot` |
| Humains en ligne | `online` |
| Humains en local | `local` |
| Tutoriel | `tutorial` |
| Partie restaurée | `restored` |
| Mode inconnu | `unknown` |

Sans filtre, tous les modes et statuts sont inclus. Ne pas reclasser les parties
`unknown` ou `restored` en parties humaines ou bots par supposition.

Réponse :

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "pageSize": 50,
    "totalPages": 0
  }
}
```

`items` contient les parties de la page courante. Le tri est `startedAt`
décroissant, puis `gameId` croissant. Une page hors limites retourne une liste
vide avec le total réel. Au changement de filtre, revenir à la première page.
Utiliser `URLSearchParams` pour construire les requêtes. Une liste de 50 éléments
ne représente pas nécessairement toutes les parties : utiliser la pagination.

Chaque partie expose les champs suivants :

```ts
interface RecordedGame {
  gameId: string;
  mode: 'local' | 'online' | 'human-vs-bot' | 'bot-vs-bot'
    | 'tutorial' | 'restored' | 'unknown';
  status: 'in-progress' | 'finished' | 'interrupted';
  reason: 'combat' | 'forfeit' | 'removed' | null;
  startedAt: string; // ISO UTC
  updatedAt: string;
  endedAt: string | null;
  turnCount: number;
  players: [RecordedParticipant, RecordedParticipant];
  result: { outcome: 'win'; winnerId: string; loserId: string }
    | { outcome: 'draw' } | null;
}

interface RecordedParticipant {
  playerId: string;
  commanderId: string;
  controller: 'human' | 'bot' | 'unknown';
  botId: string | null;
  healthPoints: number;
  rawHealthPoints: number | null;
}
```

Afficher au minimum la date, le mode, les participants et versions de bots,
le statut, le résultat, le tour atteint et les PV du gagnant.

Pour trouver le gagnant, comparer `result.winnerId` aux `players[].playerId`.
Ne pas comparer `winnerId` à `botId` et ne pas supposer que `players[0]` est le
gagnant ou le bot v1. Les PV du gagnant sont son `healthPoints` ; ils peuvent
valoir zéro si les PV bruts ont départagé deux morts simultanées.

`turnCount` est directement le tour atteint : une partie terminée au tour 18
affiche 18 tours, sans ajouter ni retrancher 1. Pour une partie encore en cours,
présenter cette valeur comme son tour actuel.

## 2. Détail d'une partie

```http
GET /api/game-stats/{gameId}
```

Encoder l'identifiant avec `encodeURIComponent(gameId)`. La réponse est
`{ "success": true, "data": RecordedGame }`. Une partie inconnue retourne
HTTP `404` avec le code `GAME_STATS_NOT_FOUND`.

## 3. Comparaison IA contre IA et taux de victoire

```http
GET /api/game-stats/bots/compare?botA=heuristic-v1&botB=heuristic-v2
```

Les deux identifiants sont obligatoires et doivent être distincts. Le serveur
calcule les statistiques sur toutes les confrontations `bot-vs-bot` de ces deux
versions, dans les deux ordres de participants. Les anciennes versions de bots
restent consultables même si elles ne sont plus dans le registre du serveur.

Exemple fictif de réponse :

```json
{
  "success": true,
  "data": {
    "mode": "bot-vs-bot",
    "totalGames": 6,
    "finishedGames": 4,
    "decidedGames": 3,
    "inProgressGames": 1,
    "interruptedGames": 1,
    "draws": 1,
    "bots": [
      { "botId": "heuristic-v1", "wins": 2, "losses": 1, "winRatePercent": 50, "decisiveWinRatePercent": 66.67 },
      { "botId": "heuristic-v2", "wins": 1, "losses": 2, "winRatePercent": 25, "decisiveWinRatePercent": 33.33 }
    ]
  }
}
```

- `winRatePercent` : victoires / parties terminées × 100, égalités incluses.
- `decisiveWinRatePercent` : victoires / parties avec gagnant × 100.
- Ces valeurs sont déjà des pourcentages arrondis à deux décimales : ne pas
  les multiplier à nouveau par 100. Afficher `null` comme « — », pas comme 0 %.
- Les interruptions et parties en cours sont comptées à part, sans devenir des
  défaites. Les parties terminées par combat ou abandon contribuent aux taux.
- Sans confrontation, la réponse reste HTTP `200`, les compteurs valent zéro
  et les pourcentages `null`.
- Consommer ces résultats calculés par le serveur ; ne pas recalculer les taux
  depuis la seule page de parties affichée.

Pour afficher la liste des confrontations derrière cette comparaison :

```http
GET /api/game-stats?botA=heuristic-v1&botB=heuristic-v2&page=1&pageSize=50
```

Ajouter `status=finished` pour limiter cette liste aux parties terminées.
Les paramètres `botA`/`botB` imposent le mode `bot-vs-bot` ; ne pas les combiner
avec `mode=online`, `local` ou un autre mode incompatible. Les filtres de la liste
ne modifient pas le périmètre du GET de comparaison, qui couvre toutes les
confrontations enregistrées des deux bots.

## États UI et erreurs

Vérifier `response.ok` et l'enveloppe JSON `success` avant d'utiliser `data`.
Prévoir les états chargement, succès, liste vide, erreur réseau et réessai.

```json
{
  "success": false,
  "error": {
    "code": "GAME_STATS_UNAVAILABLE",
    "message": "Game statistics are temporarily unavailable."
  }
}
```

- HTTP `400` / `INVALID_INPUT` : paramètres invalides, bots manquants ou
  identiques, pagination invalide, mode ou statut inconnu.
- HTTP `404` / `GAME_STATS_NOT_FOUND` : détail d'une partie inexistante.
- HTTP `503` / `GAME_STATS_UNAVAILABLE` : MongoDB indisponible ; afficher une
  erreur, pas une liste vide présentée comme un succès.

Les statistiques sont écrites en arrière-plan. Prévoir un bouton de
rafraîchissement : le dernier résultat peut apparaître après un court délai.
Si l'utilisateur change de filtre pendant une requête, ignorer ou annuler
l'ancienne réponse pour ne pas écraser le résultat du filtre courant.

Le serveur expose également ce contrat dans `/api-docs`, tag `GameStats`.
Référence côté serveur : `doc/game-stats-api.md`.
