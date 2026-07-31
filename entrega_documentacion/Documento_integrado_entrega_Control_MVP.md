# Documento integrado de entrega - Control MVP

## 1. Informacion general del proyecto

### 1.1 Nombre del proyecto

Control MVP - Sistema de reservas, prestamos, devoluciones e inventario para el Laboratorio de Idiomas de la Universidad EAFIT.

### 1.2 Fecha del documento

12 de mayo de 2026.

### 1.3 Tipo de solucion

El proyecto corresponde a un MVP funcional desarrollado en Power Apps Canvas. Su proposito es organizar en una sola aplicacion los procesos principales del laboratorio relacionados con la solicitud de recursos, la gestion operativa de prestamos, la devolucion de materiales, la cancelacion de reservas y la consulta de inventario.

### 1.4 Proposito de este documento

Este documento integra en un solo archivo toda la documentacion principal del proyecto. Su objetivo es servir como soporte de entrega academica y como base para la transcripcion posterior a Word si se requiere. Aqui se consolidan el contexto del sistema, los flujos funcionales, la ficha tecnica, la validacion realizada, la explicacion del prototipo y las observaciones finales de entrega.

## 2. Descripcion general del sistema

El sistema fue concebido para responder a una necesidad concreta del Laboratorio de Idiomas: controlar de forma clara y trazable el uso de recursos fisicos, evitando que la operacion diaria dependa de mensajes dispersos, registros manuales o consultas aisladas en distintas fuentes.

Antes del MVP, los procesos de reserva, entrega, devolucion y seguimiento podian resultar fragmentados. Con esta solucion, se planteo una aplicacion centralizada que permite diferenciar claramente tres momentos del proceso:

- la solicitud del recurso
- la gestion operativa del prestamo
- el seguimiento administrativo del historial y el inventario

Esta separacion es importante porque evita mezclar acciones que tienen objetivos distintos. Reservar no es lo mismo que prestar, devolver no es lo mismo que cancelar, y consultar historial no es lo mismo que operar el dia a dia. El MVP organiza esas responsabilidades dentro de la app para que cada modulo cumpla una funcion precisa.

## 3. Objetivo general y objetivos especificos

### 3.1 Objetivo general

Centralizar la gestion de reservas, prestamos, devoluciones, cancelaciones e inventario del Laboratorio de Idiomas en una sola herramienta operativa con trazabilidad, visibilidad y soporte para la toma de decisiones.

### 3.2 Objetivos especificos

- permitir que los usuarios creen y consulten reservas de recursos disponibles
- concentrar en un modulo operativo la gestion de entregas, devoluciones y cancelaciones
- mantener trazabilidad de los cambios de estado sin eliminar informacion historica relevante
- facilitar la consulta de inventario de recursos y cocina
- ofrecer vistas complementarias para seguimiento diario, alertas y reportes
- mejorar la claridad del flujo funcional separando la etapa de reserva de la etapa de prestamo

## 4. Alcance del MVP

El MVP cubre el flujo principal del sistema y permite demostrar el funcionamiento operativo esencial del laboratorio. En su estado actual, el alcance incluye:

- autenticacion institucional e ingreso al sistema
- identificacion del rol del usuario al iniciar sesion
- acceso a un tablero principal con navegacion centralizada
- creacion y consulta de reservas
- gestion de prestamos desde una bandeja operativa unificada
- registro de entregas y devoluciones
- cancelacion de reservas con conservacion de historial
- consulta de inventario de recursos y cocina
- vistas de apoyo como Vista Hoy, Alertas, Centro de decision y Reportes

No se trata de una solucion empresarial cerrada en todas sus capas, sino de un MVP funcional validado sobre el recorrido principal. Esto significa que el proyecto ya resuelve el problema central y permite operar el flujo clave, aunque a futuro podria ampliarse con mayores controles de backend, gobierno de datos, auditoria o automatizaciones adicionales.

## 5. Usuarios y roles del sistema

