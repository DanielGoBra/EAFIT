# Documento de flujos del sistema

Proyecto: Control MVP de reservas, prestamos e inventario

Institucion: Universidad EAFIT - Laboratorio de Idiomas

Version: 1.0

Fecha: 13 de mayo de 2026

## 1. Objetivo del documento

Documentar los flujos funcionales del sistema desarrollado como MVP para la gestion de reservas, prestamos, devoluciones, cancelaciones, consulta de inventario y seguimiento operativo del Laboratorio de Idiomas.

## 2. Alcance del sistema

El MVP cubre los siguientes procesos:

- autenticacion institucional e ingreso al sistema
- visualizacion del tablero principal segun rol
- creacion y consulta de reservas
- gestion operativa de prestamos y entregas
- registro de devoluciones
- cancelacion de reservas con trazabilidad
- consulta de inventario de recursos y cocina
- vistas de seguimiento como Vista Hoy, Alertas, Centro de decision y Reportes

El alcance actual corresponde a un MVP funcional validado sobre el flujo principal del sistema.

## 3. Actores y roles

### 3.1 Docente

- consulta sus reservas y prestamos
- crea reservas de recursos disponibles
- revisa el estado de sus solicitudes y materiales

### 3.2 Administrador

- consulta la operacion completa del laboratorio
- gestiona reservas pendientes
- registra entregas y devoluciones
- cancela reservas cuando aplica
- consulta inventario y vistas de seguimiento

### 3.3 SuperAdmin

- tiene las capacidades del perfil administrador
- accede adicionalmente a vistas y funciones ampliadas de gestion

## 4. Fuentes principales de informacion

El sistema trabaja sobre las siguientes entidades funcionales:

- Usuarios
- Reservas
- Prestamos
- Recursos
- Cocina

Estas entidades soportan la trazabilidad del recurso desde la solicitud hasta la gestion operativa y la consulta administrativa.

## 5. Flujo general del sistema

1. El usuario inicia sesion con su cuenta institucional.
2. El sistema resuelve el rol y muestra el tablero principal.
3. Desde el tablero, el usuario navega hacia Reservas, Prestamos, Inventario o vistas de seguimiento.
4. El docente puede crear reservas y consultar su estado.
5. El administrador puede transformar reservas pendientes en prestamos, registrar devoluciones o cancelar reservas.
6. Los cambios de estado impactan las vistas operativas y de seguimiento.
7. El sistema conserva trazabilidad para consulta posterior.

## 6. Flujos detallados del sistema

### 6.1 Flujo de autenticacion e ingreso

1. El usuario entra por la pantalla de inicio de sesion.
2. La app identifica la cuenta institucional activa.
3. Se normaliza el correo y se consulta el rol del usuario.
4. El sistema dirige al usuario al tablero principal.

Resultado esperado:

- acceso al sistema segun perfil
- carga de contexto de usuario y permisos
- navegacion al centro operativo principal

### 6.2 Flujo del tablero principal

1. El sistema presenta el centro operativo de idiomas.
2. El tablero resume los accesos principales del sistema.
3. Segun el rol, se habilitan modulos de consulta o gestion.
4. Desde esta pantalla se puede cerrar sesion o navegar a los modulos funcionales.

Modulos principales visibles desde el tablero:

- Reservas
- Prestamos
- Inventario
- Vista Hoy
- Alertas
- Centro de decision
- Reportes

### 6.3 Flujo de reserva de recursos

1. El usuario ingresa a la pantalla de Reservas.
2. Puede consultar reservas por estado o crear una nueva reserva.
3. En el formulario de nueva reserva selecciona material, fecha, bloque horario y observaciones.
4. El sistema valida disponibilidad y estado del recurso.
5. Al confirmar, se registra la reserva.

Resultado esperado:

- la reserva queda creada en estado activo
- la informacion queda disponible para consulta posterior
- si aun no existe prestamo asociado, el caso podra aparecer como pendiente en la vista operativa de Prestamos

### 6.4 Flujo de consulta de reservas

1. El usuario entra a Reservas.
2. Puede filtrar por Activas, Completadas, Canceladas o Todos.
3. Visualiza referencia, material, docente, fecha y estado.
4. El flujo de gestion operativa no se ejecuta aqui, sino desde Prestamos.

Objetivo del modulo:

- separar la consulta y programacion de la operacion real
- evitar mezclar solicitud con ejecucion operativa

### 6.5 Flujo de gestion operativa en Prestamos

