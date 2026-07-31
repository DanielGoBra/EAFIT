# MVP QA Checklist

## Fuente de verdad
La logica estabilizada quedo en `powerapps/canvas/v10_src/Src/*.fx.yaml`.
Antes de reempaquetar, valida no sobrescribir estos cambios con un `buildV10.js` antiguo.

## Reservas
- Crear reserva valida de `Recursos`.
- Crear reserva valida de `Cocina`.
- Intentar reservar un material marcado como `Dañado`.
- Intentar reservar un material sin `CantidadDisponible`.
- Intentar reservar el mismo material, misma fecha y mismo bloque dos veces.
- Reservar el mismo material en bloques distintos del mismo dia.
- Intentar reservar en domingo.
- Cancelar antes de 30 minutos.
- Intentar cancelar dentro de la ventana bloqueada.

## Prestamos
- Registrar retiro usando una `Reserva` activa.
- Ver que la reserva cambie a `Completada`.
- Ver que el inventario aumente `CantidadPrestada`.
- Ver prestamo activo en la vista del docente.
- Forzar vencimiento por hora y confirmar cambio a `Vencido`.
- Registrar devolucion `Bueno`.
- Registrar devolucion `Dañado`.
- Registrar devolucion `Incompleto`.
- Confirmar recalculo de `CantidadPrestada`, `CantidadDanada` y `Estado`.

## Alertas y reportes
- Revisar `ScrAlertas` con prestamos `Activo`, `Vencido` y proximos a vencer.
- Validar reportes por semana, mes y año.
- Validar uso por docente.
- Validar uso por material.
- Validar devoluciones retrasadas.
- Validar materiales dañados.

## Pantallas auxiliares
- Abrir `ScrCalendario` y navegar entre semanas.
- Crear reserva desde el calendario en un dia habil.
- Confirmar que domingo queda bloqueado.
- Consultar `ScrAiChat` con palabras clave: `reserva`, `prestamo`, `vencido`, `inventario`.

## Riesgos pendientes
- `Src/EditorState/*.json` y `Other/Src/*.pa.yaml` siguen desalineados respecto a varias pantallas reescritas.
- Si el empaquetado final exige regenerar esos artefactos, conviene hacerlo desde una version actualizada del pipeline antes de la entrega final.
