# SharePoint Lists — Schema EAFIT Idiomas MVP

## Lista 1: Materiales

| Columna            | Tipo SP              | Valores / Notas                              |
|--------------------|----------------------|----------------------------------------------|
| Title              | Línea de texto       | Nombre del material (campo nativo SP)        |
| Categoria          | Opción               | Cocina · Recursos                            |
| Subcategoria       | Opción               | Utensilio · Juego · Libro                    |
| CantidadTotal      | Número               | Mínimo: 0                                    |
| CantidadDisponible | Número               | Mínimo: 0                                    |
| Condicion          | Opción               | Bueno · Regular · Dañado                     |
| Estado             | Opción               | Disponible · Prestado · Dañado · Agotado     |
| Descripcion        | Varias líneas        |                                              |
| Observaciones      | Varias líneas        |                                              |
| FotoURL            | Hipervínculo         | Fase 2                                       |

---

## Lista 2: Docentes

| Columna     | Tipo SP          | Valores / Notas                       |
|-------------|------------------|---------------------------------------|
| Title       | Línea de texto   | Nombre completo                       |
| Email       | Línea de texto   | nombre@eafit.edu.co                   |
| EsAdmin     | Sí/No            | false = Docente · true = Admin        |
| Activo      | Sí/No            | Para desactivar sin borrar            |

---

## Lista 3: Reservas

| Columna          | Tipo SP               | Valores / Notas                                        |
|------------------|-----------------------|--------------------------------------------------------|
| Title            | Línea de texto        | Número reserva: RES-YYYYMMDD-XXXX (calculado)         |
| Material         | Búsqueda → Materiales | Campo: Title                                           |
| Docente          | Búsqueda → Docentes   | Campo: Title                                           |
| Fecha            | Fecha                 |                                                        |
| BloqueHorario    | Opción                | LV_0600_0800 · LV_0800_1000 · LV_1200_1400 ·         |
|                  |                       | LV_1600_1830 · LV_1830_2100 · SAB_0730_0930 ·        |
|                  |                       | SAB_0930_1130 · SAB_1130_1330 · SAB_1330_1530         |
| HoraInicio       | Línea de texto        | HH:MM — calculado según bloque                        |
| HoraFin          | Línea de texto        | HH:MM — calculado según bloque                        |
| Estado           | Opción                | Activa · Completada · Cancelada                       |
| FechaCreacion    | Fecha y hora          | Default: hoy                                          |
| FechaCancelacion | Fecha y hora          | Null si no se canceló                                 |
| CanceladaPor     | Búsqueda → Docentes   | Quién canceló (admin o docente)                       |

### Bloques horarios → horas (referencia)

| BloqueHorario    | HoraInicio | HoraFin |
|------------------|------------|---------|
| LV_0600_0800     | 06:00      | 08:00   |
| LV_0800_1000     | 08:00      | 10:00   |
| LV_1200_1400     | 12:00      | 14:00   |
| LV_1600_1830     | 16:00      | 18:30   |
| LV_1830_2100     | 18:30      | 21:00   |
| SAB_0730_0930    | 07:30      | 09:30   |
| SAB_0930_1130    | 09:30      | 11:30   |
| SAB_1130_1330    | 11:30      | 13:30   |
| SAB_1330_1530    | 13:30      | 15:30   |

---

## Lista 4: Prestamos

| Columna                | Tipo SP               | Valores / Notas                          |
|------------------------|-----------------------|------------------------------------------|
| Title                  | Línea de texto        | Número transacción: TRX-YYYYMMDD-XXXX   |
| Reserva                | Búsqueda → Reservas   | Campo: Title                             |
| Material               | Búsqueda → Materiales | Campo: Title (denormalizado para queries)|
| Docente                | Búsqueda → Docentes   | Campo: Title                             |
| FechaRetiro            | Fecha y hora          |                                          |
| FechaDevolucionEsperada| Fecha y hora          | Calculado: FechaRetiro + duración bloque |
| FechaDevolucionReal    | Fecha y hora          | Null hasta devolución                    |
| EstadoInicial          | Opción                | Bueno · Dañado                           |
| EstadoFinal            | Opción                | Bueno · Dañado · Incompleto              |
| ObservacionDanio       | Varias líneas         |                                          |
| Estado                 | Opción                | Activo · Devuelto · Vencido              |
| RegistradoPor          | Búsqueda → Docentes   | Admin que registró el retiro             |

---

## Power Automate Flows

### Flow 1 — Email Confirmación de Reserva
- **Trigger:** cuando se crea item en lista **Reservas** con Estado = "Activa"
- **Acción:** Send Email (V2) al email del Docente
- **Asunto:** `✓ Tu reserva ha sido confirmada - [Title]`

### Flow 2 — Email Vencimiento sin Devolución
- **Trigger:** Recurrence cada 5 minutos
- **Condición:** items en **Prestamos** donde Estado = "Activo" AND FechaDevolucionEsperada < now()
- **Acción 1:** Actualizar Estado → "Vencido"
- **Acción 2:** Send Email al Docente
- **Asunto:** `⚠ VENCIDO - Material sin devolver - [Material]`

### Flow 3 — Email Daño al Devolver
- **Trigger:** cuando se modifica item en **Prestamos** con EstadoFinal = "Dañado"
- **Acción:** Send Email al Docente + CC a admin
- **Asunto:** `⚠ Material devuelto con DAÑO - [Material]`

---

## Resumen de PCF Components

| Componente         | Template  | Pantalla                 | Dataset               |
|--------------------|-----------|--------------------------|-----------------------|
| CalendarioReservas | dataset   | Reservas → Paso 2 y 3    | Reservas              |
| SemaforoPendientes | dataset   | Alertas Admin            | Prestamos             |
| GraficosReportes   | dataset   | Reportes Admin           | Prestamos + Reservas  |
