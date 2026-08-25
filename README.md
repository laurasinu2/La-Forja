# Versión 2.12.5 · Persistencia y selector jerárquico de Mundo

Base: v2.12.4.

## Correcciones

- La edición local de criaturas desde el panel lateral del Atlas vuelve a tener desplazamiento vertical completo.
- Las categorías personalizadas del Bestiario se conservan al guardar, recargar, cerrar/abrir, exportar e importar la campaña.
- También se conserva la categoría asignada a cada criatura.

## Atlas · Ficha de Mundo

- El selector antiguo Tipo/Ficha se sustituye visualmente por un selector jerárquico plegable.
- Criaturas: aparecen **Todos**, las categorías personalizadas y **Sin categoría** cuando corresponde; cada grupo empieza cerrado y se despliega al pulsarlo.
- Organizaciones: cada organización aparece como grupo plegable por su nombre. Dentro se puede elegir la propia organización o cualquiera de sus personajes.
- Los personajes que no pertenecen a ninguna organización aparecen en un grupo independiente.
- Un marcador puede enlazarse directamente a una criatura, una organización completa o un personaje de Mundo.
- Las escenas usan el mismo selector para mantener un comportamiento coherente.

## Compatibilidad

- No se modifica la lógica de ajustes locales por marcador introducida en v2.12.4.
- No se cambian Historia, Cuaderno, Batalla ni la jerarquía de Mundo.
