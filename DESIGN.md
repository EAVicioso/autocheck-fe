# DESIGN.md - AutoCheck Design System (ITV Dominicana)

Master visual design specification document, tokens, and interface rules for AutoCheck project unification in Stitch.

---

## 1. Color Palette and Visual Tokens

| Color Role | Hex Code | Interface Usage |
| :--- | :--- | :--- |
| **Dominant** | `#FFFFFF` | Screen backgrounds, main cards, empty input fields. |
| **Secondary** | `#0052CC` | Primary buttons, links, active navigation, inactive progress nodes. |
| **Accent** | `#CF6625` | Completed progress nodes, status alerts, appointment highlights. |
| **Dark Neutral**| `#001E4D` | Titles, headings, sidebar navigation, main body text. |
| **Light Neutral** | `#D8E8FF` | Informational cards, hover states, inactive connector lines. |

---

## 2. Unified Components

### 2.1. Form Progress Bar (Node Stepper)
* **Mandatory style:** Interconnected step nodes (Visual Stepper). Solid progress bars or color gradients are strictly prohibited.
* **Completed / Active nodes:** Circles with Accent background (`#CF6625`), text or icon in white. Preceding connector line in `#CF6625`.
* **Pending / Inactive nodes:** Circles with Secondary background/border (`#0052CC`), visible step number. Subsequent connector line in `#D8E8FF`.
* **Scope:** Authentication forms (Login/Register), Appointment Scheduling, and Payment Gateway.

### 2.2. Sidebar Navigation and Dropdown Menus
* **Button structure:** 8px rounded corners (`border-radius: 8px`), left-aligned text with inline icon.
* **Spacing:** Standardized inner padding of 10px vertical and 16px horizontal.
* **Active State:** Light Neutral background (`#D8E8FF`) with text and icon in Secondary (`#0052CC`) and active left border.
* **Hover State:** Smooth transition to `#D8E8FF` (reduced opacity).

### 2.3. Cards, Grids, and Spatial Layout
* **Container padding:** 24px in main sections.
* **Grid gap:** 16px between cards, form fields, and buttons.
* **Borders and Shadows:** Consistent 12px rounding on main cards with subtle shadow (`0 2px 8px rgba(0, 30, 77, 0.08)`).

## Implementación

Los [tokens](src/app/globals.css) son la referencia en código. El [registro de Stitch](.agents/skills/stitch-mcp-workflow.md) conserva los identificadores de pantalla y las decisiones de implementación.

El naranja de marca se aplica a los nodos y al borde de los avisos. Blanco sobre naranja tiene contraste 3,76:1. En esos nodos, los números usan texto negrita de 20 px y los iconos blancos se acompañan de una etiqueta azul oscura y estado accesible. El texto de los avisos usa azul oscuro sobre azul claro.

Login y registro comparten el stepper. Citas y pago pueden reutilizar el mismo componente cuando se integren sus pantallas.
