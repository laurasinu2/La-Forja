# La Forja del Narrador

Aplicación web local y sin dependencias para organizar campañas de rol. Está preparada para abrirse y editarse en Visual Studio Code.

## Abrir en Visual Studio Code

1. Abre la carpeta `la_forja_del_narrador_app` en VS Code.
2. Instala la extensión **Live Server** si todavía no la tienes.
3. Haz clic derecho en `index.html` y elige **Open with Live Server**.

También puede abrirse `index.html` directamente. Para utilizar el modo instalable/PWA y el service worker conviene ejecutarla mediante `localhost`.


## Versión 2.1 · Editor de mazmorras — Fase 1

- Al crear una escena del Atlas se puede elegir entre **Imagen subida** y **Mapa creado**.
- Las escenas de tipo Mapa creado abren una vista separada de **Editor de mazmorras**.
- El editor usa una cuadrícula cuadrada en la que cada casilla representa **1 m²**. La cuadrícula y el ajuste automático se pueden activar o desactivar.
- Herramientas de selección, movimiento del lienzo, habitaciones rectangulares, pasillos, paredes, texto y borrador.
- Elementos arquitectónicos: puertas simples, dobles y secretas, escaleras de subida y bajada, rejas, ventanas, columnas, fosos y puentes.
- Mobiliario: mesas, sillas, camas, estanterías, armarios, cofres, barriles, cajas, altares, estatuas, antorchas y braseros.
- Señales rápidas del DM para trampas, secretos y puntos de interés. Los marcadores interactivos continúan añadiéndose desde Atlas.
- Seis estilos preestablecidos: mazmorra de piedra, ruina, cueva, fortaleza, madera/taberna y templo.
- Texturas repetitivas predefinidas para piedra clara u oscura, madera, tierra, arena, baldosa, agua, hierba, ladrillo, ruina y cueva.
- Controles avanzados para colores de suelo, paredes, trazos, puertas, objetos, texto y cuadrícula, además de grosor, sombras y relieve.
- Selección, arrastre, redimensionado, rotación desde el inspector, duplicado, borrado, visibilidad y orden de capas.
- Historial de deshacer y rehacer, zoom, encaje automático y cambio de tamaño del mapa hasta 120 × 120 m.
- Cada mapa conserva simultáneamente el **proyecto editable** dentro de la campaña y un **PNG renderizado** que se utiliza como imagen normal del Atlas.
- Botones para guardar, guardar y volver al Atlas, exportar el PNG y exportar un archivo de proyecto `.forja-map.json`.
- El PNG generado se integra con las escenas hijas, marcadores, conexiones, niebla de guerra y proyección existentes.
- La importación de texturas propias y el generador aleatorio de mazmorras quedan reservados para las siguientes fases.

## Versión 2.0 · Atlas y modo de proyección

- Nueva pantalla inicial para elegir entre **DM** y **Jugador**.
- Cada campaña tiene su propia contraseña de DM. La primera vez aparece el mensaje «Esta campaña todavía no tiene contraseña. Crea una para continuar».
- Opción **Recordar este dispositivo como DM** y cambio de contraseña desde el panel lateral ☰.
- Nueva vista **Atlas** con escenas anidadas sin límite: Mundo → Región → Pueblo → Tienda, mazmorra, habitación, etc.
- Cada escena puede usar una imagen de fondo distinta, guardada en `IndexedDB`.
- Marcadores con nombre pequeño, icono, categoría, visibilidad, escena de destino y relaciones opcionales con entradas del cuaderno.
- Categorías incluidas para ciudades, tiendas, ruinas, caminos, enemigos, combates, secretos, portales y otros puntos. El DM también puede crear categorías propias.
- Herramientas de texto, líneas, flechas, círculos y rectángulos, todas con control de visibilidad para jugadores.
- Niebla de guerra mediante pincel para revelar, pincel para volver a ocultar, radio ajustable y zonas preparadas que se activan o desactivan con un clic.
- La niebla del DM mantiene una opacidad uniforme y translúcida incluso al volver a ocultar; el pincel interpola el trazo para pintar de forma continua. Los botones **Tapar todo** y **Revelar todo** permiten restaurar cualquiera de los dos estados completos de la escena.
- Botón **Mostrar esta escena** y ventana independiente de **Proyección** para un segundo monitor.
- Dos modos de navegación pública: **Seguir al DM** y **Exploración libre** por las escenas ya descubiertas.
- Los jugadores solo ven el mapa, las zonas reveladas, los marcadores permitidos y sus nombres. No ven fichas, estadísticas, notas ni conexiones privadas.
- El DM puede proyectar y cerrar la tabla de artículos de una tienda o comerciante relacionado con un marcador.
- Las relaciones entre marcadores y fichas aparecen también dentro del apartado Conexiones de la ficha.
- Nuevo panel lateral para seguridad, exportación e importación.
- Dos formatos de copia: **JSON ligero** sin imágenes y **ZIP completo** con el perfil y todos los fondos del Atlas.