El comportamiento del sistema depende del tipo de usuario que ingresa.

### 5.1 Docente

El docente es el usuario que principalmente solicita recursos. Su participacion se concentra en la reserva y en la consulta del estado de sus solicitudes. No gestiona directamente acciones sensibles como registrar una entrega o una devolucion. Su rol dentro del sistema es principalmente de consulta y solicitud.

Funciones principales del docente:

- crear reservas
- consultar reservas registradas
- revisar el estado de materiales solicitados
- navegar por las vistas autorizadas segun su perfil

### 5.2 Administrador

El administrador es el perfil operativo del laboratorio. Este rol si interviene en la ejecucion real del proceso, porque convierte una reserva en un prestamo, registra devoluciones, cancela solicitudes cuando corresponde y consulta el panorama global del inventario y del historial.

Funciones principales del administrador:

- revisar reservas pendientes
- registrar la entrega de materiales
- registrar devoluciones
- cancelar reservas
- consultar inventario y estados operativos
- usar vistas de seguimiento y lectura administrativa

### 5.3 SuperAdmin

El perfil SuperAdmin conserva las capacidades del administrador y puede tener acceso ampliado a otras vistas o controles de supervision. En este MVP se considera un rol con mayor nivel de gestion, especialmente util para administracion extendida o toma de decisiones.

## 6. Entidades principales de informacion

El sistema se apoya en un conjunto de entidades que representan la informacion esencial del negocio.

### 6.1 Usuarios

Contiene la informacion de identidad y rol de las personas que acceden a la aplicacion. Esta entidad permite determinar si el usuario que inicia sesion es docente, administrador o SuperAdmin.

### 6.2 Reservas

Registra las solicitudes de uso de recursos realizadas por los usuarios. En esta entidad se conserva el detalle de cada solicitud, su fecha, su estado y su trazabilidad posterior.

### 6.3 Prestamos

Representa la operacion real del recurso cuando la reserva ya pasa al momento de entrega o uso. Aqui se registra si el prestamo esta activo, vencido o devuelto.

### 6.4 Recursos

Corresponde al inventario general de materiales, juegos, libros y otros elementos del laboratorio que pueden ser consultados o reservados.

### 6.5 Cocina

Corresponde a un grupo especifico de recursos o inventario administrado dentro del mismo ecosistema funcional del MVP.

Estas entidades permiten que el sistema conserve continuidad entre la solicitud inicial, la operacion posterior y la consulta historica.

## 7. Arquitectura funcional del sistema

La arquitectura del MVP no se planteo como una sola lista de pantallas sin orden, sino como una estructura funcional con responsabilidades separadas.

### 7.1 Capa de acceso

Corresponde a la autenticacion institucional. Aqui el sistema identifica al usuario, normaliza el correo y determina su rol antes de permitir el ingreso al tablero principal.

### 7.2 Capa de navegacion principal

Es el tablero o centro operativo desde donde el usuario puede dirigirse a los modulos funcionales disponibles. Esta pantalla organiza la experiencia y evita depender de accesos aislados.

### 7.3 Capa de solicitud

Esta capa se materializa principalmente en el modulo de Reservas. Su objetivo es que el usuario cree la solicitud y consulte su estado, pero sin ejecutar aun la operacion real del prestamo.

### 7.4 Capa operativa

Se concentra en el modulo de Prestamos. Aqui se realizan las acciones sensibles: registrar entrega, registrar devolucion, editar casos operativos y cancelar reservas. Esta separacion fue una decision importante del proyecto, porque permite que la pantalla de reservas se dedique a reservar y que la pantalla de prestamos se dedique a gestionar.

### 7.5 Capa de seguimiento y apoyo administrativo

Incluye pantallas como Vista Hoy, Alertas, Centro de decision y Reportes. Estas vistas no sustituyen el proceso operativo, pero si transforman la informacion registrada en una lectura administrativa util.

## 8. Modulos principales del MVP

El MVP quedo estructurado en varios modulos o pantallas funcionales.

