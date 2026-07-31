import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SemaforoApp, Prestamo } from "./App";

export class SemaforoPendientes
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private _container: HTMLDivElement;

  init(
    context: ComponentFramework.Context<IInputs>,
    _notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._container = container;
    this._render(context);
  }

  updateView(context: ComponentFramework.Context<IInputs>): void {
    this._render(context);
  }

  private _render(context: ComponentFramework.Context<IInputs>): void {
    const ds = context.parameters.prestamos;
    const prestamos: Prestamo[] = [];

    if (ds && ds.sortedRecordIds) {
      for (const id of ds.sortedRecordIds) {
        const r = ds.records[id];
        const fechaRaw = r.getValue("fechaDevolucionEsperada");
        const fecha = fechaRaw instanceof Date ? fechaRaw : new Date(fechaRaw?.toString() ?? "");
        prestamos.push({
          id,
          numeroTransaccion: r.getValue("numeroTransaccion")?.toString() ?? id,
          material:          r.getValue("material")?.toString() ?? "—",
          docente:           r.getValue("docente")?.toString() ?? "—",
          fechaDevolucionEsperada: fecha,
          estado:            r.getValue("estado")?.toString() ?? "",
        });
      }
    }

    ReactDOM.render(
      React.createElement(SemaforoApp, { prestamos }),
      this._container
    );
  }

  getOutputs(): IOutputs { return {}; }

  destroy(): void {
    ReactDOM.unmountComponentAtNode(this._container);
  }
}
