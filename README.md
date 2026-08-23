# Versión 2.11.1 · Selector de capítulo compacto y responsive
## Corrección 2.11.1

- El filtro de capítulo del Cuaderno ya no ocupa una fila propia: queda integrado de forma compacta a la derecha del buscador.
- El selector se adapta a pantallas estrechas y oculta su etiqueta textual cuando hace falta espacio.
- El selector de capítulo de la ficha también puede encogerse y saltar de línea correctamente en móvil.
- No se modifica ninguna otra función de la v2.11.0.


Esta versión parte de La Forja v2.10.0 y añade:

- Capítulos compartidos entre Historia y Cuaderno.
- Filtro del Cuaderno por capítulo y selector de capítulo en cada ficha.
- Cambio de capítulo de nodos de Historia, con opción de mover también sus descendientes.
- Padres e hijos de Historia entre capítulos diferentes.
- Referencias de campaña jerárquicas y plegadas por defecto.
- Creación opcional de fichas del Cuaderno desde escenas y marcadores del Atlas (excepto NPC, que conserva su tratamiento privado).
- Fichas internas del Atlas reutilizables por varios NPC/marcadores.
- Vista limpia de fichas internas: los campos vacíos no se muestran y el botón ✎ activa la edición.
- Árboles jerárquicos del Atlas plegados inicialmente.
- Nuevas ramas del Cuaderno nacen plegadas; se respeta el estado abierto/cerrado ya guardado en campañas anteriores.


## Base heredada: v2.10.0

## Cambio de esta versión
- **Historia** pasa de tres columnas a un mapa mental editable organizado por capítulos.
- Puedes crear, renombrar y eliminar capítulos definidos por ti.
- Cada nodo puede arrastrarse libremente por el mapa y también moverse con controles de dirección.
- Al marcar un nodo como **Ha ocurrido**, se desbloquean sus hijos directos; si un hijo tiene varios padres puedes exigir todos o cualquiera.
- Botón **Añadir hijo directo** para construir ramas rápidamente.
- Cada nodo admite referencias a fichas del **Cuaderno**, escenas del **Atlas** y marcadores del Atlas.
- Se mantienen los desbloqueos latentes ya existentes: una escena o marcador puede aparecer cuando ocurre un nodo de Historia.
- Los sucesos de versiones 2.9.x se migran automáticamente a **Capítulo 1** y reciben una posición inicial en el mapa; no se pierden sus estados ni sus vínculos al Atlas.
- Los desplegables de desbloqueo del Atlas agrupan los nodos por capítulo.