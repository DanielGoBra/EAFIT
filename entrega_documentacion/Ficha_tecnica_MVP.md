# Ficha tecnica del MVP

## Nombre del proyecto

Control MVP - Reservas, prestamos e inventario del Laboratorio de Idiomas EAFIT

## Tipo de solucion

Aplicacion Canvas desarrollada en Power Apps como MVP funcional de gestion operativa.

## Objetivo principal

Centralizar la reserva, el prestamo, la devolucion, la cancelacion y la consulta de inventario de recursos del laboratorio en una sola herramienta operativa con trazabilidad.

## Plataforma y stack

- Power Apps Canvas
- Power Fx
- Excel Online Business como origen de datos operativo
- Power Platform CLI para empaquetado y validacion

## Artefacto funcional entregable

- Prototipo ejecutable: Prototipo/Control_MVP_final_20260505_canceladas.msapp

## Pantallas funcionales principales

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

## Modulos cubiertos

- autenticacion institucional
- tablero principal
- reservas
- prestamos y entregas
- devoluciones
- cancelaciones con trazabilidad
- inventario de recursos y cocina
- seguimiento diario, alertas y reportes

## Roles cubiertos

- Docente
- Administrador
- SuperAdmin

## Entidades principales de datos

- Usuarios
- Reservas
- Prestamos
- Recursos
- Cocina

## Regla funcional destacada

Las cancelaciones no eliminan fisicamente la reserva. El sistema conserva el registro en estado Cancelada para mantener trazabilidad y lectura administrativa.

## Estado del proyecto al cierre

MVP funcional validado sobre el flujo principal del sistema, con empaquetado final revisado y comportamiento operativo comprobado en login, reservas, prestamos, cancelaciones y vistas de seguimiento.