# Guia manual de conexion Excel -> pantallas Power Apps

## Punto clave antes de empezar

Si Power Apps te muestra campos viejos como:

- `Fecha`
- `FechaFin`
- `Item`
- `Tipo`
- `Usuario`

entonces **NO estas leyendo el esquema nuevo del MVP**. En ese caso no sigas agregando campos manualmente en la pantalla porque quedarás montando la app sobre una tabla vieja.

Lo correcto es:

1. Eliminar el datasource viejo de esa tabla.
2. Volver a agregar la tabla exacta desde el Excel nuevo.
3. Verificar que los campos visibles coincidan con el esquema esperado.

## Archivo correcto

- Excel origen: `C:\Users\DanielFelipeGómezBra\Universidad EAFIT\bd - Documentos\bd_eafit.xlsx`

## Tablas correctas del MVP

### `Usuarios`

Campos esperados:

- `Email`
- `Nombre`
- `Rol`
- `Activo`
- `__PowerAppsId__`

### `Recursos`

Campos esperados:

- `Juegos`
- `Descripci?n`
- `Unidades`
- `Categoria`
- `Observaciones`
- `Estado`
- `CantidadPrestada`
- `CantidadDanada`
- `ObservacionEstado`
- `__PowerAppsId__`

Nota:
- En Power Apps puede salir como `Descripci?n` por el tema del encabezado del Excel.
- Si Studio lo renombra distinto al reconectar, usa exactamente el nombre que Power Apps te muestre en autocompletado.

### `Cocina`

Campos esperados:

- `Elemento`
- `Und`
- `Existencia`
- `Observaciones`
- `Malo`
- `Regular`
- `Bueno`
- `Observaciones2`
- `Estado`
- `CantidadPrestada`
- `CantidadDanada`
- `ObservacionEstado`
- `__PowerAppsId__`

### `Reservas`

Campos esperados:

- `NumeroReserva`
- `DocenteNombre`
- `DocenteEmail`
- `MaterialNombre`
- `MaterialTipo`
- `MaterialId`
- `FechaServicio`
- `Bloque`
- `FechaInicio`
- `FechaFin`
- `Estado`
- `FechaCreacion`
- `FechaCancelacion`
- `CanceladaPor`
- `Notas`
- `__PowerAppsId__`

### `Prestamos`

Campos esperados:

- `NumeroTransaccion`
- `NumeroReserva`
- `DocenteNombre`
- `DocenteEmail`
- `MaterialNombre`
- `MaterialTipo`
- `MaterialId`
- `FechaRetiro`
- `FechaDevolucionEsperada`
- `FechaDevolucionReal`
- `EstadoInicial`
- `EstadoFinal`
- `Estado`
- `Observaciones`
- `RegistradoPor`
- `__PowerAppsId__`

## Se puede arreglar la vinculacion automatica

Sí, pero en Power Apps con Excel no siempre se corrige solo. Cuando cambiaste la estructura del libro, Studio probablemente se quedó con metadatos cacheados.

La mejor ruta es esta:

1. Cierra la app en Studio.
2. Vuelve a abrirla.
3. Elimina los 5 datasources viejos.
4. Agrega otra vez las 5 tablas desde el Excel correcto.
5. Revisa que cada tabla muestre los campos correctos.
6. Solo después entra pantalla por pantalla a asignar `Origen de datos` y `Campos`.

Si aun así sigue trayendo campos viejos:

1. Guarda una copia nueva de la app.
2. Abre esa copia.
3. Agrega desde cero los 5 datasources.

## Regla importante por tipo de pantalla

### Pantallas con `DataTable`

Aquí sí debes:

1. Seleccionar el `DataTable`.
2. Asignar el `Origen de datos`.
3. Agregar manualmente los campos correctos.

### Pantallas de formulario manual

Aquí normalmente **no debes usar "Agregar campo"**.

La mayoría de esas pantallas ya tienen controles `TextInput`, botones y fórmulas hechas a mano. En esas pantallas solo necesitas que el datasource exista y que los nombres de columnas coincidan con las fórmulas.

## Mapeo exacto por pantalla

## `App`

Data sources que deben existir en la app:

- `Usuarios`
- `Recursos`
- `Cocina`
- `Reservas`
- `Prestamos`

Sin esto no funciona:

- detección de rol
- `colBloques`
- `colMateriales`
- alertas de vencimiento

## `Screen1`

Tablas que usa:

- `Reservas`
- `Prestamos`
- `Recursos`
- `Cocina`

No tienes que agregar campos manuales en esta pantalla.

Solo verifica que el `OnVisible` no marque error y que carguen los contadores.

