import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { CalendarioApp } from "./App";

export class CalendarioReservas
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private _container: HTMLDivElement;
  private _notifyOutputChanged: () => void;
  private _selectedDate = "";
  private _selectedBloque = "";

  init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._container = container;
    this._notifyOutputChanged = notifyOutputChanged;
    this._render(context);
  }

  updateView(context: ComponentFramework.Context<IInputs>): void {
    this._render(context);
  }

  private _render(context: ComponentFramework.Context<IInputs>): void {
    const ds = context.parameters.reservaciones;
    const reservas: { fecha: string; bloqueHorario: string; estado: string }[] = [];

    if (ds && ds.sortedRecordIds) {
      for (const id of ds.sortedRecordIds) {
        const r = ds.records[id];
        reservas.push({
          fecha:         r.getValue("fecha")?.toString() ?? "",
          bloqueHorario: r.getValue("bloqueHorario")?.toString() ?? "",
          estado:        r.getValue("estado")?.toString() ?? "",
        });
      }
    }

    ReactDOM.render(
      React.createElement(CalendarioApp, {
        reservas,
        onSeleccion: (fecha: string, bloque: string) => {
          this._selectedDate = fecha;
          this._selectedBloque = bloque;
          this._notifyOutputChanged();
        },
      }),
      this._container
    );
  }

  getOutputs(): IOutputs {
    return {
      selectedDate:   this._selectedDate,
      selectedBloque: this._selectedBloque,
    };
  }

  destroy(): void {
    ReactDOM.unmountComponentAtNode(this._container);
  }
}
