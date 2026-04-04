# Design System Specification: The Precision Architect

## 1. Overview & Creative North Star
**Creative North Star: The Precision Architect**

This design system rejects the "template" aesthetic of traditional SaaS. Instead, it draws inspiration from high-end architectural blueprints and editorial layouts. It is characterized by **structural clarity, intentional asymmetry, and tonal depth.** 

While the CRM context requires high data density, this system achieves it through "breathable complexity"—using white space as a structural element rather than a void. By moving away from rigid, boxed-in grids and embracing layered surfaces, we create a workspace that feels like a premium physical office: authoritative, calm, and hyper-efficient.

---

## 2. Colors
Our palette balances the authority of deep blues with the clarity of surgical whites. Color is used as a functional tool for navigation and status, not just decoration.

### Functional Roles
*   **Primary (`#0050d4`):** The engine. Use for high-priority actions and brand moments.
*   **Secondary (`#006947`):** The confirmation. Used for success states and growth metrics.
*   **Tertiary (`#815100`):** The alert. Used for warnings and attention-required items.
*   **Neutral Hierarchy:** A sophisticated range from `surface-container-lowest` (#FFFFFF) for primary content to `surface-dim` (#D0D5D8) for background depth.

### The "No-Line" Rule
To achieve a premium, modern feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background color shifts. For instance, a sidebar should be defined by a `surface-container-low` background against a `surface` main content area. Contrast is created through tone, not lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface-container` tiers to create "nested" depth:
1.  **Base:** `surface` (Main canvas)
2.  **Sectioning:** `surface-container-low` (Navigation rails, background panels)
3.  **Active Content:** `surface-container-highest` (Secondary panels, selected states)
4.  **Floating Elements:** `surface-container-lowest` (Cards, modals)

### The "Glass & Gradient" Rule
For floating elements or hero components, use **Glassmorphism**. Apply a semi-transparent surface color with a `backdrop-filter: blur(20px)`. To provide "visual soul," use subtle linear gradients (e.g., `primary` to `primary-container`) for CTAs to move beyond flat, generic buttons.

---

## 3. Typography
The system utilizes a dual-font strategy to balance editorial sophistication with technical utility.

*   **Display & Headlines (Manrope):** A modern geometric sans-serif used for `display-lg` through `headline-sm`. Its wide apertures and structural stability convey confidence and high-end precision.
*   **Body & Labels (Inter):** A workhorse typeface designed for readability. Used for all `title`, `body`, and `label` roles. Its high x-height ensures clarity in data-rich CRM tables.

**The Editorial Scale:** Utilize extreme contrast in sizing. Pair a `display-sm` header with `body-sm` metadata to create a hierarchy that feels intentional and curated.

---

## 4. Elevation & Depth
We eschew traditional "structural lines" in favor of **Tonal Layering.**

### The Layering Principle
Depth is achieved by stacking tiers. Place a `surface-container-lowest` card on top of a `surface-container-low` section. This creates a soft, natural lift that feels integrated into the environment.

### Ambient Shadows
Shadows must be "atmospheric." When a floating effect is required (e.g., Modals), use extra-diffused shadows:
*   **Blur:** 30px–60px
*   **Opacity:** 4%–8%
*   **Tint:** Use a tinted version of `on-surface` rather than pure black to mimic natural light.

### The "Ghost Border" Fallback
If a border is required for accessibility in interactive elements (inputs/chips), use a **Ghost Border**:
*   Token: `outline-variant`
*   Opacity: 15%–20%
*   Width: 1px
*   *Note: Never use 100% opaque borders for non-interactive containers.*

---

## 5. Components

### Buttons
*   **Primary:** Uses a subtle gradient from `primary` to `primary_dim`. Corner radius: `md`. High-contrast `on_primary` text.
*   **Secondary:** Ghost-style. No fill, `outline` border at 20% opacity. On hover, fills with `surface-container-high`.
*   **Tertiary:** Text-only with a heavy `label-md` weight.

### Input Fields
*   **Style:** `surface-container-lowest` background with a `Ghost Border`. 
*   **Focus State:** The border transitions to 100% opaque `primary`, accompanied by a 4px soft "glow" (shadow) using the `primary` color at 10% opacity.
*   **Error:** Uses the `error` token for the border and `on_error_container` for the helper text.

### Cards & Lists
*   **Forbid Divider Lines:** Separate list items using vertical white space (8px–12px) or alternating background shifts (Zebra striping using `surface` and `surface-container-low`).
*   **Editorial Layouts:** Use `xl` (1.5rem) rounded corners for large dashboard cards to soften the data-heavy environment.

### Data Chips
*   **Status Chips:** Use `secondary_container` for success and `tertiary_container` for warnings. 
*   **Interactive Chips:** Pill-shaped (`full` roundedness) with a `surface-container-high` background.

### Premium CRM Component: The "Activity Feed"
Instead of a vertical line, use a series of `surface-container-low` blocks that "bleed" into each other, using `primary_fixed` dots to mark milestones. This creates a continuous flow of data that feels narrative rather than clinical.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `surface-container-lowest` for all interactive cards to make them "pop" against the background.
*   **Do** leverage `title-lg` for card headers to create an editorial, high-contrast look.
*   **Do** use asymmetrical layouts (e.g., a wide 8-column main area paired with a slim 4-column utility bar) to break the "grid" feel.

### Don't
*   **Don't** use 1px dividers to separate content. Use space or tonal shifts.
*   **Don't** use pure black (#000000) for text. Use `on-surface` (#2C2F31) for a softer, premium contrast.
*   **Don't** use "drop shadows" on every element. Reserve elevation for elements that physically float over others (Modals, Popovers).
*   **Don't** use standard `md` corners on everything. Mix `md` for small components (inputs) and `xl` for large containers (cards) to create visual hierarchy.