Importante:

- `Screen1` ya no debe hacer `Patch` sobre `Prestamos` para marcar `Vencido`
- solo resume contadores y navegación
- los vencidos se muestran de forma visual según `FechaDevolucionEsperada` y/o `Estado`

## `ScrLogin`

Tabla que usa:

- `Usuarios`

No debes agregar campos manuales.

## `ScrRecursos`

Tabla:

- `Recursos`

Control principal:

- `DataTable2`

`Origen de datos` de `DataTable2`:

- `Recursos`

Campos que debes agregar a `DataTable2`:

- `Categoria`
- `Descripci?n`
- `Juegos`
- `Observaciones`
- `Unidades`

Campos usados además por la pantalla:

- `Juegos`
- `Descripci?n`
- `Categoria`

porque la búsqueda usa esos nombres.

## `ScrItemFormRecursos`

Tabla:

- `Recursos`

No agregues campos automáticos.

Controles que dependen del datasource:

- `TxtFReJuegos` -> `Juegos`
- `TxtFReDesc` -> `Descripci?n`
- `TxtFReUnidades` -> `Unidades`
- `TxtFReCategoria` -> `Categoria`
- `TxtFReObs` -> `Observaciones`

Campos que guarda el botón:

- `Juegos`
- `Descripci?n`
- `Unidades`
- `Categoria`
- `Observaciones`
- `Estado`
- `CantidadPrestada`
- `CantidadDanada`
- `ObservacionEstado`

## `ScrCocina`

Tabla:

- `Cocina`

Control principal:

- `DataTable1`

`Origen de datos` de `DataTable1`:

- `Cocina`

Campos que debes agregar a `DataTable1`:

- `Bueno`
- `Elemento`
- `Existencia`
- `Malo`
- `Observaciones`
- `Observaciones2`
- `Regular`
- `Und`

## `ScrItemFormCocina`

Tabla:

- `Cocina`

No agregues campos automáticos.

Controles que dependen del datasource:

- `TxtFCoElemento` -> `Elemento`
- `TxtFCoUnd` -> `Und`
- `TxtFCoExistencia` -> `Existencia`
- `TxtFCoObs` -> `Observaciones`

Campos que guarda el botón:

- `Elemento`
- `Und`
- `Existencia`
- `Observaciones`
- `Bueno`
- `Malo`
- `Regular`
- `Estado`
- `CantidadPrestada`
- `CantidadDanada`
- `ObservacionEstado`

## `ScrReservas`

Tabla principal:

- `Reservas`

Tablas auxiliares:

- `Prestamos`
- `Recursos`
- `Cocina`

Control principal:

- `DataTable3`

`Origen de datos` de `DataTable3`:

- `Reservas`

Campos que debes agregar a `DataTable3`:

- `NumeroReserva`
- `MaterialNombre`
- `DocenteNombre`
- `FechaInicio`
- `Estado`

## `ScrItemFormReserva`

Tablas que deben existir:

- `Reservas`
- `Usuarios`
- `Recursos`
- `Cocina`

No uses `Agregar campo` en esta pantalla.

Esta pantalla funciona por controles manuales.

Campos que lee o escribe:

- `DocenteNombre`
- `DocenteEmail`
- `MaterialNombre`
- `MaterialTipo`
- `MaterialId`
- `FechaServicio`
- `Bloque`
- `FechaInicio`
- `FechaFin`
- `Estado`
- `FechaCreacion`
- `FechaCancelacion`
- `CanceladaPor`
- `Notas`
- `NumeroReserva`

Controles principales:

- `TxtFRsvDocente`
  - se llena desde `Usuarios`
  - no deberías escribirlo a mano
- `TxtFRsvMaterial`
  - es solo lectura
  - muestra el material elegido desde `DataTableMatRsv`
- `DataTableMatRsv`
  - usa `colMateriales`
  - no se conecta directo a Excel
  - se alimenta con `Recursos + Cocina`
- `RctUseMatFRsv` y `LblUseMatFRsv`
  - guardan el material seleccionado en `gMaterialReservaId`
- `TxtFRsvFecha`
  - fecha del servicio
- botones de bloques
  - usan `gBloqueReserva`

Estado actual:

- `Docente` ya queda automático por sesión
- `Material` ya no se escribe libre
- el guardado usa `gMaterialReservaId`
- la alerta de disponibilidad también valida por `MaterialId`
- si abres una reserva `Cancelada` o `Completada`, debe quedar solo lectura
- si editas una reserva `Activa`, se conserva el `DocenteNombre` y `DocenteEmail` original
- la disponibilidad por fecha y bloque ya no bloquea 1 a 1: compara reservas activas del mismo slot contra `CantidadDisponible`

