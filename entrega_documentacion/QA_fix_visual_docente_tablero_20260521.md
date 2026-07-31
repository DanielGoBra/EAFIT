# QA fix visual Docente - tablero principal

## Problema detectado

En la vista inicial del rol Docente se estaban superponiendo los textos de las tarjetas Inventario y Reservas. Esto ocurria porque la tarjeta Reservas se expandia a ancho completo cuando el usuario no era administrador, pero los controles visuales de Inventario seguian visibles en la misma posicion.

## Ajuste aplicado

Se ocultaron los elementos de la tarjeta Inventario cuando el usuario no tiene rol administrativo.

Controles ajustados en Screen1:

- RctCardMatS1
- RctCardMatAccentS1
- LblMatTitleS1
- LblMatCountS1
- LblMatTxtS1

Todos quedaron condicionados con:

- Visible = gEsAdmin

## Resultado esperado

Para Docente:

- la tarjeta Reservas queda limpia y a ancho completo
- no se muestra texto de Inventario encima
- el tablero mantiene Prestamos, Seguimiento y Nueva reserva

Para Admin/SuperAdmin:

- Inventario sigue visible como tarjeta independiente
- Reservas mantiene su posicion de media columna

## Validacion tecnica

- Screen1.fx.yaml no reporta errores.
- Se genero un nuevo .msapp.
- Se realizo smoke unpack del paquete generado.
- Screen1.fx.yaml reabierto desde el paquete no reporta errores.

## Artefacto final generado

- tmp/Control_MVP_final_20260521_docente_historial_visualfix.msapp
- entrega_documentacion/Prototipo/Control_MVP_final_20260521_docente_historial_visualfix.msapp

## Resultado final

Fix aprobado para entrega visual previa a presentacion con cliente.