### 8.1 Login

Es la puerta de entrada al sistema. Su funcion es autenticar al usuario y reconstruir el contexto de sesion necesario para el resto de la aplicacion.

### 8.2 Tablero principal

Organiza la navegacion general del sistema y centraliza el acceso a los modulos disponibles. Desde aqui tambien se incluyo la accion de cerrar sesion, importante para mantener un flujo de acceso mas seguro y coherente.

### 8.3 Reservas

Este modulo se enfoca en la consulta y programacion de reservas. Su responsabilidad es permitir que el usuario solicite recursos y revise el estado de sus solicitudes.

### 8.4 Formulario de reserva

Es la pantalla donde se registra el detalle de una nueva reserva. Incluye seleccion de material, fecha, bloque horario y observaciones, ademas de la validacion de disponibilidad.

### 8.5 Prestamos

Es la bandeja operativa central del laboratorio. Aqui se agrupan reservas pendientes, prestamos activos, vencidos, devueltos y cancelaciones visibles para trazabilidad.

### 8.6 Formulario operativo de prestamo

Permite registrar la entrega de un recurso o la devolucion de un prestamo. Es una pantalla clave porque conecta la solicitud con la operacion real.

### 8.7 Inventario, recursos y cocina

Permiten consultar materiales y estados de disponibilidad. Tambien sirven como punto de entrada para iniciar reservas desde el contexto del recurso.

### 8.8 Vistas de seguimiento

Incluyen Vista Hoy, Alertas, Centro de decision y Reportes. Estas pantallas aportan lectura sintetica del estado del sistema y facilitan supervision o analisis.

## 9. Flujo general del sistema

El recorrido funcional principal puede resumirse asi:

1. El usuario inicia sesion con su cuenta institucional.
2. El sistema identifica el rol y carga el contexto correspondiente.
3. El usuario llega al tablero principal.
4. Desde el tablero puede navegar a Reservas, Prestamos, Inventario o vistas de seguimiento.
5. Si el usuario necesita solicitar un recurso, realiza la reserva.
6. Si el caso ya entra en operacion, el administrador lo gestiona desde Prestamos.
7. El sistema conserva el historial del caso y actualiza los estados visibles para consulta posterior.

Este flujo general permite entender que el MVP no es solo una app para registrar datos, sino una herramienta que acompana la secuencia del proceso completo.

## 10. Flujos funcionales detallados

### 10.1 Flujo de autenticacion e ingreso

El usuario accede a la pantalla de inicio de sesion. La aplicacion toma la cuenta institucional activa y la normaliza para evitar inconsistencias en la identificacion del usuario. Luego consulta la informacion de roles disponible y define a que tipo de experiencia puede acceder la persona autenticada.

El resultado de este flujo es que el usuario no solo entra a la app, sino que entra con un contexto funcional resuelto: quien es, que puede ver y desde donde debe comenzar a operar.

### 10.2 Flujo del tablero principal

Una vez autenticado, el usuario llega al tablero principal. Esta pantalla tiene la funcion de actuar como centro operativo del sistema. No es solamente una portada visual: organiza la navegacion, resume los modulos del proyecto y facilita el acceso rapido a cada zona funcional.

Desde esta pantalla se puede:

- ir al modulo de Reservas
- ir al modulo de Prestamos
- consultar Inventario
- acceder a Vista Hoy, Alertas, Centro de decision y Reportes
- cerrar sesion

La incorporacion del boton de cierre de sesion fue relevante porque mejora la consistencia del flujo de acceso y evita que la experiencia dependa de cerrar el navegador o salir de forma informal.

### 10.3 Flujo de reserva de recursos

El usuario entra al modulo de Reservas y tiene la posibilidad de consultar registros existentes o iniciar una nueva solicitud. Cuando abre el formulario de reserva, selecciona el material que necesita, la fecha, el bloque horario y cualquier observacion adicional necesaria para contextualizar la solicitud.