La proyección de esta versión web sincroniza ventanas del **mismo navegador y ordenador**, pensada para usar un segundo monitor. La conexión de jugadores por Wi-Fi, QR y código temporal queda preparada como evolución para una futura aplicación de escritorio; una web estática no puede abrir por sí sola un servidor de red local.

La contraseña evita accesos accidentales desde la interfaz, pero sigue siendo una protección local: una persona con acceso directo a los archivos y a las herramientas de desarrollo del navegador podría manipular la aplicación.

## Cambios anteriores

- Las fichas de criaturas incluyen ahora un campo editable de **Iniciativa** junto a HP, AC y Velocidad. Las criaturas antiguas reciben inicialmente el modificador de Destreza como valor de iniciativa, pero después puede editarse de forma independiente.
- Los inventarios de **PNJ vendedor / Comerciante** y **Tienda / Comercio** separan ahora el precio en una cantidad numérica y una moneda seleccionable: `cp`, `sp`, `gp` o `ptp`. Cada moneda incluye un indicador visual de cobre, plata, oro o platino.
- Se han ajustado varios iconos: Región usa un mapa doblado, Misión principal muestra un interrogante perfectamente centrado dentro de un círculo, Misión secundaria conserva el interrogante simple y Tesoro utiliza un cofre monocromo dibujado como silueta.
- El editor Markdown aplica ahora títulos, notas y listas a **todas las líneas seleccionadas**, no solo a la primera. Las listas numeradas se renumeran automáticamente y al pulsar de nuevo el mismo formato se elimina de todo el bloque.
- Negrita, cursiva y tachado también funcionan correctamente cuando la selección ocupa varias líneas.
- En las fichas de **Elementos**, Ubicación, Leyenda y Habilidades funcionan ahora como colecciones ordenadas: cada formulario añade un apunte independiente, los apuntes se muestran como tarjetas numeradas y pueden subirse, bajarse o eliminarse.
- Los antiguos textos de esos tres campos se migran automáticamente a la primera tarjeta de su sección.
- Se ha ensanchado y centrado por completo la columna de modificadores de la mesa de dados, evitando títulos cortados y números desalineados.
- Entre tablet y escritorio, el panel de modificadores cambia a una cuadrícula más ancha cuando el espacio vertical u horizontal es limitado.
- Los botones de **importar** y **exportar** vuelven a estar disponibles en móvil. En pantallas muy estrechas, la cabecera se divide en dos filas para conservar todas las acciones sin desbordamiento.
- Se ha corregido el comportamiento responsive de las cinco colecciones:
  - En pantallas amplias se mantienen los cinco árboles simultáneos.
  - Cuando el panel deja de tener espacio suficiente, las categorías pasan a pestañas y solo se muestra el árbol activo.
  - De este modo no se comprimen nombres, iconos y niveles del árbol en columnas demasiado estrechas.
  - En móvil se conservan el desplazamiento interno de cada árbol y una ficha adaptable, sin desplazamiento horizontal de toda la página.
- Nueva vista **Dados**, junto a Cuaderno, Calendario y Mapa:
  - Dados d4, d6, d8, d10, d12, d20 y d100.
  - La cantidad de cada dado se aumenta pulsando el dado o su botón `+`, y se reduce con `−`.
  - Modificadores desde `+20` hasta `−20`, incluido `0`, mostrados como botones contiguos.
  - El modificador activo y el resultado utilizan el color destacado de la interfaz.
  - Fórmula editable, por ejemplo `2d20 + 4`, `3d6 - 2` o `1d8 + 1d4 + 5`.
  - Los dados siempre generan valores entre `1` y el número de caras; nunca puede salir `0`.
  - Desglose visible de cada resultado, por ejemplo `(10 + 15) + 4 = 29`.
  - Historial independiente para cada campaña, con opción de reutilizar una fórmula anterior.
- Se mantienen los items obtenibles de las localizaciones, el calendario manual de campaña y el mapa mental de conexiones.

- El mapa mental utiliza ahora una distribución radial **por ramas**: la ficha con más conexiones —o la localización filtrada— ocupa el centro.
- Las fichas conectadas directamente se colocan cerca de su ficha de origen, y sus propias conexiones se agrupan alrededor de ellas. Por ejemplo, una ruina puede quedar apartada del centro mientras sus bandidos la rodean, y una misión queda junto al bandido que la activa.
- La distancia depende del número real de conexiones atravesadas, no de un único anillo global. Esto conserva visualmente cada cadena y cada grupo relacionado.
- Los nodos mantienen un radio mínimo de separación para evitar solapamientos.
- Cada nodo se puede mover arrastrándolo; al desplazarlo, los nodos próximos se apartan automáticamente y la posición se guarda dentro de la campaña.
- La primera vez que se abre esta versión, las posiciones antiguas del mapa se reorganizan automáticamente para aplicar el nuevo sistema por ramas.
- El fondo del mapa continúa pudiéndose arrastrar para desplazar la vista completa.

