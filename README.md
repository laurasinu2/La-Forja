# Versión 2.12.2 · Mundo visual, fichas en Atlas y batalla lateral

## Mundo · Criaturas
- La ficha visual se reorganiza en dos zonas claras: **información a la izquierda** e **imagen grande a la derecha**.
- La imagen no invade la información; una transición oscura suaviza la unión entre ambas zonas.
- La ficha sigue ocultando en lectura los apartados que no tienen contenido.
- En pantallas pequeñas la composición se apila para mantenerla usable.

## Mundo · Organizaciones
- La jerarquía sigue mostrando el mando arriba y los subordinados en niveles inferiores.
- Las conexiones ya no dependen de bordes CSS: se dibujan como líneas SVG entre el centro de cada superior y sus subordinados para evitar cortes, corchetes y trazos desalineados.
- La ficha de la organización permanece a la izquierda y el organigrama a la derecha en escritorio.

## Atlas · Fichas de Mundo
- Pulsar un marcador asociado a una criatura, personaje u organización **ya no cambia al apartado Mundo**.
- La ficha asociada se abre directamente en el panel lateral del Atlas.
- Las referencias de Mundo siguen siendo reutilizables: varios marcadores pueden apuntar a la misma ficha base.

## Atlas · Batalla
- Nuevo botón **⚔ Batalla**.
- El DM elige qué marcadores de la escena participan.
- Se abre un panel lateral y el mapa reduce su espacio para dejar sitio al panel.
- El panel muestra **exclusivamente la foto y el nombre** de cada participante: no muestra PG, CA, estados ni estadísticas.
- La vista de jugadores recibe el mismo panel lateral; el mapa se reajusta automáticamente en vez de ser sustituido.
- Funciona también mediante la proyección LAN de la APK y sincroniza las imágenes necesarias.
- La batalla puede editarse o cerrarse desde el propio panel.

## Compatibilidad
- Base: v2.12.1.
- Se conservan campañas, fichas de Mundo, referencias del Atlas, Historia, Cuaderno y demás datos existentes.