Antes de confirmar, la aplicacion valida la disponibilidad del recurso y revisa si el estado del material permite reservarlo. Si la informacion es valida, se registra la reserva.

Este flujo fue pensado para que el usuario pueda solicitar recursos de manera clara, sin confundirse con acciones operativas como prestar o devolver. Por eso la reserva representa la intencion formal de uso, no la entrega fisica del material.

### 10.4 Flujo de consulta de reservas

Dentro de Reservas tambien existe la posibilidad de filtrar y revisar solicitudes ya creadas. El usuario puede visualizar reservas Activas, Completadas, Canceladas o consultar Todos los registros visibles segun su perfil.

La importancia de este flujo no esta solo en mostrar datos, sino en dejar clara la separacion funcional del sistema. La pantalla de Reservas se usa para consultar y programar; la operacion posterior se realiza en Prestamos. Esto evita ambiguedad en la experiencia del usuario y en la logica del negocio.

### 10.5 Flujo de gestion operativa en Prestamos

El modulo de Prestamos concentra la gestion real del laboratorio. Cuando el administrador entra a esta pantalla, encuentra una bandeja unificada que puede incluir reservas pendientes, prestamos activos, casos vencidos, devoluciones registradas y cancelaciones trazables.

La vista permite filtrar por estados operativos como:

- Todos
- Activos
- Vencidos
- Devueltos
- Canceladas

Tambien puede segmentar por tipo de material, lo que facilita concentrarse en juegos, libros, cocina u otros grupos de recursos.

Este flujo fue una mejora estructural importante del proyecto. La idea central es que la operacion del laboratorio se gestione en una sola bandeja, en lugar de repartir acciones sensibles en varios puntos de la aplicacion.

### 10.6 Flujo de entrega o generacion de prestamo

Cuando existe una reserva pendiente y el recurso va a ser entregado, el administrador entra al formulario operativo de Prestamos. Alli registra la entrega del recurso, con lo cual el sistema crea o actualiza el prestamo correspondiente.

Este paso marca la transicion entre la solicitud y la operacion real. Desde este momento, el caso deja de ser una simple reserva pendiente y pasa a formar parte del conjunto de prestamos activos que deben ser monitoreados hasta su devolucion.

### 10.7 Flujo de devolucion

Cuando el recurso regresa al laboratorio, el administrador selecciona el caso correspondiente y registra la devolucion. En ese momento, el sistema actualiza el estado del prestamo, modifica la disponibilidad del recurso segun corresponda y conserva evidencia del cierre de la operacion.

La devolucion es importante porque no solo libera el material: tambien cierra el ciclo del caso y lo convierte en un registro util para seguimiento, historial y reportes.

### 10.8 Flujo de cancelacion

Si una reserva no debe continuar, el administrador puede cancelarla desde la vista operativa. Al hacerlo, la reserva cambia a estado Cancelada, pero no se elimina fisicamente del sistema.

Este punto es uno de los mas relevantes del MVP, porque la cancelacion fue concebida con criterio de trazabilidad. En lugar de borrar el registro y perder contexto, la app conserva la informacion para que pueda ser consultada despues. Esto permite auditoria basica, lectura historica y explicacion administrativa de lo ocurrido con cada caso.

Ademas, las cancelaciones quedaron visibles mediante un filtro especifico dentro de Prestamos, lo cual evita que desaparezcan de la operacion y se pierda visibilidad sobre ellas.

### 10.9 Flujo de inventario y consulta de recursos

Los modulos de inventario, recursos y cocina permiten revisar disponibilidad, estado y cantidad de materiales. Esta consulta es importante tanto para la planeacion como para la operacion. En algunos casos, desde el propio contexto del recurso es posible iniciar una reserva, lo que hace mas directo el proceso.

Este flujo conecta la capa informativa del sistema con la capa de accion, ya que no se limita a mostrar inventario, sino que facilita que el usuario actue a partir de la informacion disponible.

### 10.10 Flujo de seguimiento y apoyo administrativo

