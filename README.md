# Versión 2.12.6 · Categorías editables, personajes y Bestiario compacto

Base: v2.12.5.

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
- No se cambian Historia, Cuaderno, Batalla ni la estructura jerárquica de las organizaciones.

## Cambios de v2.12.6

- Las categorías de criaturas creadas por el DM se pueden renombrar y eliminar desde la barra de categorías.
- Eliminar una categoría no borra criaturas: las mueve a “Sin categoría”.
- En las jerarquías de organizaciones cada personaje tiene acceso directo a editar su ficha (✎) y, por separado, su cargo/posición (↕).
- La ficha visual del Bestiario prioriza la información a la izquierda y limita el retrato de la derecha a un tamaño compacto y adaptable.
- En pantallas estrechas el retrato se apila sin forzar alturas grandes.
