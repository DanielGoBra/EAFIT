import * as React from "react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isSameDay, getDay, isToday, parseISO
} from "date-fns";
import { es } from "date-fns/locale";
import { LOGO_EAFIT } from "./logo";

// ── Design Tokens (espejo de AppTheme Flutter) ─────────────────────────────────
const T = {
  blue:         "#1A5CA8",
  blueDark:     "#0F3D73",
  blueLight:    "#2E7BC4",
  blueTint:     "#EBF3FF",
  yellow:       "#F7B500",
  yellowDark:   "#CC9600",
  yellowTint:   "#FFF8E1",
  canvas:       "#EEF4FC",
  surface:      "#FFFFFF",
  surfaceElev:  "#E4EEF9",
  txtPrimary:   "#0F3D73",
  txtBody:      "#1A2742",
  txtSecond:    "#6B7080",
  txtTertiary:  "#9BA3AF",
  border:       "#E2E8F0",
  borderStrong: "#CBD5E1",
  font:         "'Montserrat','Segoe UI',sans-serif",
  shadow:       "0 4px 18px rgba(26,92,168,0.07),0 2px 7px rgba(26,92,168,0.05),0 1px 3px rgba(26,92,168,0.03)",
  shadowMd:     "0 8px 32px rgba(26,92,168,0.11),0 3px 10px rgba(26,92,168,0.07),0 1px 3px rgba(26,92,168,0.04)",
};

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Bloque = { id: string; label: string; inicio: string; fin: string };

const BLOQUES_LV: Bloque[] = [
  { id: "LV_0600_0800", label: "6:00 – 8:00 am",   inicio: "06:00", fin: "08:00" },
  { id: "LV_0800_1000", label: "8:00 – 10:00 am",  inicio: "08:00", fin: "10:00" },
  { id: "LV_1200_1400", label: "12:00 – 2:00 pm",  inicio: "12:00", fin: "14:00" },
  { id: "LV_1600_1830", label: "4:00 – 6:30 pm",   inicio: "16:00", fin: "18:30" },
  { id: "LV_1830_2100", label: "6:30 – 9:00 pm",   inicio: "18:30", fin: "21:00" },
];
const BLOQUES_SAB: Bloque[] = [
  { id: "SAB_0730_0930", label: "7:30 – 9:30 am",  inicio: "07:30", fin: "09:30" },
  { id: "SAB_0930_1130", label: "9:30 – 11:30 am", inicio: "09:30", fin: "11:30" },
  { id: "SAB_1130_1330", label: "11:30 – 1:30 pm", inicio: "11:30", fin: "13:30" },
  { id: "SAB_1330_1530", label: "1:30 – 3:30 pm",  inicio: "13:30", fin: "15:30" },
];

// ── Sub-componentes internos ───────────────────────────────────────────────────

