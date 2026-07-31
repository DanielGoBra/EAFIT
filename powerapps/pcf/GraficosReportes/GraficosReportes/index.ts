import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { GraficosApp } from "./App";

const AZUL = "#1A5CA8";

export class GraficosReportes
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
    const ds        = context.parameters.reporteData;
    const titulo    = (context.parameters.titulo?.raw as string)        ?? "";
    const colorPrim = (context.parameters.colorPrimario?.raw as string) ?? AZUL;
    const data: { etiqueta: string; valor: number; categoria?: string }[] = [];

    if (ds && ds.sortedRecordIds) {
      for (const id of ds.sortedRecordIds) {
        const r = ds.records[id];
        data.push({
          etiqueta:  r.getValue("etiqueta")?.toString()  ?? "",
          valor:     Number(r.getValue("valor"))         ?? 0,
          categoria: r.getValue("categoria")?.toString() ?? "",
        });
      }
    }

    ReactDOM.render(
      React.createElement(GraficosApp, { titulo, colorPrimario: colorPrim, data }),
      this._container
    );
  }

  getOutputs(): IOutputs { return {}; }

  destroy(): void {
    ReactDOM.unmountComponentAtNode(this._container);
  }
}
