# Versión 2.12.4 · Criaturas del Atlas con ajustes locales

Base: v2.12.3.

## Cambio

- Una criatura asociada desde Mundo/Bestiario a un marcador del Atlas sigue heredando su ficha base.
- Desde la ficha lateral del propio Atlas, el botón ✎ permite editar estadísticas y textos sólo para ese marcador.
- Los cambios se guardan como ajustes locales del marcador y no modifican la criatura original del Bestiario.
- Los campos no modificados continúan heredándose de la ficha base.
- «Restablecer Bestiario» elimina los ajustes locales y devuelve ese marcador a la ficha original.
- Si se cambia la criatura asociada al marcador, sus ajustes locales anteriores se descartan para evitar aplicarlos a otra criatura.

## Mundo · Criaturas
- Nueva barra de **categorías personalizadas** encima de la biblioteca de criaturas.
- La categoría **Todos** existe siempre y muestra el Bestiario completo.
- El botón **+ Categoría** permite crear las categorías que necesites para cada campaña.
- Al pulsar una categoría, la lista muestra únicamente las criaturas asignadas a ella.
- Dentro de **Editar criatura** aparece el campo **Categoría** para decidir a cuál pertenece; también puede dejarse sin categoría.
- Las criaturas de campañas anteriores siguen siendo compatibles y aparecen en **Todos**.

## Tamaño y navegación
- La lista de criaturas ya no alarga la página: tiene desplazamiento interno cuando hay muchas entradas.
- La ficha seleccionada deja de forzar una altura mínima enorme y ocupa sólo el espacio que necesita.
- Si una ficha tiene mucha información, el desplazamiento queda dentro de su panel en vez de hacer crecer toda la vista de Mundo.
- En tablet y móvil, lista y ficha se reparten el espacio disponible sin salirse de la pantalla.

## Compatibilidad
- Base: v2.12.2.
- No se modifican Batalla, Atlas, organizaciones, Historia, Cuaderno ni las fichas existentes.