## Funciones principales

- Perfil local con varias campañas independientes.
- Cinco columnas ramificadas: Localizaciones, Organizaciones, Criaturas, Misiones y Elementos.
- Árboles con niveles ilimitados, reordenación mediante arrastre y botones de subir/bajar.
- Clases e iconos propios para cada categoría.
- Estados adaptados a cada categoría y tachado automático de entradas muertas, destruidas, disueltas o irrelevantes.
- Descripción en Markdown visual con títulos, listas, notas, negrita, cursiva, tachado y enlaces.
- Estadísticas de criaturas con HP, AC, velocidad, iniciativa, atributos y modificadores automáticos.
- PNJ vendedor y localización de tipo Tienda con tabla de nombre, cantidad, moneda y descripción de artículos.
- Localizaciones con tabla de items obtenibles, rareza, forma de conseguirlos y ficha relacionada.
- Items transportados, conexiones interactivas y journal cronológico.
- Calendario de campaña manual con eventos enlazados a fichas.
- Mapa mental de conexiones con filtro por localización.
- Tirador de dados con fórmulas, modificadores, desglose e historial.
- Buscador global por campaña.
- Guardado automático mediante `localStorage`.
- Exportación e importación en JSON ligero o ZIP completo con imágenes del Atlas.
- Tema claro y oscuro.
- PWA básica para instalar la aplicación desde un navegador compatible.

## Archivos principales

- `index.html`: estructura de la interfaz.
- `styles.css`: diseño completo y adaptación a pantallas pequeñas.
- `app.js`: perfil, campañas, árboles, editor, estadísticas, inventarios, conexiones, calendario, mapa y dados.
- `atlas.js`: acceso por rol, seguridad local, IndexedDB, Atlas, niebla, proyección y copias ZIP.
- `dungeon.js`: editor de mazmorras, herramientas de dibujo, texturas, mobiliario, renderizado y exportación PNG.
- `sw.js`: service worker y caché de la aplicación.
- `manifest.webmanifest`: configuración instalable.

## Datos y copias de seguridad

No utiliza servidor. Las campañas se guardan en `localStorage` y las imágenes del Atlas en `IndexedDB`. El JSON guarda la estructura y las campañas, pero no contiene los archivos de imagen. El ZIP completo incluye `profile.json`, un índice de medios y todos los fondos usados por el Atlas. La importación de una copia completa reemplaza el perfil local.

La descripción admite Markdown visual: `#` y `##` para títulos, `**texto**` para negrita, `*texto*` para cursiva, `-` o `1.` para listas, `>` para notas, `~~texto~~` para tachado y `[texto](https://...)` para enlaces. Los símbolos se ocultan al salir del modo de edición.


## Responsive 1.2.1

- En ventanas de menos de 1880 px, la ficha se coloca debajo de los árboles para que las cinco columnas mantengan un ancho legible.
- A 1280 px o menos, las colecciones pasan a pestañas y solo se muestra un árbol cada vez.
- Los títulos no se parten y el botón `+` conserva siempre su tamaño.
- La página no genera desplazamiento horizontal.

## Ajuste 1.2.2

- El menú de acciones de los tres puntos permanece dentro de la pantalla incluso con nombres muy largos.
- El título admite hasta dos líneas y aplica puntos suspensivos si todavía no cabe.
- Se eliminó el desplazamiento horizontal de los diálogos y se reinicia su posición al abrirlos.



## Detalles propios de Elementos

Las entradas de la colección **Elementos** sustituyen el inventario genérico por tres colecciones específicas: **Ubicación**, **Leyenda o qué se sabe** y **Habilidades que tiene**. Cada colección permite añadir varios apuntes independientes desde el formulario inferior, mostrarlos como tarjetas numeradas y cambiar su orden con los botones de subir y bajar. Los cambios se guardan automáticamente y forman parte de la exportación JSON.

### Árbol de escenas plegable

Las escenas con hijas muestran una flecha para plegar o desplegar su rama. El estado se conserva dentro de la campaña y, al abrir una escena interior desde un marcador o una ruta, sus escenas superiores se despliegan automáticamente.

### Ajustes de zonas y enfoque de jugador

- Las zonas preparadas de niebla pueden seleccionarse con la herramienta de cursor.
- Arrastra el interior de una zona para moverla y sus ocho tiradores para redimensionarla.
- También puedes pulsar el botón ↔ de la zona en el panel de capas para seleccionarla.
- La vista proyectada calcula el área revelada y la centra automáticamente, ampliándola cuando solo hay una parte pequeña del mapa visible.


