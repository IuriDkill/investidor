import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import type { SimulationPoint } from '@/lib/fixedIncome';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import { axisMargin, linePath, ticksForWidth, tooltipLeft, yDomain } from './geometry';
import styles from './style.module.css';

const HEIGHT = 300;
const MARGIN = { top: 12, right: 16, bottom: 28 };
const Y_TICKS = 4;

const monthLabel = (month: number) => {
  if (month === 0) return 'Início';
  if (month % 12 !== 0) return `${month} ${month === 1 ? 'mês' : 'meses'}`;
  return `${month / 12} ${month === 12 ? 'ano' : 'anos'}`;
};

export default function GrowthChart({ series }: { series: SimulationPoint[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const tooltip = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);

  useLayoutEffect(() => {
    if (tooltip.current) setTooltipWidth(tooltip.current.offsetWidth);
  }, [hovered, width]);

  useEffect(() => {
    if (!container.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  const gross = series.map((point) => point.gross);
  const invested = series.map((point) => point.invested);
  const domain = yDomain([...gross, ...invested]);
  const months = series[series.length - 1].month;

  const yTicks = Array.from({ length: Y_TICKS + 1 }, (_, index) => (domain[1] / Y_TICKS) * index);
  const yLabels = yTicks.map(formatCompactCurrency);
  const marginLeft = axisMargin(yLabels);
  const plotWidth = Math.max(width - marginLeft - MARGIN.right, 1);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const xTicks = ticksForWidth(months, plotWidth);

  const xOf = (month: number) => (months === 0 ? 0 : (month / months) * plotWidth);
  const yOf = (value: number) => plotHeight - (value / domain[1]) * plotHeight;

  const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    setHovered(Math.round(ratio * months));
  };

  const point = hovered === null ? null : series[hovered];

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>
        <h3 className={styles.title}>Evolução do patrimônio</h3>
        <ul className={styles.legend}>
          <li>
            <span className={`${styles.swatch} ${styles.swatchGross}`} />
            Patrimônio bruto
          </li>
          <li>
            <span className={`${styles.swatch} ${styles.swatchInvested}`} />
            Total investido
          </li>
        </ul>
      </figcaption>

      <div ref={container} className={styles.plot}>
        <svg width={width} height={HEIGHT} aria-hidden="true">
          <g transform={`translate(${marginLeft} ${MARGIN.top})`}>
            {yTicks.map((value, index) => (
              <g key={index}>
                <line className={styles.grid} x1={0} x2={plotWidth} y1={yOf(value)} y2={yOf(value)} />
                <text className={styles.axis} x={-10} y={yOf(value)} dy="0.32em" textAnchor="end">
                  {yLabels[index]}
                </text>
              </g>
            ))}

            {xTicks.map((month) => (
              <text
                key={month}
                className={styles.axis}
                x={xOf(month)}
                y={plotHeight + 20}
                textAnchor={month === 0 ? 'start' : month === months ? 'end' : 'middle'}
              >
                {monthLabel(month)}
              </text>
            ))}

            <path className={styles.lineInvested} d={linePath(invested, plotWidth, plotHeight, domain)} />
            <path className={styles.lineGross} d={linePath(gross, plotWidth, plotHeight, domain)} />

            {point && (
              <>
                <line className={styles.crosshair} x1={xOf(point.month)} x2={xOf(point.month)} y1={0} y2={plotHeight} />
                <circle className={styles.dotInvested} cx={xOf(point.month)} cy={yOf(point.invested)} r={4} />
                <circle className={styles.dotGross} cx={xOf(point.month)} cy={yOf(point.gross)} r={4} />
              </>
            )}

            <rect
              className={styles.hitArea}
              width={plotWidth}
              height={plotHeight}
              onPointerMove={onPointerMove}
              onPointerDown={onPointerMove}
              onPointerLeave={() => setHovered(null)}
            />
          </g>
        </svg>

        {point && (
          <div
            ref={tooltip}
            className={styles.tooltip}
            style={{
              left: tooltipLeft(marginLeft + xOf(point.month), tooltipWidth, width),
              top: MARGIN.top,
            }}
          >
            <strong>{monthLabel(point.month)}</strong>
            <span>Patrimônio bruto: {formatCurrency(point.gross)}</span>
            <span>Total investido: {formatCurrency(point.invested)}</span>
          </div>
        )}
      </div>

      <div className={styles.srOnly}>
        <table>
          <caption>Evolução do patrimônio mês a mês</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col">Total investido</th>
              <th scope="col">Patrimônio bruto</th>
            </tr>
          </thead>
          <tbody>
            {series.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{formatCurrency(row.invested)}</td>
                <td>{formatCurrency(row.gross)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
