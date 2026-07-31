import * as React from "react";
import { LOGO_EAFIT } from "./logo";

// ── Design Tokens ──────────────────────────────────────────────────────────────
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
  shadowMd:     "0 8px 32px rgba(26,92,168,0.11),0 3px 10px rgba(26,92,168,0.07)",
};

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Urgencia = "vencido" | "proximo" | "tiempo";

export interface Prestamo {
  id: string;
  numeroTransaccion: string;
  material: string;
  docente: string;
  fechaDevolucionEsperada: Date;
  estado: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function urgencia(fecha: Date): Urgencia {
  const diffMin = (fecha.getTime() - Date.now()) / 60000;
  if (diffMin < 0)  return "vencido";
  if (diffMin < 60) return "proximo";
  return "tiempo";
}

function tiempoRelativo(fecha: Date): string {
  const diff    = Math.abs(fecha.getTime() - Date.now());
  const h       = Math.floor(diff / 3600000);
  const m       = Math.floor((diff % 3600000) / 60000);
  const vencido = fecha.getTime() < Date.now();
  const texto   = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return vencido ? `Vencido hace ${texto}` : `Vence en ${texto}`;
}

// ── Config visual por urgencia ─────────────────────────────────────────────────
const URG_CFG: Record<Urgencia, {
  accentBar: string; cardBg: string; badgeBg: string; badgeText: string;
  dotColor: string; label: string; countBg: string;
}> = {
  vencido: {
    accentBar:  T.yellow,
    cardBg:     "#FFFBF0",
    badgeBg:    T.yellowTint,
    badgeText:  T.yellowDark,
    dotColor:   T.yellow,
    label:      "Vencido",
    countBg:    T.yellowTint,
  },
  proximo: {
    accentBar:  "#F59E0B",
    cardBg:     "#FFFDF5",
    badgeBg:    "#FEF9E7",
    badgeText:  "#92600A",
    dotColor:   "#F59E0B",
    label:      "Próximo",
    countBg:    "#FEF9E7",
  },
  tiempo: {
    accentBar:  T.blue,
    cardBg:     T.surface,
    badgeBg:    T.blueTint,
    badgeText:  T.blue,
    dotColor:   T.blue,
    label:      "En Tiempo",
    countBg:    T.blueTint,
  },
};

// ── Chip de contador ───────────────────────────────────────────────────────────
function CountChip({ tipo, count }: { tipo: Urgencia; count: number }) {
  const cfg = URG_CFG[tipo];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 100,
      background: cfg.countBg,
      border: `1.5px solid ${cfg.dotColor}33`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dotColor, display: "inline-block" }} />
      <span style={{ fontFamily: T.font, fontSize: 11, fontWeight: 700, color: cfg.badgeText }}>
        {count} {cfg.label}{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

// ── Tarjeta de préstamo ────────────────────────────────────────────────────────
function PrestamoCard({ p }: { p: Prestamo }) {
  const [hover, setHover] = React.useState(false);
  const urg = urgencia(p.fechaDevolucionEsperada);
  const cfg = URG_CFG[urg];
  const esVencido = urg === "vencido";

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        borderRadius: 12,
        background: cfg.cardBg,
        boxShadow: hover ? T.shadow : "0 1px 4px rgba(26,92,168,0.05)",
        border: `1px solid ${hover ? cfg.dotColor + "44" : T.border}`,
        overflow: "hidden",
        transition: "box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
        transform: hover ? "translateY(-1px)" : "none",
      }}
    >
      {/* Barra de acento izquierda */}
      <div style={{
        width: 4,
        background: cfg.accentBar,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Efecto shimmer en vencidos */}
        {esVencido && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "linear-gradient(transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
            animation: "shimmer 1.8s ease-in-out infinite",
          }} />
        )}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>

        {/* Icono material */}
        <div style={{
          width: 38, height: 38, borderRadius: 9, flexShrink: 0,
          background: `${cfg.dotColor}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17,
        }}>
          🎧
        </div>

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.txtPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.material}
          </div>
          <div style={{ fontFamily: T.font, fontSize: 11, color: T.txtSecond, marginTop: 2 }}>
            {p.docente}
          </div>
          <div style={{ fontFamily: T.font, fontSize: 10, color: T.txtTertiary, marginTop: 1 }}>
            # {p.numeroTransaccion}
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
          {/* Badge urgencia */}
          <span style={{
            fontFamily: T.font, fontSize: 10, fontWeight: 700,
            padding: "3px 9px", borderRadius: 100, letterSpacing: "0.3px",
            background: cfg.badgeBg, color: cfg.badgeText, whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}>
            {cfg.label}
          </span>
          {/* Countdown */}
          <span style={{
            fontFamily: T.font, fontSize: 11, fontWeight: 600,
            color: cfg.badgeText, whiteSpace: "nowrap",
          }}>
            {tiempoRelativo(p.fechaDevolucionEsperada)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export function SemaforoApp({ prestamos }: { prestamos: Prestamo[] }) {
  const ordenados = [...prestamos].sort((a, b) => {
    const ord: Record<Urgencia, number> = { vencido: 0, proximo: 1, tiempo: 2 };
    return ord[urgencia(a.fechaDevolucionEsperada)] - ord[urgencia(b.fechaDevolucionEsperada)];
  });

  const counts: Record<Urgencia, number> = { vencido: 0, proximo: 0, tiempo: 0 };
  ordenados.forEach(p => counts[urgencia(p.fechaDevolucionEsperada)]++);

  // ── Empty state ──
  if (ordenados.length === 0) {
    return (
      <div style={{ fontFamily: T.font, background: T.canvas, borderRadius: 14, overflow: "hidden", boxShadow: T.shadowMd }}>
        <div style={{
          background: `linear-gradient(135deg, ${T.blue} 0%, ${T.blueDark} 100%)`,
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <img src={LOGO_EAFIT} alt="EAFIT" style={{ height: 28, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase" }}>Escuela de Idiomas</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Semáforo de Préstamos</div>
          </div>
        </div>
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>✅</div>
          <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.blue, marginBottom: 4 }}>
            Todo al día
          </div>
          <div style={{ fontFamily: T.font, fontSize: 12, color: T.txtSecond }}>
            No hay préstamos pendientes en este momento
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: T.font, background: T.canvas, borderRadius: 14, overflow: "hidden", boxShadow: T.shadowMd }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${T.blue} 0%, ${T.blueDark} 100%)`,
        padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <img src={LOGO_EAFIT} alt="EAFIT" style={{ height: 28, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.3)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: T.font, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase" }}>
            Escuela de Idiomas
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: T.font }}>
            Semáforo de Préstamos
          </div>
        </div>
        {/* Total chip */}
        <div style={{ padding: "4px 12px", borderRadius: 100, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 700, color: "#fff" }}>
            {ordenados.length} activo{ordenados.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Chips de conteo */}
      <div style={{
        padding: "10px 14px",
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        display: "flex", gap: 8, flexWrap: "wrap",
      }}>
        {(["vencido", "proximo", "tiempo"] as Urgencia[]).map(u => (
          counts[u] > 0 && <CountChip key={u} tipo={u} count={counts[u]} />
        ))}
      </div>

      {/* Lista */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {ordenados.map(p => <PrestamoCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
