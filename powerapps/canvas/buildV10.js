/**
 * buildV10.js — EAFIT Control de Idiomas v10  (Semana 1: Roles + CRUD inventario)
 * pac canvas pack workflow: studio_unpacked (patched) → ControlMVP_v10.msapp
 * Nota 2026-04-21: la estabilizacion funcional del MVP quedo aplicada directamente en
 * `powerapps/canvas/v10_src/Src/*.fx.yaml`; este script debe actualizarse antes de
 * regenerar esos artefactos para no sobrescribir la logica corregida.
 *
 * Tablas Excel (reales):
 *   Tabla1  → Recursos:  Juegos, Descripción, Unidades, Categoria, Observaciones
 *   Tabla2  → Cocina:    Elemento, Und, Existencia, Observaciones, Malo, Regular, Bueno
 *   Usuarios → Email, Nombre, Rol (SuperAdmin|Admin|Docente), Activo
 *
 * Roles:
 *   SuperAdmin → CRUD completo, gestión de usuarios
 *   Admin      → registrar retiro/devolución, ver reservas
 *   Docente    → solo lectura + reservar
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Paths ─────────────────────────────────────────────────────────────────────
const ORIG = 'C:/EAFIT/studio_unpacked';
const SRC  = 'C:/EAFIT/powerapps/canvas/v10_src';
const OUT  = 'C:/EAFIT/powerapps/canvas/ControlMVP_v10.msapp';
const PAC  = 'C:/Users/DanielFelipeGómezBra/AppData/Local/Microsoft/PowerAppsCLI/Microsoft.PowerApps.CLI.2.5.1/tools/pac.exe';

// ── EAFIT palette ─────────────────────────────────────────────────────────────
const C = {
  navy:        'RGBA(15, 61, 115, 1)',
  navyDark:    'RGBA(8, 32, 70, 1)',
  blue:        'RGBA(26, 92, 168, 1)',
  blueLight:   'RGBA(46, 123, 196, 1)',
  canvas:      'RGBA(238, 244, 252, 1)',
  canvasMid:   'RGBA(220, 232, 248, 1)',
  white:       'RGBA(255, 255, 255, 1)',
  yellow:      'RGBA(247, 181, 0, 1)',
  yellowDark:  'RGBA(204, 150, 0, 1)',
  yellowLight: 'RGBA(255, 248, 220, 1)',
  gray:        'RGBA(107, 112, 128, 1)',
  grayLight:   'RGBA(243, 244, 246, 1)',
  grayMid:     'RGBA(229, 231, 235, 1)',
  border:      'RGBA(203, 213, 225, 1)',
  textDark:    'RGBA(26, 39, 66, 1)',
  transparent: 'RGBA(0, 0, 0, 0)',
  overlay:     'RGBA(0, 0, 0, 0.55)',
};

// ── Layout constants ──────────────────────────────────────────────────────────
const HDR     = 72;
const ACCENT  = 3;
const PAD     = 20;
const GAP     = 16;
const BTN_H   = 44;
const SRCH_Y  = HDR + ACCENT + 8;   // 83
const SRCH_H  = 38;
const DT_Y    = SRCH_Y + SRCH_H;    // 121
const INPUT_H = 60;

const IS_EAFIT = `EndsWith(Lower(User().Email), "@eafit.edu.co")`;
const LC_W = 500; const LC_H = 428;
const LC_X = `(Parent.Width - ${LC_W}) / 2`;
const LC_Y = `(Parent.Height - ${LC_H}) / 2`;

const CW     = `(Parent.Width - ${PAD*2} - ${GAP}) / 2`;
const STRIP_H = 60;  // alertas strip below 2×2 card grid
const CH     = `(Parent.Height - ${HDR + ACCENT + PAD + GAP + PAD + GAP + STRIP_H}) / 2`;
const R1Y    = HDR + ACCENT + PAD;
const R2Y    = `${R1Y} + ${CH} + ${GAP}`;
// Alert strip Y = R1Y + 2*CH + 2*GAP = Parent.Height - STRIP_H - PAD
const STRIP_Y = `Parent.Height - ${STRIP_H + PAD}`;

// ── fx.yaml helpers ───────────────────────────────────────────────────────────
const ind = n => ' '.repeat(n);
function ctrl(name, type, variant, indent, props) {
  const h = `${ind(indent)}${name} As ${type}${variant ? '.' + variant : ''}:`;
  return [h, ...Object.entries(props).map(([k,v]) => `${ind(indent+4)}${k}: =${v}`)].join('\n');
}
const rect = (n, p, i=4) => ctrl(n, 'rectangle', 'ManualInput', i, p);
const lbl  = (n, p, i=4) => ctrl(n, 'label',     'Label',       i, p);
const tin  = (n, p, i=4) => ctrl(n, 'text',       'TextInput',   i, p);

// ── ASCII-safe identifier ─────────────────────────────────────────────────────
function toAsciiId(str) {
  return str
    .replace(/[áàäâãÁÀÄÂÃ]/g, 'a').replace(/[éèëêÉÈËÊ]/g, 'e')
    .replace(/[íìïîÍÌÏÎ]/g, 'i') .replace(/[óòöôõÓÒÖÔÕ]/g, 'o')
    .replace(/[úùüûÚÙÜÛ]/g, 'u') .replace(/[ñÑ]/g, 'n')
    .replace(/[^a-zA-Z0-9_]/g, '_');
}

// ════════════════════════════════════════════════════════════════════════════
// PATCH HELPERS — DataTable column section (YAML + EditorState)
// ════════════════════════════════════════════════════════════════════════════
function makeColumnYaml(cols, prefix='') {
  return cols.map((col, idx) => {
    const baseName = `${toAsciiId(col.field)}_Columna${idx + 1}`;
    const ctrlName = prefix ? `${prefix}_${baseName}` : baseName;
    return [
      `        ${ctrlName} As dataTableColumn.textualColumn:`,
      `            DisplayMode: =DisplayMode.Edit`,
      `            FieldDisplayName: ="${col.display || col.field}"`,
      `            FieldName: ="${col.field}"`,
      `            FieldVariantName: ="textualColumn"`,
      `            Height: =Parent.Height`,
      `            LayoutHeight: =Parent.Height`,
      `            Order: =${idx + 1}`,
      `            Text: =ThisItem.${col.field}`,
      `            Width: =${col.width}`,
      `            X: =0`,
      `            Y: =0`,
      `            ZIndex: =0`,
    ].join('\n');
  }).join('\n\n');
}

function makeColEditorEntry(ctrlName, parentIdx) {
  return {
    AllowAccessToGlobals: true,
    ControlPropertyState: [
      'FieldName','Order','FieldVariantName','FieldDisplayName',
      'LayoutHeight','X','Y','Width','Height','DisplayMode','ZIndex','Text'
    ],
    HasDynamicProperties: false,
    IsAutoGenerated: false, IsComponentDefinition: false, IsDataControl: false,
    IsFromScreenLayout: false, IsGroupControl: false,
    IsLocked: true,
    LayoutName: '', MetaDataIDKey: '', Name: ctrlName,
    OptimizeForDevices: 'Off', ParentIndex: parentIdx, PersistMetaDataIDKey: false,
    Properties: [
      { Category: 'Data',   PropertyName: 'FieldName',        RuleProviderType: 'Unknown' },
      { Category: 'Data',   PropertyName: 'Order',            RuleProviderType: 'Unknown' },
      { Category: 'Data',   PropertyName: 'FieldVariantName', RuleProviderType: 'Unknown' },
      { Category: 'Data',   PropertyName: 'FieldDisplayName', RuleProviderType: 'Unknown' },
      { Category: 'Data',   PropertyName: 'Text',             RuleProviderType: 'Unknown' },
      { Category: 'Design', PropertyName: 'LayoutHeight',     RuleProviderType: 'Unknown' },
      { Category: 'Design', PropertyName: 'X',                RuleProviderType: 'Unknown' },
      { Category: 'Design', PropertyName: 'Y',                RuleProviderType: 'Unknown' },
      { Category: 'Design', PropertyName: 'Width',            RuleProviderType: 'Unknown' },
      { Category: 'Design', PropertyName: 'Height',           RuleProviderType: 'Unknown' },
      { Category: 'Design', PropertyName: 'DisplayMode',      RuleProviderType: 'Unknown' },
      { Category: 'Design', PropertyName: 'ZIndex',           RuleProviderType: 'Unknown' },
    ],
    StyleName: '', Type: 'ControlInfo',
  };
}

function patchYamlColumns(yamlContent, newCols) {
  const firstColMatch = yamlContent.match(/\n        [^\n]+ As dataTableColumn/);
  if (!firstColMatch) throw new Error('No DataTable columns found');
  const colStart = firstColMatch.index + 1;
  const afterCols = yamlContent.slice(colStart);
  const dtEndMatch = afterCols.match(/\n    \w/);
  const colEnd = dtEndMatch
    ? colStart + dtEndMatch.index + 1
    : yamlContent.length;
  return yamlContent.slice(0, colStart) + makeColumnYaml(newCols) + '\n\n' + yamlContent.slice(colEnd);
}

function patchEditorStateColumns(esContent, newCols, extraEntries = {}) {
  const es = JSON.parse(esContent);
  for (const key of Object.keys(es.ControlStates)) {
    if (es.ControlStates[key].IsLocked === true) delete es.ControlStates[key];
  }
  newCols.forEach((col, idx) => {
    const ctrlName = `${toAsciiId(col.field)}_Columna${idx + 1}`;
    es.ControlStates[ctrlName] = makeColEditorEntry(ctrlName, idx);
  });
  Object.assign(es.ControlStates, extraEntries);
  return JSON.stringify(es, null, 2);
}

// ── Search bar YAML snippet ───────────────────────────────────────────────────
function makeSearchBarYaml(sn) {
  return [
    `    RctSearch${sn} As rectangle.ManualInput:`,
    `        BorderColor: =${C.border}`,
    `        BorderThickness: =1`,
    `        Fill: =${C.white}`,
    `        Height: =${SRCH_H}`,
    `        Width: =Parent.Width - 40`,
    `        X: =${PAD}`,
    `        Y: =${SRCH_Y}`,
    ``,
    `    LblSearchIco${sn} As label.Label:`,
    `        Align: =Align.Center`,
    `        Color: =${C.gray}`,
    `        Height: =${SRCH_H}`,
    `        Size: =14`,
    `        Text: ="\uD83D\uDD0D"`,
    `        Width: =28`,
    `        X: =${PAD + 8}`,
    `        Y: =${SRCH_Y}`,
    ``,
    `    LblSearchHint${sn} As label.Label:`,
    `        Color: =${C.gray}`,
    `        Height: =${SRCH_H}`,
    `        Size: =12`,
    `        Text: ="Buscar por nombre..."`,
    `        VerticalAlign: =VerticalAlign.Middle`,
    `        Width: =Parent.Width - 96`,
    `        X: =${PAD + 36}`,
    `        Y: =${SRCH_Y}`,
  ].join('\n');
}

function makeSearchBarEditorEntries(sn, startIdx) {
  return {
    [`RctSearch${sn}`]: {
      AllowAccessToGlobals: true,
      ControlPropertyState: ['X','Y','Width','Height','Fill','BorderColor','BorderThickness','ZIndex'],
      HasDynamicProperties: false,
      IsAutoGenerated: false, IsComponentDefinition: false, IsDataControl: false,
      IsFromScreenLayout: false, IsGroupControl: false, IsLocked: false,
      LayoutName: '', MetaDataIDKey: '', Name: `RctSearch${sn}`,
      OptimizeForDevices: 'Off', ParentIndex: startIdx, PersistMetaDataIDKey: false,
      Properties: [
        { Category: 'Design', PropertyName: 'X',               RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Y',               RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Width',           RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Height',          RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Fill',            RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'BorderColor',     RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'BorderThickness', RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'ZIndex',          RuleProviderType: 'Unknown' },
      ],
      StyleName: 'defaultRectangleStyle', Type: 'ControlInfo',
    },
    [`LblSearchIco${sn}`]: {
      AllowAccessToGlobals: true,
      ControlPropertyState: ['X','Y','Width','Height','Fill','Text','Size','Color','Align','VerticalAlign','ZIndex'],
      HasDynamicProperties: false,
      IsAutoGenerated: false, IsComponentDefinition: false, IsDataControl: false,
      IsFromScreenLayout: false, IsGroupControl: false, IsLocked: false,
      LayoutName: '', MetaDataIDKey: '', Name: `LblSearchIco${sn}`,
      OptimizeForDevices: 'Off', ParentIndex: startIdx + 1, PersistMetaDataIDKey: false,
      Properties: [
        { Category: 'Data',   PropertyName: 'Text',         RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'X',            RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Y',            RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Width',        RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Height',       RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Fill',         RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Size',         RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Color',        RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Align',        RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'VerticalAlign',RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'ZIndex',       RuleProviderType: 'Unknown' },
      ],
      StyleName: 'defaultLabelStyle', Type: 'ControlInfo',
    },
    [`LblSearchHint${sn}`]: {
      AllowAccessToGlobals: true,
      ControlPropertyState: ['X','Y','Width','Height','Fill','Text','Color','Size','VerticalAlign','ZIndex'],
      HasDynamicProperties: false,
      IsAutoGenerated: false, IsComponentDefinition: false, IsDataControl: false,
      IsFromScreenLayout: false, IsGroupControl: false, IsLocked: false,
      LayoutName: '', MetaDataIDKey: '', Name: `LblSearchHint${sn}`,
      OptimizeForDevices: 'Off', ParentIndex: startIdx + 2, PersistMetaDataIDKey: false,
      Properties: [
        { Category: 'Data',   PropertyName: 'Text',         RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'X',            RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Y',            RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Width',        RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Height',       RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Fill',         RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Color',        RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'Size',         RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'VerticalAlign',RuleProviderType: 'Unknown' },
        { Category: 'Design', PropertyName: 'ZIndex',       RuleProviderType: 'Unknown' },
      ],
      StyleName: 'defaultLabelStyle', Type: 'ControlInfo',
    },
  };
}

// Functional search bar YAML (TextInput + icon label) for studio-patched screens
function makeFunctionalSearchYaml(sn, suffix) {
  const tinName = `TxtSearch${suffix}`;
  return [
    `    ${tinName} As text.TextInput:`,
    `        BorderColor: =${C.border}`,
    `        BorderThickness: =1`,
    `        Default: =""`,
    `        Fill: =${C.white}`,
    `        Height: =${SRCH_H}`,
    `        HintText: ="Buscar..."`,
    `        Mode: =TextMode.SingleLine`,
    `        PaddingLeft: =36`,
    `        PaddingRight: =10`,
    `        Width: =Parent.Width - 40`,
    `        X: =${PAD}`,
    `        Y: =${SRCH_Y}`,
    ``,
    `    LblSearchIco${sn} As label.Label:`,
    `        Align: =Align.Center`,
    `        Color: =${C.gray}`,
    `        DisplayMode: =DisplayMode.View`,
    `        Height: =${SRCH_H}`,
    `        Size: =14`,
    `        Text: ="\uD83D\uDD0D"`,
    `        Width: =28`,
    `        X: =${PAD + 6}`,
    `        Y: =${SRCH_Y}`,
  ].join('\n');
}

function makeFunctionalSearchEditorEntries(sn, suffix, startIdx) {
  const tinName = `TxtSearch${suffix}`;
  const makeProps = (...names) => names.map(n => ({
    Category: ['Default','HintText','Text'].includes(n) ? 'Data' : 'Design',
    PropertyName: n, RuleProviderType: 'Unknown',
  }));
  return {
    [tinName]: {
      AllowAccessToGlobals: true,
      ControlPropertyState: ['X','Y','Width','Height','Fill','BorderColor','BorderThickness','Default','HintText','Mode','PaddingLeft','PaddingRight'],
      HasDynamicProperties: false,
      IsAutoGenerated: false, IsComponentDefinition: false, IsDataControl: false,
      IsFromScreenLayout: false, IsGroupControl: false, IsLocked: false,
      LayoutName: '', MetaDataIDKey: '', Name: tinName,
      OptimizeForDevices: 'Off', ParentIndex: startIdx, PersistMetaDataIDKey: false,
      Properties: makeProps('Default','HintText','X','Y','Width','Height','Fill','BorderColor','BorderThickness','Mode','PaddingLeft','PaddingRight'),
      StyleName: 'defaultLabelStyle', Type: 'ControlInfo',
    },
    [`LblSearchIco${sn}`]: {
      AllowAccessToGlobals: true,
      ControlPropertyState: ['X','Y','Width','Height','Text','Size','Color','Align','DisplayMode'],
      HasDynamicProperties: false,
      IsAutoGenerated: false, IsComponentDefinition: false, IsDataControl: false,
      IsFromScreenLayout: false, IsGroupControl: false, IsLocked: false,
      LayoutName: '', MetaDataIDKey: '', Name: `LblSearchIco${sn}`,
      OptimizeForDevices: 'Off', ParentIndex: startIdx + 1, PersistMetaDataIDKey: false,
      Properties: makeProps('Text','X','Y','Width','Height','Size','Color','Align','DisplayMode'),
      StyleName: 'defaultLabelStyle', Type: 'ControlInfo',
    },
  };
}
// Parameters:
//   dtName:     DataTable control name  (DataTable1 | DataTable2)
//   nameField:  Field to show in bar    (Elemento | Juegos)
//   tableName:  Data source to Remove   (Tabla2 | Tabla1)
//   formScreen: Screen to navigate for edit
//   suf:        unique suffix for control names
// ════════════════════════════════════════════════════════════════════════════
function makeActionBarYaml(dtName, nameField, tableName, formScreen, suf, docCanAdd=false) {
  const BY = `Parent.Height - 72`;
  const sel = `!IsBlank(${dtName}.Selected.${nameField})`;
  const parts = [
    // Background bar
    rect(`RctActBar${suf}`, {
      X:0, Y:BY, Width:'Parent.Width', Height:72,
      Fill:C.white, BorderColor:C.border, BorderThickness:1,
      Visible: sel,
    }),
    // Selected item name label
    lbl(`LblActName${suf}`, {
      X:16, Y:BY, Width:'Parent.Width - 168', Height:72,
      Fill:C.transparent,
      Text:`${dtName}.Selected.${nameField}`,
      Color:C.navy, Size:12, FontWeight:'FontWeight.Semibold',
      VerticalAlign:'VerticalAlign.Middle',
      Visible: sel,
    }),
    // Edit button (Admin+)
    rect(`RctEditBtn${suf}`, {
      X:'Parent.Width - 156', Y:`${BY} + 14`, Width:68, Height:BTN_H,
      Fill:C.blue, BorderThickness:0,
      RadiusTopLeft:6, RadiusTopRight:6, RadiusBottomLeft:6, RadiusBottomRight:6,
      OnSelect:`Set(gItemEdit,${dtName}.Selected);Navigate(${formScreen},ScreenTransition.Slide)`,
      Visible:`${sel} && gRol <> "Docente"`,
    }),
    lbl(`LblEditBtn${suf}`, {
      X:'Parent.Width - 156', Y:`${BY} + 14`, Width:68, Height:BTN_H,
      Fill:C.transparent, Text:`"\u270F Editar"`,
      Color:C.white, Size:11, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gItemEdit,${dtName}.Selected);Navigate(${formScreen},ScreenTransition.Slide)`,
      Visible:`${sel} && gRol <> "Docente"`,
    }),
    // Delete button (SuperAdmin only)
    rect(`RctDelBtn${suf}`, {
      X:'Parent.Width - 80', Y:`${BY} + 14`, Width:64, Height:BTN_H,
      Fill:C.navyDark, BorderThickness:0,
      RadiusTopLeft:6, RadiusTopRight:6, RadiusBottomLeft:6, RadiusBottomRight:6,
      OnSelect:`Set(gItemEdit,${dtName}.Selected);Set(gConfirmDelInv,true)`,
      Visible:`${sel} && gRol = "SuperAdmin"`,
    }),
    lbl(`LblDelBtn${suf}`, {
      X:'Parent.Width - 80', Y:`${BY} + 14`, Width:64, Height:BTN_H,
      Fill:C.transparent, Text:`"\uD83D\uDDD1 Borrar"`,
      Color:C.yellow, Size:11, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gItemEdit,${dtName}.Selected);Set(gConfirmDelInv,true)`,
      Visible:`${sel} && gRol = "SuperAdmin"`,
    }),
    // Confirm delete overlay
    rect(`RctDelOvl${suf}`, {
      X:0, Y:0, Width:'Parent.Width', Height:'Parent.Height',
      Fill:C.overlay, BorderThickness:0, Visible:'gConfirmDelInv',
    }),
    rect(`RctDelCard${suf}`, {
      X:'(Parent.Width-310)/2', Y:'(Parent.Height-170)/2',
      Width:310, Height:170, Fill:C.white, BorderThickness:0,
      RadiusTopLeft:12, RadiusTopRight:12, RadiusBottomLeft:12, RadiusBottomRight:12,
      Visible:'gConfirmDelInv',
    }),
    lbl(`LblDelMsg${suf}`, {
      X:'(Parent.Width-278)/2', Y:'(Parent.Height-170)/2+16',
      Width:278, Height:64,
      Fill:C.transparent,
      Text:`"¿Eliminar \\"" & gItemEdit.${nameField} & "\\"?" & Char(10) & "Esta acción no se puede deshacer."`,
      Color:C.textDark, Size:12, Align:'Align.Center',
      VerticalAlign:'VerticalAlign.Top', PaddingTop:6,
      Visible:'gConfirmDelInv',
    }),
    rect(`RctDelYes${suf}`, {
      X:'(Parent.Width-310)/2+16', Y:'(Parent.Height-170)/2+96',
      Width:130, Height:40, Fill:C.navyDark, BorderThickness:0,
      RadiusTopLeft:6, RadiusTopRight:6, RadiusBottomLeft:6, RadiusBottomRight:6,
      OnSelect:`Remove(${tableName},gItemEdit);Set(gConfirmDelInv,false);Set(gItemEdit,Blank())`,
      Visible:'gConfirmDelInv',
    }),
    lbl(`LblDelYes${suf}`, {
      X:'(Parent.Width-310)/2+16', Y:'(Parent.Height-170)/2+96',
      Width:130, Height:40, Fill:C.transparent, Text:'"Eliminar"',
      Color:C.yellow, Size:12, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Remove(${tableName},gItemEdit);Set(gConfirmDelInv,false);Set(gItemEdit,Blank())`,
      Visible:'gConfirmDelInv',
    }),
    rect(`RctDelNo${suf}`, {
      X:'(Parent.Width-310)/2+164', Y:'(Parent.Height-170)/2+96',
      Width:130, Height:40, Fill:C.grayMid, BorderThickness:0,
      RadiusTopLeft:6, RadiusTopRight:6, RadiusBottomLeft:6, RadiusBottomRight:6,
      OnSelect:`Set(gConfirmDelInv,false)`,
      Visible:'gConfirmDelInv',
    }),
    lbl(`LblDelNo${suf}`, {
      X:'(Parent.Width-310)/2+164', Y:'(Parent.Height-170)/2+96',
      Width:130, Height:40, Fill:C.transparent, Text:'"Cancelar"',
      Color:C.textDark, Size:12, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gConfirmDelInv,false)`,
      Visible:'gConfirmDelInv',
    }),
    // FAB transparent overlay (gives OnSelect + hides for Docentes when docCanAdd=false)
    rect(`RctFabAct${suf}`, {
      X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
      Fill:C.transparent, BorderThickness:0,
      OnSelect:`Set(gItemEdit,Blank());Navigate(${formScreen},ScreenTransition.Slide)`,
      Visible: docCanAdd ? 'true' : `gRol <> "Docente"`,
    }),
    // FAB mask for Docentes (covers the blue FAB from studio)
    rect(`RctFabMask${suf}`, {
      X:'Parent.Width - 80', Y:'Parent.Height - 80', Width:64, Height:64,
      Fill:C.canvas, BorderThickness:0,
      Visible: docCanAdd ? 'false' : `gRol = "Docente"`,
    }),
  ];
  return parts.join('\n\n');
}

// ════════════════════════════════════════════════════════════════════════════
// FORM HELPERS — inline form section builder
// ════════════════════════════════════════════════════════════════════════════
function makeFormHeader(suf, backScreen, titleFormula) {
  return [
    rect(`RctHdr${suf}`, { X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 }),
    rect(`RctBack${suf}`, {
      X:4,Y:16,Width:44,Height:40,Fill:C.blueLight,BorderThickness:0,
      RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
      OnSelect:`Set(gItemEdit,Blank());Navigate(${backScreen},ScreenTransition.None)`,
    }),
    lbl(`LblBack${suf}`, {
      X:4,Y:16,Width:44,Height:40,Fill:C.transparent,Text:`"\u2190"`,
      Color:C.white,Size:22,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gItemEdit,Blank());Navigate(${backScreen},ScreenTransition.None)`,
    }),
    lbl(`LblTitle${suf}`, {
      X:58,Y:0,Width:'Parent.Width - 68',Height:HDR,Fill:C.transparent,
      Text:titleFormula,Color:C.white,Size:16,FontWeight:'FontWeight.Bold',
      Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle',
    }),
    rect(`RctAccent${suf}`,{X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0}),
  ].join('\n\n');
}

function makeFieldBlock(suf, index, labelText, inputName, fieldExpr, multiline=false) {
  const LBL_H = 22;
  const INP_H = multiline ? 80 : 44;
  const BASE_Y = HDR + ACCENT + 12;
  const FIELD_STEP = LBL_H + INP_H + 14;
  const y = BASE_Y + index * FIELD_STEP;
  return [
    lbl(`LblF${suf}${index}`, {
      X:20,Y:y,Width:'Parent.Width - 40',Height:LBL_H,
      Fill:C.transparent, Text:labelText,
      Color:C.navy, Size:12, FontWeight:'FontWeight.Semibold',
      VerticalAlign:'VerticalAlign.Middle',
    }),
    tin(inputName, {
      Default:fieldExpr, Height:INP_H, Mode:`TextMode.${multiline ? 'MultiLine' : 'SingleLine'}`,
      Width:'Parent.Width - 40', X:20, Y:y + LBL_H + 2,
      BorderColor:C.border, BorderThickness:1, Fill:C.white,
      PaddingLeft:10, PaddingRight:10,
    }),
  ].join('\n\n');
}

// ────────────────────────────────────────────────────────────────────────────
// CONFIRM-DELETE overlay (used inside form screens)
// ────────────────────────────────────────────────────────────────────────────
function makeFormDeleteOverlay(suf, tableName, backScreen) {
  return [
    rect(`RctFDelOvl${suf}`, {
      X:0,Y:0,Width:'Parent.Width',Height:'Parent.Height',
      Fill:C.overlay, BorderThickness:0, Visible:'gConfirmDel',
    }),
    rect(`RctFDelCard${suf}`, {
      X:'(Parent.Width-310)/2', Y:'(Parent.Height-180)/2',
      Width:310, Height:180, Fill:C.white, BorderThickness:0,
      RadiusTopLeft:12,RadiusTopRight:12,RadiusBottomLeft:12,RadiusBottomRight:12,
      Visible:'gConfirmDel',
    }),
    lbl(`LblFDelMsg${suf}`, {
      X:'(Parent.Width-278)/2', Y:'(Parent.Height-180)/2+16',
      Width:278, Height:72, Fill:C.transparent,
      Text:'"¿Eliminar este elemento?" & Char(10) & "Esta acción no se puede deshacer."',
      Color:C.textDark, Size:13, Align:'Align.Center',
      VerticalAlign:'VerticalAlign.Top', PaddingTop:8,
      Visible:'gConfirmDel',
    }),
    rect(`RctFDelYes${suf}`, {
      X:'(Parent.Width-310)/2+16', Y:'(Parent.Height-180)/2+104',
      Width:130, Height:40, Fill:C.navyDark, BorderThickness:0,
      RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
      OnSelect:`Remove(${tableName},gItemEdit);Set(gConfirmDel,false);Navigate(${backScreen},ScreenTransition.None)`,
      Visible:'gConfirmDel',
    }),
    lbl(`LblFDelYes${suf}`, {
      X:'(Parent.Width-310)/2+16', Y:'(Parent.Height-180)/2+104',
      Width:130, Height:40, Fill:C.transparent, Text:'"Eliminar"',
      Color:C.yellow, Size:12, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Remove(${tableName},gItemEdit);Set(gConfirmDel,false);Navigate(${backScreen},ScreenTransition.None)`,
      Visible:'gConfirmDel',
    }),
    rect(`RctFDelNo${suf}`, {
      X:'(Parent.Width-310)/2+164', Y:'(Parent.Height-180)/2+104',
      Width:130, Height:40, Fill:C.grayMid, BorderThickness:0,
      RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
      OnSelect:`Set(gConfirmDel,false)`, Visible:'gConfirmDel',
    }),
    lbl(`LblFDelNo${suf}`, {
      X:'(Parent.Width-310)/2+164', Y:'(Parent.Height-180)/2+104',
      Width:130, Height:40, Fill:C.transparent, Text:'"Cancelar"',
      Color:C.textDark, Size:12, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gConfirmDel,false)`,
      Visible:'gConfirmDel',
    }),
  ].join('\n\n');
}

// ════════════════════════════════════════════════════════════════════════════
// DataTable YAML + EditorState helpers
// ════════════════════════════════════════════════════════════════════════════
function makeDataTableYaml(dtName, tableName, dtY, cols, bottomPad=0, filterExpr='', visibleExpr='') {
  const heightExpr = bottomPad > 0
    ? `Parent.Height - ${dtY} - ${bottomPad}`
    : `Parent.Height - ${dtY}`;
  const itemsExpr = filterExpr || tableName;
  return [
    `    ${dtName} As dataTable.datatable:`,
    `        BorderColor: =RGBA(0, 0, 0, 0)`,
    `        BorderStyle: =BorderStyle.Solid`,
    `        Color: =RGBA(50, 49, 48, 1)`,
    `        DisabledColor: =RGBA(161, 159, 157, 1)`,
    `        DisplayMode: =DisplayMode.Edit`,
    `        Fill: =RGBA(0, 0, 0, 0)`,
    `        Font: =Font.'Segoe UI'`,
    `        FontWeight: =FontWeight.Normal`,
    `        HeadingColor: =RGBA(255, 255, 255, 1)`,
    `        HeadingFill: =${C.navy}`,
    `        HeadingFont: =Font.'Segoe UI'`,
    `        HeadingFontWeight: =FontWeight.Normal`,
    `        HeadingSize: =13`,
    `        Height: =${heightExpr}`,
    `        HoverColor: =${C.navy}`,
    `        HoverFill: =${C.canvasMid}`,
    `        InputFill: =RGBA(245, 245, 245, 1)`,
    `        InvertedColor: =RGBA(255, 255, 255, 1)`,
    `        Items: =${itemsExpr}`,
    `        LinkColor: =RGBA(0, 120, 212, 1)`,
    `        PrimaryColor1: =${C.blue}`,
    `        PrimaryColor2: =${C.blueLight}`,
    `        PrimaryColor3: =${C.navy}`,
    `        SelectedColor: =${C.navy}`,
    `        SelectedFill: =${C.canvasMid}`,
    `        Size: =13`,
    ...(visibleExpr ? [`        Visible: =${visibleExpr}`] : []),
    `        Width: =Parent.Width`,
    `        X: =0`,
    `        Y: =${dtY}`,
    `        ZIndex: =1`,
    ``,
    makeColumnYaml(cols, dtName),
  ].join('\n');
}

function makeDataTableEditorEntry(dtName, parentIdx) {
  const props = ['Fill','Color','DisabledColor','BorderColor','BorderStyle','Font','FontWeight',
    'X','Y','Width','Height','DisplayMode','ZIndex','LinkColor',
    'PrimaryColor1','PrimaryColor2','PrimaryColor3','SelectedFill','SelectedColor',
    'HoverFill','HoverColor','InputFill','InvertedColor',
    'HeadingFont','HeadingSize','HeadingFontWeight','HeadingFill','HeadingColor','Size','Items'];
  return {
    AllowAccessToGlobals: true,
    ControlPropertyState: props,
    HasDynamicProperties: false,
    IsAutoGenerated: false, IsComponentDefinition: false, IsDataControl: false,
    IsFromScreenLayout: false, IsGroupControl: false, IsLocked: false,
    LayoutName: '', MetaDataIDKey: '', Name: dtName,
    OptimizeForDevices: 'Off', ParentIndex: parentIdx, PersistMetaDataIDKey: false,
    Properties: [
      { Category:'Data',   PropertyName:'Items',             RuleProviderType:'Unknown' },
      ...['Fill','Color','DisabledColor','BorderColor','BorderStyle','Font','FontWeight',
         'X','Y','Width','Height','DisplayMode','ZIndex','LinkColor',
         'PrimaryColor1','PrimaryColor2','PrimaryColor3','SelectedFill','SelectedColor',
         'HoverFill','HoverColor','InputFill','InvertedColor',
         'HeadingFont','HeadingSize','HeadingFontWeight','HeadingFill','HeadingColor','Size']
        .map(p => ({ Category:'Design', PropertyName:p, RuleProviderType:'Unknown' })),
    ],
    StyleName: 'defaultDataTableStyle',
    Type: 'ControlInfo',
  };
}

// ════════════════════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════
const COCINA_COLS = [
  { field: 'Elemento',      display: 'Elemento',       width: 400 },
  { field: 'Und',           display: 'Und',            width: 100 },
  { field: 'Existencia',    display: 'Existencia',     width: 150 },
  { field: 'Observaciones', display: 'Observaciones',  width: 618 },
];

const RECURSOS_COLS = [
  { field: 'Juegos',            display: 'Juegos',           width: 320 },
  { field: 'Descripci\u00f3n', display: 'Descripci\u00f3n', width: 320 },
  { field: 'Unidades',          display: 'Unidades',         width: 150 },
  { field: 'Categoria',         display: 'Categor\u00eda',   width: 300 },
];

const RESERVAS_COLS = [
  { field: 'Docente',     display: 'Docente',      width: 220 },
  { field: 'Recurso',     display: 'Recurso',      width: 220 },
  { field: 'FechaInicio', display: 'Fecha Inicio', width: 180 },
  { field: 'FechaFin',    display: 'Fecha Fin',    width: 180 },
  { field: 'Estado',      display: 'Estado',       width: 150 },
];

const PRESTAMOS_COLS = [
  { field: 'Item',     display: 'Art\u00edculo',   width: 200 },
  { field: 'Tipo',     display: 'Tipo',             width: 110 },
  { field: 'Usuario',  display: 'Docente',          width: 190 },
  { field: 'Fecha',    display: 'Retiro',           width: 130 },
  { field: 'FechaFin', display: 'Dev. esperada',    width: 130 },
  { field: 'Estado',   display: 'Estado',           width: 100 },
];

const ALERTAS_COLS = [
  { field: 'Item',     display: 'Art\u00edculo',    width: 220 },
  { field: 'Usuario',  display: 'Docente',           width: 220 },
  { field: 'Fecha',    display: 'Retiro',            width: 150 },
  { field: 'FechaFin', display: 'Dev. esperada',     width: 150 },
];

// Reporte 1 — Uso por Docente (GroupBy Tabla4 by Docente)
const RPT1_COLS = [
  { field: 'Docente',   display: 'Docente',   width: 300 },
  { field: 'Reservas',  display: 'Reservas',  width: 150 },
];
// Reporte 2 — Uso por Material (GroupBy Tabla4 by Recurso)
const RPT2_COLS = [
  { field: 'Recurso',  display: 'Recurso',  width: 300 },
  { field: 'Usos',     display: 'Usos',     width: 150 },
];
// Reporte 3 — Devoluciones Retrasadas (Tabla5 Estado=Activo + FechaFin vencida)
const RPT3_COLS = [
  { field: 'Item',     display: 'Art\u00edculo',    width: 200 },
  { field: 'Usuario',  display: 'Docente',           width: 200 },
  { field: 'FechaFin', display: 'Dev. esperada',     width: 150 },
];
// Reporte 4 — Materiales Dañados Cocina (Tabla2 donde Malo > 0)
const RPT4_COLS = [
  { field: 'Elemento',       display: 'Art\u00edculo',   width: 220 },
  { field: 'Malo',           display: 'Da\u00f1ados',    width: 110 },
  { field: 'Observaciones',  display: 'Observaciones',   width: 280 },
];

const USUARIOS_COLS = [
  { field: 'Email',  display: 'Email',  width: 350 },
  { field: 'Nombre', display: 'Nombre', width: 300 },
  { field: 'Rol',    display: 'Rol',    width: 150 },
  { field: 'Activo', display: 'Activo', width: 100 },
];

// ════════════════════════════════════════════════════════════════════════════
// App.fx.yaml — OnStart: roles + global state init
// ════════════════════════════════════════════════════════════════════════════
// FASE A: roles por email hardcodeado.
// Personalizar los 2 emails de admin antes del deploy.
// FASE B (cuando Usuarios esté conectado): reemplazar Switch por
//   Set(gRol, LookUp(Usuarios, Email=User().Email, Rol))
const APP_FX = `App As appinfo:
    BackEnabled: =true
    Theme: =PowerAppsTheme
    OnStart: =Concurrent(Set(gUser,User()),Set(gItemEdit,Blank()),Set(gConfirmDel,false),Set(gConfirmDelInv,false),Set(gEstadoEdit,"Disponible"),Set(gEstadoReserva,"Pendiente"),Set(gTipoPrestamo,"Retiro"),Set(gRolEdit,"Docente"),Set(gActivoUsr,"Activo"),Set(gRol,Coalesce(LookUp(Tabla3,Email=User().Email,Rol),If(EndsWith(Lower(User().Email),"@eafit.edu.co"),"Docente","Invitado"))),Set(gFechaDesde,Text(DateAdd(Today(),-30,Days),"yyyy-mm-dd")),Set(gPeriodo,"Mes"),Set(gRptTab,1),Set(gBloqueReserva,"1"),Set(gFiltroReserva,"Todos"),Set(gFiltroPrestamo,"Todos"),Set(gCalFecha,Text(DateAdd(Today(),-Weekday(Today())+2,Days),"yyyy-mm-dd")),ClearCollect(colSelReservas,Blank()),ClearCollect(colChat,{role:"bot",msg:"Hola, soy tu asistente del laboratorio de idiomas EAFIT. \u00bfEn qu\u00e9 puedo ayudarte?"}))

    Host As hostControl.DefaultHostControlVariant:
        OnCancel: =false
        OnEdit: =false
        OnNew: =false
        OnSave: =false
        OnView: =false

`;

// ════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_LOGIN = `"ScrLogin As screen":
    Fill: =${C.navy}
    LoadingSpinner: =LoadingSpinner.None
    LoadingSpinnerColor: =${C.yellow}
    OnVisible: =If(${IS_EAFIT}, Navigate(Screen1, ScreenTransition.Fade))

${rect('RctBgGrad', {
  X:0, Y:'Parent.Height * 0.55', Width:'Parent.Width', Height:'Parent.Height * 0.45',
  Fill:C.navyDark, BorderThickness:0,
})}
${rect('RctLoginCard', {
  X:LC_X, Y:LC_Y, Width:LC_W, Height:LC_H, Fill:C.white, BorderThickness:0,
  RadiusTopLeft:16, RadiusTopRight:16, RadiusBottomLeft:16, RadiusBottomRight:16,
  DropShadow:'DropShadow.Heavy',
})}
${rect('RctLoginAccent', {
  X:LC_X, Y:LC_Y, Width:LC_W, Height:6, Fill:C.yellow, BorderThickness:0,
  RadiusTopLeft:16, RadiusTopRight:16, RadiusBottomLeft:0, RadiusBottomRight:0,
})}
${lbl('LblLoginEafit', {
  X:LC_X, Y:`${LC_Y} + 20`, Width:LC_W, Height:44,
  Fill:C.transparent, Text:'"UNIVERSIDAD EAFIT"',
  Color:C.navy, Size:22, FontWeight:'FontWeight.Bold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
})}
${lbl('LblLoginSub', {
  X:LC_X, Y:`${LC_Y} + 64`, Width:LC_W, Height:24,
  Fill:C.transparent, Text:'"Control de Idiomas \u00b7 Laboratorio"',
  Color:C.gray, Size:13, Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
})}
${rect('RctDiv1L', { X:`${LC_X}+24`, Y:`${LC_Y}+100`, Width:LC_W-48, Height:1, Fill:C.border, BorderThickness:0 })}
${lbl('LblLoginLb', {
  X:`${LC_X}+24`, Y:`${LC_Y}+112`, Width:LC_W-48, Height:20,
  Fill:C.transparent, Text:'"Sesi\u00f3n iniciada como:"', Color:C.gray, Size:11,
  VerticalAlign:'VerticalAlign.Middle',
})}
${lbl('LblLoginName', {
  X:`${LC_X}+24`, Y:`${LC_Y}+134`, Width:LC_W-48, Height:34,
  Fill:C.transparent, Text:'User().FullName',
  Color:C.textDark, Size:16, FontWeight:'FontWeight.Bold', VerticalAlign:'VerticalAlign.Middle',
})}
${lbl('LblLoginEmail', {
  X:`${LC_X}+24`, Y:`${LC_Y}+168`, Width:LC_W-48, Height:24,
  Fill:C.transparent, Text:'User().Email', Color:C.gray, Size:13, VerticalAlign:'VerticalAlign.Middle',
})}
${rect('RctDiv2L', { X:`${LC_X}+24`, Y:`${LC_Y}+200`, Width:LC_W-48, Height:1, Fill:C.border, BorderThickness:0 })}
${rect('RctDomainOk', {
  X:`${LC_X}+24`, Y:`${LC_Y}+212`, Width:LC_W-48, Height:40,
  Fill:C.canvas, BorderColor:C.blueLight, BorderThickness:1,
  RadiusTopLeft:6, RadiusTopRight:6, RadiusBottomLeft:6, RadiusBottomRight:6,
  Visible:IS_EAFIT,
})}
${lbl('LblDomainOk', {
  X:`${LC_X}+36`, Y:`${LC_Y}+212`, Width:LC_W-72, Height:40,
  Fill:C.transparent, Text:'"\u2713  Cuenta institucional @eafit.edu.co verificada"',
  Color:C.blue, Size:13, FontWeight:'FontWeight.Semibold', VerticalAlign:'VerticalAlign.Middle',
  Visible:IS_EAFIT,
})}
${rect('RctDomainErr', {
  X:`${LC_X}+24`, Y:`${LC_Y}+212`, Width:LC_W-48, Height:40,
  Fill:C.yellowLight, BorderColor:C.yellow, BorderThickness:1,
  RadiusTopLeft:6, RadiusTopRight:6, RadiusBottomLeft:6, RadiusBottomRight:6,
  Visible:`Not(${IS_EAFIT})`,
})}
${lbl('LblDomainErr', {
  X:`${LC_X}+36`, Y:`${LC_Y}+212`, Width:LC_W-72, Height:40,
  Fill:C.transparent, Text:'"\u26A0  Acceso restringido a cuentas @eafit.edu.co"',
  Color:C.yellowDark, Size:13, FontWeight:'FontWeight.Semibold', VerticalAlign:'VerticalAlign.Middle',
  Visible:`Not(${IS_EAFIT})`,
})}
${rect('RctAccessBtn', {
  X:`${LC_X}+24`, Y:`${LC_Y}+268`, Width:LC_W-48, Height:BTN_H,
  Fill:`If(${IS_EAFIT},${C.blue},${C.grayMid})`, BorderThickness:0,
  RadiusTopLeft:8, RadiusTopRight:8, RadiusBottomLeft:8, RadiusBottomRight:8,
  OnSelect:`If(${IS_EAFIT}, Navigate(Screen1, ScreenTransition.Fade))`,
})}
${lbl('LblAccessBtn', {
  X:`${LC_X}+24`, Y:`${LC_Y}+268`, Width:LC_W-48, Height:BTN_H,
  Fill:C.transparent,
  Text:`If(${IS_EAFIT},"Acceder al sistema  \u2192","Sin acceso")`,
  Color:`If(${IS_EAFIT},${C.white},${C.gray})`,
  Size:15, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:`If(${IS_EAFIT}, Navigate(Screen1, ScreenTransition.Fade))`,
})}
${lbl('LblLoginHint', {
  X:LC_X, Y:`${LC_Y}+322`, Width:LC_W, Height:20,
  Fill:C.transparent,
  Text:`If(${IS_EAFIT},"Ingreso autom\u00e1tico habilitado","Contacte al administrador del sistema")`,
  Color:C.gray, Size:11, Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
})}
${lbl('LblLoginFooter', {
  X:LC_X, Y:`${LC_Y}+${LC_H}-32`, Width:LC_W, Height:28,
  Fill:C.transparent, Text:'"\u00a9 2026 Universidad EAFIT  \u00b7  Medell\u00edn, Colombia"',
  Color:C.gray, Size:10, Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
})}
`;

// ════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — Dashboard (role-adaptive)
// ════════════════════════════════════════════════════════════════════════════
function mkCard(n, cx, cy, title, desc, countFormula, target) {
  const btnY = `${cy} + ${CH} - ${BTN_H}`;
  return [
    rect(`RctCard${n}`, {
      X:cx, Y:cy, Width:CW, Height:CH,
      Fill:C.white, BorderColor:C.border, BorderThickness:1,
      OnSelect:`Navigate(${target})`,
    }),
    rect(`RctA${n}`, { X:cx, Y:cy, Width:CW, Height:5, Fill:C.yellow, BorderThickness:0 }),
    lbl(`LblTitle${n}`, {
      X:cx, Y:`${cy}+14`, Width:CW, Height:44,
      Fill:C.transparent, Text:`"${title}"`,
      Color:C.blue, Size:17, FontWeight:'FontWeight.Bold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Navigate(${target})`,
    }),
    lbl(`LblCount${n}`, {
      X:`${cx}+16`, Y:`${cy}+64`, Width:`${CW}-32`, Height:52,
      Fill:C.transparent, Text:countFormula,
      Color:C.yellow, Size:36, FontWeight:'FontWeight.Bold',
      VerticalAlign:'VerticalAlign.Middle',
      DisplayMode:'DisplayMode.View',
    }),
    lbl(`LblDesc${n}`, {
      X:`${cx}+16`, Y:`${cy}+118`, Width:`${CW}-32`, Height:22,
      Fill:C.transparent, Text:`"${desc}"`,
      Color:C.gray, Size:12, VerticalAlign:'VerticalAlign.Middle',
      DisplayMode:'DisplayMode.View',
    }),
    rect(`RctBtn${n}`, {
      X:cx, Y:btnY, Width:CW, Height:BTN_H,
      Fill:C.blue, BorderThickness:0, OnSelect:`Navigate(${target})`,
    }),
    lbl(`LblBtn${n}`, {
      X:cx, Y:btnY, Width:CW, Height:BTN_H,
      Fill:C.transparent, Text:'"Ver \u2192"',
      Color:C.white, Size:14, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Navigate(${target})`,
    }),
  ].join('\n\n');
}

const SCREEN1 = `"Screen1 As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None
    LoadingSpinnerColor: =RGBA(0, 120, 212, 1)

${rect('RctHdrS1',{ X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${lbl('LblHdrS1',{
  X:20,Y:0,Width:'Parent.Width - 320',Height:HDR,
  Fill:C.transparent, Text:'"Universidad EAFIT  \u00b7  Control de Idiomas"',
  Color:C.white,Size:17,FontWeight:'FontWeight.Bold',
  Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle',
})}
${rect('RctRolBadgeS1',{
  X:'Parent.Width - 310',Y:20,Width:80,Height:32,
  Fill:C.canvasMid, BorderThickness:0,
  RadiusTopLeft:16,RadiusTopRight:16,RadiusBottomLeft:16,RadiusBottomRight:16,
})}
${lbl('LblRolBadgeS1',{
  X:'Parent.Width - 310',Y:20,Width:80,Height:32,
  Fill:C.transparent,
  Text:'gRol',
  Color:C.navy,Size:11,FontWeight:'FontWeight.Semibold',
  Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',
})}
${rect('RctRptBtnS1',{
  X:'Parent.Width - 222',Y:16,Width:44,Height:40,
  Fill:C.yellow,BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:'Navigate(ScrReportes,ScreenTransition.Slide)',
  Visible:'gRol = "Admin" || gRol = "SuperAdmin"',
})}
${lbl('LblRptBtnS1',{
  X:'Parent.Width - 222',Y:16,Width:44,Height:40,
  Fill:C.transparent,Text:'"\uD83D\uDCCA"',Size:20,
  Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Navigate(ScrReportes,ScreenTransition.Slide)',
  Visible:'gRol = "Admin" || gRol = "SuperAdmin"',
})}
${rect('RctAiBtnS1',{
  X:'Parent.Width - 168',Y:16,Width:44,Height:40,
  Fill:C.yellow,BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:'Navigate(ScrAiChat,ScreenTransition.Slide)',
})}
${lbl('LblAiBtnS1',{
  X:'Parent.Width - 168',Y:16,Width:44,Height:40,
  Fill:C.transparent,Text:'"\uD83E\uDD16"',Size:20,
  Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Navigate(ScrAiChat,ScreenTransition.Slide)',
})}
${rect('RctHelpBtnS1',{
  X:'Parent.Width - 116',Y:16,Width:44,Height:40,
  Fill:C.yellow,BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:'Navigate(ScrAyuda,ScreenTransition.Slide)',
})}
${lbl('LblHelpBtnS1',{
  X:'Parent.Width - 116',Y:16,Width:44,Height:40,
  Fill:C.transparent,Text:'"\u2753"',Size:20,
  Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Navigate(ScrAyuda,ScreenTransition.Slide)',
})}
${rect('RctAdminBtnS1',{
  X:'Parent.Width - 64',Y:16,Width:44,Height:40,
  Fill:C.yellow,BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:'Navigate(ScrUsuarios,ScreenTransition.Slide)',
  Visible:'gRol = "SuperAdmin"',
})}
${lbl('LblAdminBtnS1',{
  X:'Parent.Width - 64',Y:16,Width:44,Height:40,
  Fill:C.transparent,Text:'"\u2699\uFE0F"',Size:20,
  Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Navigate(ScrUsuarios,ScreenTransition.Slide)',
  Visible:'gRol = "SuperAdmin"',
})}
${rect('RctAccentS1',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}

${mkCard(1, String(PAD), String(R1Y),
  'Cocina', 'Art\u00edculos registrados',
  'Text(CountRows(Tabla2))', 'ScrCocina')}

${mkCard(2, `${PAD}+${CW}+${GAP}`, String(R1Y),
  'Recursos', 'Recursos registrados',
  'Text(CountRows(Tabla1))', 'ScrRecursos')}

${mkCard(3, String(PAD), R2Y,
  'Reservas', 'Solicitudes activas',
  'Text(CountRows(Tabla4))', 'ScrReservas')}

${mkCard(4, `${PAD}+${CW}+${GAP}`, R2Y,
  'Pr\u00e9stamos', 'Art\u00edculos en uso',
  'Text(CountIf(Tabla5,Estado="Activo"))', 'ScrPrestamos')}

${rect('RctStatsBarBgS1',{
  X:PAD, Y:`${STRIP_Y} - 44`, Width:`Parent.Width - ${PAD*2}`, Height:36,
  Fill:C.grayMid, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  Visible:'(gRol = "Admin" || gRol = "SuperAdmin") && CountRows(Tabla4)>0',
})}
${rect('RctStatsPendS1',{
  X:PAD, Y:`${STRIP_Y} - 44`, Width:`(Parent.Width - ${PAD*2}) * CountIf(Tabla4,Estado="Pendiente") / Max(CountRows(Tabla4),1)`, Height:36,
  Fill:C.yellow, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:0,RadiusBottomLeft:8,RadiusBottomRight:0,
  Visible:'(gRol = "Admin" || gRol = "SuperAdmin") && CountIf(Tabla4,Estado="Pendiente")>0',
})}
${rect('RctStatsAprvS1',{
  X:`${PAD} + (Parent.Width - ${PAD*2}) * CountIf(Tabla4,Estado="Pendiente") / Max(CountRows(Tabla4),1)`, Y:`${STRIP_Y} - 44`,
  Width:`(Parent.Width - ${PAD*2}) * CountIf(Tabla4,Estado="Aprobada") / Max(CountRows(Tabla4),1)`, Height:36,
  Fill:C.blue, BorderThickness:0,
  Visible:'(gRol = "Admin" || gRol = "SuperAdmin") && CountIf(Tabla4,Estado="Aprobada")>0',
})}
${lbl('LblStatsLegendS1',{
  X:PAD+8, Y:`${STRIP_Y} - 44`, Width:`Parent.Width - ${PAD*2} - 16`, Height:36,
  Fill:C.transparent,
  Text:`"\ud83d\udfe1 " & CountIf(Tabla4,Estado="Pendiente") & " Pend.  \ud83d\udfe6 " & CountIf(Tabla4,Estado="Aprobada") & " Aprob.  \u2b1c " & CountIf(Tabla4,Estado="Denegada") & " Deneg."`,
  Color:C.textDark, Size:11, FontWeight:'FontWeight.Semibold',
  VerticalAlign:'VerticalAlign.Middle',
  Visible:'(gRol = "Admin" || gRol = "SuperAdmin") && CountRows(Tabla4)>0',
})}

${rect('RctAlertS1',{
  X:PAD, Y:STRIP_Y, Width:`Parent.Width - ${PAD*2}`, Height:STRIP_H,
  Fill:C.white,
  BorderColor:`If(CountIf(Tabla5,Estado="Activo",Not(IsBlank(FechaFin)),FechaFin<Text(Today(),"yyyy-mm-dd"))>0,${C.yellowDark},${C.blue})`,
  BorderThickness:2,
  RadiusTopLeft:12,RadiusTopRight:12,RadiusBottomLeft:12,RadiusBottomRight:12,
  OnSelect:'Navigate(ScrAlertas,ScreenTransition.Slide)',
  Visible:'gRol = "Admin" || gRol = "SuperAdmin"',
})}
${lbl('LblAlertTxtS1',{
  X:`${PAD}+14`, Y:STRIP_Y, Width:`Parent.Width - ${PAD*2} - 100`, Height:STRIP_H,
  Fill:C.transparent,
  Text:`"\u26a0\ufe0f  Alertas de pendientes  (" & CountIf(Tabla5,Estado="Activo") & " activos)"`,
  Color:C.navy, Size:13, FontWeight:'FontWeight.Semibold',
  VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Navigate(ScrAlertas,ScreenTransition.Slide)',
  Visible:'gRol = "Admin" || gRol = "SuperAdmin"',
})}
${lbl('LblAlertBtnS1',{
  X:`Parent.Width - ${PAD + 80}`, Y:STRIP_Y, Width:80, Height:STRIP_H,
  Fill:C.transparent, Text:'"Ver \u2192"',
  Color:C.blue, Size:13, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Navigate(ScrAlertas,ScreenTransition.Slide)',
  Visible:'gRol = "Admin" || gRol = "SuperAdmin"',
})}

${rect('RctLoanRemS1',{
  X:PAD, Y:STRIP_Y, Width:`Parent.Width - ${PAD*2}`, Height:STRIP_H,
  Fill:C.white,
  BorderColor:`If(CountIf(Tabla5,Usuario=User().FullName,Estado="Activo",Not(IsBlank(FechaFin)),FechaFin<Text(Today(),"yyyy-mm-dd"))>0,${C.yellowDark},${C.blue})`,
  BorderThickness:2,
  RadiusTopLeft:12,RadiusTopRight:12,RadiusBottomLeft:12,RadiusBottomRight:12,
  OnSelect:'Navigate(ScrPrestamos,ScreenTransition.Slide)',
  Visible:'gRol = "Docente" && CountIf(Tabla5,Usuario=User().FullName,Estado="Activo")>0',
})}
${lbl('LblLoanRemTxtS1',{
  X:`${PAD}+14`, Y:STRIP_Y, Width:`Parent.Width - ${PAD*2} - 100`, Height:STRIP_H,
  Fill:C.transparent,
  Text:`If(CountIf(Tabla5,Usuario=User().FullName,Estado="Activo",Not(IsBlank(FechaFin)),FechaFin<Text(Today(),"yyyy-mm-dd"))>0,"\u26a0\ufe0f  Tienes " & CountIf(Tabla5,Usuario=User().FullName,Estado="Activo",Not(IsBlank(FechaFin)),FechaFin<Text(Today(),"yyyy-mm-dd")) & " pr\u00e9stamo(s) vencido(s)","\ud83d\udce6  Tienes " & CountIf(Tabla5,Usuario=User().FullName,Estado="Activo") & " pr\u00e9stamo(s) activo(s)")`,
  Color:`If(CountIf(Tabla5,Usuario=User().FullName,Estado="Activo",Not(IsBlank(FechaFin)),FechaFin<Text(Today(),"yyyy-mm-dd"))>0,${C.yellowDark},${C.navy})`,
  Size:13, FontWeight:'FontWeight.Semibold',
  VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Navigate(ScrPrestamos,ScreenTransition.Slide)',
  Visible:'gRol = "Docente" && CountIf(Tabla5,Usuario=User().FullName,Estado="Activo")>0',
})}
${lbl('LblLoanRemBtnS1',{
  X:`Parent.Width - ${PAD + 80}`, Y:STRIP_Y, Width:80, Height:STRIP_H,
  Fill:C.transparent, Text:'"Ver \u2192"',
  Color:C.blue, Size:13, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Navigate(ScrPrestamos,ScreenTransition.Slide)',
  Visible:'gRol = "Docente" && CountIf(Tabla5,Usuario=User().FullName,Estado="Activo")>0',
})}
`;

// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// AI CHAT — Functional keyword-based assistant (colChat collection)
// Future: Replace keyword logic with Power Automate → FastAPI /api/chat
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
const MSG_Y = HDR + ACCENT + 16;
const CHAT_SEND_FX =
  `If(Len(TxtChatInput.Text)>0,` +
  `Collect(colChat,{role:"user",msg:TxtChatInput.Text});` +
  `Collect(colChat,{role:"bot",msg:` +
  `If(` +
  `"reserva" in Lower(TxtChatInput.Text),"Para reservar material, ve a Reservas desde el Dashboard y presiona +. Hay " & CountRows(Tabla4) & " reservas registradas.",` +
  `"pr\u00e9stamo" in Lower(TxtChatInput.Text) || "prestamo" in Lower(TxtChatInput.Text),"Pr\u00e9stamos activos: " & CountIf(Tabla5,Estado="Activo") & ". Ve a Pr\u00e9stamos para m\u00e1s detalles.",` +
  `"cocina" in Lower(TxtChatInput.Text),"Inventario cocina: " & CountRows(Tabla2) & " elementos registrados. Ve a la secci\u00f3n Cocina.",` +
  `"recurso" in Lower(TxtChatInput.Text) || "juego" in Lower(TxtChatInput.Text),"Recursos disponibles: " & CountRows(Tabla1) & ". Consulta la secci\u00f3n Recursos.",` +
  `"hola" in Lower(TxtChatInput.Text) || "buenos" in Lower(TxtChatInput.Text),"\u00a1Hola! Soy tu asistente del laboratorio de idiomas EAFIT. Preg\u00fantame sobre reservas, pr\u00e9stamos o inventario.",` +
  `"ayuda" in Lower(TxtChatInput.Text),"Puedo ayudarte con:" & Char(10) & "\u2022 Consultas de inventario (cocina, recursos)" & Char(10) & "\u2022 Estado de pr\u00e9stamos activos" & Char(10) & "\u2022 Informaci\u00f3n de reservas" & Char(10) & "\u2022 Disponibilidad de materiales",` +
  `"vencido" in Lower(TxtChatInput.Text) || "retraso" in Lower(TxtChatInput.Text),"Pr\u00e9stamos vencidos: " & CountIf(Tabla5,Estado="Activo",Not(IsBlank(FechaFin)),FechaFin<Text(Today(),"yyyy-mm-dd")) & ". Revisa la secci\u00f3n Alertas del Dashboard.",` +
  `"disponible" in Lower(TxtChatInput.Text) || "cuantos" in Lower(TxtChatInput.Text),"Cocina: " & CountRows(Tabla2) & " art\u00edculos | Recursos: " & CountRows(Tabla1) & " juegos | Activos: " & CountIf(Tabla5,Estado="Activo"),` +
  `"No tengo informaci\u00f3n espec\u00edfica sobre eso. Preg\u00fantame sobre reservas, pr\u00e9stamos, cocina o recursos del laboratorio."` +
  `)});` +
  `Reset(TxtChatInput))`;
const AICHAT = `"ScrAiChat As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None
    LoadingSpinnerColor: =RGBA(0, 120, 212, 1)

${rect('RctHdrChat',{ X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${rect('RctBackChat',{ X:4,Y:16,Width:44,Height:40,Fill:C.blueLight,BorderThickness:0,RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,OnSelect:'Navigate(Screen1)' })}
${lbl('LblBackChat',{
  X:4,Y:16,Width:44,Height:40,Fill:C.transparent,Text:'"\u2190"',
  Color:C.white,Size:22,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Navigate(Screen1)',
})}
${lbl('LblTitleChat',{
  X:58,Y:0,Width:'Parent.Width - 68',Height:HDR,
  Fill:C.transparent,Text:'"Asistente IA  \u00b7  Laboratorio"',
  Color:C.white,Size:17,FontWeight:'FontWeight.Bold',
  Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle',
})}
${rect('RctAccentChat',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}
${rect('RctChatBg',{
  X:0,Y:HDR+ACCENT,Width:'Parent.Width',
  Height:`Parent.Height - ${HDR+ACCENT+INPUT_H}`,
  Fill:C.white,BorderThickness:0,
})}
${lbl('LblChatHistory',{
  X:12,Y:HDR+ACCENT+8,Width:'Parent.Width - 24',
  Height:`Parent.Height - ${HDR+ACCENT+INPUT_H+16}`,
  Fill:C.transparent,
  Text:'Concat(colChat,If(role="bot","\uD83E\uDD16  " & msg,"\uD83D\uDC64  " & msg) & Char(10) & "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500" & Char(10),"")',
  Color:C.textDark,Size:13,
  VerticalAlign:'VerticalAlign.Bottom',
  PaddingLeft:8,PaddingRight:8,PaddingBottom:8,
})}
${rect('RctInputBar',{
  X:0,Y:'Parent.Height - 60',Width:'Parent.Width',Height:INPUT_H,
  Fill:C.white,BorderColor:C.border,BorderThickness:1,
})}
${tin('TxtChatInput',{
  X:12,Y:'Parent.Height - 48',Width:'Parent.Width - 76',Height:36,
  Fill:C.grayLight,BorderColor:C.border,BorderThickness:1,
  Default:'""',HintText:'"Escribe tu pregunta..."',
  Mode:'TextMode.SingleLine',
  PaddingLeft:14,PaddingRight:14,
})}
${rect('RctSendBtn',{
  X:'Parent.Width - 56',Y:'Parent.Height - 50',Width:40,Height:40,
  Fill:C.blue,BorderThickness:0,
  RadiusTopLeft:20,RadiusTopRight:20,RadiusBottomLeft:20,RadiusBottomRight:20,
  OnSelect:CHAT_SEND_FX,
})}
${lbl('LblSendIcon',{
  X:'Parent.Width - 56',Y:'Parent.Height - 50',Width:40,Height:40,
  Fill:C.transparent,Text:'"\u27A4"',Color:C.white,Size:16,
  Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',
  OnSelect:CHAT_SEND_FX,
})}
`;


// ════════════════════════════════════════════════════════════════════════════
// SCREEN_ITEM_FORM_CO — Add/Edit form for Cocina items (Tabla2)
// ════════════════════════════════════════════════════════════════════════════
// Field layout: base Y = HDR+ACCENT+12 = 87, each field = 22+H+14 px
// Fi0 Elemento  (44): Y=87       lbl, Y=109 input, ends=153
// Fi1 Und       (44): Y=167      lbl, Y=189 input, ends=233
// Fi2 Existencia(44): Y=247      lbl, Y=269 input, ends=313
// Estado btns:        Y=327      lbl, Y=349 btns,  ends=389
// Fi3 Observ   (80):  Y=403      lbl, Y=425 input, ends=505
// Save btn:           Y=521
// Delete btn:         Y=573

const _EF = (field) => `If(IsBlank(gItemEdit),"",gItemEdit.${field})`;

const SCREEN_ITEM_FORM_CO = (() => {
  const suf = 'FCo';
  const ESTADO_Y = 327;
  const OBS_Y    = 403;
  const SAVE_Y   = 521;
  const DEL_Y    = 573;

  const patchFormula =
    `If(IsBlank(TxtFCoElemento.Text),` +
    `Notify("El nombre del elemento es obligatorio",NotificationType.Error),` +
    `Patch(Tabla2,If(IsBlank(gItemEdit),Defaults(Tabla2),gItemEdit),` +
    `{Elemento:TxtFCoElemento.Text,` +
    `Und:If(IsBlank(TxtFCoUnd.Text),"1",TxtFCoUnd.Text),` +
    `Existencia:If(IsBlank(TxtFCoExistencia.Text),"0",TxtFCoExistencia.Text),` +
    `Observaciones:TxtFCoObs.Text,` +
    `Bueno:If(gEstadoEdit="Disponible","TRUE","FALSE"),` +
    `Malo:If(gEstadoEdit="Da\u00f1ado","TRUE","FALSE"),` +
    `Regular:If(gEstadoEdit="Regular","TRUE","FALSE")});` +
    `Set(gItemEdit,Blank());Navigate(ScrCocina,ScreenTransition.None))`;

  const estados = ['Disponible','Regular','Da\u00f1ado'];
  const W3 = '(Parent.Width - 56) / 3';

  return `"ScrItemFormCocina As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None
    OnVisible: =Set(gEstadoEdit,If(IsBlank(gItemEdit),"Disponible",If(gItemEdit.Malo="TRUE","Da\u00f1ado",If(gItemEdit.Regular="TRUE","Regular","Disponible"))))

${makeFormHeader(suf, 'ScrCocina', 'If(IsBlank(gItemEdit),"Nuevo elemento","Editar elemento")')}

${makeFieldBlock(suf,0,'"Elemento *"','TxtFCoElemento',_EF('Elemento'))}

${makeFieldBlock(suf,1,'"Und"','TxtFCoUnd',_EF('Und'))}

${makeFieldBlock(suf,2,'"Existencia"','TxtFCoExistencia',_EF('Existencia'))}

${lbl(`LblEstadoTit${suf}`,{
  X:20, Y:ESTADO_Y, Width:'Parent.Width-40', Height:22,
  Fill:C.transparent, Text:'"Estado del material"',
  Color:C.navy, Size:12, FontWeight:'FontWeight.Semibold', VerticalAlign:'VerticalAlign.Middle',
})}
${estados.map((e,i) => {
  const xOff = i === 0 ? 20 : i === 1 ? `20+(Parent.Width-56)/3+8` : `20+2*(Parent.Width-56)/3+16`;
  const eId  = toAsciiId(e);
  return [
    rect(`RctEst${eId}${suf}`,{
      X:xOff, Y:ESTADO_Y+26, Width:W3, Height:40,
      Fill:`If(gEstadoEdit="${e}",${C.blue},${C.grayMid})`,
      BorderThickness:0,
      RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
      OnSelect:`Set(gEstadoEdit,"${e}")`,
    }),
    lbl(`LblEst${eId}${suf}`,{
      X:xOff, Y:ESTADO_Y+26, Width:W3, Height:40,
      Fill:C.transparent, Text:`"${e}"`,
      Color:`If(gEstadoEdit="${e}",${C.white},${C.textDark})`,
      Size:11, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gEstadoEdit,"${e}")`,
    }),
  ].join('\n\n');
}).join('\n\n')}

${lbl(`LblFCoObs`,{
  X:20, Y:OBS_Y, Width:'Parent.Width-40', Height:22,
  Fill:C.transparent, Text:'"Observaciones"',
  Color:C.navy, Size:12, FontWeight:'FontWeight.Semibold', VerticalAlign:'VerticalAlign.Middle',
})}
${tin('TxtFCoObs',{
  Default:_EF('Observaciones'), Height:80, Mode:'TextMode.MultiLine',
  Width:'Parent.Width-40', X:20, Y:OBS_Y+24,
  BorderColor:C.border, BorderThickness:1, Fill:C.white,
  PaddingLeft:10, PaddingRight:10,
})}

${rect(`RctSave${suf}`,{
  X:20, Y:SAVE_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:patchFormula,
})}
${lbl(`LblSave${suf}`,{
  X:20, Y:SAVE_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:'"Guardar cambios"',
  Color:C.white, Size:15, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:patchFormula,
})}

${rect(`RctDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.navyDark, BorderColor:C.navyDark, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`gRol="SuperAdmin" && !IsBlank(gItemEdit)`,
})}
${lbl(`LblDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:'"Eliminar elemento"',
  Color:C.yellow, Size:14, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`gRol="SuperAdmin" && !IsBlank(gItemEdit)`,
})}

${makeFormDeleteOverlay(suf,'Tabla2','ScrCocina')}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_ITEM_FORM_RE — Add/Edit form for Recursos items (Tabla1)
// ════════════════════════════════════════════════════════════════════════════
// Fields: Juegos, Descripción, Unidades, Categoria, Observaciones (multiline)
const SCREEN_ITEM_FORM_RE = (() => {
  const suf = 'FRe';
  const SAVE_Y = HDR + ACCENT + 12 + 5 * (22 + 44 + 14) + 12; // after 4 single + 1 multi approx
  // Calculate: base=87, step=80 (22+44+14), 4 steps= 320, + OBS (22+80+14)=116 → SAVE≈523
  const OBS_Y  = HDR + ACCENT + 12 + 4 * (22 + 44 + 14);    // ≈407
  const REAL_SAVE_Y = OBS_Y + 22 + 80 + 14 + 12;             // ≈535
  const DEL_Y = REAL_SAVE_Y + BTN_H + 12;                    // ≈591

  const patchFormula =
    `If(IsBlank(TxtFReJuegos.Text),` +
    `Notify("El nombre del recurso es obligatorio",NotificationType.Error),` +
    `Patch(Tabla1,If(IsBlank(gItemEdit),Defaults(Tabla1),gItemEdit),` +
    `{Juegos:TxtFReJuegos.Text,` +
    `Descripci\u00f3n:TxtFReDesc.Text,` +
    `Unidades:If(IsBlank(TxtFReUnidades.Text),"1",TxtFReUnidades.Text),` +
    `Categoria:If(IsBlank(TxtFReCategoria.Text),"General",TxtFReCategoria.Text),` +
    `Observaciones:TxtFReObs.Text});` +
    `Set(gItemEdit,Blank());Navigate(ScrRecursos,ScreenTransition.None))`;

  return `"ScrItemFormRecursos As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None

${makeFormHeader(suf, 'ScrRecursos', 'If(IsBlank(gItemEdit),"Nuevo recurso","Editar recurso")')}

${makeFieldBlock(suf,0,'"Nombre del juego / recurso *"','TxtFReJuegos',_EF('Juegos'))}

${makeFieldBlock(suf,1,'"Descripci\u00f3n"','TxtFReDesc',_EF('Descripci\u00f3n'))}

${makeFieldBlock(suf,2,'"Unidades"','TxtFReUnidades',_EF('Unidades'))}

${makeFieldBlock(suf,3,'"Categor\u00eda"','TxtFReCategoria',_EF('Categoria'))}

${lbl(`LblObsTit${suf}`,{
  X:20, Y:OBS_Y, Width:'Parent.Width-40', Height:22,
  Fill:C.transparent, Text:'"Observaciones"',
  Color:C.navy, Size:12, FontWeight:'FontWeight.Semibold', VerticalAlign:'VerticalAlign.Middle',
})}
${tin('TxtFReObs',{
  Default:_EF('Observaciones'), Height:80, Mode:'TextMode.MultiLine',
  Width:'Parent.Width-40', X:20, Y:OBS_Y+24,
  BorderColor:C.border, BorderThickness:1, Fill:C.white,
  PaddingLeft:10, PaddingRight:10,
})}

${rect(`RctSave${suf}`,{
  X:20, Y:REAL_SAVE_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:patchFormula,
})}
${lbl(`LblSave${suf}`,{
  X:20, Y:REAL_SAVE_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:'"Guardar cambios"',
  Color:C.white, Size:15, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:patchFormula,
})}

${rect(`RctDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.navyDark, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`gRol="SuperAdmin" && !IsBlank(gItemEdit)`,
})}
${lbl(`LblDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:'"Eliminar recurso"',
  Color:C.yellow, Size:14, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`gRol="SuperAdmin" && !IsBlank(gItemEdit)`,
})}

${makeFormDeleteOverlay(suf,'Tabla1','ScrRecursos')}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// SCREEN_USUARIOS — User management (SuperAdmin only), full CRUD via Tabla3
// ════════════════════════════════════════════════════════════════════════════
const USR_FILTER = `If(IsBlank(TxtSearchUsr.Text),Tabla3,Search(Tabla3,TxtSearchUsr.Text,"Email","Nombre","Rol"))`;
const SCREEN_USUARIOS = (() => {
  const suf = 'Usr';
  const dtYaml   = makeDataTableYaml('DataTable5','Tabla3', DT_Y, USUARIOS_COLS, 80, USR_FILTER);
  const actionBar = makeActionBarYaml('DataTable5','Email','Tabla3','ScrItemFormUsuario', suf, false);
  return `"ScrUsuarios As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None

${rect('RctHdrUsr',   { X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${rect('RctBackUsr',  { X:4,Y:16,Width:44,Height:40,Fill:C.blueLight,BorderThickness:0,RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblBackUsr',   { X:4,Y:16,Width:44,Height:40,Fill:C.transparent,Text:'"←"',Color:C.white,Size:22,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblTitleUsr',  { X:58,Y:0,Width:'Parent.Width-68',Height:HDR,Fill:C.transparent,Text:'"Gestión de Usuarios"',Color:C.white,Size:17,FontWeight:'FontWeight.Bold',Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle' })}
${rect('RctAccentUsr',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}

${rect('RctNoAccUsr',{
  X:20, Y:HDR+ACCENT+24, Width:'Parent.Width-40', Height:80,
  Fill:C.yellowLight, BorderColor:C.yellow, BorderThickness:1,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  Visible:'gRol <> "SuperAdmin"',
})}
${lbl('LblNoAccUsr',{
  X:32, Y:HDR+ACCENT+24, Width:'Parent.Width-64', Height:80,
  Fill:C.transparent,
  Text:'"⛔  Solo el SuperAdmin puede gestionar usuarios."',
  Color:C.yellowDark, Size:13, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  Visible:'gRol <> "SuperAdmin"',
})}

${tin('TxtSearchUsr',{
  Default:'""', Height:SRCH_H, Mode:'TextMode.SingleLine',
  Width:'Parent.Width-40', X:PAD, Y:SRCH_Y,
  BorderColor:C.border, BorderThickness:1, Fill:C.white,
  PaddingLeft:36, PaddingRight:10, HintText:'"Buscar usuario..."',
  Visible:'gRol = "SuperAdmin"',
})}
${lbl('LblSearchIcoUsr',{
  X:PAD+6, Y:SRCH_Y, Width:28, Height:SRCH_H,
  Fill:C.transparent, Text:'"🔍"', Color:C.gray, Size:14,
  Align:'Align.Center', DisplayMode:'DisplayMode.View',
  Visible:'gRol = "SuperAdmin"',
})}

${dtYaml}

${rect('RctFabUsr',{
  X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:28,RadiusTopRight:28,RadiusBottomLeft:28,RadiusBottomRight:28,
  OnSelect:'Set(gItemEdit,Blank());Navigate(ScrItemFormUsuario,ScreenTransition.Slide)',
})}
${lbl('LblFabUsr',{
  X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
  Fill:C.transparent, Text:'"+"', Color:C.white, Size:28,
  FontWeight:'FontWeight.Bold', Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Set(gItemEdit,Blank());Navigate(ScrItemFormUsuario,ScreenTransition.Slide)',
})}

${actionBar}
`;
})();

/// ════════════════════════════════════════════════════════════════════════════
// SCREEN_ITEM_FORM_USUARIO — Add/Edit form for Usuarios (Tabla3)
// Fields: Nombre, Email, Rol (4-option radio), Activo (2-option radio)
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_ITEM_FORM_USUARIO = (() => {
  const suf = 'FUsr';
  const BASE_Y   = HDR + ACCENT + 12; // 87
  const STEP     = 80;
  const ROLES_Y  = BASE_Y + 2 * STEP; // 247
  const ACTIVO_Y = ROLES_Y + 26 + 40 + 8 + 40 + 14; // 375
  const SAVE_Y   = ACTIVO_Y + 26 + 40 + 14;          // 455
  const DEL_Y    = SAVE_Y + BTN_H + 12;               // 511

  const _RF = f => `If(IsBlank(gItemEdit),"",gItemEdit.${f})`;
  const W2  = '(Parent.Width - 48) / 2';

  const patchFormula =
    `If(IsBlank(TxtFUsrNombre.Text)||IsBlank(TxtFUsrEmail.Text),` +
    `Notify("Nombre y Email son obligatorios",NotificationType.Error),` +
    `Patch(Tabla3,If(IsBlank(gItemEdit),Defaults(Tabla3),gItemEdit),` +
    `{Nombre:TxtFUsrNombre.Text,Email:TxtFUsrEmail.Text,Rol:gRolEdit,Activo:gActivoUsr});` +
    `Set(gItemEdit,Blank());Navigate(ScrUsuarios,ScreenTransition.None))`;

  const roles   = ['SuperAdmin','Admin','Docente','Invitado'];
  const activos = ['Activo','Inactivo'];

  return `"ScrItemFormUsuario As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None
    OnVisible: =Concurrent(Set(gRolEdit,If(IsBlank(gItemEdit),"Docente",If(IsBlank(gItemEdit.Rol),"Docente",gItemEdit.Rol))),Set(gActivoUsr,If(IsBlank(gItemEdit),"Activo",If(IsBlank(gItemEdit.Activo),"Activo",gItemEdit.Activo))))

${makeFormHeader(suf, 'ScrUsuarios', 'If(IsBlank(gItemEdit),"Nuevo usuario","Editar usuario")')}

${lbl(`LblF${suf}0`,{ X:20,Y:BASE_Y,Width:'Parent.Width-40',Height:22,Fill:C.transparent,Text:'"Nombre *"',Color:C.navy,Size:12,FontWeight:'FontWeight.Semibold',VerticalAlign:'VerticalAlign.Middle' })}
${tin('TxtFUsrNombre',{ Default:_RF('Nombre'),Height:44,Mode:'TextMode.SingleLine',Width:'Parent.Width-40',X:20,Y:BASE_Y+22,BorderColor:C.border,BorderThickness:1,Fill:C.white,PaddingLeft:10,PaddingRight:10 })}

${lbl(`LblF${suf}1`,{ X:20,Y:BASE_Y+STEP,Width:'Parent.Width-40',Height:22,Fill:C.transparent,Text:'"Email *"',Color:C.navy,Size:12,FontWeight:'FontWeight.Semibold',VerticalAlign:'VerticalAlign.Middle' })}
${tin('TxtFUsrEmail',{ Default:_RF('Email'),Height:44,Mode:'TextMode.SingleLine',Width:'Parent.Width-40',X:20,Y:BASE_Y+STEP+22,BorderColor:C.border,BorderThickness:1,Fill:C.white,PaddingLeft:10,PaddingRight:10 })}

${lbl(`LblRolTit${suf}`,{ X:20,Y:ROLES_Y,Width:'Parent.Width-40',Height:22,Fill:C.transparent,Text:'"Rol"',Color:C.navy,Size:12,FontWeight:'FontWeight.Semibold',VerticalAlign:'VerticalAlign.Middle' })}
${roles.map((r, i) => {
  const row  = i < 2 ? 0 : 1;
  const col  = i % 2;
  const xOff = col === 0 ? 20 : `20+(Parent.Width-48)/2+8`;
  const yOff = ROLES_Y + 26 + row * 48;
  const rId  = toAsciiId(r);
  return [
    rect(`RctRol${rId}${suf}`,{
      X:xOff, Y:yOff, Width:W2, Height:40,
      Fill:`If(gRolEdit="${r}",${C.blue},${C.grayMid})`,
      BorderThickness:0,
      RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
      OnSelect:`Set(gRolEdit,"${r}")`,
    }),
    lbl(`LblRol${rId}${suf}`,{
      X:xOff, Y:yOff, Width:W2, Height:40,
      Fill:C.transparent, Text:`"${r}"`,
      Color:`If(gRolEdit="${r}",${C.white},${C.textDark})`,
      Size:11, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gRolEdit,"${r}")`,
    }),
  ].join('\n\n');
}).join('\n\n')}

${lbl(`LblActivoTit${suf}`,{ X:20,Y:ACTIVO_Y,Width:'Parent.Width-40',Height:22,Fill:C.transparent,Text:'"Estado del usuario"',Color:C.navy,Size:12,FontWeight:'FontWeight.Semibold',VerticalAlign:'VerticalAlign.Middle' })}
${activos.map((a, i) => {
  const xOff = i === 0 ? 20 : `20+(Parent.Width-48)/2+8`;
  const aId  = toAsciiId(a);
  return [
    rect(`RctAct${aId}${suf}`,{
      X:xOff, Y:ACTIVO_Y+26, Width:W2, Height:40,
      Fill:`If(gActivoUsr="${a}",${C.blue},${C.grayMid})`,
      BorderThickness:0,
      RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
      OnSelect:`Set(gActivoUsr,"${a}")`,
    }),
    lbl(`LblAct${aId}${suf}`,{
      X:xOff, Y:ACTIVO_Y+26, Width:W2, Height:40,
      Fill:C.transparent, Text:`"${a}"`,
      Color:`If(gActivoUsr="${a}",${C.white},${C.textDark})`,
      Size:12, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gActivoUsr,"${a}")`,
    }),
  ].join('\n\n');
}).join('\n\n')}

${rect(`RctSave${suf}`,{
  X:20, Y:SAVE_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:patchFormula,
})}
${lbl(`LblSave${suf}`,{
  X:20, Y:SAVE_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:'"Guardar usuario"',
  Color:C.white, Size:15, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:patchFormula,
})}

${rect(`RctDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.navyDark, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`!IsBlank(gItemEdit)`,
})}
${lbl(`LblDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:'"Eliminar usuario"',
  Color:C.yellow, Size:14, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`!IsBlank(gItemEdit)`,
})}

${makeFormDeleteOverlay(suf,'Tabla3','ScrUsuarios')}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_RESERVAS — DataTable list for Tabla4 (Reservas) with filter
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_RESERVAS = (() => {
  const suf = 'Rsv';
  const FILT_Y = HDR + ACCENT + 8;
  const DT_Y_RSV = FILT_Y + 44 + 8;
  const filterExpr = 'If(gFiltroReserva="Todos",Tabla4,Filter(Tabla4,Estado=gFiltroReserva))';
  const dtYaml   = makeDataTableYaml('DataTable3','Tabla4', DT_Y_RSV, RESERVAS_COLS, 80, filterExpr);
  const actionBar = makeActionBarYaml('DataTable3','Docente','Tabla4','ScrItemFormReserva', suf, true);
  const filtros = ['Todos','Pendiente','Aprobada','Denegada'];
  const W4 = '(Parent.Width - 56) / 4';

  const filterBtns = filtros.map((f, i) => {
    const xExpr = i === 0 ? 20 : `20 + ${i} * ((Parent.Width - 56) / 4 + 8)`;
    return [
      rect(`RctFlt${f}${suf}`,{
        X:xExpr, Y:FILT_Y, Width:W4, Height:36,
        Fill:`If(gFiltroReserva="${f}",${C.blue},${C.white})`,
        BorderColor:C.blue, BorderThickness:1,
        RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
        OnSelect:`Set(gFiltroReserva,"${f}")`,
      }),
      lbl(`LblFlt${f}${suf}`,{
        X:xExpr, Y:FILT_Y, Width:W4, Height:36,
        Fill:C.transparent, Text:`"${f}"`,
        Color:`If(gFiltroReserva="${f}",${C.white},${C.blue})`,
        Size:11, FontWeight:'FontWeight.Semibold',
        Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
        OnSelect:`Set(gFiltroReserva,"${f}")`,
      }),
    ].join('\n\n');
  }).join('\n\n');

  return `"ScrReservas As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None

${rect('RctHdrRsv',   { X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${rect('RctBackRsv',  { X:4,Y:16,Width:44,Height:40,Fill:C.blueLight,BorderThickness:0,RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblBackRsv',   { X:4,Y:16,Width:44,Height:40,Fill:C.transparent,Text:'"\u2190"',Color:C.white,Size:22,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblTitleRsv',  { X:58,Y:0,Width:'Parent.Width-220',Height:HDR,Fill:C.transparent,Text:'"Reservas del Laboratorio"',Color:C.white,Size:17,FontWeight:'FontWeight.Bold',Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle' })}
${rect('RctCalRsv',{
  X:'Parent.Width - 230', Y:20, Width:36, Height:36,
  Fill:C.blueLight, BorderThickness:0,
  RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
  OnSelect:'Navigate(ScrCalendario,ScreenTransition.Fade)',
})}
${lbl('LblCalRsv',{
  X:'Parent.Width - 230', Y:20, Width:36, Height:36,
  Fill:C.transparent, Text:'"\uD83D\uDCC5"', Color:C.white, Size:16,
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Navigate(ScrCalendario,ScreenTransition.Fade)',
})}

${rect('RctBatchApvRsv',{
  X:'Parent.Width - 160', Y:18, Width:70, Height:36,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
  OnSelect:'ForAll(Filter(Tabla4,Estado="Pendiente"),Patch(Tabla4,ThisRecord,{Estado:"Aprobada",Aprobado:"TRUE"}))',
  Visible:'(gRol = "Admin" || gRol = "SuperAdmin") && CountIf(Tabla4,Estado="Pendiente")>0',
})}
${lbl('LblBatchApvRsv',{
  X:'Parent.Width - 160', Y:18, Width:70, Height:36,
  Fill:C.transparent, Text:'"\u2714 Todas"',
  Color:C.white, Size:11, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'ForAll(Filter(Tabla4,Estado="Pendiente"),Patch(Tabla4,ThisRecord,{Estado:"Aprobada",Aprobado:"TRUE"}))',
  Visible:'(gRol = "Admin" || gRol = "SuperAdmin") && CountIf(Tabla4,Estado="Pendiente")>0',
})}
${rect('RctBatchDnyRsv',{
  X:'Parent.Width - 82', Y:18, Width:70, Height:36,
  Fill:C.navyDark, BorderThickness:0,
  RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
  OnSelect:'ForAll(Filter(Tabla4,Estado="Pendiente"),Patch(Tabla4,ThisRecord,{Estado:"Denegada",Aprobado:"FALSE"}))',
  Visible:'(gRol = "Admin" || gRol = "SuperAdmin") && CountIf(Tabla4,Estado="Pendiente")>0',
})}
${lbl('LblBatchDnyRsv',{
  X:'Parent.Width - 82', Y:18, Width:70, Height:36,
  Fill:C.transparent, Text:'"\u2718 Todas"',
  Color:C.yellow, Size:11, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'ForAll(Filter(Tabla4,Estado="Pendiente"),Patch(Tabla4,ThisRecord,{Estado:"Denegada",Aprobado:"FALSE"}))',
  Visible:'(gRol = "Admin" || gRol = "SuperAdmin") && CountIf(Tabla4,Estado="Pendiente")>0',
})}
${rect('RctAccentRsv',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}

${filterBtns}

${dtYaml}

${rect('RctFabRsv',{
  X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:28,RadiusTopRight:28,RadiusBottomLeft:28,RadiusBottomRight:28,
  OnSelect:'Set(gItemEdit,Blank());Navigate(ScrItemFormReserva,ScreenTransition.Slide)',
})}
${lbl('LblFabRsv',{
  X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
  Fill:C.transparent, Text:'"+"', Color:C.white, Size:28,
  FontWeight:'FontWeight.Bold', Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Set(gItemEdit,Blank());Navigate(ScrItemFormReserva,ScreenTransition.Slide)',
})}

${actionBar}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_ITEM_FORM_RESERVA — Add/Edit form for Reservas (Tabla4)
// Fields: Docente, Recurso, Fecha + Bloque horario + Estado radio + conflict warning
// Time blocks: L-V 6-8,8-10,12-14,16-18:30,18:30-21 | Sáb 7:30-9:30,9:30-11:30
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_ITEM_FORM_RESERVA = (() => {
  const suf      = 'FRsv';
  const BLOQUE_Y = HDR + ACCENT + 12 + 3 * (22 + 44 + 14); // after 3 fields
  const ESTADO_Y = BLOQUE_Y + 22 + 40 + 8 + 40 + 16;       // after 2 rows of blocks
  const NOTAS_Y  = ESTADO_Y + 26 + 40 + 12;                // after Estado radios
  const WARN_Y   = NOTAS_Y + 22 + 50 + 8;                  // after Notas field
  const SAVE_Y   = WARN_Y + 44 + 8 + 44 + 12;              // 2 warning rows
  const DEL_Y    = SAVE_Y + BTN_H + 12;
  const W3       = '(Parent.Width - 56) / 3';
  const W4       = '(Parent.Width - 64) / 4';

  // Time block definitions: id, label, startTime, endTime
  const bloques = [
    { id:'1', lbl:'L-V 06-08',     start:'06:00', end:'08:00' },
    { id:'2', lbl:'L-V 08-10',     start:'08:00', end:'10:00' },
    { id:'3', lbl:'L-V 12-14',     start:'12:00', end:'14:00' },
    { id:'4', lbl:'L-V 16-18:30',  start:'16:00', end:'18:30' },
    { id:'5', lbl:'L-V 18:30-21',  start:'18:30', end:'21:00' },
    { id:'6', lbl:'S\u00e1b 7:30-9:30', start:'07:30', end:'09:30' },
    { id:'7', lbl:'S\u00e1b 9:30-11:30',start:'09:30', end:'11:30' },
  ];

  // Build FechaInicio/FechaFin from date + block using Switch (clean, no scope issues)
  const switchStart = bloques.map(b => `"${b.id}","${b.start}"`).join(',');
  const switchEnd   = bloques.map(b => `"${b.id}","${b.end}"`).join(',');
  const patchFormula =
    `If(IsBlank(TxtFRsvRecurso.Text)||IsBlank(TxtFRsvFecha.Text),` +
    `Notify("Recurso y Fecha son obligatorios",NotificationType.Error),` +
    `Patch(Tabla4,If(IsBlank(gItemEdit),Defaults(Tabla4),gItemEdit),` +
    `{Docente:TxtFRsvDocente.Text,Recurso:TxtFRsvRecurso.Text,` +
    `Bloque:gBloqueReserva,` +
    `FechaInicio:TxtFRsvFecha.Text & " " & Switch(gBloqueReserva,${switchStart},"06:00"),` +
    `FechaFin:TxtFRsvFecha.Text & " " & Switch(gBloqueReserva,${switchEnd},"08:00"),` +
    `Notas:TxtFRsvNotas.Text,` +
    `Estado:gEstadoReserva,Aprobado:If(gEstadoReserva="Aprobada","TRUE","FALSE")});` +
    `Set(gItemEdit,Blank());Navigate(ScrReservas,ScreenTransition.None))`;

  const estados = ['Pendiente','Aprobada','Denegada'];

  // Generate block buttons (row1: 4, row2: 3)
  const row1 = bloques.slice(0,4);
  const row2 = bloques.slice(4);

  const mkBlkBtn = (b, xExpr, yOff, wExpr) => [
    rect(`RctBlk${b.id}${suf}`,{
      X:xExpr, Y:BLOQUE_Y + 22 + yOff, Width:wExpr, Height:40,
      Fill:`If(gBloqueReserva="${b.id}",${C.blue},${C.grayMid})`,
      BorderThickness:0, RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
      OnSelect:`Set(gBloqueReserva,"${b.id}")`,
    }),
    lbl(`LblBlk${b.id}${suf}`,{
      X:xExpr, Y:BLOQUE_Y + 22 + yOff, Width:wExpr, Height:40,
      Fill:C.transparent, Text:`"${b.lbl}"`,
      Color:`If(gBloqueReserva="${b.id}",${C.white},${C.textDark})`,
      Size:10, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gBloqueReserva,"${b.id}")`,
    }),
  ].join('\n\n');

  const bloqueButtons = [
    ...row1.map((b,i) => {
      const xExpr = i === 0 ? 20 : `20 + ${i} * ((Parent.Width - 64) / 4 + 8)`;
      return mkBlkBtn(b, xExpr, 0, W4);
    }),
    ...row2.map((b,i) => {
      const xExpr = i === 0 ? 20 : `20 + ${i} * ((Parent.Width - 56) / 3 + 8)`;
      return mkBlkBtn(b, xExpr, 48, W3);
    }),
  ].join('\n\n');

  return `"ScrItemFormReserva As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None
    OnVisible: =Concurrent(Set(gEstadoReserva,If(IsBlank(gItemEdit),"Pendiente",If(IsBlank(gItemEdit.Estado),"Pendiente",gItemEdit.Estado))),Set(gBloqueReserva,If(IsBlank(gItemEdit),"1",Coalesce(gItemEdit.Bloque,"1"))))

${makeFormHeader(suf, 'ScrReservas', 'If(IsBlank(gItemEdit),"Nueva reserva","Editar reserva")')}

${makeFieldBlock(suf, 0, '"Docente *"',              'TxtFRsvDocente',     'If(IsBlank(gItemEdit),User().FullName,gItemEdit.Docente)')}

${makeFieldBlock(suf, 1, '"Recurso *"',              'TxtFRsvRecurso',     _EF('Recurso'))}

${makeFieldBlock(suf, 2, '"Fecha (AAAA-MM-DD)"', 'TxtFRsvFecha', 'If(IsBlank(gItemEdit),Text(Today(),"yyyy-mm-dd"),Left(gItemEdit.FechaInicio,10))')}

${lbl(`LblBloqueTit${suf}`,{
  X:20, Y:BLOQUE_Y, Width:'Parent.Width-40', Height:22,
  Fill:C.transparent, Text:'"Bloque horario"',
  Color:C.navy, Size:12, FontWeight:'FontWeight.Semibold', VerticalAlign:'VerticalAlign.Middle',
})}
${bloqueButtons}

${lbl(`LblEstadoTit${suf}`,{
  X:20, Y:ESTADO_Y, Width:'Parent.Width-40', Height:22,
  Fill:C.transparent, Text:'"Estado de la reserva"',
  Color:C.navy, Size:12, FontWeight:'FontWeight.Semibold', VerticalAlign:'VerticalAlign.Middle',
})}
${estados.map((e,i) => {
  const xOff = i === 0 ? 20 : i === 1 ? `20+(Parent.Width-56)/3+8` : `20+2*(Parent.Width-56)/3+16`;
  const eId  = toAsciiId(e);
  return [
    rect(`RctEst${eId}${suf}`,{
      X:xOff, Y:ESTADO_Y+26, Width:W3, Height:40,
      Fill:`If(gEstadoReserva="${e}",${C.blue},${C.grayMid})`,
      BorderThickness:0, RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
      OnSelect:`Set(gEstadoReserva,"${e}")`,
    }),
    lbl(`LblEst${eId}${suf}`,{
      X:xOff, Y:ESTADO_Y+26, Width:W3, Height:40,
      Fill:C.transparent, Text:`"${e}"`,
      Color:`If(gEstadoReserva="${e}",${C.white},${C.textDark})`,
      Size:11, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gEstadoReserva,"${e}")`,
    }),
  ].join('\n\n');
}).join('\n\n')}

${lbl(`LblNotasTit${suf}`,{
  X:20, Y:NOTAS_Y, Width:'Parent.Width-40', Height:22,
  Fill:C.transparent, Text:'"Notas (opcional)"',
  Color:C.navy, Size:12, FontWeight:'FontWeight.Semibold', VerticalAlign:'VerticalAlign.Middle',
})}
${tin(`TxtFRsvNotas`,{
  X:20, Y:NOTAS_Y+22, Width:'Parent.Width-40', Height:50,
  Fill:C.white, BorderColor:C.border, BorderThickness:1,
  RadiusTopLeft:8, RadiusTopRight:8, RadiusBottomLeft:8, RadiusBottomRight:8,
  Default:'If(IsBlank(gItemEdit),"",Coalesce(gItemEdit.Notas,""))',
  HintText:'"Observaciones adicionales..."',
  Mode:'TextMode.MultiLine',
})}

${rect(`RctWarnDmg${suf}`,{
  X:20, Y:WARN_Y, Width:'Parent.Width-40', Height:44,
  Fill:C.yellowLight, BorderColor:C.yellowDark, BorderThickness:2,
  RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
  Visible:`Len(TxtFRsvRecurso.Text)>0 && (Lower(Coalesce(LookUp(Tabla1,Juegos=TxtFRsvRecurso.Text,Observaciones),"")) exactin "dañado" || Lower(Coalesce(LookUp(Tabla1,Juegos=TxtFRsvRecurso.Text,Observaciones),"")) exactin "fuera de servicio")`,
})}
${lbl(`LblWarnDmg${suf}`,{
  X:32, Y:WARN_Y, Width:'Parent.Width-64', Height:44,
  Fill:C.transparent,
  Text:`"\u26D4  Este recurso est\u00e1 da\u00f1ado o fuera de servicio."`,
  Color:C.yellowDark, Size:11, FontWeight:'FontWeight.Bold',
  VerticalAlign:'VerticalAlign.Middle',
  Visible:`Len(TxtFRsvRecurso.Text)>0 && (Lower(Coalesce(LookUp(Tabla1,Juegos=TxtFRsvRecurso.Text,Observaciones),"")) exactin "dañado" || Lower(Coalesce(LookUp(Tabla1,Juegos=TxtFRsvRecurso.Text,Observaciones),"")) exactin "fuera de servicio")`,
})}

${rect(`RctWarn${suf}`,{
  X:20, Y:WARN_Y+52, Width:'Parent.Width-40', Height:44,
  Fill:C.yellowLight, BorderColor:C.yellow, BorderThickness:1,
  RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
  Visible:`Len(TxtFRsvRecurso.Text)>0 && Len(TxtFRsvFecha.Text)>=10 && CountIf(Tabla4,Recurso=TxtFRsvRecurso.Text && Estado="Aprobada" && Left(FechaInicio,10)=TxtFRsvFecha.Text)>0`,
})}
${lbl(`LblWarn${suf}`,{
  X:32, Y:WARN_Y+52, Width:'Parent.Width-64', Height:44,
  Fill:C.transparent,
  Text:`If(Len(TxtFRsvRecurso.Text)>0 && Len(TxtFRsvFecha.Text)>=10 && CountIf(Tabla4,Recurso=TxtFRsvRecurso.Text && Estado="Aprobada" && Left(FechaInicio,10)=TxtFRsvFecha.Text)>0,"\u26A0  Ya existe una reserva aprobada para este recurso en esta fecha.","")`,
  Color:C.yellowDark, Size:11, FontWeight:'FontWeight.Semibold',
  VerticalAlign:'VerticalAlign.Middle',
  Visible:`Len(TxtFRsvRecurso.Text)>0 && Len(TxtFRsvFecha.Text)>=10 && CountIf(Tabla4,Recurso=TxtFRsvRecurso.Text && Estado="Aprobada" && Left(FechaInicio,10)=TxtFRsvFecha.Text)>0`,
})}

${rect(`RctSave${suf}`,{
  X:20, Y:SAVE_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:patchFormula,
})}
${lbl(`LblSave${suf}`,{
  X:20, Y:SAVE_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:'"Guardar reserva"',
  Color:C.white, Size:15, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:patchFormula,
})}

${rect(`RctDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.navyDark, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`!IsBlank(gItemEdit) && (gRol="SuperAdmin" || (gRol in ["Admin","Docente"] && gItemEdit.Docente=User().FullName && DateAdd(Now(),30,TimeUnit.Minutes)<DateTimeValue(gItemEdit.FechaInicio)))`,
})}
${lbl(`LblDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:`If(gRol="SuperAdmin","Eliminar reserva","Cancelar mi reserva")`,
  Color:C.yellow, Size:14, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`!IsBlank(gItemEdit) && (gRol="SuperAdmin" || (gRol in ["Admin","Docente"] && gItemEdit.Docente=User().FullName && DateAdd(Now(),30,TimeUnit.Minutes)<DateTimeValue(gItemEdit.FechaInicio)))`,
})}

${makeFormDeleteOverlay(suf,'Tabla4','ScrReservas')}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_PRESTAMOS — DataTable list for Tabla5 (Préstamos/Retiros) with filter
// Docente sees only their loans; Admin/SuperAdmin sees all
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_PRESTAMOS = (() => {
  const suf = 'Pst';
  const FILT_Y = HDR + ACCENT + 8;
  const DT_Y_PST = FILT_Y + 44 + 8;
  // Combined role + status filter
  const baseFilter = 'If(gRol="Docente",Filter(Tabla5,Usuario=User().FullName),Tabla5)';
  const filterExpr = `If(gFiltroPrestamo="Todos",${baseFilter},Filter(${baseFilter},Estado=gFiltroPrestamo))`;
  const dtYaml   = makeDataTableYaml('DataTable4','Tabla5', DT_Y_PST, PRESTAMOS_COLS, 80, filterExpr);
  const actionBar = makeActionBarYaml('DataTable4','Item','Tabla5','ScrItemFormPrestamo', suf, true);
  const filtros = ['Todos','Activo','Devuelto'];
  const W3 = '(Parent.Width - 48) / 3';

  const filterBtns = filtros.map((f, i) => {
    const xExpr = i === 0 ? 20 : `20 + ${i} * ((Parent.Width - 48) / 3 + 8)`;
    return [
      rect(`RctFlt${f}${suf}`,{
        X:xExpr, Y:FILT_Y, Width:W3, Height:36,
        Fill:`If(gFiltroPrestamo="${f}",${C.blue},${C.white})`,
        BorderColor:C.blue, BorderThickness:1,
        RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
        OnSelect:`Set(gFiltroPrestamo,"${f}")`,
      }),
      lbl(`LblFlt${f}${suf}`,{
        X:xExpr, Y:FILT_Y, Width:W3, Height:36,
        Fill:C.transparent, Text:`"${f}"`,
        Color:`If(gFiltroPrestamo="${f}",${C.white},${C.blue})`,
        Size:11, FontWeight:'FontWeight.Semibold',
        Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
        OnSelect:`Set(gFiltroPrestamo,"${f}")`,
      }),
    ].join('\n\n');
  }).join('\n\n');

  return `"ScrPrestamos As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None

${rect('RctHdrPst',   { X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${rect('RctBackPst',  { X:4,Y:16,Width:44,Height:40,Fill:C.blueLight,BorderThickness:0,RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblBackPst',   { X:4,Y:16,Width:44,Height:40,Fill:C.transparent,Text:'"\u2190"',Color:C.white,Size:22,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblTitlePst',  { X:58,Y:0,Width:'Parent.Width-68',Height:HDR,Fill:C.transparent,Text:'If(gRol="Docente","Mis Pr\u00e9stamos","Pr\u00e9stamos y Retiros")',Color:C.white,Size:17,FontWeight:'FontWeight.Bold',Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle' })}
${rect('RctAccentPst',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}

${filterBtns}

${dtYaml}

${rect('RctFabPst',{
  X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:28,RadiusTopRight:28,RadiusBottomLeft:28,RadiusBottomRight:28,
  Visible:'gRol = "Admin" || gRol = "SuperAdmin"',
  OnSelect:'Set(gItemEdit,Blank());Navigate(ScrItemFormPrestamo,ScreenTransition.Slide)',
})}
${lbl('LblFabPst',{
  X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
  Fill:C.transparent, Text:'"+"', Color:C.white, Size:28,
  FontWeight:'FontWeight.Bold', Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  Visible:'gRol = "Admin" || gRol = "SuperAdmin"',
  OnSelect:'Set(gItemEdit,Blank());Navigate(ScrItemFormPrestamo,ScreenTransition.Slide)',
})}

${actionBar}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_ITEM_FORM_PRESTAMO — Add/Edit form for Préstamos/Retiros (Tabla5)
// Fields: Item, Tipo radio (Retiro/Devolución), Usuario, Fecha, FechaFin, Notas
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_ITEM_FORM_PRESTAMO = (() => {
  const suf      = 'FPst';
  const TIPO_Y   = HDR + ACCENT + 12 + 1 * (22 + 44 + 14); // slot 1 — tipo radio
  const NOTAS_Y  = HDR + ACCENT + 12 + 5 * (22 + 44 + 14); // slot 5 — notas
  const SAVE_Y   = NOTAS_Y + 22 + 50 + 12;                  // after notas
  const DEL_Y    = SAVE_Y + BTN_H + 12;
  const W2       = '(Parent.Width - 48) / 2';

  const patchFormula =
    `If(Or(IsBlank(Trim(TxtFPstItem.Text)),IsBlank(Trim(TxtFPstUsuario.Text)),` +
    `IsBlank(Trim(TxtFPstFecha.Text)),IsBlank(Trim(TxtFPstFechaFin.Text))),` +
    `Notify("Artículo, usuario y fechas son obligatorios",NotificationType.Error),` +
    `IfError(` +
    `Patch(Tabla5,If(IsBlank(gItemEdit),Defaults(Tabla5),gItemEdit),` +
    `{Item:TxtFPstItem.Text,Tipo:gTipoPrestamo,Usuario:TxtFPstUsuario.Text,` +
    `Fecha:TxtFPstFecha.Text,FechaFin:TxtFPstFechaFin.Text,Notas:TxtFPstNotas.Text,` +
    `Estado:If(gTipoPrestamo="Devolución","Devuelto","Activo")});` +
    `Refresh(Tabla5);Set(gItemEdit,Blank());Notify("Préstamo guardado",NotificationType.Success);` +
    `Navigate(ScrPrestamos,ScreenTransition.None),` +
    `Notify("No se pudo guardar el préstamo. Revisa la conexión a Excel o los datos ingresados.",NotificationType.Error)))`;

  const tipos = ['Retiro','Devoluci\u00f3n'];

  return `"ScrItemFormPrestamo As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None
    OnVisible: =Set(gTipoPrestamo,If(IsBlank(gItemEdit),"Retiro",If(IsBlank(gItemEdit.Tipo),"Retiro",gItemEdit.Tipo)))

${makeFormHeader(suf, 'ScrPrestamos', 'If(IsBlank(gItemEdit),"Nuevo pr\u00e9stamo","Editar pr\u00e9stamo")')}

${makeFieldBlock(suf, 0, '"Art\u00edculo *"', 'TxtFPstItem', _EF('Item'))}

${lbl(`LblTipoTit${suf}`,{
  X:20, Y:TIPO_Y, Width:'Parent.Width-40', Height:22,
  Fill:C.transparent, Text:'"Tipo de movimiento"',
  Color:C.navy, Size:12, FontWeight:'FontWeight.Semibold', VerticalAlign:'VerticalAlign.Middle',
})}
${tipos.map((t,i) => {
  const xOff = i === 0 ? 20 : `20+(Parent.Width-48)/2+8`;
  const tId  = toAsciiId(t);
  return [
    rect(`RctTip${tId}${suf}`,{
      X:xOff, Y:TIPO_Y+26, Width:W2, Height:40,
      Fill:`If(gTipoPrestamo="${t}",${C.blue},${C.grayMid})`,
      BorderThickness:0, RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
      OnSelect:`Set(gTipoPrestamo,"${t}")`,
    }),
    lbl(`LblTip${tId}${suf}`,{
      X:xOff, Y:TIPO_Y+26, Width:W2, Height:40,
      Fill:C.transparent, Text:`"${t}"`,
      Color:`If(gTipoPrestamo="${t}",${C.white},${C.textDark})`,
      Size:12, FontWeight:'FontWeight.Semibold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      OnSelect:`Set(gTipoPrestamo,"${t}")`,
    }),
  ].join('\n\n');
}).join('\n\n')}

${makeFieldBlock(suf, 2, '"Usuario"', 'TxtFPstUsuario', 'If(IsBlank(gItemEdit),User().FullName,gItemEdit.Usuario)')}

${makeFieldBlock(suf, 3, '"Fecha (AAAA-MM-DD)"', 'TxtFPstFecha', 'If(IsBlank(gItemEdit),Text(Today(),"yyyy-mm-dd"),gItemEdit.Fecha)')}

${makeFieldBlock(suf, 4, '"Fecha esperada devoluci\u00f3n (AAAA-MM-DD)"', 'TxtFPstFechaFin', 'If(IsBlank(gItemEdit),Text(Today(),"yyyy-mm-dd"),gItemEdit.FechaFin)')}

${lbl(`LblNotasTit${suf}`,{
  X:20, Y:NOTAS_Y, Width:'Parent.Width-40', Height:22,
  Fill:C.transparent, Text:'"Notas (opcional)"',
  Color:C.navy, Size:12, FontWeight:'FontWeight.Semibold', VerticalAlign:'VerticalAlign.Middle',
})}
${tin(`TxtFPstNotas`,{
  X:20, Y:NOTAS_Y+22, Width:'Parent.Width-40', Height:50,
  Fill:C.white, BorderColor:C.border, BorderThickness:1,
  RadiusTopLeft:8, RadiusTopRight:8, RadiusBottomLeft:8, RadiusBottomRight:8,
  Default:'If(IsBlank(gItemEdit),"",Coalesce(gItemEdit.Notas,""))',
  HintText:'"Observaciones del pr\u00e9stamo..."',
  Mode:'TextMode.MultiLine',
})}

${rect(`RctSave${suf}`,{
  X:20, Y:SAVE_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:patchFormula,
})}
${lbl(`LblSave${suf}`,{
  X:20, Y:SAVE_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:'"Guardar"',
  Color:C.white, Size:15, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:patchFormula,
})}

${rect(`RctDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.navyDark, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`gRol="SuperAdmin" && !IsBlank(gItemEdit)`,
})}
${lbl(`LblDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:'"Eliminar registro"',
  Color:C.yellow, Size:14, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`gRol="SuperAdmin" && !IsBlank(gItemEdit)`,
})}

${makeFormDeleteOverlay(suf,'Tabla5','ScrPrestamos')}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_ALERTAS — Pending / overdue loans dashboard (Admin)
// Stat pills: Vencidos / Vence hoy / En tiempo
// DataTable6 filtered to Tabla5 Estado="Activo"
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_ALERTAS = (() => {
  const suf      = 'Alt';
  const PILLS_Y  = HDR + ACCENT + 16;          // 91  — top of pill row
  const PILLS_H  = 80;                          // height of each pill box
  const DTY      = PILLS_Y + PILLS_H + 14;      // 185 — DataTable top
  const W3       = `(Parent.Width - 56) / 3`;  // pill width (3 cols, 8px gaps)
  const X2       = `20 + (Parent.Width - 56) / 3 + 8`;
  const X3       = `20 + (Parent.Width - 56) / 3 * 2 + 16`;

  // CountIf formulas — text comparison safe for yyyy-mm-dd strings
  const todayStr = `Text(Today(),"yyyy-mm-dd")`;
  const cntVen   = `CountIf(Tabla5,Estado="Activo",Not(IsBlank(FechaFin)),FechaFin<${todayStr})`;
  const cntHoy   = `CountIf(Tabla5,Estado="Activo",Not(IsBlank(FechaFin)),FechaFin=${todayStr})`;
  const cntOk    = `CountIf(Tabla5,Estado="Activo",Not(IsBlank(FechaFin)),FechaFin>${todayStr})`;
  const filterEx = `Filter(Tabla5,Estado="Activo")`;

  const dtYaml   = makeDataTableYaml('DataTable6','Tabla5', DTY, ALERTAS_COLS, 0, filterEx);

  // Pill builder — borderColor, countFormula
  function pill(prefix, xExpr, borderColor, numColor, countFml, labelTxt) {
    return [
      rect(`Rct${prefix}${suf}`,{
        X:xExpr, Y:PILLS_Y, Width:W3, Height:PILLS_H,
        Fill:C.white, BorderColor:borderColor, BorderThickness:2,
        RadiusTopLeft:12,RadiusTopRight:12,RadiusBottomLeft:12,RadiusBottomRight:12,
      }),
      lbl(`LblN${prefix}${suf}`,{
        X:xExpr, Y:PILLS_Y+4, Width:W3, Height:40,
        Fill:C.transparent, Text:countFml,
        Color:numColor, Size:28, FontWeight:'FontWeight.Bold',
        Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
        DisplayMode:'DisplayMode.View',
      }),
      lbl(`LblL${prefix}${suf}`,{
        X:xExpr, Y:`${PILLS_Y}+44`, Width:W3, Height:30,
        Fill:C.transparent, Text:`"${labelTxt}"`,
        Color:C.gray, Size:11,
        Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
        DisplayMode:'DisplayMode.View',
      }),
    ].join('\n\n');
  }

  return `"ScrAlertas As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None

${rect('RctHdrAlt',   { X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${rect('RctBackAlt',  { X:4,Y:16,Width:44,Height:40,Fill:C.blueLight,BorderThickness:0,RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblBackAlt',   { X:4,Y:16,Width:44,Height:40,Fill:C.transparent,Text:'"\u2190"',Color:C.white,Size:22,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblTitleAlt',  { X:58,Y:0,Width:'Parent.Width-68',Height:HDR,Fill:C.transparent,Text:'"Alertas de Pendientes"',Color:C.white,Size:17,FontWeight:'FontWeight.Bold',Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle' })}
${rect('RctAccentAlt',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}

${pill('Ven', 20,           C.yellowDark, C.yellowDark, cntVen, 'Vencidos')}

${pill('Hoy', X2,           C.yellow,     C.yellow,     cntHoy, 'Vence hoy')}

${pill('Ok',  X3,           C.blue,       C.blue,       cntOk,  'En tiempo')}

${dtYaml}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_REPORTES — Reports hub: period filter + 4 tabs (Admin)
// Tab 1: Uso por Docente · Tab 2: Uso por Material
// Tab 3: Devoluciones Retrasadas · Tab 4: Materiales Dañados
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_REPORTES = (() => {
  const suf      = 'Rpt';
  const PERIOD_Y = HDR + ACCENT + 12;        // 87 — period filter row
  const PERIOD_H = 38;
  const TAB_Y    = PERIOD_Y + PERIOD_H + 8;  // 133 — tab row
  const TAB_H    = 36;
  const DT_RPT_Y = TAB_Y + TAB_H + 6;        // 175 — DataTable top

  // Period button widths/offsets
  const WP  = `(Parent.Width - 56) / 3`;
  const XP2 = `20 + (Parent.Width - 56) / 3 + 8`;
  const XP3 = `20 + (Parent.Width - 56) / 3 * 2 + 16`;

  // Tab button widths/offsets
  const WT  = `(Parent.Width - 52) / 4`;
  const XT2 = `20 + (Parent.Width - 52) / 4 + 4`;
  const XT3 = `20 + (Parent.Width - 52) / 4 * 2 + 8`;
  const XT4 = `20 + (Parent.Width - 52) / 4 * 3 + 12`;

  // DataTable Items expressions
  const dt1Items = `AddColumns(GroupBy(Filter(Tabla4,FechaInicio>=gFechaDesde),"Docente","_r"),"Reservas",CountRows(_r))`;
  const dt2Items = `AddColumns(GroupBy(Filter(Tabla4,FechaInicio>=gFechaDesde),"Recurso","_r"),"Usos",CountRows(_r))`;
  const dt3Items = `Filter(Tabla5,Estado="Activo",Not(IsBlank(FechaFin)),FechaFin<Text(Today(),"yyyy-mm-dd"))`;
  const dt4Items = `Filter(Tabla2,Not(IsBlank(Malo)))`;

  const dt1Yaml = makeDataTableYaml('DataTableRpt1','Tabla4', DT_RPT_Y, RPT1_COLS, 0, dt1Items, 'gRptTab=1');
  const dt2Yaml = makeDataTableYaml('DataTableRpt2','Tabla4', DT_RPT_Y, RPT2_COLS, 0, dt2Items, 'gRptTab=2');
  const dt3Yaml = makeDataTableYaml('DataTableRpt3','Tabla5', DT_RPT_Y, RPT3_COLS, 0, dt3Items, 'gRptTab=3');
  const dt4Yaml = makeDataTableYaml('DataTableRpt4','Tabla2', DT_RPT_Y, RPT4_COLS, 0, dt4Items, 'gRptTab=4');

  function periodBtn(id, xExpr, label, periodoVal, fechaFml) {
    const onSel = `Concurrent(Set(gPeriodo,"${periodoVal}"),Set(gFechaDesde,${fechaFml}))`;
    return [
      rect(`RctP${id}${suf}`,{
        X:xExpr, Y:PERIOD_Y, Width:WP, Height:PERIOD_H,
        Fill:`If(gPeriodo="${periodoVal}",${C.navy},${C.canvasMid})`,
        BorderThickness:0,
        RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
        OnSelect:onSel,
      }),
      lbl(`LblP${id}${suf}`,{
        X:xExpr, Y:PERIOD_Y, Width:WP, Height:PERIOD_H,
        Fill:C.transparent, Text:`"${label}"`,
        Color:`If(gPeriodo="${periodoVal}",${C.white},${C.navy})`,
        Size:12, FontWeight:'FontWeight.Semibold',
        Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
        OnSelect:onSel,
      }),
    ].join('\n\n');
  }

  function tabBtn(n, xExpr, label) {
    return [
      rect(`RctT${n}${suf}`,{
        X:xExpr, Y:TAB_Y, Width:WT, Height:TAB_H,
        Fill:`If(gRptTab=${n},${C.blue},${C.grayMid})`,
        BorderThickness:0,
        RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
        OnSelect:`Set(gRptTab,${n})`,
      }),
      lbl(`LblT${n}${suf}`,{
        X:xExpr, Y:TAB_Y, Width:WT, Height:TAB_H,
        Fill:C.transparent, Text:`"${label}"`,
        Color:`If(gRptTab=${n},${C.white},${C.textDark})`,
        Size:11, FontWeight:'FontWeight.Semibold',
        Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
        OnSelect:`Set(gRptTab,${n})`,
      }),
    ].join('\n\n');
  }

  return `"ScrReportes As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None
    OnVisible: =Set(gRptTab,1)

${rect('RctHdrRpt',  { X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${rect('RctBackRpt', { X:4,Y:16,Width:44,Height:40,Fill:C.blueLight,BorderThickness:0,RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblBackRpt',  { X:4,Y:16,Width:44,Height:40,Fill:C.transparent,Text:'"\u2190"',Color:C.white,Size:22,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblTitleRpt', { X:58,Y:0,Width:'Parent.Width-68',Height:HDR,Fill:C.transparent,Text:'"Reportes"',Color:C.white,Size:17,FontWeight:'FontWeight.Bold',Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle' })}
${rect('RctAccentRpt',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}

${periodBtn('Sem', 20,  '\u00daltima semana', 'Semana', 'Text(DateAdd(Today(),-7,Days),"yyyy-mm-dd")')}

${periodBtn('Mes', XP2, '\u00daltimo mes',    'Mes',    'Text(DateAdd(Today(),-30,Days),"yyyy-mm-dd")')}

${periodBtn('Ano', XP3, '\u00daltimo a\u00f1o', 'A\u00f1o', 'Text(DateAdd(Today(),-365,Days),"yyyy-mm-dd")')}

${tabBtn(1, 20,  'Docentes')}

${tabBtn(2, XT2, 'Material')}

${tabBtn(3, XT3, 'Retrasos')}

${tabBtn(4, XT4, 'Da\u00f1os')}

${dt1Yaml}

${dt2Yaml}

${dt3Yaml}

${dt4Yaml}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_AYUDA — User manual / help screen
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_AYUDA = (() => {
  const CONTENT_Y = HDR + ACCENT + 16;

  // Docente help text
  const docenteHelp = `"` +
    `\u2705 RESERVAR MATERIAL" & Char(10) &` +
    `"1. Ve a Reservas y presiona +" & Char(10) &` +
    `"2. Selecciona material, fecha y bloque horario" & Char(10) &` +
    `"3. Confirma tu reserva" & Char(10) & Char(10) &` +
    `"\u23f0 MIS PR\u00c9STAMOS" & Char(10) &` +
    `"Ve los materiales que tienes prestados y su fecha de devoluci\u00f3n." & Char(10) & Char(10) &` +
    `"\u274c CANCELAR RESERVA" & Char(10) &` +
    `"Puedes cancelar hasta 30 minutos antes del inicio." & Char(10) & Char(10) &` +
    `"\u26a0\ufe0f IMPORTANTE" & Char(10) &` +
    `"Devuelve el material al finalizar tu bloque horario."`;

  // Admin help text
  const adminHelp = `"` +
    `\ud83d\udcdd REGISTRAR RETIRO" & Char(10) &` +
    `"1. Ve a Pr\u00e9stamos y presiona +" & Char(10) &` +
    `"2. Tipo: Retiro, ingresa art\u00edculo y docente" & Char(10) &` +
    `"3. Define fecha de devoluci\u00f3n esperada" & Char(10) & Char(10) &` +
    `"\u2705 REGISTRAR DEVOLUCI\u00d3N" & Char(10) &` +
    `"Edita el pr\u00e9stamo activo y cambia Tipo a Devoluci\u00f3n." & Char(10) & Char(10) &` +
    `"\ud83d\udea8 ALERTAS" & Char(10) &` +
    `"Revisa ScrAlertas para ver pr\u00e9stamos vencidos." & Char(10) & Char(10) &` +
    `"\ud83d\udcca REPORTES" & Char(10) &` +
    `"Filtra por per\u00edodo y consulta uso por docente/material."`;

  return `"ScrAyuda As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None

${rect('RctHdrAyu',   { X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${rect('RctBackAyu',  { X:4,Y:16,Width:44,Height:40,Fill:C.blueLight,BorderThickness:0,RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblBackAyu',   { X:4,Y:16,Width:44,Height:40,Fill:C.transparent,Text:'"\u2190"',Color:C.white,Size:22,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblTitleAyu',  { X:58,Y:0,Width:'Parent.Width-68',Height:HDR,Fill:C.transparent,Text:'"Manual de Usuario"',Color:C.white,Size:17,FontWeight:'FontWeight.Bold',Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle' })}
${rect('RctAccentAyu',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}

${rect('RctHelpCard',{
  X:20, Y:CONTENT_Y, Width:'Parent.Width - 40', Height:'Parent.Height - ${CONTENT_Y + 20}',
  Fill:C.white, BorderColor:C.border, BorderThickness:1,
  RadiusTopLeft:12,RadiusTopRight:12,RadiusBottomLeft:12,RadiusBottomRight:12,
})}

${lbl('LblHelpDocente',{
  X:36, Y:CONTENT_Y+16, Width:'Parent.Width - 72', Height:'Parent.Height - ${CONTENT_Y + 52}',
  Fill:C.transparent,
  Text: docenteHelp,
  Color:C.textDark, Size:14,
  VerticalAlign:'VerticalAlign.Top',
  Visible:'gRol = "Docente" || gRol = "Invitado"',
})}

${lbl('LblHelpAdmin',{
  X:36, Y:CONTENT_Y+16, Width:'Parent.Width - 72', Height:'Parent.Height - ${CONTENT_Y + 52}',
  Fill:C.transparent,
  Text: adminHelp,
  Color:C.textDark, Size:14,
  VerticalAlign:'VerticalAlign.Top',
  Visible:'gRol = "Admin" || gRol = "SuperAdmin"',
})}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_CALENDARIO — Weekly calendar view for reservations
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_CALENDARIO = (() => {
  const suf = 'Cal';
  const NAV_Y = HDR + ACCENT + 12;
  const CAL_Y = NAV_Y + 44 + 12;
  const DAY_W = '(Parent.Width - 56) / 7';

  // Week navigation uses gCalFecha as the start of the displayed week
  const dias = ['Lun','Mar','Mi\u00e9','Jue','Vie','S\u00e1b','Dom'];

  const dayHeaders = dias.map((d, i) => {
    const xExpr = i === 0 ? 20 : `20 + ${i} * ((Parent.Width - 56) / 7 + 4)`;
    return lbl(`LblDay${i}${suf}`,{
      X:xExpr, Y:CAL_Y, Width:DAY_W, Height:28,
      Fill:C.canvasMid, Text:`"${d}"`,
      Color:C.navy, Size:11, FontWeight:'FontWeight.Bold',
      Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
      RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:0,RadiusBottomRight:0,
    });
  }).join('\n\n');

  const dayColumns = dias.map((d, i) => {
    const xExpr = i === 0 ? 20 : `20 + ${i} * ((Parent.Width - 56) / 7 + 4)`;
    const dayDate = `Text(DateAdd(DateValue(gCalFecha),${i},Days),"yyyy-mm-dd")`;
    const count = `CountIf(Tabla4,Left(FechaInicio,10)=${dayDate})`;
    return [
      rect(`RctCol${i}${suf}`,{
        X:xExpr, Y:CAL_Y+28, Width:DAY_W, Height:'Parent.Height - ${CAL_Y + 28 + 20}',
        Fill:C.white, BorderColor:C.border, BorderThickness:1,
        RadiusTopLeft:0,RadiusTopRight:0,RadiusBottomLeft:6,RadiusBottomRight:6,
      }),
      lbl(`LblDate${i}${suf}`,{
        X:xExpr, Y:CAL_Y+30, Width:DAY_W, Height:22,
        Fill:C.transparent, Text:`Text(DateAdd(DateValue(gCalFecha),${i},Days),"dd")`,
        Color:C.textDark, Size:14, FontWeight:'FontWeight.Bold',
        Align:'Align.Center', VerticalAlign:'VerticalAlign.Top',
      }),
      lbl(`LblCnt${i}${suf}`,{
        X:xExpr, Y:CAL_Y+52, Width:DAY_W, Height:20,
        Fill:C.transparent, Text:`If(${count}>0,${count} & " res.","")`,
        Color:C.blue, Size:10, FontWeight:'FontWeight.Semibold',
        Align:'Align.Center', VerticalAlign:'VerticalAlign.Top',
      }),
    ].join('\n\n');
  }).join('\n\n');

  return `"ScrCalendario As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None
    OnVisible: =Set(gCalFecha,Text(DateAdd(Today(),-Weekday(Today())+2,Days),"yyyy-mm-dd"))

${rect('RctHdrCal',   { X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${rect('RctBackCal',  { X:4,Y:16,Width:44,Height:40,Fill:C.blueLight,BorderThickness:0,RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,OnSelect:'Navigate(ScrReservas,ScreenTransition.Slide)' })}
${lbl('LblBackCal',   { X:4,Y:16,Width:44,Height:40,Fill:C.transparent,Text:'"\u2190"',Color:C.white,Size:22,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',OnSelect:'Navigate(ScrReservas,ScreenTransition.Slide)' })}
${lbl('LblTitleCal',  { X:58,Y:0,Width:'Parent.Width-68',Height:HDR,Fill:C.transparent,Text:'"Calendario de Reservas"',Color:C.white,Size:17,FontWeight:'FontWeight.Bold',Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle' })}
${rect('RctAccentCal',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}

${rect('RctNavPrevCal',{
  X:20, Y:NAV_Y, Width:80, Height:40,
  Fill:C.grayMid, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:'Set(gCalFecha,Text(DateAdd(DateValue(gCalFecha),-7,Days),"yyyy-mm-dd"))',
})}
${lbl('LblNavPrevCal',{
  X:20, Y:NAV_Y, Width:80, Height:40,
  Fill:C.transparent, Text:'"\u2190 Ant."',
  Color:C.textDark, Size:12, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Set(gCalFecha,Text(DateAdd(DateValue(gCalFecha),-7,Days),"yyyy-mm-dd"))',
})}
${lbl('LblWeekCal',{
  X:108, Y:NAV_Y, Width:'Parent.Width - 216', Height:40,
  Fill:C.transparent, Text:'"Semana del " & Text(DateValue(gCalFecha),"dd mmm yyyy")',
  Color:C.navy, Size:14, FontWeight:'FontWeight.Bold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
})}
${rect('RctNavNextCal',{
  X:'Parent.Width - 100', Y:NAV_Y, Width:80, Height:40,
  Fill:C.grayMid, BorderThickness:0,
  RadiusTopLeft:8,RadiusTopRight:8,RadiusBottomLeft:8,RadiusBottomRight:8,
  OnSelect:'Set(gCalFecha,Text(DateAdd(DateValue(gCalFecha),7,Days),"yyyy-mm-dd"))',
})}
${lbl('LblNavNextCal',{
  X:'Parent.Width - 100', Y:NAV_Y, Width:80, Height:40,
  Fill:C.transparent, Text:'"Sig. \u2192"',
  Color:C.textDark, Size:12, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:'Set(gCalFecha,Text(DateAdd(DateValue(gCalFecha),7,Days),"yyyy-mm-dd"))',
})}

${dayHeaders}

${dayColumns}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS — EditorState helpers, file I/O, patching
// ════════════════════════════════════════════════════════════════════════════

// Simple (non-DataTable) EditorState control entry
function se(name, style) {
  return {
    IsAutoGenerated: false, IsComponentDefinition: false, IsDataControl: false,
    IsFromScreenLayout: false, IsGroupControl: false, IsLocked: false,
    LayoutName: '', MetaDataIDKey: '', Name: name,
    OptimizeForDevices: 'Off', StyleName: style, Type: 'ControlInfo',
  };
}

// Wrap control states into full EditorState JSON
function mkEditorState(topParent, states) {
  return JSON.stringify({ ControlStates: states, TopParentName: topParent }, null, 2);
}

// Remove named controls from a YAML string (4-space indented child controls)
function stripControls(yaml, names) {
  let result = yaml;
  for (const name of names) {
    // Match "    name As type.variant:" and everything until next 4-space control or eof
    const re = new RegExp(
      `\\n    ${name} As [^\\n]+:[\\s\\S]*?(?=\\n    (?:[A-Za-z_])|$)`,
      'g'
    );
    result = result.replace(re, '');
  }
  return result;
}

// Recursive directory copy
function cpDir(src, dst) {
  if (typeof fs.cpSync === 'function') {
    fs.cpSync(src, dst, { recursive: true, force: true });
  } else {
    const items = fs.readdirSync(src, { withFileTypes: true });
    fs.mkdirSync(dst, { recursive: true });
    for (const item of items) {
      const s = path.join(src, item.name);
      const d = path.join(dst, item.name);
      if (item.isDirectory()) cpDir(s, d);
      else fs.copyFileSync(s, d);
    }
  }
}

// Write file (creates parent dirs if needed)
function write(p, c) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, c, 'utf8');
}

// Update CanvasManifest.json screen order
function updateManifest(manifestPath, screenOrder) {
  const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  m.ScreenOrder = screenOrder;
  fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + '\n', 'utf8');
}

// ════════════════════════════════════════════════════════════════════════════
// GENERATED SCREENS — all screens written/overwritten by the build
// ════════════════════════════════════════════════════════════════════════════
const GENERATED_SCREENS = [
  { name: 'ScrLogin',            yaml: SCREEN_LOGIN },
  { name: 'Screen1',             yaml: SCREEN1 },
  { name: 'ScrAiChat',           yaml: AICHAT },
  { name: 'ScrItemFormCocina',   yaml: SCREEN_ITEM_FORM_CO },
  { name: 'ScrItemFormRecursos', yaml: SCREEN_ITEM_FORM_RE },
  { name: 'ScrReservas',         yaml: SCREEN_RESERVAS },
  { name: 'ScrItemFormReserva',  yaml: SCREEN_ITEM_FORM_RESERVA },
  { name: 'ScrPrestamos',        yaml: SCREEN_PRESTAMOS },
  { name: 'ScrItemFormPrestamo', yaml: SCREEN_ITEM_FORM_PRESTAMO },
  { name: 'ScrAlertas',          yaml: SCREEN_ALERTAS },
  { name: 'ScrReportes',         yaml: SCREEN_REPORTES },
  { name: 'ScrUsuarios',         yaml: SCREEN_USUARIOS },
  { name: 'ScrItemFormUsuario',  yaml: SCREEN_ITEM_FORM_USUARIO },
  { name: 'ScrAyuda',            yaml: SCREEN_AYUDA },
  { name: 'ScrCalendario',       yaml: SCREEN_CALENDARIO },
];

// ════════════════════════════════════════════════════════════════════════════
// BUILD STEPS
// ════════════════════════════════════════════════════════════════════════════

console.log('\n\u250C\u2500 buildV10.js \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

// ── Step 1: Copy studio_unpacked → v10_src ────────────────────────────────
console.log('\u2502 Step 1 \u2502 cpDir studio_unpacked \u2192 v10_src');
cpDir(ORIG, SRC);

// ── Step 2: Write App.fx.yaml ─────────────────────────────────────────────
console.log('\u2502 Step 2 \u2502 App.fx.yaml');
write(path.join(SRC, 'Src', 'App.fx.yaml'), APP_FX);

// ── Step 3: Write all generated screen YAML files ─────────────────────────
console.log('\u2502 Step 3 \u2502 Generated screen YAMLs');
for (const { name, yaml } of GENERATED_SCREENS) {
  write(path.join(SRC, 'Src', `${name}.fx.yaml`), yaml);
  process.stdout.write(`\u2502        \u2502   \u2714 ${name}\n`);
}

// ── Step 4: EditorState for generated form screens (no DataTable) ─────────
console.log('\u2502 Step 4 \u2502 EditorState \u2014 form screens');

// ScrItemFormReserva
{
  const ctrls = ['ScrItemFormReserva','RctHdrFRsv','RctBackFRsv','LblBackFRsv','LblTitleFRsv','RctAccentFRsv',
    'LblFFRsv0','TxtFRsvDocente','LblFFRsv1','TxtFRsvRecurso',
    'LblFFRsv2','TxtFRsvFecha',
    'LblBloqueTitFRsv',
    'RctBlk1FRsv','LblBlk1FRsv','RctBlk2FRsv','LblBlk2FRsv',
    'RctBlk3FRsv','LblBlk3FRsv','RctBlk4FRsv','LblBlk4FRsv',
    'RctBlk5FRsv','LblBlk5FRsv','RctBlk6FRsv','LblBlk6FRsv','RctBlk7FRsv','LblBlk7FRsv',
    'LblEstadoTitFRsv',
    'RctEstPendienteFRsv','LblEstPendienteFRsv',
    'RctEstAprobadaFRsv','LblEstAprobadaFRsv',
    'RctEstDenegadaFRsv','LblEstDenegadaFRsv',
    'LblNotasTitFRsv','TxtFRsvNotas',
    'RctWarnDmgFRsv','LblWarnDmgFRsv',
    'RctWarnFRsv','LblWarnFRsv',
    'RctSaveFRsv','LblSaveFRsv','RctDelFRsv','LblDelFRsv',
    'RctFDelOvlFRsv','RctFDelCardFRsv','LblFDelMsgFRsv',
    'RctFDelYesFRsv','LblFDelYesFRsv','RctFDelNoFRsv','LblFDelNoFRsv'];
  const styles = {
    ScrItemFormReserva:'defaultScreenStyle',
    TxtFRsvDocente:'defaultLabelStyle', TxtFRsvRecurso:'defaultLabelStyle',
    TxtFRsvFecha:'defaultLabelStyle', TxtFRsvNotas:'defaultLabelStyle',
  };
  const states = Object.fromEntries(ctrls.map(n => [n, se(n,
    styles[n] || (n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle')
  )]));
  write(path.join(SRC,'Src','EditorState','ScrItemFormReserva.editorstate.json'), mkEditorState('ScrItemFormReserva', states));
}

// ScrItemFormPrestamo
{
  const ctrls = ['ScrItemFormPrestamo','RctHdrFPst','RctBackFPst','LblBackFPst','LblTitleFPst','RctAccentFPst',
    'LblFFPst0','TxtFPstItem',
    'LblTipoTitFPst',
    'RctTipRetiroFPst','LblTipRetiroFPst',
    'RctTipDevolucionFPst','LblTipDevolucionFPst',
    'LblFFPst2','TxtFPstUsuario','LblFFPst3','TxtFPstFecha',
    'LblFFPst4','TxtFPstFechaFin',
    'LblNotasTitFPst','TxtFPstNotas',
    'RctSaveFPst','LblSaveFPst','RctDelFPst','LblDelFPst',
    'RctFDelOvlFPst','RctFDelCardFPst','LblFDelMsgFPst',
    'RctFDelYesFPst','LblFDelYesFPst','RctFDelNoFPst','LblFDelNoFPst'];
  const styles = {
    ScrItemFormPrestamo:'defaultScreenStyle',
    TxtFPstItem:'defaultLabelStyle', TxtFPstUsuario:'defaultLabelStyle',
    TxtFPstFecha:'defaultLabelStyle', TxtFPstFechaFin:'defaultLabelStyle',
    TxtFPstNotas:'defaultLabelStyle',
  };
  const states = Object.fromEntries(ctrls.map(n => [n, se(n,
    styles[n] || (n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle')
  )]));
  write(path.join(SRC,'Src','EditorState','ScrItemFormPrestamo.editorstate.json'), mkEditorState('ScrItemFormPrestamo', states));
}

// ScrItemFormUsuario
{
  const ctrls = ['ScrItemFormUsuario','RctHdrFUsr','RctBackFUsr','LblBackFUsr','LblTitleFUsr','RctAccentFUsr',
    'LblFFUsr0','TxtFUsrNombre','LblFFUsr1','TxtFUsrEmail',
    'LblRolTitFUsr',
    'RctRolSuperAdminFUsr','LblRolSuperAdminFUsr',
    'RctRolAdminFUsr','LblRolAdminFUsr',
    'RctRolDocenteFUsr','LblRolDocenteFUsr',
    'RctRolInvitadoFUsr','LblRolInvitadoFUsr',
    'LblActivoTitFUsr',
    'RctActActivoFUsr','LblActActivoFUsr',
    'RctActInactivoFUsr','LblActInactivoFUsr',
    'RctSaveFUsr','LblSaveFUsr','RctDelFUsr','LblDelFUsr',
    'RctFDelOvlFUsr','RctFDelCardFUsr','LblFDelMsgFUsr',
    'RctFDelYesFUsr','LblFDelYesFUsr','RctFDelNoFUsr','LblFDelNoFUsr'];
  const styles = {
    ScrItemFormUsuario:'defaultScreenStyle',
    TxtFUsrNombre:'defaultLabelStyle', TxtFUsrEmail:'defaultLabelStyle',
  };
  const states = Object.fromEntries(ctrls.map(n => [n, se(n,
    styles[n] || (n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle')
  )]));
  write(path.join(SRC,'Src','EditorState','ScrItemFormUsuario.editorstate.json'), mkEditorState('ScrItemFormUsuario', states));
}

// ── Step 4.5: ScrReservas EditorState (DataTable3 + prefixed columns + filters + batch) ─────
console.log('\u2502 Step 4.5 \u2502 EditorState ScrReservas');
{
  const simpleCtrl = ['ScrReservas','RctHdrRsv','RctBackRsv','LblBackRsv','LblTitleRsv','RctAccentRsv',
    'RctCalRsv','LblCalRsv','RctBatchApvRsv','LblBatchApvRsv','RctBatchDnyRsv','LblBatchDnyRsv',
    'RctFltTodosRsv','LblFltTodosRsv','RctFltPendienteRsv','LblFltPendienteRsv',
    'RctFltAprobadaRsv','LblFltAprobadaRsv','RctFltDenegadaRsv','LblFltDenegadaRsv',
    'RctFabRsv','LblFabRsv',
    'RctActBarRsv','LblActNameRsv','RctEditBtnRsv','LblEditBtnRsv',
    'RctDelBtnRsv','LblDelBtnRsv',
    'RctDelOvlRsv','RctDelCardRsv','LblDelMsgRsv',
    'RctDelYesRsv','LblDelYesRsv','RctDelNoRsv','LblDelNoRsv',
    'RctFabActRsv','RctFabMaskRsv'];
  const states = Object.fromEntries(simpleCtrl.map(n => [n, se(n,
    n === 'ScrReservas' ? 'defaultScreenStyle' :
    n.startsWith('Lbl') ? 'defaultLabelStyle' : 'defaultRectangleStyle'
  )]));
  states['DataTable3'] = makeDataTableEditorEntry('DataTable3', 3);
  RESERVAS_COLS.forEach((col, i) => {
    const ctrlName = `DataTable3_${toAsciiId(col.field)}_Columna${i + 1}`;
    states[ctrlName] = makeColEditorEntry(ctrlName, i);
  });
  write(path.join(SRC,'Src','EditorState','ScrReservas.editorstate.json'), mkEditorState('ScrReservas', states));
}

// ── Step 4.6: ScrPrestamos EditorState (DataTable4 + prefixed columns + filters) ────
console.log('\u2502 Step 4.6 \u2502 EditorState ScrPrestamos');
{
  const simpleCtrl = ['ScrPrestamos','RctHdrPst','RctBackPst','LblBackPst','LblTitlePst','RctAccentPst',
    'RctFltTodosPst','LblFltTodosPst','RctFltActivoPst','LblFltActivoPst',
    'RctFltDevueltoPst','LblFltDevueltoPst',
    'RctFabPst','LblFabPst',
    'RctActBarPst','LblActNamePst','RctEditBtnPst','LblEditBtnPst',
    'RctDelBtnPst','LblDelBtnPst',
    'RctDelOvlPst','RctDelCardPst','LblDelMsgPst',
    'RctDelYesPst','LblDelYesPst','RctDelNoPst','LblDelNoPst',
    'RctFabActPst','RctFabMaskPst'];
  const states = Object.fromEntries(simpleCtrl.map(n => [n, se(n,
    n === 'ScrPrestamos' ? 'defaultScreenStyle' :
    n.startsWith('Lbl') ? 'defaultLabelStyle' : 'defaultRectangleStyle'
  )]));
  states['DataTable4'] = makeDataTableEditorEntry('DataTable4', 4);
  PRESTAMOS_COLS.forEach((col, i) => {
    const ctrlName = `DataTable4_${toAsciiId(col.field)}_Columna${i + 1}`;
    states[ctrlName] = makeColEditorEntry(ctrlName, i);
  });
  write(path.join(SRC,'Src','EditorState','ScrPrestamos.editorstate.json'), mkEditorState('ScrPrestamos', states));
}

// ── Step 4.7: ScrUsuarios EditorState (DataTable5 + prefixed columns) ─────
console.log('\u2502 Step 4.7 \u2502 EditorState ScrUsuarios (new DataTable5 version)');
{
  const simpleCtrl = ['ScrUsuarios','RctHdrUsr','RctBackUsr','LblBackUsr','LblTitleUsr','RctAccentUsr',
    'RctNoAccUsr','LblNoAccUsr','TxtSearchUsr','LblSearchIcoUsr',
    'RctFabUsr','LblFabUsr',
    'RctActBarUsr','LblActNameUsr','RctEditBtnUsr','LblEditBtnUsr',
    'RctDelBtnUsr','LblDelBtnUsr',
    'RctDelOvlUsr','RctDelCardUsr','LblDelMsgUsr',
    'RctDelYesUsr','LblDelYesUsr','RctDelNoUsr','LblDelNoUsr',
    'RctFabActUsr','RctFabMaskUsr'];
  const states = Object.fromEntries(simpleCtrl.map(n => [n, se(n,
    n === 'ScrUsuarios' ? 'defaultScreenStyle' :
    n === 'TxtSearchUsr' ? 'defaultLabelStyle' :
    n.startsWith('Lbl') ? 'defaultLabelStyle' : 'defaultRectangleStyle'
  )]));
  states['DataTable5'] = makeDataTableEditorEntry('DataTable5', 8);
  USUARIOS_COLS.forEach((col, i) => {
    const ctrlName = `DataTable5_${toAsciiId(col.field)}_Columna${i + 1}`;
    states[ctrlName] = makeColEditorEntry(ctrlName, i);
  });
  write(path.join(SRC,'Src','EditorState','ScrUsuarios.editorstate.json'), mkEditorState('ScrUsuarios', states));
}

// ── Step 4.8: ScrAlertas EditorState (DataTable6 + prefixed columns) ──────
console.log('\u2502 Step 4.8 \u2502 EditorState ScrAlertas');
{
  const simpleCtrl = ['ScrAlertas','RctHdrAlt','RctBackAlt','LblBackAlt','LblTitleAlt','RctAccentAlt',
    'RctVenAlt','LblNVenAlt','LblLVenAlt',
    'RctHoyAlt','LblNHoyAlt','LblLHoyAlt',
    'RctOkAlt', 'LblNOkAlt', 'LblLOkAlt'];
  const states = Object.fromEntries(simpleCtrl.map(n => [n, se(n,
    n === 'ScrAlertas' ? 'defaultScreenStyle' :
    n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle'
  )]));
  states['DataTable6'] = makeDataTableEditorEntry('DataTable6', 6);
  ALERTAS_COLS.forEach((col, i) => {
    const ctrlName = `DataTable6_${toAsciiId(col.field)}_Columna${i + 1}`;
    states[ctrlName] = makeColEditorEntry(ctrlName, i);
  });
  write(path.join(SRC,'Src','EditorState','ScrAlertas.editorstate.json'), mkEditorState('ScrAlertas', states));
}

// ── Step 4.9: ScrReportes EditorState (4 DataTables + prefixed columns) ───
console.log('\u2502 Step 4.9 \u2502 EditorState ScrReportes');
{
  const simpleCtrl = ['ScrReportes','RctHdrRpt','RctBackRpt','LblBackRpt','LblTitleRpt','RctAccentRpt',
    'RctPSemRpt','LblPSemRpt','RctPMesRpt','LblPMesRpt','RctPAnoRpt','LblPAnoRpt',
    'RctT1Rpt','LblT1Rpt','RctT2Rpt','LblT2Rpt',
    'RctT3Rpt','LblT3Rpt','RctT4Rpt','LblT4Rpt'];
  const states = Object.fromEntries(simpleCtrl.map(n => [n, se(n,
    n === 'ScrReportes' ? 'defaultScreenStyle' :
    n === 'ScrReportes' ? 'defaultScreenStyle' :
    n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle'
  )]));
  [
    { dt: 'DataTableRpt1', cols: RPT1_COLS, idx: 7 },
    { dt: 'DataTableRpt2', cols: RPT2_COLS, idx: 8 },
    { dt: 'DataTableRpt3', cols: RPT3_COLS, idx: 9 },
    { dt: 'DataTableRpt4', cols: RPT4_COLS, idx: 10 },
  ].forEach(({ dt, cols, idx }) => {
    states[dt] = makeDataTableEditorEntry(dt, idx);
    cols.forEach((col, i) => {
      const ctrlName = `${dt}_${toAsciiId(col.field)}_Columna${i + 1}`;
      states[ctrlName] = makeColEditorEntry(ctrlName, i);
    });
  });
  write(path.join(SRC,'Src','EditorState','ScrReportes.editorstate.json'), mkEditorState('ScrReportes', states));
}

// ── Step 4.10: ScrAyuda EditorState (simple labels) ───────────────────────
console.log('\u2502 Step 4.10\u2502 EditorState ScrAyuda');
{
  const ctrls = ['ScrAyuda','RctHdrAyu','RctBackAyu','LblBackAyu','LblTitleAyu','RctAccentAyu',
    'RctHelpCard','LblHelpDocente','LblHelpAdmin'];
  const states = Object.fromEntries(ctrls.map(n => [n, se(n,
    n === 'ScrAyuda' ? 'defaultScreenStyle' :
    n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle'
  )]));
  write(path.join(SRC,'Src','EditorState','ScrAyuda.editorstate.json'), mkEditorState('ScrAyuda', states));
}

// ── Step 4.10a: ScrAiChat EditorState (functional chat controls) ──────────
console.log('\u2502 Step 4.10a\u2502 EditorState ScrAiChat');
{
  const ctrls = ['ScrAiChat','RctHdrChat','RctBackChat','LblBackChat','LblTitleChat','RctAccentChat',
    'RctChatBg','LblChatHistory','RctInputBar','TxtChatInput','RctSendBtn','LblSendIcon'];
  const states = Object.fromEntries(ctrls.map(n => [n, se(n,
    n === 'ScrAiChat' ? 'defaultScreenStyle' :
    n === 'TxtChatInput' ? 'defaultLabelStyle' :
    n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle'
  )]));
  write(path.join(SRC,'Src','EditorState','ScrAiChat.editorstate.json'), mkEditorState('ScrAiChat', states));
}

// ── Step 4.10b: ScrCalendario EditorState ─────────────────────────────────
console.log('\u2502 Step 4.10b\u2502 EditorState ScrCalendario');
{
  const ctrls = ['ScrCalendario','RctHdrCal','RctBackCal','LblBackCal','LblTitleCal','RctAccentCal',
    'RctNavPrevCal','LblNavPrevCal','LblWeekCal','RctNavNextCal','LblNavNextCal',
    'LblDay0Cal','LblDay1Cal','LblDay2Cal','LblDay3Cal','LblDay4Cal','LblDay5Cal','LblDay6Cal',
    'RctCol0Cal','LblDate0Cal','LblCnt0Cal',
    'RctCol1Cal','LblDate1Cal','LblCnt1Cal',
    'RctCol2Cal','LblDate2Cal','LblCnt2Cal',
    'RctCol3Cal','LblDate3Cal','LblCnt3Cal',
    'RctCol4Cal','LblDate4Cal','LblCnt4Cal',
    'RctCol5Cal','LblDate5Cal','LblCnt5Cal',
    'RctCol6Cal','LblDate6Cal','LblCnt6Cal'];
  const states = Object.fromEntries(ctrls.map(n => [n, se(n,
    n === 'ScrCalendario' ? 'defaultScreenStyle' :
    n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle'
  )]));
  write(path.join(SRC,'Src','EditorState','ScrCalendario.editorstate.json'), mkEditorState('ScrCalendario', states));
}

// ── Step 4.11: Patch Screen1 EditorState (add help button + loan reminder + stats bar controls) ───────
console.log('\u2502 Step 4.11\u2502 Patch Screen1 EditorState (help + loan reminder + stats)');
{
  const s1EsPath = path.join(SRC,'Src','EditorState','Screen1.editorstate.json');
  const es = JSON.parse(fs.readFileSync(s1EsPath,'utf8'));
  const newCtrls = ['RctRolBadgeS1','RctHelpBtnS1','LblHelpBtnS1','RctLoanRemS1','LblLoanRemTxtS1','LblLoanRemBtnS1',
    'RctStatsBarBgS1','RctStatsPendS1','RctStatsAprvS1','LblStatsLegendS1'];
  for (const n of newCtrls) {
    es.ControlStates[n] = se(n, n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle');
  }
  write(s1EsPath, JSON.stringify(es, null, 2));
}

// Helper to add Y property to header controls in studio_unpacked screens
function patchHeaderY(yaml, screenName) {
  // Add Y: =0 to header rect, title, and back button; Y: =72 to accent
  // Only adds Y if not already present in the control block
  let result = yaml;

  // Helper to add Y to a control if it doesn't already have one
  const addYIfMissing = (content, ctrlName, ctrlType, yVal) => {
    // Match control block: from control definition until next top-level control or end of file
    const ctrlRegex = new RegExp(`(    ${ctrlName} As ${ctrlType}[^\n]*:[\\s\\S]*?)(?=\\n    [A-Za-z]|$)`, 'g');
    return content.replace(ctrlRegex, (match) => {
      // Check if Y property already exists in this control block
      if (/\n        Y: =/.test(match)) {
        // Replace existing Y value
        return match.replace(/(\n        Y: =)[^\n]+/, `$1${yVal}`);
      } else {
        // Find the last property line and add Y after it
        const lines = match.split('\n');
        const lastPropIdx = lines.reduce((acc, line, i) => {
          if (/^        [A-Z][a-zA-Z]+: =/.test(line)) return i;
          return acc;
        }, -1);
        if (lastPropIdx >= 0) {
          lines.splice(lastPropIdx + 1, 0, `        Y: =${yVal}`);
        }
        return lines.join('\n');
      }
    });
  };

  result = addYIfMissing(result, `RctHdr${screenName}`, 'rectangle', '0');
  result = addYIfMissing(result, `LblTitle${screenName}`, 'label', '0');
  result = addYIfMissing(result, `LblBack${screenName}`, 'label', '0');
  result = addYIfMissing(result, `RctAccent${screenName}`, 'rectangle', '72');

  return result;
}

// Helpers to build a live TextInput search YAML block for studio screens
function makeSearchInputYaml(ctrlName, y, h=38) {
  return [
    `    ${ctrlName} As text.TextInput:`,
    `        Default: =""`,
    `        Fill: =${C.white}`,
    `        BorderColor: =${C.border}`,
    `        BorderThickness: =1`,
    `        Height: =${h}`,
    `        HintText: ="Buscar por nombre..."`,
    `        Mode: =TextMode.SingleLine`,
    `        PaddingLeft: =42`,
    `        PaddingRight: =10`,
    `        Width: =Parent.Width - 40`,
    `        X: =20`,
    `        Y: =${y}`,
    `        ZIndex: =10`,
  ].join('\n');
}

// ── Step 5: Patch ScrCocina — strip old action bar, add fresh one ─────────
console.log('\u2502 Step 5 \u2502 Patch ScrCocina (action bar)');
{
  const coPath = path.join(SRC,'Src','ScrCocina.fx.yaml');
  let coYaml   = fs.readFileSync(coPath,'utf8');
  const stripCo = ['RctDelOvlCo','RctDelCardCo','LblDelMsgCo','RctDelYesCo','LblDelYesCo',
    'RctDelNoCo','LblDelNoCo','RctFabMaskCo','RctFabActCo',
    'RctActBarCo','LblActNameCo','RctEditBtnCo','LblEditBtnCo',
    'RctDelBtnCo','LblDelBtnCo',
    'LblSearchHintScrCocina'];  // remove decorative hint label — replace with real TextInput
  coYaml = stripControls(coYaml, stripCo);
  // Patch DataTable1 Items to use live search
  coYaml = coYaml.replace(
    /(\s+Items: =)Tabla2/,
    `$1If(IsBlank(TxtSearchCo.Text),Tabla2,Search(Tabla2,TxtSearchCo.Text,"Elemento","Observaciones"))`
  );
  coYaml = patchHeaderY(coYaml, 'ScrCocina');
  // Inject real search TextInput before action bar
  const searchInputCo = makeSearchInputYaml('TxtSearchCo', SRCH_Y);
  coYaml = coYaml.trimEnd() + '\n\n' + searchInputCo + '\n\n' +
    makeActionBarYaml('DataTable1','Elemento','Tabla2','ScrItemFormCocina','Co',false) + '\n';
  write(coPath, coYaml);

  // Patch EditorState columns (plain names for studio screens)
  const coEsPath = path.join(SRC,'Src','EditorState','ScrCocina.editorstate.json');
  const newCoES  = patchEditorStateColumns(
    fs.readFileSync(coEsPath,'utf8'),
    COCINA_COLS,
    {
      ...Object.fromEntries(stripCo.map(n => [n, se(n, n.startsWith('Lbl') ? 'defaultLabelStyle' : 'defaultRectangleStyle')])),
      TxtSearchCo: se('TxtSearchCo','defaultLabelStyle'),
    }
  );
  write(coEsPath, newCoES);
}

// ── Step 6: Patch ScrRecursos — strip old action bar, add fresh one ───────
console.log('\u2502 Step 6 \u2502 Patch ScrRecursos (action bar)');
{
  const rePath = path.join(SRC,'Src','ScrRecursos.fx.yaml');
  let reYaml   = fs.readFileSync(rePath,'utf8');
  const stripRe = ['RctDelOvlRe','RctDelCardRe','LblDelMsgRe','RctDelYesRe','LblDelYesRe',
    'RctDelNoRe','LblDelNoRe','RctFabMaskRe','RctFabActRe',
    'RctActBarRe','LblActNameRe','RctEditBtnRe','LblEditBtnRe',
    'RctDelBtnRe','LblDelBtnRe',
    'LblSearchHintScrRecursos'];  // remove decorative hint label
  reYaml = stripControls(reYaml, stripRe);
  // Patch DataTable2 Items to use live search
  reYaml = reYaml.replace(
    /(\s+Items: =)Tabla1/,
    `$1If(IsBlank(TxtSearchRe.Text),Tabla1,Search(Tabla1,TxtSearchRe.Text,"Juegos","Descripci\u00f3n","Categoria"))`
  );
  reYaml = patchHeaderY(reYaml, 'ScrRecursos');
  const searchInputRe = makeSearchInputYaml('TxtSearchRe', SRCH_Y);
  reYaml = reYaml.trimEnd() + '\n\n' + searchInputRe + '\n\n' +
    makeActionBarYaml('DataTable2','Juegos','Tabla1','ScrItemFormRecursos','Re',false) + '\n';
  write(rePath, reYaml);

  // Patch EditorState columns (plain names for studio screens)
  const reEsPath = path.join(SRC,'Src','EditorState','ScrRecursos.editorstate.json');
  const newReES  = patchEditorStateColumns(
    fs.readFileSync(reEsPath,'utf8'),
    RECURSOS_COLS,
    {
      ...Object.fromEntries(stripRe.map(n => [n, se(n, n.startsWith('Lbl') ? 'defaultLabelStyle' : 'defaultRectangleStyle')])),
      TxtSearchRe: se('TxtSearchRe','defaultLabelStyle'),
    }
  );
  write(reEsPath, newReES);
}

// ── Step 7: Update CanvasManifest.json screen order ───────────────────────
console.log('\u2502 Step 7 \u2502 CanvasManifest.json ScreenOrder');
updateManifest(path.join(SRC,'CanvasManifest.json'), [
  'ScrLogin','Screen1','ScrCocina','ScrRecursos',
  'ScrItemFormCocina','ScrItemFormRecursos',
  'ScrReservas','ScrItemFormReserva',
  'ScrPrestamos','ScrItemFormPrestamo',
  'ScrAlertas','ScrReportes',
  'ScrUsuarios','ScrItemFormUsuario',
  'ScrAiChat','ScrAyuda','ScrCalendario',
]);

// ── Step 8: pac canvas pack ───────────────────────────────────────────────
console.log('\u2502 Step 8 \u2502 pac canvas pack');
try {
  const result = execSync(
    `"${PAC}" canvas pack --sources "${SRC}" --msapp "${OUT}"`,
    { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
  );
  console.log(result.trim().split('\n').map(l => '\u2502        \u2502 ' + l).join('\n'));
} catch (err) {
  const out = ((err.stdout || '') + '\n' + (err.stderr || '')).trim();
  console.error('\u2514\u2500 ERROR:\n' + out);
  process.exit(1);
}
console.log('\u2514\u2500 Done \u2500 ' + OUT + '\n');
