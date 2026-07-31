# Anexo de validacion del MVP

## Objetivo

Resumir las validaciones tecnicas y funcionales realizadas sobre el MVP antes del cierre del proyecto.

## Validacion tecnica

- revision de formulas en pantallas criticas del Canvas unpack
- correccion de errores hasta llegar a estado limpio en los archivos funcionales principales
- validacion de empaquetado con Power Platform CLI
- roundtrip de pack y unpack para confirmar consistencia del artefacto final

## Validacion funcional realizada

Se validaron los siguientes recorridos del sistema:

- login con cuenta institucional
- cierre e inicio de sesion
- navegacion desde el tablero principal
- ingreso a Reservas y apertura del formulario de nueva reserva
- ingreso a Prestamos y apertura del flujo operativo
- visibilidad completa de formularios y acciones inferiores
- separacion funcional entre Reservas y Prestamos
- trazabilidad de cancelaciones en la bandeja operativa

## Ajustes funcionales relevantes que quedaron implementados

- inicio real del sistema desde login
- boton de cerrar sesion en el tablero principal
- cambio de copy funcional de retiro a entrega o devolucion
- mejora visual y de responsividad en pantallas criticas
- conservacion de cancelaciones para historial y seguimiento
- nuevo filtro Canceladas en la pantalla de Prestamos

## Consideraciones operativas

- el comportamiento visual del runtime depende del entorno Power Apps y del origen de datos conectado
- la presencia o ausencia de registros en filtros como Devueltos depende de la data real disponible en el momento de la prueba
- el MVP esta validado sobre el flujo principal, aunque una fase futura podria reforzar backend, concurrencia y gobierno de datos

## Conclusiones

El sistema quedo en estado funcional para demostrar y operar el flujo principal del laboratorio: reservar, gestionar, devolver, cancelar y consultar con trazabilidad.