## Corrección 2.1.3
- Restablecidas las herramientas de habitación, pasillo, pared, puertas y mobiliario del editor de mazmorras.
- Verificado el dibujo de habitaciones, pasillos, paredes, puertas de longitud libre y mobiliario.

## Controles de colocación y edición

- Las herramientas de mobiliario y arquitectura permanecen activas para colocar varios elementos seguidos.
- El objeto recién creado queda seleccionado, pero hacer clic sobre él vuelve a colocar otro elemento; solo sus tiradores interceptan el clic.
- Los cuatro vértices redimensionan el objeto según su orientación.
- El control `✥` permite moverlo libremente y el control `↻` girarlo en pasos de 45 grados. Mantén Shift durante el giro para usar un ángulo libre.
- Con Ctrl + clic (o Cmd + clic en macOS) puedes seleccionar un elemento antiguo sin abandonar la herramienta actual.

## Mejoras de organizacion del Atlas y texturas

- El selector Escena que abre de los marcadores se muestra como un arbol jerarquico plegable y desplazable con la rueda del raton.
- Las relaciones con el cuaderno respetan la estructura padre/hijo de cada una de las cinco colecciones.
- El boton Ficha DM abre la columna derecha real del Cuaderno como panel privado dentro del Atlas. La ficha elegida queda vinculada a la escena.
- El editor de mazmorras incorpora texturas mas visibles: tablas de madera, arena, tierra, baldosas, marmol, adoquines, piedra antigua y piedra con musgo.
- Las puertas dobles tienen dos hojas claramente diferenciadas.

## Cambios de esta revisión

- Las fichas relacionadas con un marcador que abre una escena quedan vinculadas a esa escena.
- La ficha prioritaria es una Localización; si no existe, una Criatura; después el resto.
- Los marcadores sin escena abren directamente su ficha DM cuando tienen una relación.
- La apertura automática de la ficha es opcional por marcador.
- El editor incluye estatuas de caballero o persona, portales rectangulares o arqueados y tarimas/pedestales elevados.


## Actualización: fichas compactas e imágenes de objetos

- El selector de la ficha vinculada del panel DM queda plegado en una sola línea y despliega el árbol solo cuando se necesita.
- Las estatuas incluyen cuatro variantes gráficas: guerrero/gladiador, dios con tridente, figura clásica y figura en movimiento.
- Cualquier objeto no estructural del editor puede sustituir su dibujo por una imagen PNG, SVG, WebP o JPG desde el panel de selección.
- Las imágenes personalizadas permanecen dentro del proyecto editable y se incluyen al generar el PNG del Atlas.

## Materiales del editor de mazmorras

El editor incluye materiales de suelo y pared a escala visible. Cada material permite ajustar escala, rotación e intensidad. Los patrones se calculan en coordenadas globales para que continúen entre habitaciones y pasillos conectados.

También se pueden importar texturas PNG, SVG, WebP o JPG. La aplicación las convierte internamente a PNG seguro y ofrece tres modos para el suelo: textura continua con bordes reflejados, cubrir todo el mapa y repetición original. El suelo puede aplicarse a todo el mapa o solo a la habitación/pasillo seleccionado. Las texturas se conservan en el proyecto editable y en el PNG generado para Atlas.

## v2.8.0

Esta versión añade marcadores proporcionales al mapa, NPC con actitud (enemigo/aliado/neutral), pseudónimo público opcional, zoom táctil en la proyección, código de acceso local y una carpeta de autoguardado/restauración local. La web sigue funcionando sin backend y puede publicarse como sitio estático en GitHub Pages.


## v2.8.1

- La niebla del Atlas conserva correctamente `fogBase`: si una escena se revela por completo, seguirá revelada al cerrar y volver a abrir la aplicación. Los cambios de revelar/ocultar se persisten inmediatamente.
- La ficha DM lateral muestra **Actitud hacia los PJ** cuando se abre desde un marcador NPC, incluso si la ficha procede del Cuaderno: Neutral/desconocido, Aliado o Enemigo. Cambiarla actualiza el color del marcador.
- La ficha lateral del Atlas se puede ensanchar o estrechar arrastrando su borde izquierdo en escritorio/tablet amplia; el ancho se recuerda en el dispositivo.
- Cambiar el tamaño de un mapa del diseñador ya no puede ocultar accidentalmente el trabajo existente: si se intenta reducir por debajo del contenido, La Forja conserva automáticamente el tamaño mínimo necesario.
- El diseñador incorpora **Selección múltiple** apta para táctil. También funciona con Shift/Ctrl/Cmd. Los elementos seleccionados se pueden mover juntos conservando sus distancias.
