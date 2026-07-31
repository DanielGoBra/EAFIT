# Power Automate MVP - Correos y alertas operativas

## Objetivo

Automatizar comunicaciones del MVP EAFIT sin recargar la logica de Power Apps:

- Confirmar reservas por correo al docente.
- Recordar reservas del dia.
- Alertar a administradores cuando una reserva no fue entregada.
- Recordar devoluciones pendientes a docentes.
- Alertar a Admin/SuperAdmin por prestamos vencidos.
- Enviar resumen operativo diario.

La arquitectura recomendada es:

- Power Apps crea y actualiza datos en Excel.
- Power Automate envia correos y revisa pendientes.
- Excel conserva campos de control para evitar correos duplicados.

## Preparacion en Excel

Antes de crear los flujos, agrega estas columnas a las tablas del libro cloud usado por la app.

### Tabla Reservas

- `CorreoConfirmacionEnviado`
- `FechaCorreoConfirmacion`
- `CorreoRecordatorioEnviado`
- `FechaCorreoRecordatorio`
- `AlertaNoEntregadaEnviada`
- `FechaAlertaNoEntregada`

### Tabla Prestamos

- `CorreoRecordatorioDevolucionEnviado`
- `FechaCorreoRecordatorioDevolucion`
- `AlertaVencidoEnviada`
- `FechaAlertaVencido`
- `UltimaAlertaEnviada`

### Tabla Usuarios

Validar que existan estos campos:

- `Email`
- `Nombre`
- `Rol`
- `Activo`

Los destinatarios administrativos se obtienen filtrando:

- `Rol` igual a `Admin` o `SuperAdmin`
- `Activo` igual a `TRUE` o `Activo`

## Flujo 1 - Confirmacion de reserva

Nombre sugerido: `EAFIT_Reserva_Confirmacion`

Tipo recomendado para la primera version: flujo automatizado con Excel.

Trigger:

- Excel Online Business
- `When a row is added or modified`
- Tabla: `Reservas`

Condicion principal:

```text
Estado = Activa
DocenteEmail no esta vacio
NumeroReserva no esta vacio
CorreoConfirmacionEnviado no es TRUE
```

Acciones:

1. Enviar correo Outlook 365 a `DocenteEmail`.
2. Actualizar la misma fila de `Reservas`:
	- `CorreoConfirmacionEnviado = TRUE`
	- `FechaCorreoConfirmacion = utcNow()`

Asunto:

```text
Reserva confirmada - Centro de idiomas EAFIT
```

Cuerpo sugerido:

```html
<p>Hola @{DocenteNombre},</p>
<p>Tu reserva fue confirmada correctamente.</p>
<ul>
  <li><b>Reserva:</b> @{NumeroReserva}</li>
  <li><b>Material:</b> @{MaterialNombre}</li>
  <li><b>Fecha:</b> @{FechaServicio}</li>
  <li><b>Bloque:</b> @{Bloque}</li>
  <li><b>Inicio:</b> @{FechaInicio}</li>
  <li><b>Fin:</b> @{FechaFin}</li>
</ul>
<p>Si necesitas modificar o cancelar la reserva, hazlo desde la app antes del servicio.</p>
```

Nota: esta version por trigger de Excel es suficiente para empezar. Si el trigger se retrasa o duplica, pasamos a un flujo llamado directamente desde Power Apps.

## Flujo 2 - Recordatorio de reservas del dia

Nombre sugerido: `EAFIT_Reservas_Recordatorio_Dia`

Trigger:

- `Recurrence`
- Frecuencia: diaria
- Hora sugerida: 7:00 a. m.
- Zona horaria: `SA Pacific Standard Time`

Acciones:

1. Listar filas de `Reservas`.
2. Filtrar reservas con:
	- `Estado = Activa`
	- `FechaServicio = hoy`
	- `CorreoRecordatorioEnviado` no es `TRUE`
3. Enviar correo al docente.
4. Actualizar fila:
	- `CorreoRecordatorioEnviado = TRUE`
	- `FechaCorreoRecordatorio = utcNow()`

Asunto:

```text
Recordatorio de reserva para hoy - EAFIT
```

## Flujo 3 - Reserva no entregada

Nombre sugerido: `EAFIT_Reserva_No_Entregada_Admin`

Trigger:

- `Recurrence`
- Cada 30 o 60 minutos
- Zona horaria: `SA Pacific Standard Time`

Logica:

