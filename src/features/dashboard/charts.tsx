import { useState } from "react";
import { formatCount } from "@/lib/format";
import { formatShortDate } from "@/features/dashboard/dashboardMetrics";

// Chart SVG custom (Catmull-Rom, gradien area, tooltip hover) tanpa dependensi tambahan.
const W = 640;
const H = 250;
const PAD_L = 48;
const PAD_R = 14;
const PAD_T = 20;
const PAD_B = 30;
const IW = W - PAD_L - PAD_R;
const IH = H - PAD_T - PAD_B;

function niceStep(raw: number) {
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const snap = norm >= 5 ? 5 : norm >= 2 ? 2 : 1;
  return snap * mag;
}

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

export function PopulationTrendChart({
  series,
}: {
  series: [string, number][];
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (series.length === 0)
    return (
      <div className="flex h-[250px] items-center justify-center rounded-xl border border-dashed border-[#c9ddd0] bg-[#f8fbf8] text-sm text-[#5a6d63]">
        Belum ada histori populasi.
      </div>
    );
  const values = series.map(([, total]) => total);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(1, rawMax - rawMin);
  const step = niceStep(span / 3);
  const lo = Math.floor((rawMin - span * 0.15) / step) * step;
  const hi = Math.max(
    Math.ceil((rawMax + span * 0.15) / step) * step,
    lo + step
  );
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(v);
  const x = (i: number) =>
    series.length <= 1
      ? PAD_L + IW / 2
      : PAD_L + (i / (series.length - 1)) * IW;
  const y = (v: number) => PAD_T + IH - ((v - lo) / (hi - lo)) * IH;
  const pts = series.map(([, total], i) => ({ x: x(i), y: y(total) }));
  const line = smoothPath(pts);
  const base = PAD_T + IH;
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)},${base} L ${pts[0].x.toFixed(1)},${base} Z`;
  const last = pts[pts.length - 1];
  const xStep = Math.max(1, Math.ceil(series.length / 6));
  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const sx = ((event.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((sx - PAD_L) / IW) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };
  const hoverPt = hover === null ? null : pts[hover];
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="popFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2c8a63" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#2c8a63" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#2c8a63" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="popStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#1d5c48" />
            <stop offset="100%" stopColor="#3fa37c" />
          </linearGradient>
        </defs>
        {ticks.map(tick => (
          <g key={tick}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#e5e9e6"
              strokeWidth="1"
              strokeDasharray={tick === lo ? "" : "3 4"}
            />
            <text
              x={PAD_L - 8}
              y={y(tick) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#7a877f"
            >
              {formatCount(tick)}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#popFill)" stroke="none" />
        <path
          d={line}
          fill="none"
          stroke="url(#popStroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {hoverPt ? (
          <g>
            <line
              x1={hoverPt.x}
              x2={hoverPt.x}
              y1={PAD_T}
              y2={base}
              stroke="#9db8ab"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <circle
              cx={hoverPt.x}
              cy={hoverPt.y}
              r="5"
              fill="#1d5c48"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
          </g>
        ) : (
          <g>
            <circle
              cx={last.x}
              cy={last.y}
              r="8"
              fill="#1d5c48"
              opacity="0.15"
            />
            <circle
              cx={last.x}
              cy={last.y}
              r="4"
              fill="#1d5c48"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        )}
        {series.map(([date], i) =>
          i % xStep === 0 || i === series.length - 1 ? (
            <text
              key={`${date}-${i}`}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#7a877f"
            >
              {formatShortDate(date)}
            </text>
          ) : null
        )}
      </svg>
      {hoverPt && hover !== null ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[#dfe7e1] bg-white/95 px-3 py-1.5 text-center shadow-lg backdrop-blur"
          style={{
            left: `${(hoverPt.x / W) * 100}%`,
            top: `${(hoverPt.y / H) * 100}%`,
          }}
        >
          <p className="whitespace-nowrap text-[11px] text-[#5a6d63]">
            {formatShortDate(series[hover][0])}
          </p>
          <p className="whitespace-nowrap text-sm font-bold text-[#173b32]">
            {formatCount(series[hover][1])} ekor
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function WeeklyProductionChart({
  bars,
}: {
  bars: { label: string; value: number }[];
}) {
  if (bars.length === 0 || bars.every(bar => bar.value <= 0))
    return (
      <div className="flex h-[248px] items-center justify-center rounded-xl border border-dashed border-[#c9ddd0] bg-[#f8fbf8] text-sm text-[#5a6d63]">
        Belum ada data produksi.
      </div>
    );
  const max = Math.max(...bars.map(bar => bar.value));
  const ceiling = Math.max(1, Math.ceil(max / 100) * 100);
  const gridSteps = [0, 1, 2, 3, 4];
  const peak = bars.reduce((a, b) => (b.value >= a.value ? b : a), bars[0]);
  return (
    <div className="mt-2">
      <div className="relative h-[210px]">
        <div className="absolute inset-y-0 left-0 w-9">
          {gridSteps.map(step => (
            <span
              key={step}
              className="absolute -translate-y-1/2 text-[10px] text-[#7a877f]"
              style={{ bottom: `${(step / 4) * 100}%` }}
            >
              {formatCount((ceiling * step) / 4)}
            </span>
          ))}
        </div>
        <div className="absolute inset-0 left-9">
          {gridSteps.map(step => (
            <div
              key={step}
              className="absolute w-full border-t border-dashed border-[#e5e9e6]"
              style={{ bottom: `${(step / 4) * 100}%` }}
            />
          ))}
        </div>
        <div className="absolute inset-y-0 left-9 right-0 flex items-end gap-4 border-b border-[#dfe4e0] sm:gap-6">
          {bars.map(bar => {
            const isPeak = bar === peak && bar.value > 0;
            return (
              <div
                key={bar.label}
                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                title={`${bar.label}: ${formatCount(bar.value)} butir`}
              >
                <span className="text-xs font-bold text-[#202522]">
                  {formatCount(bar.value)}
                </span>
                <div
                  className={`w-full max-w-[72px] origin-bottom rounded-t-[8px] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-opacity group-hover:opacity-90 ${
                    isPeak
                      ? "bg-gradient-to-t from-[#1d5c48] to-[#4cb283]"
                      : "bg-gradient-to-t from-[#a97913] to-[#e9c25c]"
                  }`}
                  style={{
                    height: `${Math.max(6, (bar.value / ceiling) * 100)}%`,
                  }}
                />
                <span className="-mb-6 text-[10px] font-medium text-[#5a6d63]">
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-6" />
    </div>
  );
}
