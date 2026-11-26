<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AutoCheck frontend

Lee el módulo de trabajo y la guía de Next instalada antes de editar código.

| Tarea | Contexto |
| --- | --- |
| App Router, sesión SSR, límites Client/Server | [.agents/ARCHITECTURE.md](.agents/ARCHITECTURE.md) |
| REST, tipos, errores, PDF, QR, asistencia, Realtime | [.agents/API_CONTRACT.md](.agents/API_CONTRACT.md) |
| Casos de uso, invariantes, seguridad por recurso | [.agents/DOMAIN_RULES.md](.agents/DOMAIN_RULES.md) |
| Intervención visual y accesibilidad | [.agents/STITCH_UI_WORKFLOW.md](.agents/STITCH_UI_WORKFLOW.md) |
| Pruebas, CI y evidencia | [.agents/TESTING_AND_QUALITY.md](.agents/TESTING_AND_QUALITY.md) |

- Sigue las instrucciones del usuario y el alcance aprobado. El [contrato original](API_CONTRACT.md) fija el HTTP y el [traspaso](BACKEND_CONTEXT_TRANSFER.md) fija invariantes y trazabilidad. Conserva diferencias con flujos previstos. Una marca `[PENDIENTE_EN_BACKEND]` significa operación indisponible. Ante divergencia, verifica la fuente y consulta antes de alterar el contrato.
- Conecta Google Stitch antes de cada pantalla o componente visual. Registra proyecto, pantalla, revisión y tokens. Si falta una referencia verificable, registra el bloqueo y conserva únicamente los puntos de entrada estructurales.
- Usa AutoCheck REST para negocio. El servidor comprueba rol, sesión, permiso, propiedad, asignación y centro. Guarda credenciales en servidor. Evita registrar datos sensibles y usar proveedores reales en pruebas. Conserva el webhook Sandbox en la integración servidor a servidor.
- Mantén TypeScript estricto, Tailwind v4, npm y su lockfile. Implementa por caso de uso, con Server Components por defecto. Limita esta fase al esqueleto, infraestructura, documentación y pruebas base.
