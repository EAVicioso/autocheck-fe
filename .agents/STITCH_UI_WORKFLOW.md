# Flujo de UI con Google Stitch

Antes de implementar o modificar cada pantalla o componente visual, descubre el MCP Google Stitch y selecciona el proyecto AutoCheck, la pantalla y su revisión. Inspecciona jerarquía, activos, variantes, estados, comportamiento responsivo y breakpoints. Si faltan datos o hay varios proyectos plausibles, registra el bloqueo y lleva adelante el trabajo estructural y de infraestructura.

## Referencia del proyecto

- Proyecto verificado por MCP el 23 de noviembre de 2026 en Santo Domingo. [AutoCheck UI Project](https://stitch.withgoogle.com/projects/11913831292782401288) tiene el recurso `projects/11913831292782401288`. Stitch reportó `updateTime = 2026-11-24T01:30:21.972110Z` para el proyecto.
- El inventario contiene 35 diseños de escritorio, 3 prototipos móviles, 2 documentos y 3 imágenes de marca. Se verificó la lectura del recurso de la landing con `get_screen`. Las dimensiones son del lienzo de Stitch.
- Para resolver cada pantalla, usa `projects/11913831292782401288/screens/{id}`. El ID de archivo HTML es el observado en el inventario y sirve para cotejar futuros cambios. El MCP consultado carece de un número de revisión independiente por pantalla. Vuelve a consultar la pantalla y confirma su variante antes de usarla como referencia.

| Pantalla en Stitch | ID de pantalla | Lienzo | ID de archivo HTML |
| --- | --- | --- | --- |
| Untitled Prototype | `979abe6a22f64329b9c37f627760fcda` | MOBILE 390 × 884 | — |
| 05 Citizen: Dashboard (Hi-Fi) | `e431bb3b0b464651b56f9e04e7dac8de` | DESKTOP 2560 × 2238 | `7214092633840263831` |
| 04 Authentication: Access Denied (Hi-Fi) | `498a6f468a7044ce8cc310cd91f48125` | DESKTOP 2560 × 2048 | `4657283958793835909` |
| 04 Authentication: Reset Password (Hi-Fi) | `4d33d65df25544e2bce9700d57db3191` | DESKTOP 2560 × 2048 | `946670504841149645` |
| 07 INTRANT: National Dashboard (Hi-Fi) | `dd1dba05e503435da645d879513badd2` | DESKTOP 3136 × 2454 | `7421688765282220352` |
| 04 Authentication: Session Expired (Hi-Fi) | `50341d1c91ab43dc9df8122aff50cc32` | DESKTOP 2560 × 2048 | `3368505496701419163` |
| 04 Authentication: Citizen Registration - Step 2 (Hi-Fi) | `2824e329f9d34843bbc4bdbc8d5961db` | DESKTOP 2560 × 2048 | `2756779783425218980` |
| 04 Authentication: Citizen Registration - Step 1 (Hi-Fi) | `654f5d06e389466d8ef3f703fd68efc2` | DESKTOP 2560 × 2048 | `2716291170263752888` |
| 04 Authentication: Login (Hi-Fi) | `ab424e8a921d4732b7f50dd8a41661e2` | DESKTOP 2560 × 2048 | `4143551413628215723` |
| 04 Authentication: Forgot Password (Hi-Fi) | `f8bdc38c7f454d3ea8f4802df81b09df` | DESKTOP 2560 × 2048 | `12592846582603489425` |
| 06 Inspection Center: Dashboard (Hi-Fi) | `452cdaa8bf5c44028afc1ac45d682c1c` | DESKTOP 2560 × 2216 | `14566090539212972075` |
| 04 Authentication: Registration Success (Hi-Fi) | `094ba93dac514dc7b469519b53846ef3` | DESKTOP 2560 × 2048 | `14237430520605425295` |
| 01 Public: Landing Page (Hi-Fi) | `9661d3e97f674ce59d0898085f1273e7` | DESKTOP 2560 × 4872 | `13851004867864034141` |
| Untitled Prototype | `35b22de5539743e5bc08b5b07fd2b7b6` | MOBILE 390 × 884 | `9194aeff38904411a76791d43e0933ef` |
| 10 Support: Chatbot Central | `f91a33dcfd944be0b48765a73ce630c6` | DESKTOP 2560 × 2048 | `110405999866409562` |

El inventario consultado carece de una pantalla explícita para verificación pública por QR. Chatbot Central es una referencia de soporte. Confirma la variante del contenedor global y su comportamiento móvil antes de diseñarlo. Los prototipos de 390 px requieren comprobar su correspondencia con cada flujo.

### Fuentes de tokens

El tema de proyecto devuelto por `get_project` contiene un `designTheme.designMd` llamado **Technical Blueprint**. Declara Inter, primario `#000000`, superficie `#fbf9f8`, separador de grilla de 16 px y escala de 4, 8, 16, 24 y 32 px. `list_design_systems` devolvió estos sistemas.

| Sistema | Recurso | Versión publicada por MCP |
| --- | --- | --- |
| Mi sistema de diseño | `assets/11596173783724005055` | 2 |
| Blueprint Enterprise | `assets/12a6c4f953a64770926eccc623ade8ec` | 1 |
| Fidelity Design System | `assets/13365610629313385803` | 2 |
| Technical Blueprint | `assets/4e54000dcb85495db74e6135998e3570` | 1 |
| Dominicana ITV Precision | `assets/f068aa08ed29473680a1a93d2530c50a` | 1 |

La paleta local en [DESIGN.md](../DESIGN.md) usa azul `#0052CC` y acento `#CF6625`. Confirma qué sistema y tokens corresponden a cada pantalla y registra cualquier divergencia antes de trasladarlos a CSS. Los títulos de Stitch orientan la búsqueda de diseños. Los roles, flujos disponibles y comportamiento se rigen por el contrato AutoCheck.

## Registro para cada intervención visual

- Anota proyecto, pantalla, ID o revisión inmutable, origen de activos y tokens observados de color, tipografía, espaciado, radios y dimensiones. Relaciona cada token con su variable CSS semántica y el tema Tailwind v4 de `src/app/globals.css`.
- Registra controles reutilizados o nuevos, variantes, carga, estados vacíos, errores, foco, teclado y cambios de layout por breakpoint. Revisa la navegación de Inspector en tableta y móvil reales, los objetivos táctiles, etiquetas y contraste. Si aparece un conflicto con accesibilidad, identifica el componente y pide decisión sobre la revisión.
- Revisa exportaciones de Stitch conforme a arquitectura, privacidad, contrato y accesibilidad. Anota evidencia de prueba y revisión utilizada antes de completar.
