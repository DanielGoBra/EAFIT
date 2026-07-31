# Integracion MCP para Power Apps EAFIT

## Estado actual

El proyecto ya tiene servidores MCP registrados a nivel proyecto en [c:\EAFIT\.mcp.json](.mcp.json).

- filesystem-eafit: acceso controlado al workspace y a la carpeta real del Excel local en C:\Users\DanielFelipeGómezBra\Universidad EAFIT\bd - Documentos.
- playwright-eafit: automatizacion E2E para validar botones, navegacion y formularios en la app publicada.
- chrome-devtools-eafit: inspeccion visual y tecnica de la app publicada para refinar layout, capturas, viewport y comportamiento visual.

## Para que sirve cada MCP en este proyecto

### filesystem-eafit

Usarlo cuando necesites:

- comparar [c:\EAFIT\studio_unpacked](studio_unpacked) contra [c:\EAFIT\powerapps\canvas\v10_src](powerapps/canvas/v10_src)
- inspeccionar el Excel local real fuera del repo
- revisar diferencias entre formulas Canvas, DataSources y archivos auxiliares

### playwright-eafit

Usarlo cuando necesites:

- validar que los botones de la app publicada ejecutan la accion correcta
- comprobar navegacion entre Dashboard, Reservas, Prestamos, Cocina y Recursos
- hacer pruebas de humo despues de publicar cambios o reconectar tablas

### chrome-devtools-eafit

Usarlo cuando necesites:

- revisar espaciados, jerarquia visual y consistencia entre pantallas publicadas
- capturar estados de la UI con viewport controlado para comparar iteraciones
- inspeccionar render, red y comportamiento del navegador cuando la app no se ve bien
- complementar a Playwright cuando el problema es mas visual que funcional

## Validacion rapida

Desde la raiz del proyecto:

```powershell
npx @anthropic-ai/claude-code mcp get filesystem-eafit
npx @anthropic-ai/claude-code mcp get playwright-eafit
npx @anthropic-ai/claude-code mcp get chrome-devtools-eafit
```

Resultado esperado hoy:

- filesystem-eafit: conectado
- playwright-eafit: conectado
- chrome-devtools-eafit: conectado

## MCP recomendado para mejorar la interfaz

El MCP mas util para llevar una interfaz basica de Power Apps a algo mas pulido, con el stack actual, es chrome-devtools-eafit.

```powershell
cmd /c npx -y chrome-devtools-mcp --headless --isolated --viewport 1440x900 --no-usage-statistics
```

Motivo:

- no depende de permisos del tenant ni de credenciales empresariales
- trabaja sobre la app publicada, que es donde realmente se percibe la calidad visual
- permite capturas y analisis iterativo del resultado final, no solo del unpack

Si luego el equipo dispone de Figma operativo para este flujo, la opcion complementaria a evaluar es figma-developer-mcp para extraer tokens y medidas desde un archivo de diseño. No se integró ahora para evitar dejar otro servidor dependiente de credenciales no confirmadas.

## Integraciones descartadas por ahora

- Microsoft 365 / Graph: descartado temporalmente porque el tenant no concede los permisos necesarios para autenticacion.
- Figma MCP: recomendado a futuro si el equipo tiene archivo y acceso confirmados, pero no se integró en esta fase para no dejar configuraciones fallando.

## Flujo recomendado para este MVP

1. Usar filesystem-eafit para comparar el unpack activo contra la fuente buena y contra el Excel local.
2. Usar playwright-eafit para validar flujo funcional de botones, formularios y navegacion.
3. Usar chrome-devtools-eafit para refinar jerarquia visual, espaciado, viewport y consistencia entre pantallas.
4. Empaquetar o validar cambios Canvas con pac sobre el unpack estable, no con scripts viejos de regeneracion.

## Nota operativa

Power Apps no consume en runtime una ruta Windows local. El archivo local sirve como referencia y fuente de comparacion, pero la app ejecuta contra el dataset cloud del conector Excel Online Business. Mientras no exista acceso Microsoft 365 desde este entorno, la validacion de conexion debe hacerse desde Power Apps Studio y la validacion visual/funcional desde los MCP ya activos.