1. El administrador entra a la pantalla de Prestamos.
2. Visualiza una bandeja unificada con reservas pendientes y prestamos ya registrados.
3. Puede filtrar por estado operativo: Todos, Activos, Vencidos, Devueltos y Canceladas.
4. Tambien puede filtrar por grupo de material: Todos, Juegos, Libros y Cocina.
5. Desde esta bandeja ejecuta acciones como editar reserva, registrar entrega, registrar devolucion o cancelar.

Objetivo del modulo:

- concentrar la operacion real del laboratorio en una sola vista
- dar trazabilidad a cada cambio de estado

### 6.6 Flujo de entrega o generacion de prestamo

1. El administrador selecciona una reserva pendiente.
2. Ingresa al formulario operativo de Prestamos.
3. Registra la entrega del recurso.
4. El sistema crea o actualiza el prestamo correspondiente.
5. La reserva asociada deja de ser una solicitud pendiente y pasa a estado atendido.

Resultado esperado:

- el recurso queda prestado
- el inventario refleja la operacion
- el caso pasa a la trazabilidad de prestamos activos

### 6.7 Flujo de devolucion

1. El administrador selecciona un prestamo activo o vencido.
2. Entra al formulario operativo.
3. Registra la devolucion y el estado final del material.
4. El sistema actualiza el prestamo a Devuelto.
5. El inventario se actualiza segun disponibilidad y condicion del recurso.

Resultado esperado:

- el caso queda en estado Devuelto
- se libera o ajusta disponibilidad del recurso
- la devolucion queda disponible para consulta operativa y de seguimiento

### 6.8 Flujo de cancelacion

1. El administrador selecciona una reserva pendiente desde Prestamos.
2. El sistema solicita confirmacion de cancelacion.
3. La reserva cambia a estado Cancelada.
4. La app conserva el historial de la operacion y no elimina fisicamente el registro.
5. La reserva cancelada queda disponible para consulta bajo el filtro Canceladas.

Resultado esperado:

- se conserva la trazabilidad
- la reserva no desaparece del sistema como si nunca hubiera existido
- la gestion administrativa puede auditar el caso posteriormente

### 6.9 Flujo de inventario y consulta de recursos

1. El usuario entra a Inventario, Recursos o Cocina.
2. Consulta disponibilidad, estado y cantidad de materiales.
3. Desde estas pantallas puede iniciar un flujo de reserva con informacion precargada.
4. El sistema reutiliza el mismo proceso de reserva segun el tipo de recurso.

Resultado esperado:

- consulta rapida del inventario
- acceso mas directo a la reserva desde el contexto del material

### 6.10 Flujo de seguimiento y decision

El sistema incluye vistas complementarias para lectura operativa y administrativa:

- Vista Hoy: resumen diario de operacion y pendientes
- Alertas: casos que requieren atencion inmediata
- Centro de decision: lectura sintetica para priorizacion
- Reportes: consulta consolidada de indicadores operativos

Estas pantallas no reemplazan la operacion principal, pero convierten el dato en informacion util para gestion y toma de decisiones.

## 7. Estados principales de negocio

### 7.1 Estados de reservas

- Activa: reserva creada y vigente
- Cancelada: reserva anulada sin perder trazabilidad
- Completada: reserva atendida dentro del flujo operativo

### 7.2 Estados de prestamos

- Pendiente: vista operativa de una reserva activa aun no entregada
- Activo: prestamo en curso
- Vencido: prestamo cuya fecha esperada ya fue superada
- Devuelto: prestamo cerrado por devolucion registrada

### 7.3 Estados de inventario

- Disponible
- Prestado
- Danado

## 8. Reglas de negocio relevantes

- solo perfiles administrativos ejecutan entrega, devolucion y cancelacion
- el docente crea y consulta, pero no gestiona la operacion sensible
- una cancelacion conserva el historial y no elimina el registro
- los recursos sin cupo o con estado no habilitado no deben reservarse
- la vista operativa de Prestamos concentra estados y acciones para evitar dispersion del proceso

## 9. Salidas y evidencias del sistema

El sistema genera evidencia funcional en los siguientes puntos:

- registro de reservas creadas
- registro de prestamos activos, vencidos y devueltos
- cancelaciones visibles y trazables
- consulta de inventario y disponibilidad
- vistas administrativas para seguimiento y lectura operativa

## 10. Conclusion del documento

El sistema fue disenado para que la operacion del laboratorio no dependa de pasos aislados o informacion dispersa. La arquitectura funcional del MVP separa claramente la solicitud, la operacion y el seguimiento, permitiendo una gestion mas clara, trazable y util para docentes y administradores.