## `ScrCalendario`

Tabla:

- `Reservas`

Control principal:

- `DataTableCal`

`Origen de datos` de `DataTableCal`:

- `Reservas`

Campos que debes agregar a `DataTableCal`:

- `MaterialNombre`
- `Bloque`
- `DocenteNombre`
- `Estado`

La pantalla también usa:

- `FechaServicio`

para filtrar por día.

## `ScrPrestamos`

Tabla principal:

- `Prestamos`

Control principal:

- `DataTable4`

`Origen de datos` de `DataTable4`:

- `Prestamos`

Campos que debes agregar a `DataTable4`:

- `NumeroTransaccion`
- `MaterialNombre`
- `DocenteNombre`
- `FechaDevolucionEsperada`
- `Estado`

Si aquí te salen campos viejos como `Fecha`, `Item`, `Tipo`, `Usuario`, primero corrige el datasource. No sigas configurando la pantalla.

Importante:

- la lista usa un `EstadoVisual` para mostrar `Vencido` sin hacer `Patch` al abrir la pantalla
- el acceso directo de devolución debe quedar solo para préstamos `Activo` o `Vencido`
- un préstamo `Devuelto` no debe reabrirse para volver a descontar o devolver inventario

## `ScrItemFormPrestamo`

Tablas que deben existir:

- `Prestamos`
- `Reservas`
- `Recursos`
- `Cocina`

No uses `Agregar campo` en esta pantalla.

Campos usados para retiro:

- `NumeroReserva`
- `DocenteNombre`
- `DocenteEmail`
- `MaterialNombre`
- `MaterialTipo`
- `MaterialId`
- `FechaFin`

Controles clave del retiro:

- `DataTableResActFPst`
  - muestra reservas con `Estado="Activa"`
  - agrega estos campos:
    - `NumeroReserva`
    - `MaterialNombre`
    - `DocenteNombre`
    - `FechaInicio`
- `RctUseReservaFPst` y `LblUseReservaFPst`
  - toman la fila seleccionada
  - guardan `__PowerAppsId__` en `gReservaPrestamoId`
- `TxtFPstUsuario`
  - se llena desde la reserva activa seleccionada
- `TxtFPstMaterial`
  - se llena desde la reserva activa seleccionada
- `TxtFPstFechaFin`
  - se llena desde la reserva activa seleccionada

Campos que crea en `Prestamos`:

- `NumeroTransaccion`
- `NumeroReserva`
- `DocenteNombre`
- `DocenteEmail`
- `MaterialNombre`
- `MaterialTipo`
- `MaterialId`
- `FechaRetiro`
- `FechaDevolucionEsperada`
- `FechaDevolucionReal`
- `EstadoInicial`
- `EstadoFinal`
- `Estado`
- `Observaciones`
- `RegistradoPor`

Además actualiza inventario en:

- `Recursos`
- `Cocina`

Importante:

- en retiro ya no debes escribir `NumeroReserva` manualmente
- primero seleccionas una reserva activa y luego confirmas el retiro
- la devolución solo puede ejecutarse sobre préstamos `Activo` o `Vencido`
- si un préstamo ya está `Devuelto`, la pantalla debe bloquear reapertura y guardado

## `ScrAlertas`

Tabla:

- `Prestamos`

Control principal:

- `DataTableAlt`

`Origen de datos` de `DataTableAlt`:

- `Prestamos`

Campos que debes agregar a `DataTableAlt`:

- `MaterialNombre`
- `DocenteNombre`
- `FechaDevolucionEsperada`
- `Estado`

## `ScrReportes`

Tablas que debe tener disponibles:

- `Reservas`
- `Prestamos`
- `Recursos`
- `Cocina`

La pantalla usa además:

- `colMateriales`

### `DataTableRpt1`

No depende de un datasource directo fijo porque usa una colección calculada con `AddColumns(GroupBy(...))`.

Campos visibles esperados:

- `DocenteNombre`
- `ReservasCount`

### `DataTableRpt2`

Campos visibles esperados:

- `MaterialNombre`
- `UsoCount`

### `DataTableRpt3`

Campos visibles esperados:

- `MaterialNombre`
- `DocenteNombre`
- `FechaDevolucionEsperada`

### `DataTableRpt4`

Campos visibles esperados:

- `MaterialNombre`
- `MaterialTipo`
- `ObservacionEstadoCalc`

Nota:
- Si estas tablas quedan vacías pero sin error, normalmente no es de conexión sino que falta ejecutar `App > Run OnStart`.