function EafitHeader({ mes, onPrev, onNext }: {
  mes: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    const [hover, setHover] = React.useState(false);
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
          border: "1.5px solid rgba(255,255,255,0.3)",
          borderRadius: 8,
          color: "#fff",
          width: 32,
          height: 32,
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s ease",
          padding: 0,
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.blue} 0%, ${T.blueDark} 100%)`,
      borderRadius: "12px 12px 0 0",
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      {/* Logo */}
      <img src={LOGO_EAFIT} alt="EAFIT" style={{ height: 32, objectFit: "contain", filter: "brightness(0) invert(1)" }} />

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.3)" }} />

      {/* Título */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.font, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "0.7px", textTransform: "uppercase" }}>
          Escuela de Idiomas
        </div>
        <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px", lineHeight: 1.2 }}>
          Reservaciones de Sala
        </div>
      </div>

      {/* Navegación mes */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <NavBtn onClick={onPrev}>‹</NavBtn>
        <span style={{
          fontFamily: T.font, fontSize: 13, fontWeight: 700, color: "#fff",
          textTransform: "capitalize", minWidth: 110, textAlign: "center",
        }}>
          {format(mes, "MMMM yyyy", { locale: es })}
        </span>
        <NavBtn onClick={onNext}>›</NavBtn>
      </div>
    </div>
  );
}

function DayCell({ dia, isActive, isMes, reservaCount, onClick }: {
  dia: Date;
  isActive: boolean;
  isMes: boolean;
  reservaCount: number;
  onClick: () => void;
}) {
  const [hover, setHover] = React.useState(false);
  const hoy      = isToday(dia);
  const domingo  = getDay(dia) === 0;
  const inactive = !isMes || domingo;

  let bg     = "transparent";
  let color  = inactive ? T.txtTertiary : T.txtPrimary;
  let border = "2px solid transparent";
  const cursor = inactive ? "default" : "pointer";

  if (isActive)       { bg = T.blue;    color = "#fff"; border = `2px solid ${T.blueDark}`; }
  else if (hoy)       { border = `2px solid ${T.yellow}`; color = T.blueDark; }
  else if (hover && !inactive) { bg = T.blueTint; }

  return (
    <div
      onClick={() => !inactive && onClick()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        textAlign: "center",
        padding: "7px 2px",
        borderRadius: 8,
        cursor,
        background: bg,
        border,
        opacity: inactive ? 0.35 : 1,
        transition: "background 0.12s ease, border-color 0.12s ease",
      }}
    >
      <span style={{
        fontFamily: T.font,
        fontSize: 12,
        fontWeight: hoy || isActive ? 700 : 400,
        color,
        lineHeight: 1,
      }}>
        {format(dia, "d")}
      </span>

      {/* Dot de reserva */}
      {reservaCount > 0 && !inactive && (
        <span style={{
          position: "absolute",
          top: 2,
          right: 3,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isActive ? T.yellow : T.yellow,
          display: "block",
          boxShadow: `0 0 0 1.5px ${isActive ? T.blueDark : T.surface}`,
        }} />
      )}
    </div>
  );
}

function BloqueRow({ bloque, ocupado, seleccionado, onClick }: {
  bloque: Bloque;
  ocupado: boolean;
  seleccionado: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = React.useState(false);

  let bg     = T.surface;
  let border = T.border;
  let txtClr = T.txtPrimary;
  let cursor = "pointer";

  if (ocupado)      { bg = T.surfaceElev; border = T.borderStrong; txtClr = T.txtSecond; cursor = "not-allowed"; }
  else if (seleccionado) { bg = T.blue; border = T.blueDark; txtClr = "#fff"; }
  else if (hover)   { bg = T.blueTint; border = T.blueLight; }

  return (
    <div
      onClick={() => !ocupado && onClick()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 14px",
        borderRadius: 10,
        background: bg,
        border: `1.5px solid ${border}`,
        cursor,
        boxShadow: seleccionado ? T.shadow : ocupado ? "none" : hover ? "0 2px 8px rgba(26,92,168,0.08)" : "none",
        transition: "all 0.13s ease",
      }}
    >
      {/* Horario */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: ocupado ? T.borderStrong : seleccionado ? "#fff" : T.blueLight,
          flexShrink: 0,
        }} />
        <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: txtClr }}>
          {bloque.label}
        </span>
      </div>

      {/* Badge estado */}
      <span style={{
        fontFamily: T.font,
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 100,
        letterSpacing: "0.4px",
        background: ocupado
          ? T.border
          : seleccionado
          ? T.blueDark
          : `${T.blue}18`,
        color: ocupado ? T.txtSecond : seleccionado ? "#fff" : T.blue,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
      }}>
        {ocupado ? "× Ocupado" : seleccionado ? "✓ Seleccionado" : "Disponible"}
      </span>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

interface CalendarioProps {
  reservas: { fecha: string; bloqueHorario: string; estado: string }[];
  onSeleccion: (fecha: string, bloque: string) => void;
}

export function CalendarioApp({ reservas, onSeleccion }: CalendarioProps) {
  const [mes, setMes]               = React.useState(new Date());
  const [diaActivo, setDiaActivo]   = React.useState<Date | null>(null);
  const [bloqueActivo, setBloqueActivo] = React.useState<string | null>(null);

  const dias      = eachDayOfInterval({ start: startOfMonth(mes), end: endOfMonth(mes) });
  const primerDia = getDay(startOfMonth(mes));

  function reservasEnDia(dia: Date) {
    return reservas.filter(r => {
      try { return isSameDay(parseISO(r.fecha), dia) && r.estado === "Activa"; }
      catch { return false; }
    });
  }

  function bloqueOcupado(bloque: Bloque) {
    if (!diaActivo) return false;
    return reservasEnDia(diaActivo).some(r => r.bloqueHorario === bloque.id);
  }

  function bloquesDel(dia: Date): Bloque[] {
    const dow = getDay(dia);
    if (dow === 0) return [];
    return dow === 6 ? BLOQUES_SAB : BLOQUES_LV;
  }

  function seleccionarBloque(bloque: Bloque) {
    if (!diaActivo || bloqueOcupado(bloque)) return;
    setBloqueActivo(bloque.id);
    onSeleccion(format(diaActivo, "yyyy-MM-dd"), bloque.id);
  }

  // ── Render ──
  const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
  // Ajustar primerDia: date-fns getDay retorna 0=Dom, ajustar para Lu=0
  const offset = (primerDia === 0 ? 6 : primerDia - 1);

  // resumen mes
  const totalReservas = reservas.filter(r => {
    try { return isSameMonth(parseISO(r.fecha), mes) && r.estado === "Activa"; }
    catch { return false; }
  }).length;

  return (
    <div style={{ fontFamily: T.font, background: T.canvas, borderRadius: 14, overflow: "hidden", boxShadow: T.shadowMd }}>

      {/* Header */}
      <EafitHeader mes={mes} onPrev={() => { setMes(subMonths(mes, 1)); setDiaActivo(null); setBloqueActivo(null); }} onNext={() => { setMes(addMonths(mes, 1)); setDiaActivo(null); setBloqueActivo(null); }} />

      {/* Resumen mes */}
      <div style={{
        padding: "8px 16px",
        background: T.blueDark,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span style={{ fontSize: 10, fontFamily: T.font, color: "rgba(255,255,255,0.65)", fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase" }}>
          {totalReservas > 0 ? `${totalReservas} reserva${totalReservas !== 1 ? "s" : ""} este mes` : "Sin reservas este mes"}
        </span>
        {totalReservas > 0 && (
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.yellow, display: "inline-block" }} />
        )}
      </div>

      {/* Cuerpo */}
      <div style={{ padding: 16 }}>
        {/* Cabeceras día */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{
              textAlign: "center", fontSize: 11, fontWeight: 700,
              color: d === "Do" ? T.txtTertiary : T.blueLight,
              fontFamily: T.font, paddingBottom: 4, letterSpacing: "0.3px",
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid calendario */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {dias.map(dia => (
            <DayCell
              key={dia.toISOString()}
              dia={dia}
              isActive={!!(diaActivo && isSameDay(dia, diaActivo))}
              isMes={isSameMonth(dia, mes)}
              reservaCount={reservasEnDia(dia).length}
              onClick={() => { setDiaActivo(dia); setBloqueActivo(null); }}
            />
          ))}
        </div>

        {/* Panel de bloques */}
        {diaActivo && (
          <div style={{ marginTop: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 10, paddingBottom: 10,
              borderBottom: `1px solid ${T.border}`,
            }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: T.blue }} />
              <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 700, color: T.txtPrimary }}>
                {getDay(diaActivo) === 0
                  ? "Sin servicio los domingos"
                  : format(diaActivo, "EEEE d 'de' MMMM", { locale: es })}
              </span>
            </div>

            {getDay(diaActivo) === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: T.txtTertiary, fontSize: 12, fontFamily: T.font }}>
                No hay bloques disponibles
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {bloquesDel(diaActivo).map(bloque => (
                  <BloqueRow
                    key={bloque.id}
                    bloque={bloque}
                    ocupado={bloqueOcupado(bloque)}
                    seleccionado={bloqueActivo === bloque.id}
                    onClick={() => seleccionarBloque(bloque)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hint inicial */}
        {!diaActivo && (
          <div style={{
            marginTop: 14, padding: "10px 14px", borderRadius: 10,
            background: T.blueTint, border: `1px dashed ${T.blueLight}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>📅</span>
            <span style={{ fontFamily: T.font, fontSize: 11, color: T.blueLight, fontWeight: 500 }}>
              Selecciona un día para ver los bloques disponibles
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 16px",
        borderTop: `1px solid ${T.border}`,
        display: "flex",
        gap: 16,
      }}>
        {[
          { color: T.blue,   label: "Seleccionado" },
          { color: T.yellow, label: "Reservado" },
          { color: T.border, label: "Ocupado" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
            <span style={{ fontFamily: T.font, fontSize: 10, color: T.txtSecond, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
