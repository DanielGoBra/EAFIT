import * as React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
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
  txtSecond:    "#6B7080",
  txtTertiary:  "#9BA3AF",
  border:       "#E2E8F0",
  font:         "'Montserrat','Segoe UI',sans-serif",
  shadow:       "0 4px 18px rgba(26,92,168,0.07),0 2px 7px rgba(26,92,168,0.05),0 1px 3px rgba(26,92,168,0.03)",
  shadowMd:     "0 8px 32px rgba(26,92,168,0.11),0 3px 10px rgba(26,92,168,0.07)",
};

const PALETTE = [
  T.blue, T.blueLight, "#4A9ED6", T.blueDark, "#5BAEE8", "#3A7FC4",
];

// ── Tooltip personalizado ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; fill: string }[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const val  = payload[0].value;
  const clr  = payload[0].fill;
  const isMax = clr === T.yellow;

  return (
    <div style={{
      background: T.surface,
      border: `1.5px solid ${isMax ? T.yellow : T.blue + "44"}`,
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: T.shadow,
      fontFamily: T.font,
    }}>
      <div style={{ fontSize: 11, color: T.txtSecond, marginBottom: 4, fontWeight: 600, letterSpacing: "0.3px" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: isMax ? T.yellowDark : T.blue, lineHeight: 1 }}>
          {val}
        </span>
        <span style={{ fontSize: 11, color: T.txtSecond }}>usos</span>
      </div>
      {isMax && (
        <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: T.yellowDark, letterSpacing: "0.4px", textTransform: "uppercase" }}>
          ★ Mayor uso
        </div>
      )}
    </div>
  );
}

// ── KPI Chip ───────────────────────────────────────────────────────────────────
function KpiChip({ label, value, color, bg }: {
  label: string; value: string | number; color: string; bg: string;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 80,
      padding: "9px 12px",
      borderRadius: 10,
      background: bg,
      border: `1px solid ${color}33`,
      textAlign: "center",
    }}>
      <div style={{ fontFamily: T.font, fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: T.font, fontSize: 10, fontWeight: 600, color: T.txtSecond, marginTop: 3, letterSpacing: "0.4px", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
interface GraficosProps {
  titulo: string;
  colorPrimario: string;
  data: { etiqueta: string; valor: number; categoria?: string }[];
}

export function GraficosApp({ titulo, data }: GraficosProps) {

  // ── Empty state ──
  if (data.length === 0) {
    return (
      <div style={{ fontFamily: T.font, background: T.canvas, borderRadius: 14, overflow: "hidden", boxShadow: T.shadowMd }}>
        <div style={{ background: `linear-gradient(135deg, ${T.blue} 0%, ${T.blueDark} 100%)`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <img src={LOGO_EAFIT} alt="EAFIT" style={{ height: 28, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: T.font, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase" }}>Escuela de Idiomas</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: T.font }}>{titulo || "Gráficos de Reportes"}</div>
          </div>
        </div>
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>📊</div>
          <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.blue, marginBottom: 4 }}>Sin datos disponibles</div>
          <div style={{ fontFamily: T.font, fontSize: 12, color: T.txtSecond }}>Conecta una fuente de datos al componente</div>
        </div>
      </div>
    );
  }

  const maximo   = Math.max(...data.map(d => d.valor));
  const total    = data.reduce((s, d) => s + d.valor, 0);
  const promedio = Math.round(total / data.length);
  const topItem  = data.find(d => d.valor === maximo);

  const colores = data.map((d, i) =>
    d.valor === maximo ? T.yellow : PALETTE[i % PALETTE.length]
  );

  return (
    <div style={{ fontFamily: T.font, background: T.canvas, borderRadius: 14, overflow: "hidden", boxShadow: T.shadowMd }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${T.blue} 0%, ${T.blueDark} 100%)`,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <img src={LOGO_EAFIT} alt="EAFIT" style={{ height: 28, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.3)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: T.font, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase" }}>
            Escuela de Idiomas
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: T.font }}>
            {titulo || "Gráficos de Reportes"}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ padding: "12px 14px 4px", background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
        <KpiChip label="Total usos" value={total}    color={T.blue}       bg={T.blueTint} />
        <KpiChip label="Mayor uso"  value={maximo}   color={T.yellowDark} bg={T.yellowTint} />
        <KpiChip label="Promedio"   value={promedio} color={T.blueLight}  bg={T.surfaceElev} />
      </div>

      {/* Gráfico */}
      <div style={{ padding: "16px 14px 8px", background: T.surface }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: data.length > 6 ? 44 : 32, left: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
            <XAxis
              dataKey="etiqueta"
              tick={{ fontFamily: T.font, fontSize: 10, fill: T.txtSecond, fontWeight: 500 }}
              axisLine={{ stroke: T.border }}
              tickLine={false}
              angle={data.length > 6 ? -35 : 0}
              textAnchor={data.length > 6 ? "end" : "middle"}
              interval={0}
            />
            <YAxis
              tick={{ fontFamily: T.font, fontSize: 10, fill: T.txtSecond }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={24}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: `${T.blue}09`, radius: 6 }} />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((_, i) => (
                <Cell key={i} fill={colores[i]} />
              ))}
              <LabelList
                dataKey="valor"
                position="top"
                style={{ fontFamily: T.font, fontSize: 10, fontWeight: 700, fill: T.txtSecond }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + top item */}
      <div style={{
        padding: "10px 14px",
        borderTop: `1px solid ${T.border}`,
        background: T.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}>
        {/* Colores */}
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { color: T.yellow,    label: "Mayor uso" },
            { color: T.blue,      label: "Uso normal" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
              <span style={{ fontFamily: T.font, fontSize: 10, color: T.txtSecond, fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Top item badge */}
        {topItem && (
          <div style={{
            padding: "4px 10px", borderRadius: 100,
            background: T.yellowTint, border: `1px solid ${T.yellow}44`,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ fontSize: 11 }}>★</span>
            <span style={{ fontFamily: T.font, fontSize: 10, fontWeight: 700, color: T.yellowDark }}>
              {topItem.etiqueta}: {topItem.valor} usos
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
