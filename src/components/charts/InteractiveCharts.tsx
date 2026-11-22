import React, { useMemo, useState } from 'react';
import { formatCompactCurrency, formatCurrency } from '../../utils/calculations';

export interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

export interface ChartDatum {
  label: string;
  tooltipTitle?: string;
  [key: string]: string | number | undefined;
}

interface BarChartProps {
  data: ChartDatum[];
  series: SeriesConfig[];
  height?: number;
  currencySymbol?: string;
  emptyMessage?: string;
}

export function InteractiveBarChart({
  data,
  series,
  height = 260,
  currencySymbol = '₹',
  emptyMessage = 'No data available for selected period.',
}: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { maxVal, minVal, ticks } = useMemo(() => {
    let max = 0;
    let min = 0;
    for (const d of data) {
      for (const s of series) {
        const val = Number(d[s.key]) || 0;
        if (val > max) max = val;
        if (val < min) min = val;
      }
    }
    if (max === 0 && min === 0) max = 1000;
    const paddedMax = max > 0 ? max * 1.15 : 0;
    const paddedMin = min < 0 ? min * 1.15 : 0;
    const step = (paddedMax - paddedMin) / 4;
    const tickList = [0, 1, 2, 3, 4].map((i) => paddedMin + step * i);
    return { maxVal: paddedMax, minVal: paddedMin, ticks: tickList };
  }, [data, series]);

  if (!data.length) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg"
      >
        {emptyMessage}
      </div>
    );
  }

  const width = 720;
  const padLeft = 64;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const range = Math.max(1, maxVal - minVal);
  const zeroY = padTop + ((maxVal - 0) / range) * plotH;

  const groupW = plotW / data.length;
  const barGap = 4;
  const maxBarW = series.length === 1 ? 36 : 20;
  const barW = Math.max(
    4,
    Math.min(maxBarW, (groupW * 0.72 - barGap * (series.length - 1)) / series.length)
  );
  const totalGroupBarW = barW * series.length + barGap * (series.length - 1);

  return (
    <div className="relative w-full">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-3">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span
              className="w-3 h-3 rounded-sm inline-block shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
        >
          {/* Gridlines & Y Ticks */}
          {ticks.map((tickVal, idx) => {
            const y = padTop + ((maxVal - tickVal) / range) * plotH;
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke={Math.abs(tickVal) < 0.01 ? '#94a3b8' : '#e2e8f0'}
                  strokeDasharray={Math.abs(tickVal) < 0.01 ? undefined : '3 3'}
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] font-mono"
                >
                  {formatCompactCurrency(tickVal, currencySymbol)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const groupX = padLeft + i * groupW;
            const startX = groupX + (groupW - totalGroupBarW) / 2;
            const showLabel = data.length <= 14 || i % Math.ceil(data.length / 10) === 0 || i === data.length - 1;

            return (
              <g
                key={`${d.label}-${i}`}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Hover highlight column */}
                <rect
                  x={groupX}
                  y={padTop}
                  width={groupW}
                  height={plotH}
                  fill={hoveredIdx === i ? '#f1f5f9' : 'transparent'}
                  rx={4}
                />

                {series.map((s, sIdx) => {
                  const raw = Number(d[s.key]) || 0;
                  const valY = padTop + ((maxVal - raw) / range) * plotH;
                  const rectY = raw >= 0 ? valY : zeroY;
                  const rectH = Math.max(2, Math.abs(zeroY - valY));
                  const barX = startX + sIdx * (barW + barGap);

                  return (
                    <rect
                      key={s.key}
                      x={barX}
                      y={raw === 0 ? zeroY - 1 : rectY}
                      width={barW}
                      height={raw === 0 ? 2 : rectH}
                      fill={s.color}
                      rx={3}
                      opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.6}
                    />
                  );
                })}

                {showLabel && (
                  <text
                    x={groupX + groupW / 2}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10.5px]"
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Interactive Tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="mt-2 px-3.5 py-2.5 rounded-lg bg-navy-900 text-white text-xs flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold">
              {data[hoveredIdx].tooltipTitle || data[hoveredIdx].label}
            </span>
            <div className="flex flex-wrap items-center gap-4">
              {series.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5 font-mono tabular-nums">
                  <span
                    className="w-2.5 h-2.5 rounded-xs inline-block"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-slate-300">{s.label}:</span>
                  <span className="font-bold text-white">
                    {formatCurrency(Number(data[hoveredIdx][s.key]) || 0, currencySymbol)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AreaChartProps {
  data: ChartDatum[];
  seriesKey: string;
  seriesLabel: string;
  color: string;
  height?: number;
  currencySymbol?: string;
}

export function InteractiveAreaChart({
  data,
  seriesKey,
  seriesLabel,
  color,
  height = 240,
  currencySymbol = '₹',
}: AreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { maxVal, minVal, ticks } = useMemo(() => {
    let max = 0;
    let min = 0;
    for (const d of data) {
      const val = Number(d[seriesKey]) || 0;
      if (val > max) max = val;
      if (val < min) min = val;
    }
    if (max === 0 && min === 0) max = 1000;
    const paddedMax = max > 0 ? max * 1.15 : 0;
    const paddedMin = min < 0 ? min * 1.15 : 0;
    const step = (paddedMax - paddedMin) / 4;
    const tickList = [0, 1, 2, 3, 4].map((i) => paddedMin + step * i);
    return { maxVal: paddedMax, minVal: paddedMin, ticks: tickList };
  }, [data, seriesKey]);

  if (!data.length) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg"
      >
        No trend data for selected period.
      </div>
    );
  }

  const width = 720;
  const padLeft = 64;
  const padRight = 22;
  const padTop = 18;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const range = Math.max(1, maxVal - minVal);
  const zeroY = padTop + ((maxVal - 0) / range) * plotH;

  const points = data.map((d, idx) => {
    const x = data.length === 1 ? padLeft + plotW / 2 : padLeft + (idx / (data.length - 1)) * plotW;
    const val = Number(d[seriesKey]) || 0;
    const y = padTop + ((maxVal - val) / range) * plotH;
    return { x, y, val, d };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`
      : '';

  const gradId = `area-grad-${seriesKey}-${color.replace('#', '')}`;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
        role="img"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((tickVal, idx) => {
          const y = padTop + ((maxVal - tickVal) / range) * plotH;
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke={Math.abs(tickVal) < 0.01 ? '#94a3b8' : '#e2e8f0'}
                strokeDasharray={Math.abs(tickVal) < 0.01 ? undefined : '3 3'}
                strokeWidth={1}
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-500 text-[11px] font-mono"
              >
                {formatCompactCurrency(tickVal, currencySymbol)}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {linePath && (
          <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        )}

        {points.map((pt, i) => {
          const showLabel =
            data.length <= 12 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1;
          const isHover = hoveredIdx === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Invisible hit target */}
              <rect
                x={pt.x - Math.max(10, plotW / data.length / 2)}
                y={padTop}
                width={Math.max(20, plotW / data.length)}
                height={plotH}
                fill="transparent"
              />
              {isHover && (
                <line
                  x1={pt.x}
                  x2={pt.x}
                  y1={padTop}
                  y2={padTop + plotH}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHover ? 5.5 : data.length > 20 ? 2.5 : 3.5}
                fill={isHover ? '#ffffff' : color}
                stroke={color}
                strokeWidth={2}
              />
              {showLabel && (
                <text
                  x={pt.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10.5px]"
                >
                  {pt.d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="mt-2 px-3.5 py-2.5 rounded-lg bg-navy-900 text-white text-xs flex items-center justify-between gap-4">
          <span className="font-semibold">
            {data[hoveredIdx].tooltipTitle || data[hoveredIdx].label}
          </span>
          <span className="font-mono font-bold tabular-nums">
            {seriesLabel}: {formatCurrency(Number(data[hoveredIdx][seriesKey]) || 0, currencySymbol)}
          </span>
        </div>
      )}
    </div>
  );
}