## `ScrUsuarios`

Tabla:

- `Usuarios`

Control principal:

- `DataTable5`

`Origen de datos` de `DataTable5`:

- `Usuarios`

Campos que debes agregar a `DataTable5`:

- `Email`
- `Nombre`
- `Rol`
- `Activo`

## `ScrItemFormUsuario`

Tabla:

- `Usuarios`

No uses `Agregar campo`.

Controles que dependen del datasource:

- `TxtFUsrNombre` -> `Nombre`
- `TxtFUsrEmail` -> `Email`

Campos que guarda:

- `Nombre`
- `Email`
- `Rol`
- `Activo`

## Orden real recomendado para configurarlo manualmente

1. Revisa primero que cada datasource muestre el esquema correcto.
2. Configura `Usuarios`.
3. Configura `Recursos`.
4. Configura `Cocina`.
5. Configura `Reservas`.
6. Configura `Prestamos`.
7. Ejecuta `App > Run OnStart`.
8. Entra a `Screen1`.
9. Luego valida estas pantallas en orden:
   - `ScrRecursos`
   - `ScrCocina`
   - `ScrReservas`
   - `ScrItemFormReserva`
   - `ScrPrestamos`
   - `ScrItemFormPrestamo`
   - `ScrAlertas`
   - `ScrReportes`
   - `ScrUsuarios`

## Flujos por rol

### `Docente`

Pantallas permitidas:

- `Screen1`
- `ScrReservas`
- `ScrItemFormReserva`
- `ScrPrestamos`
- `ScrCalendario`
- `ScrAyuda`

Pantallas restringidas:

- `ScrRecursos`
- `ScrItemFormRecursos`
- `ScrCocina`
- `ScrItemFormCocina`
- `ScrAlertas`
- `ScrReportes`
- `ScrItemFormPrestamo`
- `ScrUsuarios`
- `ScrItemFormUsuario`

### `Admin`

Pantallas permitidas:

- todo lo de `Docente`
- `ScrRecursos`
- `ScrItemFormRecursos`
- `ScrCocina`
- `ScrItemFormCocina`
- `ScrAlertas`
- `ScrReportes`
- `ScrItemFormPrestamo`

Pantallas restringidas:

- `ScrUsuarios`
- `ScrItemFormUsuario`

### `SuperAdmin`

Pantallas permitidas:

- todo lo de `Admin`
- `ScrUsuarios`
- `ScrItemFormUsuario`

## Pantallas donde conviene automatizar más

### `ScrItemFormReserva`

Mejoras recomendadas:

- `Docente` automático por sesión
- lista controlada de materiales desde `colMateriales`
- bloqueo temprano de dañados o sin disponibilidad
- después: selector de fecha con calendario real

Estado:

- ya quedó mejorada para seleccionar material desde lista visible

### `ScrItemFormPrestamo`

Estado:

- ya quedó con lista de reservas `Activa`
- ya selecciona una reserva en vez de pedir texto libre
- ya autocompleta docente, material y fecha esperada

### `ScrPrestamos`

Mejora recomendada:

- botón rápido `Registrar devolución`
- acceso directo solo para préstamos `Activo` o `Vencido`
- filtro adicional por docente y material

### `ScrAlertas`

Mejora recomendada:

- acción rápida desde la alerta para abrir el préstamo vencido
- semáforo visual más fuerte
- gatillo a flujo de correo por `Vencido`

Regla actual:

- `ScrAlertas` ya no debe cambiar el `Estado` en Excel al abrir
- solo calcula y muestra alertas visuales a partir de `FechaDevolucionEsperada` y `Estado`

### `ScrReportes`

Mejora recomendada:

- exportación CSV
- resumen superior con KPIs
- filtros por material y docente

### `Screen1`

Mejora recomendada:

- resumen de “Mis reservas activas”
- resumen de “Mis préstamos activos”
- atajos distintos por rol

### `ScrRecursos` y `ScrCocina`

Mejora recomendada:

- filtros rápidos por `Estado`
- vista de solo disponibles
- vista de dañados

### Flujos de Power Automate que deben existir

Prioridad alta:

- confirmación de reserva
- vencimiento sin devolución
- devolución con daño

Nota operativa:

- Canvas ya no debe ser quien cambie `Prestamos.Estado` a `Vencido` al navegar por pantallas
- ese cambio y sus correos deben salir desde Power Automate o desde un proceso controlado fuera de la UI

Prioridad media:

- resumen diario al admin con vencidos y por vencer
- aviso al admin cuando un material llegue a `Dañado`
