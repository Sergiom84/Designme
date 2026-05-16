# Design System

Designme centraliza las decisiones visuales en tokens antes de renderizar artefactos.

- `tokens/base.ts`: escalas compartidas de espaciado, tipografía, radios, sombras y movimiento.
- `tokens/palettes.ts`: paletas crudas por dirección visual.
- `tokens/themes.ts`: temas semánticos consumidos por el motor.
- `tokens/cssVars.ts`: convierte un tema y los tweaks activos en CSS custom properties.
- `tokens/contrast.ts`: utilidades mínimas de luminancia y contraste para futuras reglas de calidad.

El motor sigue exportando HTML standalone: los tokens se serializan como variables CSS dentro del documento generado.
