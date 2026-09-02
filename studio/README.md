# Game Data Studio

Nouveau socle isolé pendant la migration de l'éditeur existant.

## Couches

- `src/domain` : métier pur, sans dépendance externe.
- `src/application` : cas d'usage et ports, dépend du domaine.
- `src/infrastructure` : adaptateurs, dépend de l'application et du domaine.
- `src/presentation` : modèles de vue et contrôleurs sans React.
- `apps/web-react` : adaptateur React et composition des couches.

Les données existantes et les JSON de production ne sont pas connectés au nouveau socle.

## Commandes

```bash
npm install
npm run dev
npm run build
```
