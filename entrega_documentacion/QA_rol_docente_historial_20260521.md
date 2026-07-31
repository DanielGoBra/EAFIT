# QA rol Docente - historial de reservas y recursos utilizados

## 1. Objetivo de la prueba

Validar que el rol Docente pueda consultar su informacion vital dentro del MVP, especialmente:

- reservas realizadas por el docente
- reservas pendientes
- reservas canceladas
- prestamos activos o vencidos asociados al docente
- prestamos devueltos asociados al docente
- trazabilidad de materiales reservados o utilizados

La prueba se enfoco en confirmar que el comportamiento no dependa solamente del perfil SuperAdmin, ya que la mayoria de pruebas previas se habian realizado con ese rol.

## 2. Hallazgo inicial

Durante la revision de formulas se encontro lo siguiente:

- La pantalla Reservas ya filtraba correctamente la informacion del Docente usando el correo institucional del usuario autenticado.
- La pantalla Prestamos filtraba correctamente los prestamos del Docente, pero no incluia sus reservas pendientes o canceladas dentro de la bandeja operativa cuando el rol era Docente.

Esto significaba que el Docente podia ver sus reservas desde Reservas, pero su vista de historial en Prestamos podia quedar incompleta, especialmente para casos aun no entregados o cancelados.

## 3. Ajuste aplicado

Se ajusto la pantalla ScrPrestamos para que, cuando el usuario tenga rol Docente, la coleccion operativa tambien incluya sus propias reservas pendientes y canceladas.

La regla aplicada fue:

- si el rol es Docente, cargar solamente registros cuyo DocenteEmail coincida con el correo institucional normalizado del usuario
- si el rol es Admin o SuperAdmin, conservar la vista completa de operacion

Tambien se ajusto el texto visible para el Docente:

- el titulo de la pantalla ahora indica Mi historial
- el resumen explica que puede revisar reservas pendientes, prestamos, devoluciones y cancelaciones
- el mensaje de lista vacia habla de historial y no solo de prestamos

## 4. Controles de seguridad funcional

El ajuste no habilita acciones administrativas para el Docente.

Se verifico que las acciones sensibles continuen restringidas a Admin y SuperAdmin:

- registrar entrega
- cancelar reserva desde la bandeja operativa
- abrir acciones de gestion administrativa sobre reservas pendientes desde Prestamos
- crear prestamos manualmente desde la pantalla Prestamos

El Docente puede consultar su informacion, pero no queda habilitado para ejecutar gestion operativa sensible desde Prestamos.

## 5. Escenarios de QA cubiertos

### 5.1 Docente consulta sus reservas

Resultado esperado:

- la pantalla Reservas muestra solo reservas cuyo DocenteEmail coincide con el usuario autenticado
- los filtros Activas, Completadas, Canceladas y Todos operan sobre su propio subconjunto de datos

Resultado obtenido:

- validado por formula en ScrReservas
- el filtro del docente se conserva en el paquete reabierto por smoke unpack

### 5.2 Docente consulta su historial operativo

Resultado esperado:

- la pantalla Prestamos, para Docente, muestra su historial propio
- la vista Todos puede incluir prestamos y reservas relevantes
- Activos incluye prestamos activos y reservas pendientes
- Devueltos muestra prestamos devueltos si existen registros con ese estado
- Canceladas muestra reservas canceladas del docente

Resultado obtenido:

- se corrigio ScrPrestamos para incluir reservas propias del docente
- el paquete reabierto conserva la formula corregida

### 5.3 Docente no ve informacion de otros usuarios

Resultado esperado:

- el Docente no debe ver registros de otros docentes en Reservas ni en Prestamos

Resultado obtenido:

- ambas pantallas filtran con Lower(Trim(Coalesce(DocenteEmail,""))) = gUserEmailNorm para el rol Docente

### 5.4 Docente no ejecuta gestion administrativa

Resultado esperado:

- el Docente puede consultar su historial, pero no gestionar entregas, cancelaciones operativas ni prestamos manuales

Resultado obtenido:

- las acciones sensibles permanecen condicionadas a Admin o SuperAdmin

## 6. Validacion tecnica ejecutada

Se realizaron las siguientes validaciones:

- validacion del archivo ScrPrestamos.fx.yaml sin errores del entorno
- empaquetado de la app con Power Platform CLI
- smoke unpack del .msapp generado
- validacion de ScrPrestamos.fx.yaml reabierto desde el paquete
- busqueda de formulas clave dentro del paquete reabierto

## 7. Artefacto generado para QA

Archivo generado:

- tmp/Control_MVP_docente_historial_QA_20260521.msapp

Directorio de smoke unpack:

- tmp/smoke_docente_historial_QA_20260521

## 8. Resultado final

El QA confirma que el rol Docente queda cubierto para consulta de informacion vital propia.

Estado del resultado:

- aprobado con ajuste aplicado

El Docente ahora puede ver su historial de reservas y recursos utilizados desde una vista mas completa, sin recibir permisos administrativos adicionales.