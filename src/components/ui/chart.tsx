"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BaseChartProps {
  data: ChartDataPoint[];
  height?: number;
  title?: string;
  className?: string;
}

// ==================== PALETTE ====================

const DEFAULT_COLORS = [
  "#4A7C9B",
  "#C4956A",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#A8D0E6",
  "#2D5A7B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

function getColor(index: number, custom?: string): string {
  return custom || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

// ==================== BAR CHART ====================

export function BarChart({
  data,
  height = 280,
  title,
  className,
}: BaseChartProps) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      ref={ref}
      className={cn(
        "bg-owly-surface rounded-xl border border-owly-border p-5",
        className
      )}
    >
      {title && (
        <h3 className="text-sm font-semibold text-owly-text mb-4">{title}</h3>
      )}
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / maxValue) * 100;
          const color = getColor(i, d.color);
          return (
            <div
              key={d.label}
              className="flex-1 flex flex-col items-center justify-end h-full group"
            >
              {/* Tooltip */}
              <div className="relative mb-1">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs font-medium text-white bg-owly-text whitespace-nowrap z-10">
                  {d.value.toLocaleString()}
                </span>
              </div>
              {/* Bar */}
              <div
                className="w-full rounded-t-md transition-all duration-700 ease-out min-h-[2px]"
                style={{
                  height: animated ? `${pct}%` : "0%",
                  backgroundColor: color,
                  transitionDelay: `${i * 80}ms`,
                }}
              />
              {/* Label */}
              <span className="text-[10px] text-owly-text-light mt-2 truncate w-full text-center leading-tight">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== LINE CHART ====================

export function LineChart({
  data,
  height = 280,
  title,
  className,
}: BaseChartProps) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 20, right: 16, bottom: 32, left: 44 };
  const chartWidth = 600;
  const chartHeight = height;
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * innerW,
    y: padding.top + innerH - (d.value / maxValue) * innerH,
    ...d,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Gradient fill polygon
  const fillPoly =
    `${points[0].x},${padding.top + innerH} ` +
    polyline +
    ` ${points[points.length - 1].x},${padding.top + innerH}`;

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from(
    { length: yTicks },
    (_, i) => Math.round((maxValue / (yTicks - 1)) * i)
  );

  // X-axis labels: show at most 7
  const labelStep = Math.max(1, Math.floor(data.length / 7));

  return (
    <div
      ref={ref}
      className={cn(
        "bg-owly-surface rounded-xl border border-owly-border p-5",
        className
      )}
    >
      {title && (
        <h3 className="text-sm font-semibold text-owly-text mb-4">{title}</h3>
      )}
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A7C9B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4A7C9B" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTickValues.map((v) => {
          const y = padding.top + innerH - (v / maxValue) * innerH;
          return (
            <g key={v}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="4,4"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-owly-text-light"
                fontSize="10"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Gradient fill */}
        <polygon
          points={fillPoly}
          fill="url(#lineGrad)"
          className="transition-opacity duration-1000"
          opacity={animated ? 1 : 0}
        />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#4A7C9B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-1000"
          strokeDasharray={animated ? "0" : `${innerW * 3}`}
          strokeDashoffset={animated ? "0" : `${innerW * 3}`}
          style={{ transition: "stroke-dasharray 1.2s ease-out, stroke-dashoffset 1.2s ease-out" }}
        />

        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={animated ? 4 : 0}
              fill="#4A7C9B"
              stroke="white"
              strokeWidth="2"
              style={{
                transition: `r 0.4s ease-out ${0.8 + i * 0.05}s`,
              }}
            />
            {/* Hover target */}
            <circle cx={p.x} cy={p.y} r={12} fill="transparent" className="cursor-pointer">
              <title>{`${p.label}: ${p.value}`}</title>
            </circle>
          </g>
        ))}

        {/* X-axis labels */}
        {points.map(
          (p, i) =>
            i % labelStep === 0 && (
              <text
                key={i}
                x={p.x}
                y={chartHeight - 6}
                textAnchor="middle"
                className="fill-owly-text-light"
                fontSize="10"
              >
                {p.label}
              </text>
            )
        )}
      </svg>
    </div>
  );
}

// ==================== DONUT CHART ====================

export function DonutChart({
  data,
  height = 280,
  title,
  className,
}: BaseChartProps & { centerLabel?: string }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 85;
  const innerR = 58;

  // Build arcs
  let cumAngle = -90; // start at top
  const segments = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const color = getColor(i, d.color);
    return { ...d, startAngle, endAngle, angle, color, index: i };
  });

  function polarToCart(angleDeg: number, r: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(start: number, end: number, outer: number, inner: number) {
    const s1 = polarToCart(start, outer);
    const e1 = polarToCart(end, outer);
    const s2 = polarToCart(end, inner);
    const e2 = polarToCart(start, inner);
    const largeArc = end - start > 180 ? 1 : 0;
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${outer} ${outer} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${e2.x} ${e2.y}`,
      "Z",
    ].join(" ");
  }

  return (
    <div
      ref={ref}
      className={cn(
        "bg-owly-surface rounded-xl border border-owly-border p-5",
        className
      )}
    >
      {title && (
        <h3 className="text-sm font-semibold text-owly-text mb-4">{title}</h3>
      )}
      <div className="flex items-center gap-6 flex-wrap justify-center">
        {/* Donut */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            {segments.map((seg) => (
              <path
                key={seg.label}
                d={arcPath(seg.startAngle, seg.endAngle, outerR, innerR)}
                fill={seg.color}
                className="transition-all duration-700 ease-out origin-center cursor-pointer hover:opacity-80"
                style={{
                  opacity: animated ? 1 : 0,
                  transform: animated ? "scale(1)" : "scale(0.8)",
                  transitionDelay: `${seg.index * 100}ms`,
                }}
              >
                <title>{`${seg.label}: ${seg.value} (${Math.round((seg.value / total) * 100)}%)`}</title>
              </path>
            ))}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-owly-text">
              {total.toLocaleString()}
            </span>
            <span className="text-xs text-owly-text-light">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-owly-text-light">{seg.label}</span>
              <span className="font-medium text-owly-text ml-auto pl-3">
                {seg.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
