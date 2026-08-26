# Versión 2.13.0 · Giro del fondo del Atlas

Base: v2.12.9 / v2.12.8 funcional.

## Atlas

- Añadidos controles ↶ y ↷ junto al botón de Fondo para girar la escena 90° a izquierda o derecha.
- El giro transforma también marcadores, líneas, formas, zonas y niebla para que sigan anclados al mismo punto físico del mapa.
- Los marcadores no giran visualmente: su icono y su nombre permanecen derechos, con el texto debajo.
- La proyección de jugadores recibe la imagen y coordenadas ya giradas, por lo que mantiene la misma disposición.
- En mapas creados con el editor, la orientación elegida se conserva cuando el mapa vuelve a generarse.
- Sustituir la imagen de fondo conserva la orientación actual de la escena.

## Compatibilidad

- Las escenas antiguas se consideran con orientación 0° y no necesitan migración manual.
- Se mantienen intactos Mundo, Personalidad, Cuaderno, Historia, Batalla y organizaciones.
