# Anorha Web Product Design System

## Direction

The authenticated web app shares the mobile app's calm, warm product language. A reseller is usually working in ordinary indoor light at a desk, often while multitasking and already short on patience. Use the warm light theme as the primary scene. Desktop layouts may be denser, but the interaction vocabulary should still feel like Profile, Campaign Chat, and Add Product on mobile.

The marketing landing app in `apps/web` is outside this system and must remain untouched unless explicitly requested.

## Color

- Brand primary: `#93C822`, expressed as `oklch(0.77 0.17 122)` in web tokens.
- Brand deep: `#4A7C00` for green text on light surfaces.
- App ground: warm gray `#F4F4F1`.
- Card and sheet: softly tinted white, never pure `#FFFFFF`.
- Primary ink: `#18181B`; secondary ink: `#3F3F46`; dim text: `#71717A`.
- Borders: `#E5E7EB`; field fills: `#F3F4F6`.
- Success: `#16A34A`; warning: `#BA7517`; destructive: `#DC2626`.
- Use one saturated color moment per screen. Accent green is reserved for the primary action, selected state, and meaningful progress.

## Typography

Use Inter-compatible product typography through the existing sans token. Screen headings are 24-30px at 750-800 weight with tight tracking. Section titles are 18-20px at 700. Row titles and control labels are 14-15px at 600-700. Supporting copy is 13-15px at 450-500. Small grouping labels are 11-12px at 700 with restrained uppercase tracking.

## Spacing and Shape

Use the mobile spacing rhythm: 4, 8, 12, 16, 20, 24, and 32px. Page gutters are 20-32px. Cards use 16-20px padding and sit directly on the app ground. Field and card radii are 14-18px; sheets are 24-26px; buttons and compact filters are pills. Cards are flat with a hairline border. Floating controls may use a restrained shadow, but content cards do not.

## App Shell

Use a warm gray content ground with a quiet off-white navigation rail. Navigation rows are rounded and low contrast when inactive. The current route uses a soft brand tint, deep green text, and a compact icon badge rather than a dark filled block. The page header combines context and the most important action; avoid duplicating the title in multiple chrome layers.

## Components

- Primary button: 48-52px pill, brand green, dark readable foreground, 14-16px at 700.
- Secondary button: tinted white, hairline border, dim ink.
- Input: 44-48px, gray field fill or white with a hairline border, 14-15px type, brand focus ring.
- Card: white-tinted surface, 14-18px radius, hairline border, no decorative shadow.
- Section label: small uppercase label above a related surface, as in mobile Profile.
- Status row: leading icon or logo, title and plain status line, one trailing action.
- Chat: assistant messages live directly on the ground or a quiet neutral surface; user messages use a restrained brand tint. Composer is a rounded bordered surface with clear send action.
- Add Product: photo-first layout, prominent upload/capture area, editable generated details, progressive controls, and one persistent confirmation action.
- Settings/Profile: grouped row surfaces with icons, readable labels, short supporting copy, and familiar trailing controls.

## Motion

Use 160-240ms state transitions with an ease-out curve. Motion communicates hover, selection, expansion, loading, or successful completion. Respect `prefers-reduced-motion`; avoid page-load choreography and decorative motion.

## Responsive Behavior

Desktop uses the available width for a clear main column plus an optional contextual rail. At tablet widths, collapse to one column. At mobile web widths, use the same hierarchy and order as the native app, with the navigation rail becoming a standard drawer. Prose remains under 70 characters per line.
