# Git, PR y revisiones

Trabaja en `feat/{owner}-{slice}`, `fix/{owner}-{issue}` o `chore/{scope}`. Prohíbe commits y push directo a `main`. Usa Conventional Commits y PRs pequeños. A Sebastián Tavares → B Manuel Polo → C Engels Vicioso → A. El siguiente Owner revisa el cambio. Registra al menos una aprobación humana ajena al autor.

Usa [la plantilla](../../.github/PULL_REQUEST_TEMPLATE.md) con RF, CU y PA, evidencia de CI, scope RBAC, cambios HTTP y revisión Stitch. Comprueba ramas, diff y verificaciones antes de abrir el PR. Mantén Node y dependencias fijadas. Actualiza package-lock con `npm install` cuando cambie package.json.
