
// ════════════════════════════════════════════════════════════════════════════
// SCREEN_RESERVAS — DataTable list for Tabla4 (Reservas)
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_RESERVAS = (() => {
  const suf = 'Rsv';
  const dtYaml   = makeDataTableYaml('DataTable3','Tabla4', 75, RESERVAS_COLS, 80);
  const actionBar = makeActionBarYaml('DataTable3','Docente','Tabla4','ScrItemFormReserva', suf, true);
  return `"ScrReservas As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None

${rect('RctHdrRsv',   { X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${lbl('LblBackRsv',   { X:4,Y:0,Width:52,Height:HDR,Fill:C.transparent,Text:'"\u2190"',Color:C.white,Size:26,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblTitleRsv',  { X:58,Y:0,Width:'Parent.Width-68',Height:HDR,Fill:C.transparent,Text:'"Reservas del Laboratorio"',Color:C.white,Size:17,FontWeight:'FontWeight.Bold',Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle' })}
${rect('RctAccentRsv',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}

${dtYaml}

${rect('RctFabRsv',{
  X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:28,RadiusTopRight:28,RadiusBottomLeft:28,RadiusBottomRight:28,
})}
${lbl('LblFabRsv',{
  X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
  Fill:C.transparent, Text:'"+"', Color:C.white, Size:28,
  FontWeight:'FontWeight.Bold', Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  DisplayMode:'DisplayMode.View',
})}

${actionBar}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_ITEM_FORM_RESERVA — Add/Edit form for Reservas (Tabla4)
// Fields: Docente, Recurso, FechaInicio, FechaFin + Estado radio + conflict warning
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_ITEM_FORM_RESERVA = (() => {
  const suf      = 'FRsv';
  const ESTADO_Y = HDR + ACCENT + 12 + 4 * (22 + 44 + 14); // 407
  const WARN_Y   = ESTADO_Y + 26 + 40 + 10;                 // 483
  const SAVE_Y   = WARN_Y + 44 + 12;                        // 539
  const DEL_Y    = SAVE_Y + BTN_H + 12;                     // 595
  const W3       = '(Parent.Width - 56) / 3';

  const patchFormula =
    `Patch(Tabla4,If(IsBlank(gItemEdit),Defaults(Tabla4),gItemEdit),` +
    `{Docente:TxtFRsvDocente.Text,Recurso:TxtFRsvRecurso.Text,` +
    `FechaInicio:TxtFRsvFechaInicio.Text,FechaFin:TxtFRsvFechaFin.Text,` +
    `Estado:gEstadoReserva,Aprobado:If(gEstadoReserva="Aprobada","TRUE","FALSE")});` +
    `Set(gItemEdit,Blank());Navigate(ScrReservas,ScreenTransition.None)`;

  const estados = ['Pendiente','Aprobada','Denegada'];

  return `"ScrItemFormReserva As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None
    OnVisible: =Set(gEstadoReserva,If(IsBlank(gItemEdit),"Pendiente",If(IsBlank(gItemEdit.Estado),"Pendiente",gItemEdit.Estado)))

${makeFormHeader(suf, 'ScrReservas', 'If(IsBlank(gItemEdit),"Nueva reserva","Editar reserva")')}

${makeFieldBlock(suf, 0, '"Docente *"',              'TxtFRsvDocente',     'If(IsBlank(gItemEdit),User().FullName,gItemEdit.Docente)')}

${makeFieldBlock(suf, 1, '"Recurso *"',              'TxtFRsvRecurso',     _EF('Recurso'))}

${makeFieldBlock(suf, 2, '"Fecha inicio (AAAA-MM-DD)"', 'TxtFRsvFechaInicio', _EF('FechaInicio'))}

${makeFieldBlock(suf, 3, '"Fecha fin (AAAA-MM-DD)"',   'TxtFRsvFechaFin',    _EF('FechaFin'))}

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

${rect(`RctWarn${suf}`,{
  X:20, Y:WARN_Y, Width:'Parent.Width-40', Height:44,
  Fill:C.yellowLight, BorderColor:C.yellow, BorderThickness:1,
  RadiusTopLeft:6,RadiusTopRight:6,RadiusBottomLeft:6,RadiusBottomRight:6,
  Visible:`Len(TxtFRsvRecurso.Text)>0 && CountIf(Tabla4,Recurso=TxtFRsvRecurso.Text && Estado="Aprobada")>0`,
})}
${lbl(`LblWarn${suf}`,{
  X:32, Y:WARN_Y, Width:'Parent.Width-64', Height:44,
  Fill:C.transparent,
  Text:`If(Len(TxtFRsvRecurso.Text)>0 && CountIf(Tabla4,Recurso=TxtFRsvRecurso.Text && Estado="Aprobada")>0,"\u26A0  Este recurso tiene reservas aprobadas. Confirme disponibilidad.","")`,
  Color:C.yellowDark, Size:11, FontWeight:'FontWeight.Semibold',
  VerticalAlign:'VerticalAlign.Middle',
  Visible:`Len(TxtFRsvRecurso.Text)>0 && CountIf(Tabla4,Recurso=TxtFRsvRecurso.Text && Estado="Aprobada")>0`,
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
  Visible:`gRol="SuperAdmin" && !IsBlank(gItemEdit)`,
})}
${lbl(`LblDel${suf}`,{
  X:20, Y:DEL_Y, Width:'Parent.Width-40', Height:BTN_H,
  Fill:C.transparent, Text:'"Eliminar reserva"',
  Color:C.yellow, Size:14, FontWeight:'FontWeight.Semibold',
  Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  OnSelect:`Set(gConfirmDel,true)`,
  Visible:`gRol="SuperAdmin" && !IsBlank(gItemEdit)`,
})}

${makeFormDeleteOverlay(suf,'Tabla4','ScrReservas')}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_PRESTAMOS — DataTable list for Tabla5 (Préstamos/Retiros)
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_PRESTAMOS = (() => {
  const suf = 'Pst';
  const dtYaml   = makeDataTableYaml('DataTable4','Tabla5', 75, PRESTAMOS_COLS, 80);
  const actionBar = makeActionBarYaml('DataTable4','Item','Tabla5','ScrItemFormPrestamo', suf, true);
  return `"ScrPrestamos As screen":
    Fill: =${C.canvas}
    LoadingSpinner: =LoadingSpinner.None

${rect('RctHdrPst',   { X:0,Y:0,Width:'Parent.Width',Height:HDR,Fill:C.navy,BorderThickness:0 })}
${lbl('LblBackPst',   { X:4,Y:0,Width:52,Height:HDR,Fill:C.transparent,Text:'"\u2190"',Color:C.white,Size:26,Align:'Align.Center',VerticalAlign:'VerticalAlign.Middle',OnSelect:'Navigate(Screen1,ScreenTransition.Slide)' })}
${lbl('LblTitlePst',  { X:58,Y:0,Width:'Parent.Width-68',Height:HDR,Fill:C.transparent,Text:'"Pr\u00e9stamos y Retiros"',Color:C.white,Size:17,FontWeight:'FontWeight.Bold',Align:'Align.Left',VerticalAlign:'VerticalAlign.Middle' })}
${rect('RctAccentPst',{ X:0,Y:HDR,Width:'Parent.Width',Height:ACCENT,Fill:C.yellow,BorderThickness:0 })}

${dtYaml}

${rect('RctFabPst',{
  X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
  Fill:C.blue, BorderThickness:0,
  RadiusTopLeft:28,RadiusTopRight:28,RadiusBottomLeft:28,RadiusBottomRight:28,
})}
${lbl('LblFabPst',{
  X:'Parent.Width - 76', Y:'Parent.Height - 76', Width:56, Height:56,
  Fill:C.transparent, Text:'"+"', Color:C.white, Size:28,
  FontWeight:'FontWeight.Bold', Align:'Align.Center', VerticalAlign:'VerticalAlign.Middle',
  DisplayMode:'DisplayMode.View',
})}

${actionBar}
`;
})();

// ════════════════════════════════════════════════════════════════════════════
// SCREEN_ITEM_FORM_PRESTAMO — Add/Edit form for Préstamos/Retiros (Tabla5)
// Fields: Item, Tipo radio (Retiro/Devolución), Usuario, Fecha
// ════════════════════════════════════════════════════════════════════════════
const SCREEN_ITEM_FORM_PRESTAMO = (() => {
  const suf      = 'FPst';
  const TIPO_Y   = HDR + ACCENT + 12 + 1 * (22 + 44 + 14); // 167 (slot for field 1)
  const SAVE_Y   = HDR + ACCENT + 12 + 4 * (22 + 44 + 14); // 407
  const DEL_Y    = SAVE_Y + BTN_H + 12;                     // 463
  const W2       = '(Parent.Width - 48) / 2';

  const patchFormula =
    `Patch(Tabla5,If(IsBlank(gItemEdit),Defaults(Tabla5),gItemEdit),` +
    `{Item:TxtFPstItem.Text,Tipo:gTipoPrestamo,Usuario:TxtFPstUsuario.Text,` +
    `Fecha:TxtFPstFecha.Text,Estado:If(gTipoPrestamo="Devoluci\u00f3n","Devuelto","Activo")});` +
    `Set(gItemEdit,Blank());Navigate(ScrPrestamos,ScreenTransition.None)`;

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

${makeFieldBlock(suf, 3, '"Fecha (AAAA-MM-DD)"', 'TxtFPstFecha', 'If(IsBlank(gItemEdit),Text(Today(),"YYYY-MM-DD"),gItemEdit.Fecha)')}

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
  { name: 'ScrUsuarios',         yaml: SCREEN_USUARIOS },
  { name: 'ScrItemFormUsuario',  yaml: SCREEN_ITEM_FORM_USUARIO },
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
  const ctrls = ['ScrItemFormReserva','RctHdrFRsv','LblBackFRsv','LblTitleFRsv','RctAccentFRsv',
    'LblFFRsv0','TxtFRsvDocente','LblFFRsv1','TxtFRsvRecurso',
    'LblFFRsv2','TxtFRsvFechaInicio','LblFFRsv3','TxtFRsvFechaFin',
    'LblEstadoTitFRsv',
    'RctEstPendienteFRsv','LblEstPendienteFRsv',
    'RctEstAprobadaFRsv','LblEstAprobadaFRsv',
    'RctEstDenegadaFRsv','LblEstDenegadaFRsv',
    'RctWarnFRsv','LblWarnFRsv',
    'RctSaveFRsv','LblSaveFRsv','RctDelFRsv','LblDelFRsv',
    'RctFDelOvlFRsv','RctFDelCardFRsv','LblFDelMsgFRsv',
    'RctFDelYesFRsv','LblFDelYesFRsv','RctFDelNoFRsv','LblFDelNoFRsv'];
  const styles = {
    ScrItemFormReserva:'defaultScreenStyle',
    TxtFRsvDocente:'defaultLabelStyle', TxtFRsvRecurso:'defaultLabelStyle',
    TxtFRsvFechaInicio:'defaultLabelStyle', TxtFRsvFechaFin:'defaultLabelStyle',
  };
  const states = Object.fromEntries(ctrls.map(n => [n, se(n,
    styles[n] || (n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle')
  )]));
  write(path.join(SRC,'Src','EditorState','ScrItemFormReserva.editorstate.json'), mkEditorState('ScrItemFormReserva', states));
}

// ScrItemFormPrestamo
{
  const ctrls = ['ScrItemFormPrestamo','RctHdrFPst','LblBackFPst','LblTitleFPst','RctAccentFPst',
    'LblFFPst0','TxtFPstItem',
    'LblTipoTitFPst',
    'RctTipRetiroFPst','LblTipRetiroFPst',
    'RctTipDevolucionFPst','LblTipDevolucionFPst',
    'LblFFPst2','TxtFPstUsuario','LblFFPst3','TxtFPstFecha',
    'RctSaveFPst','LblSaveFPst','RctDelFPst','LblDelFPst',
    'RctFDelOvlFPst','RctFDelCardFPst','LblFDelMsgFPst',
    'RctFDelYesFPst','LblFDelYesFPst','RctFDelNoFPst','LblFDelNoFPst'];
  const styles = {
    ScrItemFormPrestamo:'defaultScreenStyle',
    TxtFPstItem:'defaultLabelStyle', TxtFPstUsuario:'defaultLabelStyle',
    TxtFPstFecha:'defaultLabelStyle',
  };
  const states = Object.fromEntries(ctrls.map(n => [n, se(n,
    styles[n] || (n.startsWith('Rct') ? 'defaultRectangleStyle' : 'defaultLabelStyle')
  )]));
  write(path.join(SRC,'Src','EditorState','ScrItemFormPrestamo.editorstate.json'), mkEditorState('ScrItemFormPrestamo', states));
}

// ScrItemFormUsuario
{
  const ctrls = ['ScrItemFormUsuario','RctHdrFUsr','LblBackFUsr','LblTitleFUsr','RctAccentFUsr',
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

// ── Step 4.5: ScrReservas EditorState (DataTable3 + prefixed columns) ─────
console.log('\u2502 Step 4.5 \u2502 EditorState ScrReservas');
{
  const simpleCtrl = ['ScrReservas','RctHdrRsv','LblBackRsv','LblTitleRsv','RctAccentRsv',
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

// ── Step 4.6: ScrPrestamos EditorState (DataTable4 + prefixed columns) ────
console.log('\u2502 Step 4.6 \u2502 EditorState ScrPrestamos');
{
  const simpleCtrl = ['ScrPrestamos','RctHdrPst','LblBackPst','LblTitlePst','RctAccentPst',
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
  const simpleCtrl = ['ScrUsuarios','RctHdrUsr','LblBackUsr','LblTitleUsr','RctAccentUsr',
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

// ── Step 5: Patch ScrCocina — strip old action bar, add fresh one ─────────
console.log('\u2502 Step 5 \u2502 Patch ScrCocina (action bar)');
{
  const coPath = path.join(SRC,'Src','ScrCocina.fx.yaml');
  let coYaml   = fs.readFileSync(coPath,'utf8');
  const stripCo = ['RctDelOvlCo','RctDelCardCo','LblDelMsgCo','RctDelYesCo','LblDelYesCo',
    'RctDelNoCo','LblDelNoCo','RctFabMaskCo','RctFabActCo',
    'RctActBarCo','LblActNameCo','RctEditBtnCo','LblEditBtnCo',
    'RctDelBtnCo','LblDelBtnCo'];
  coYaml = stripControls(coYaml, stripCo);
  coYaml = coYaml.trimEnd() + '\n\n' +
    makeActionBarYaml('DataTable1','Elemento','Tabla2','ScrItemFormCocina','Co',false) + '\n';
  write(coPath, coYaml);

  // Patch EditorState columns (plain names for studio screens)
  const coEsPath = path.join(SRC,'Src','EditorState','ScrCocina.editorstate.json');
  const newCoES  = patchEditorStateColumns(
    fs.readFileSync(coEsPath,'utf8'),
    COCINA_COLS,
    Object.fromEntries(stripCo.map(n => [n, se(n, n.startsWith('Lbl') ? 'defaultLabelStyle' : 'defaultRectangleStyle')]))
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
    'RctDelBtnRe','LblDelBtnRe'];
  reYaml = stripControls(reYaml, stripRe);
  reYaml = reYaml.trimEnd() + '\n\n' +
    makeActionBarYaml('DataTable2','Juegos','Tabla1','ScrItemFormRecursos','Re',false) + '\n';
  write(rePath, reYaml);

  // Patch EditorState columns (plain names for studio screens)
  const reEsPath = path.join(SRC,'Src','EditorState','ScrRecursos.editorstate.json');
  const newReES  = patchEditorStateColumns(
    fs.readFileSync(reEsPath,'utf8'),
    RECURSOS_COLS,
    Object.fromEntries(stripRe.map(n => [n, se(n, n.startsWith('Lbl') ? 'defaultLabelStyle' : 'defaultRectangleStyle')]))
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
  'ScrUsuarios','ScrItemFormUsuario',
  'ScrAiChat',
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