1. Listar `Reservas` activas.
2. Listar `Prestamos`.
3. Para cada reserva activa:
	- convertir `FechaInicio` a fecha/hora
	- si `FechaInicio < now()`
	- y no existe prestamo con el mismo `NumeroReserva`
	- y `AlertaNoEntregadaEnviada` no es `TRUE`
4. Enviar correo a Admin/SuperAdmin.
5. Actualizar reserva:
	- `AlertaNoEntregadaEnviada = TRUE`
	- `FechaAlertaNoEntregada = utcNow()`

Asunto:

```text
Alerta: reserva pendiente por entregar
```

Contenido minimo:

- NumeroReserva
- DocenteNombre
- DocenteEmail
- MaterialNombre
- FechaInicio
- Bloque

## Flujo 4 - Recordatorio de devolucion al docente

Nombre sugerido: `EAFIT_Prestamo_Recordatorio_Devolucion`

Trigger:

- `Recurrence`
- Cada 60 minutos

Filtro:

- `Estado = Activo` o `Estado = Vencido`
- `FechaDevolucionEsperada < now()` o esta proxima a vencer
- `FechaDevolucionReal` vacia
- `CorreoRecordatorioDevolucionEnviado` no es `TRUE`

Acciones:

1. Enviar correo a `DocenteEmail`.
2. Actualizar `Prestamos`:
	- `CorreoRecordatorioDevolucionEnviado = TRUE`
	- `FechaCorreoRecordatorioDevolucion = utcNow()`

Asunto:

```text
Recordatorio de devolucion pendiente - EAFIT
```

## Flujo 5 - Alerta de prestamo vencido a administradores

Nombre sugerido: `EAFIT_Prestamo_Vencido_Admin`

Trigger:

- `Recurrence`
- Cada 60 minutos

Filtro:

- `Estado = Activo` o `Estado = Vencido`
- `FechaDevolucionEsperada < now()`
- `FechaDevolucionReal` vacia
- `AlertaVencidoEnviada` no es `TRUE`

Acciones:

1. Si `Estado = Activo`, actualizarlo a `Vencido`.
2. Enviar correo a Admin/SuperAdmin.
3. Actualizar campos:
	- `AlertaVencidoEnviada = TRUE`
	- `FechaAlertaVencido = utcNow()`
	- `UltimaAlertaEnviada = utcNow()`

Asunto:

```text
Alerta: recurso vencido no devuelto
```

## Flujo 6 - Resumen operativo diario

Nombre sugerido: `EAFIT_Admin_Resumen_Operativo_Diario`

Trigger:

- `Recurrence`
- Diario
- Hora sugerida: 7:30 a. m. o 5:00 p. m.

Contenido:

- Reservas activas de hoy.
- Prestamos vencidos.
- Prestamos proximos a vencer.
- Materiales con dano.
- Materiales con baja disponibilidad.
- Reservas no entregadas.

Destinatarios:

- Admin
- SuperAdmin

## Orden recomendado de implementacion

1. Agregar columnas de control en Excel.
2. Crear `EAFIT_Reserva_Confirmacion`.
3. Probar creando una reserva desde Power Apps.
4. Crear `EAFIT_Prestamo_Vencido_Admin`.
5. Crear `EAFIT_Prestamo_Recordatorio_Devolucion`.
6. Crear `EAFIT_Reservas_Recordatorio_Dia`.
7. Crear `EAFIT_Reserva_No_Entregada_Admin`.
8. Crear `EAFIT_Admin_Resumen_Operativo_Diario`.

## Prueba minima

Caso 1: reserva nueva.

- Crear reserva desde la app.
- Verificar fila en `Reservas`.
- Confirmar correo al docente.
- Confirmar `CorreoConfirmacionEnviado = TRUE`.

Caso 2: prestamo vencido.

- Crear o editar prestamo de prueba con `FechaDevolucionEsperada` anterior a la hora actual.
- Mantener `FechaDevolucionReal` vacia.
- Ejecutar flujo manualmente.
- Confirmar correo a admin y docente.

Caso 3: reserva no entregada.

- Crear reserva activa con `FechaInicio` anterior a la hora actual.
- Verificar que no exista prestamo con el mismo `NumeroReserva`.
- Ejecutar flujo.
- Confirmar correo a admin.

## Posible mejora posterior

Si los triggers de Excel tardan o duplican, crear un flujo instantaneo llamado desde Power Apps:

- `EAFIT_Reserva_Confirmacion_App`

Luego conectar el flujo en `ScrItemFormReserva`, justo despues del `Patch(Reservas)` exitoso y antes del `Refresh(Reservas)`.