El MVP incluye varias vistas destinadas a interpretar la informacion registrada:

- Vista Hoy, para observar el comportamiento diario
- Alertas, para identificar casos que requieren atencion
- Centro de decision, para sintetizar informacion util en la priorizacion
- Reportes, para revisar la operacion de forma consolidada

Estas pantallas complementan el trabajo diario porque permiten leer el estado del sistema sin tener que revisar manualmente cada modulo operativo.

## 11. Estados principales del negocio

Los estados son fundamentales porque permiten entender en que momento del ciclo se encuentra cada caso.

### 11.1 Estados de reservas

- Activa: la solicitud fue creada y se encuentra vigente.
- Cancelada: la solicitud fue anulada, pero su registro sigue visible para trazabilidad.
- Completada: la solicitud fue atendida dentro del flujo operativo.

### 11.2 Estados de prestamos

- Pendiente: corresponde a una reserva activa que aun no ha sido atendida con entrega.
- Activo: el recurso ya fue entregado y el prestamo esta en curso.
- Vencido: el prestamo supero la fecha esperada y requiere seguimiento.
- Devuelto: el recurso fue regresado y el caso quedo cerrado.

### 11.3 Estados de inventario

- Disponible: el recurso puede ser usado o reservado.
- Prestado: el recurso esta comprometido en una operacion activa.
- Danado: el recurso no esta en condiciones normales de uso.

## 12. Reglas de negocio relevantes

Durante el desarrollo del MVP quedaron definidas varias reglas funcionales importantes:

- los docentes solicitan y consultan, pero no ejecutan operaciones sensibles
- la gestion operativa de entrega, devolucion y cancelacion se concentra en perfiles administrativos
- las cancelaciones deben conservar trazabilidad y no eliminar fisicamente el registro
- la pantalla de Reservas debe usarse para reservar, no para administrar prestamos
- la pantalla de Prestamos debe actuar como bandeja central de gestion operativa
- la disponibilidad y el estado del recurso condicionan la posibilidad de reservar o prestar

Estas reglas permitieron darle coherencia al sistema y evitar que la experiencia se sintiera mezclada o contradictoria.

## 13. Ficha tecnica consolidada

### 13.1 Plataforma y tecnologias utilizadas

- Power Apps Canvas
- Power Fx
- Excel Online Business como origen de datos operativo
- Power Platform CLI para empaquetado y validacion tecnica

### 13.2 Pantallas funcionales principales identificadas en el MVP

- ScrLogin
- Screen1
- ScrReservas
- ScrItemFormReserva
- ScrPrestamos
- ScrItemFormPrestamo
- ScrRecursos
- ScrCocina
- ScrVistaHoy
- ScrAlertas
- ScrCentroDecision
- ScrReportes

### 13.3 Modulos cubiertos

- autenticacion institucional
- tablero principal
- reservas
- prestamos y entregas
- devoluciones
- cancelaciones con trazabilidad
- inventario de recursos y cocina
- seguimiento diario, alertas y reportes

### 13.4 Estado del proyecto al cierre

El proyecto quedo en estado de MVP funcional validado sobre el flujo principal. Se verificaron los recorridos clave de login, navegacion, reserva, gestion de prestamos, cancelaciones y visibilidad operativa. El artefacto final fue empaquetado y conservado como prototipo funcional en formato .msapp.

## 14. Validacion realizada

### 14.1 Validacion tecnica

Antes del cierre se realizaron validaciones tecnicas sobre la estructura funcional del MVP. Entre ellas:

- revision de formulas en pantallas criticas del Canvas unpack
- correccion de errores hasta lograr estado limpio en los archivos funcionales principales
- validacion del empaquetado con Power Platform CLI
- comprobacion de consistencia mediante roundtrip de pack y unpack

Estas revisiones permitieron asegurar que el artefacto final no fuera solamente visualmente correcto, sino tambien coherente a nivel de estructura funcional y empaquetado.

### 14.2 Validacion funcional

