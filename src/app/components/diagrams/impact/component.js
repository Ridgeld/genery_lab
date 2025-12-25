'use client'
import React, { useMemo } from 'react';
import styles from './component.module.scss'

const PADDING = 60; // Увеличил отступ для длинных чисел (экспонент)
const BASE_HEIGHT = 400;
const GRAPH_STEPS = Array.from({ length: 73 }, (_, i) => i * 5);

const LINE_COLORS = {
    A: '#e91e63',
    N: '#673ab7'
};

export default function ImpactPowerGraph({
    L0, L1, L2, L3,
    omega, m3,
    isShow
}) {
    // Умное форматирование для малых величин
    const formatValue = (val) => {
        if (!val || Math.abs(val) < 1e-12) return "0";
        const absV = Math.abs(val);
        if (absV < 0.001 || absV > 10000) return val.toExponential(1);
        return val.toFixed(3);
    };

    const chartData = useMemo(() => {
        if (![L0, L1, L2, L3, omega, m3].every(v => typeof v === 'number' && !isNaN(v))) return [];
        
        const C_TO_M = 0.01;
        const l0 = L0 * C_TO_M, l1 = L1 * C_TO_M, l2 = L2 * C_TO_M, l3 = L3 * C_TO_M;
        const J0 = (m3 * l3 * l3) / 3;
        const frequency = Math.abs(omega) / (2 * Math.PI);

        const results = GRAPH_STEPS.map(angleDeg => {
            const theta1 = (angleDeg * Math.PI) / 180;
            const Bx = l1 * Math.cos(theta1), By = l1 * Math.sin(theta1);
            const dx = l0 - Bx, dy = -By;
            const d = Math.hypot(dx, dy);

            // Проверка сборки
            if (d > l2 + l3 || d < Math.abs(l2 - l3) || d === 0) return null;

            const a = (l2 * l2 - l3 * l3 + d * d) / (2 * d);
            const h2 = l2 * l2 - a * a;
            if (h2 < 0) return null;
            const h = Math.sqrt(h2);

            const x2 = Bx + (a * dx) / d, y2 = By + (a * dy) / d;
            const Cx = x2 - (h * dy) / d, Cy = y2 + (h * dx) / d;

            const theta2 = Math.atan2(Cy - By, Cx - Bx);
            const theta3 = Math.atan2(Cy, Cx - l0);

            // Знаменатель для расчета скорости
            const sinDiff = Math.sin(theta3 - theta2);
            
            // Если мы в мертвой точке (sinDiff около 0), пропускаем точку
            if (Math.abs(sinDiff) < 0.001) return null;

            const w3 = (omega * l1 * Math.sin(theta1 - theta2)) / (l3 * sinDiff);
            const A_ud = 0.5 * J0 * w3 * w3;
            const N_ud = A_ud * frequency;

            return { angle: angleDeg, A: A_ud, N: N_ud };
        });

        // Оставляем только валидные объекты с конечными числами
        return results.filter(d => d !== null && isFinite(d.A) && isFinite(d.N));
    }, [L0, L1, L2, L3, omega, m3]);

    const svgData = useMemo(() => {
        if (!chartData || chartData.length < 2) return null;

        const width = 800;
        const chartW = width - 2 * PADDING;
        const chartH = BASE_HEIGHT - 2 * PADDING;

        // Ищем максимумы, игнорируя выбросы (если есть)
        const allA = chartData.map(d => d.A);
        const allN = chartData.map(d => d.N);
        const maxA = Math.max(...allA) || 1e-6;
        const maxN = Math.max(...allN) || 1e-6;

        const scaleX = (deg) => PADDING + (deg / 360) * chartW;
        const scaleY = (val, max) => (BASE_HEIGHT - PADDING) - (val / max) * chartH;

        const pointsA = chartData.map(d => `${scaleX(d.angle)},${scaleY(d.A, maxA)}`).join(' ');
        const pointsN = chartData.map(d => `${scaleX(d.angle)},${scaleY(d.N, maxN)}`).join(' ');

        const yTicks = [0, 0.25, 0.5, 0.75, 1].map(k => ({
            pos: (BASE_HEIGHT - PADDING) - k * chartH,
            labelA: formatValue(k * maxA),
            labelN: formatValue(k * maxN)
        }));

        return { width, pointsA, pointsN, yTicks, chartW, chartH };
    }, [chartData]);

    if (!isShow) return null;

    if (!svgData) {
        return (
            <div style={{ padding: '20px', border: '1px solid #ffcfcf', color: '#d32f2f', borderRadius: '8px', background: '#fff' }}>
                Недостаточно данных для построения графика (проверьте параметры звеньев).
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h3 >
                Энергетические характеристики удара
            </h3>
            
            <svg viewBox={`0 0 ${svgData.width} ${BASE_HEIGHT}`} width="100%" style={{ overflow: 'visible' }}>
                {/* Сетка */}
                <g stroke="#8f8f8fff" strokeWidth="1">
                    {svgData.yTicks.map((t, i) => (
                        <line key={i} x1={PADDING} y1={t.pos} x2={svgData.width - PADDING} y2={t.pos} />
                    ))}
                    {[0, 90, 180, 270, 360].map(deg => {
                        const x = PADDING + (deg / 360) * svgData.chartW;
                        return <line key={deg} x1={x} y1={PADDING} x2={x} y2={BASE_HEIGHT - PADDING} />;
                    })}
                </g>

                {/* Оси */}
                <line x1={PADDING} y1={BASE_HEIGHT - PADDING} x2={svgData.width - PADDING} y2={BASE_HEIGHT - PADDING} stroke="#444" strokeWidth="1.5" />
                <line x1={PADDING} y1={PADDING} x2={PADDING} y2={BASE_HEIGHT - PADDING} stroke={LINE_COLORS.A} strokeWidth="1.5" />
                <line x1={svgData.width - PADDING} y1={PADDING} x2={svgData.width - PADDING} y2={BASE_HEIGHT - PADDING} stroke={LINE_COLORS.N} strokeWidth="1.5" />

                {/* Кривые */}
                <polyline points={svgData.pointsA} fill="none" stroke={LINE_COLORS.A} strokeWidth="2.5" strokeLinejoin="round" />
                <polyline points={svgData.pointsN} fill="none" stroke={LINE_COLORS.N} strokeWidth="2" strokeDasharray="5,3" strokeLinejoin="round" />

                {/* Текстовые метки */}
                <g fontSize="11" fill="#666" fontFamily="Arial, sans-serif">
                    {svgData.yTicks.map((t, i) => (
                        <React.Fragment key={i}>
                            <text x={PADDING - 8} y={t.pos + 4} textAnchor="end" fill={LINE_COLORS.A} fontWeight="bold">{t.labelA}</text>
                            <text x={svgData.width - PADDING + 8} y={t.pos + 4} textAnchor="start" fill={LINE_COLORS.N} fontWeight="bold">{t.labelN}</text>
                        </React.Fragment>
                    ))}
                    {[0, 90, 180, 270, 360].map(deg => (
                        <text key={deg} x={PADDING + (deg / 360) * svgData.chartW} y={BASE_HEIGHT - PADDING + 20} textAnchor="middle">
                            {deg}°
                        </text>
                    ))}
                </g>

                {/* Легенда */}
                <g transform={`translate(${PADDING + 20}, ${PADDING + 10})`}>
                    <rect x="-5" y="-5" width="130" height="45" fill="rgba(255,255,255,0.8)" rx="4" />
                    <line x1="0" y1="10" x2="20" y2="10" stroke={LINE_COLORS.A} strokeWidth="3" />
                    <text x="25" y="14" fontSize="11">A (Работа, Дж)</text>
                    <line x1="0" y1="28" x2="20" y2="28" stroke={LINE_COLORS.N} strokeWidth="2" strokeDasharray="4" />
                    <text x="25" y="32" fontSize="11">N (Мощность, Вт)</text>
                </g>
            </svg>
        </div>
    );
}