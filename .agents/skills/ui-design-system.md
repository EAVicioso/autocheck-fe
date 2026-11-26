# Design System y accesibilidad

Usa los primitivos de `src/components/ui/` en páginas, layouts y features. Antes de agregar una variante, revisa el catálogo y extiende el primitivo genérico con una prueba co-localizada. Usa los tokens de `src/app/globals.css` para colores, radios, sombras, espaciado y tipografía. Prohíbe hexadecimales y valores arbitrarios en `src/features/` y `src/app/` fuera del archivo de tokens.

- RS-02 e IU-02. Usa controles nativos, etiqueta visible programática, foco visible, navegación por teclado y texto además del color. Valida contraste WCAG AA. Usa `Button size="touch"` de al menos 44 × 44 px en Inspector. Prueba Chromium táctil, escritorio y móvil.
- LEG-05 y EE-06. Incluye `AcademicDisclaimerBanner` en `AppShell` y `QrVerificationCard`. Identifica el prototipo académico y la ausencia de validez legal u oficial ante INTRANT.
- PA-07. Verificación pública muestra exactamente «Certificado no encontrado» o «Integridad no válida» en los casos respectivos. Proyecta solo ID, emisión, centro y resultado. Queda prohibido incluir nombre, documento, contacto o hash calculado en cliente.
- PA-08 y RM-01. Usa `DataTable` con página de 20 ítems, filtros del servidor y estados de carga, vacío y error. `StatCard` muestra «Sin datos» con cero inspecciones cerradas y «Última actualización» en Santo Domingo. Para anomalías muestra aprobaciones de un total de 21, rango y carácter preventivo. Nunca infieras fraude ni obtengas listas masivas para paginarlas localmente.
- Las correcciones de accesibilidad son intencionales. Comprueba los tokens de estado con texto y contraste, y registra el cambio frente a Stitch.

[Protocolo e inventario de Stitch](stitch-mcp-workflow.md)
