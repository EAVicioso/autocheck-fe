# Protocolo Google Stitch MCP

Proyecto [AutoCheck UI Project](https://stitch.google.com/projects/11913831292782401288?pli=1), recurso `projects/11913831292782401288`. Antes de cambiar cada pantalla o componente, llama a `get_project`, `list_screens` y `get_screen` según corresponda. Lee el HTML con `download_file` y revisa las capturas, activos, jerarquía, estados, puntos de quiebre y variantes aplicables. Registra el ID de pantalla, archivo y fecha de consulta. El archivo es evidencia observada, sin garantía de numeración de revisiones por pantalla.

## Consolidación

La revisión del 25 de noviembre de 2026 consultó los 43 recursos mediante MCP y leyó los 35 HTML de diseño. Los estilos muestran Inter, fondos `#f8f9ff` y `#ffffff`, tintas `#0c1d2d` y `#434654`, primarios `#0040a2` y `#0c56d0`, acentos `#9d4300`, y radios desde `rounded-sm` hasta `rounded-full`. Bootstrap del catálogo usa Inter con respaldo de sistema, el primario de mayor contraste y una escala de espaciamiento de 4, 8, 16, 24 y 32 px. Se unificó el radio en 8 px para controles y 12 px para paneles, con una sombra de panel. Los colores de estado y el borde se eligieron para contraste y tienen etiqueta visible. La lista de assets incluye Technical Blueprint v1, Dominicana ITV Precision v1, Blueprint Enterprise v1, Fidelity Design System v2 y Mi sistema de diseño v2. La elección se basó en los HTML usados en el proyecto. [Tokens del repo](../../src/app/globals.css)

QR carece de pantalla dedicada en el inventario. Usa contrato y primitivos compartidos para su tarjeta. Chatbot Central aporta composición y controles. Los prototipos móviles y activos se inventariaron mediante metadatos. Las pruebas táctiles verifican dimensiones del catálogo y no equivalen a una revisión visual en hardware real.

## Inventario

Usa `projects/11913831292782401288/screens/{id}` para recuperar un recurso. Dimensiones de lienzo en píxeles.

| Pantalla | ID | Lienzo | Archivo HTML | Evidencia |
| --- | --- | --- | --- | --- |
| AutoCheck_Contexto_Tecnico_Consolidado.md | `6522238513834493823` | DOCUMENT 780 × 1768 | 6522238513834495938 | Metadatos |
| Information Architecture | `05ac734850a24f2b97591e24d7f981af` | DESKTOP 0 × 0 | 6db863d681194079b2f40ec2778cf04d | Metadatos |
| isotipo.jpeg | `5773764338870819595` | IMAGE 1254 × 1254 | — | Metadatos |
| logotipo.jpeg | `5773764338870820081` | IMAGE 1254 × 1254 | — | Metadatos |
| imagotipo.jpeg | `5773764338870820567` | IMAGE 1254 × 1254 | — | Metadatos |
| 09 Payments: Appointment Summary | `42f39b7b153d4e439a1d2f5aea3a4703` | DESKTOP 2560 × 2048 | 2117450344104847041 | HTML revisado |
| 09 Payments: Payment Method Selection | `61e02e8bdd664bc48296312a74742c74` | DESKTOP 2560 × 2048 | 9736473673107002005 | HTML revisado |
| 09 Payments: Card Details | `094fbf48bf974f24bbdc21df174dd5d3` | DESKTOP 2560 × 2236 | 6221555013829360753 | HTML revisado |
| 09 Payments: Payment Successful | `4e7a8f18818840eb8f4012ea8e47a39d` | DESKTOP 2560 × 2048 | 5479125859451345590 | HTML revisado |
| 10 Support: Chatbot Central | `f91a33dcfd944be0b48765a73ce630c6` | DESKTOP 2560 × 2048 | 110405999866409562 | HTML revisado |
| 05 Citizen: Schedule - Type Selection (Hi-Fi) | `4c4714e1f918496f98dd0c2954e448c6` | DESKTOP 2560 × 2048 | 2568326809875499657 | HTML revisado |
| 05 Citizen: Schedule - Confirmation (Hi-Fi) | `a8b1249ea74d4fbdb2ce36b7bacda76e` | DESKTOP 2560 × 2048 | 10817480875595032513 | HTML revisado |
| 05 Citizen: Schedule - Success (Hi-Fi) | `c79591c84fc14e5f9caa19d18a8419a0` | DESKTOP 2560 × 2048 | 2851828136135719048 | HTML revisado |
| 05 Citizen: Schedule - Date & Time Selection (Hi-Fi) | `3f1eb7ee825143188b7bc54ba37fe0e9` | DESKTOP 2560 × 2048 | 2095477413974664250 | HTML revisado |
| 05 Citizen: Schedule - Center Selection (Hi-Fi) | `de18e30f903c44e9853b02de2e0107b3` | DESKTOP 2560 × 2048 | 4194160499087432692 | HTML revisado |
| 05 Citizen: Appointment Details (Hi-Fi) | `6e4d1551936d493c9eb3e4fe4fdf90b6` | DESKTOP 2560 × 2048 | 13629175924000037703 | HTML revisado |
| 05 Citizen: Appointment History (Hi-Fi) | `3896f5b48d104d86a10853401c452ceb` | DESKTOP 2560 × 2048 | 17224780653925074299 | HTML revisado |
| 04 Authentication: Login (Hi-Fi) | `ab424e8a921d4732b7f50dd8a41661e2` | DESKTOP 2560 × 2048 | 4143551413628215723 | HTML revisado |
| 04 Authentication: Forgot Password (Hi-Fi) | `f8bdc38c7f454d3ea8f4802df81b09df` | DESKTOP 2560 × 2048 | 12592846582603489425 | HTML revisado |
| 04 Authentication: Reset Password (Hi-Fi) | `4d33d65df25544e2bce9700d57db3191` | DESKTOP 2560 × 2048 | 946670504841149645 | HTML revisado |
| 04 Authentication: Citizen Registration - Step 2 (Hi-Fi) | `2824e329f9d34843bbc4bdbc8d5961db` | DESKTOP 2560 × 2048 | 2756779783425218980 | HTML revisado |
| 04 Authentication: Citizen Registration - Step 1 (Hi-Fi) | `654f5d06e389466d8ef3f703fd68efc2` | DESKTOP 2560 × 2048 | 2716291170263752888 | HTML revisado |
| 04 Authentication: Registration Success (Hi-Fi) | `094ba93dac514dc7b469519b53846ef3` | DESKTOP 2560 × 2048 | 14237430520605425295 | HTML revisado |
| 05 Citizen: Profile Overview (Hi-Fi) | `4d595f09692d49898db0ad2a60aab4f2` | DESKTOP 2560 × 2048 | 2213695939059046795 | HTML revisado |
| 05 Citizen: Edit Profile (Hi-Fi) | `86bfda3ab90c4321bd8c615afdd00a25` | DESKTOP 2560 × 2498 | 3709125697231449645 | HTML revisado |
| 05 Citizen: Change Password (Hi-Fi) | `97ce64b0415c4454addb12ca17f49a56` | DESKTOP 2560 × 2048 | 6633425883553055794 | HTML revisado |
| 04 Authentication: Session Expired (Hi-Fi) | `50341d1c91ab43dc9df8122aff50cc32` | DESKTOP 2560 × 2048 | 3368505496701419163 | HTML revisado |
| 04 Authentication: Access Denied (Hi-Fi) | `498a6f468a7044ce8cc310cd91f48125` | DESKTOP 2560 × 2048 | 4657283958793835909 | HTML revisado |
| 07 INTRANT: National Dashboard (Hi-Fi) | `dd1dba05e503435da645d879513badd2` | DESKTOP 3136 × 2454 | 7421688765282220352 | HTML revisado |
| 08 System Administration: Centers List (Hi-Fi) | `a05fcb04e79f4aa689e646997c4983fc` | DESKTOP 3136 × 2048 | 2607118061808898665 | HTML revisado |
| 08 System Administration: Create Center (Hi-Fi) | `1f01aedae23b49c7833065031ce720da` | DESKTOP 2560 × 2048 | 3251291070081069420 | HTML revisado |
| 08 System Administration: Delete Center (Hi-Fi) | `a77be84f9cce4ff9a89f230773dd2671` | DESKTOP 2560 × 2048 | 7238219341887448711 | HTML revisado |
| 08 System Administration: Center Details (Hi-Fi) | `51034cd73cc0419a8244870dbda4fa74` | DESKTOP 3136 × 2158 | 14036324164572257784 | HTML revisado |
| 06 Inspection Center: Dashboard (Hi-Fi) | `452cdaa8bf5c44028afc1ac45d682c1c` | DESKTOP 2560 × 2216 | 14566090539212972075 | HTML revisado |
| 06 Inspection Center: Perform Inspection - Validation (Hi-Fi) | `6bc976ded81948d4b9e6180e2ea785ff` | DESKTOP 2560 × 2048 | 3904806019154861037 | HTML revisado |
| 06 Inspection Center: Perform Inspection - Form (Hi-Fi) | `93d0019fe55045eaa9d20eaa729e9e95` | DESKTOP 2560 × 2048 | 16040138879154775697 | HTML revisado |
| 08 System Administration: Vehicle Search (Hi-Fi) | `6b402c2cf9e441a7ae8f7c76e9c12e86` | DESKTOP 2560 × 2048 | 1213177697283472879 | HTML revisado |
| 06 Inspection Center: Perform Inspection - Final Decision (Hi-Fi) | `1aae16fe858a442681ce25f93d97d6ba` | DESKTOP 2560 × 2342 | 5368147524218497349 | HTML revisado |
| AutoCheck Enterprise Fleet Management | `d82a8e2c78e4430fb97d81cbab0476ff` | MOBILE 390 × 884 | 6aa47e3343784a0281f3fc2f19beaa0b | Metadatos |
| 01 Public: Landing Page (Hi-Fi) | `9661d3e97f674ce59d0898085f1273e7` | DESKTOP 2560 × 4872 | 13851004867864034141 | HTML revisado |
| Untitled Prototype | `979abe6a22f64329b9c37f627760fcda` | MOBILE 390 × 884 | — | Metadatos |
| Untitled Prototype | `35b22de5539743e5bc08b5b07fd2b7b6` | MOBILE 390 × 884 | 9194aeff38904411a76791d43e0933ef | Metadatos |
| 05 Citizen: Dashboard (Hi-Fi) | `e431bb3b0b464651b56f9e04e7dac8de` | DESKTOP 2560 × 2238 | 7214092633840263831 | HTML revisado |


## Sección C · 26 de noviembre de 2026

| Uso | Pantalla Stitch | HTML | Aplicación |
| --- | --- | --- | --- |
| Login, expiración y acceso | `ab424e8a921d4732b7f50dd8a41661e2`, `50341d1c91ab43dc9df8122aff50cc32`, `498a6f468a7044ce8cc310cd91f48125` | `4143551413628215723`, `3368505496701419163`, `4657283958793835909` | Se conserva el formulario y se anuncia el bloqueo indicado por el servidor. |
| Reportes | `dd1dba05e503435da645d879513badd2` | `7421688765282220352` | Tarjetas de totales, filtros dominicanos y tabla de alertas con énfasis preventivo. |
| Centros y rampas | `a05fcb04e79f4aa689e646997c4983fc`, `1f01aedae23b49c7833065031ce720da`, `51034cd73cc0419a8244870dbda4fa74` | `2607118061808898665`, `3251291070081069420`, `14036324164572257784` | Lista paginada, alta con campos del contrato, detalle con capacidad, rampas y horarios. Usuarios, M y auditoría reutilizan la composición de lista y formulario del portal. |
| Asistencia | `f91a33dcfd944be0b48765a73ce630c6` | `110405999866409562` | Encabezado de soporte, control de consulta y mensaje accesible con reintento explícito. |

Se consultaron los ocho HTML vía MCP y las capturas de reportes, lista de centros y asistencia. La interfaz usa etiquetas en español, foco visible, mensajes de estado con texto y controles táctiles. Los recursos de diseño se conservaron en Stitch.

El 28 de noviembre de 2026 se volvieron a consultar el tablero nacional (`dd1dba05e503435da645d879513badd2`, HTML `7421688765282220352`), el tablero de centro (`452cdaa8bf5c44028afc1ac45d682c1c`, HTML `14566090539212972075`), el alta de centro (`1f01aedae23b49c7833065031ce720da`, HTML `3251291070081069420`) y su detalle (`51034cd73cc0419a8244870dbda4fa74`, HTML `14036324164572257784`). Los formularios administrativos muestran el guardado en curso y el resultado del servidor. El tablero aplica el centro del perfil cuando está asignado y muestra el porcentaje de cada alerta junto al conteo.