Tambien se ejecutaron pruebas sobre el comportamiento del sistema. Se validaron, entre otros, los siguientes recorridos:

- inicio de sesion con cuenta institucional
- cierre de sesion y reingreso
- navegacion desde el tablero principal
- ingreso a Reservas y apertura del formulario de nueva reserva
- ingreso a Prestamos y acceso a la gestion operativa
- visibilidad completa de formularios y acciones inferiores
- separacion funcional entre Reservas y Prestamos
- permanencia de cancelaciones dentro de la trazabilidad operativa

### 14.3 Ajustes funcionales relevantes implementados

Durante la evolucion del MVP se consolidaron mejoras importantes:

- el sistema inicia desde login, no desde una pantalla operativa intermedia
- se agrego boton de cerrar sesion en el tablero principal
- se ajusto el lenguaje funcional para hablar de entrega y devolucion, evitando copy confuso de retiro
- se mejoro la responsividad y la visibilidad de formularios
- se fortalecio el manejo de cancelaciones para conservar historial
- se incorporo un filtro especifico de Canceladas en Prestamos

### 14.4 Consideraciones operativas sobre la validacion

Es importante aclarar que algunos estados visibles en la aplicacion dependen de la data real del entorno en el momento de la prueba. Por ejemplo, si la vista Devueltos aparece vacia, eso no implica necesariamente un fallo del modulo, sino la ausencia de registros con ese estado en la fuente conectada en ese instante.

Tambien debe tenerse presente que el comportamiento visual final en Power Apps depende del runtime y de la conexion al origen de datos. Aun asi, el flujo principal del MVP quedo validado y funcional.

## 15. Prototipo entregable

### 15.1 Que debe entregarse como prototipo

En este proyecto, el prototipo funcional no es una maqueta estatica ni una imagen del sistema. El prototipo real es el artefacto ejecutable de Power Apps Canvas, es decir, el archivo .msapp resultante del trabajo realizado.

Por esa razon, el prototipo entregable del proyecto corresponde a:

- Prototipo/Control_MVP_final_20260505_canceladas.msapp

### 15.2 Por que el .msapp es el prototipo correcto

Ese archivo contiene la aplicacion funcional que materializa el MVP. Es el formato natural del prototipo en este contexto, porque permite importar la app en Power Apps Studio y revisar el producto construido. No seria correcto reemplazarlo por una descripcion textual o por capturas como si fueran el prototipo principal, ya que el sistema ya existe en forma ejecutable.

### 15.3 Como abrir el prototipo

Para revisar el prototipo se debe:

1. ingresar a Power Apps Studio
2. seleccionar la opcion de importar una app Canvas
3. cargar el archivo .msapp incluido en la carpeta de entrega

## 16. Entregables incluidos y pendiente externo

### 16.1 Entregables incluidos en la carpeta de documentacion

- este documento integrado en formato Markdown
- el archivo .msapp del prototipo funcional

### 16.2 Entregable pendiente por parte del equipo

La base de datos o archivo de inventario en formato .xlsx se contempla como un anexo externo que debe ser adjuntado por el equipo en la entrega final, ya que no forma parte del artefacto funcional del MVP pero si del paquete total solicitado.

## 17. Conclusion general

El proyecto Control MVP logra articular en una sola herramienta los procesos esenciales del Laboratorio de Idiomas: reservar, operar, devolver, cancelar y consultar. El valor principal de la solucion no esta solo en mostrar pantallas, sino en haber organizado la logica del proceso de una forma clara, separando la solicitud de la gestion operativa y conservando trazabilidad en estados criticos como las cancelaciones.

Desde la perspectiva academica, este documento demuestra que el proyecto no fue un conjunto aislado de formularios, sino una propuesta funcional con estructura, reglas de negocio, recorrido operativo y validacion real. Desde la perspectiva de entrega, deja claro que el prototipo del sistema es el archivo .msapp y que la documentacion puede transcribirse a Word sin perder el sentido del trabajo desarrollado.