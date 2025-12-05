'use client'
import React, { useMemo } from 'react';
import styles from './component.module.scss'

// =================================================================
// КОНФИГУРАЦИЯ ГРАФИКА
// =================================================================
const PADDING = 40;
const BASE_HEIGHT = 400;
// Для плавного графика берем шаг 5 градусов (0, 5, 10 ... 360)
const GRAPH_STEPS = Array.from({ length: 73 }, (_, i) => i * 5);

const LINE_COLORS = {
    A: '#e91e63', // Розовый для Работы (Дж)
    N: '#673ab7'  // Фиолетовый для Мощности (Вт)
};

export default function ImpactPowerGraph({
    L0, L1, L2, L3,
    omega, m1, m2, m3,
    isShow
}) {
    // Внутренние утилиты
    const C_TO_M = 0.01; // Перевод см в метры
    const toRad = (deg) => deg * Math.PI / 180;
    const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
    const len = (v) => Math.hypot(v.x, v.y);

    // =================================================================
    // 1. БЛОК РАСЧЕТОВ ФИЗИКИ
    // =================================================================
    const chartData = useMemo(() => {
        // Валидация входных данных
        if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0) ||
            typeof omega !== 'number' ||
            typeof m3 !== 'number') {
            return [];
        }

        // --- Константы для формул ---
        // 1. Частота вращения кривошипа f (Гц)
        // omega - рад/с. f = omega / 2PI
        const freq = Math.abs(omega) / (2 * Math.PI);

        // 2. Момент инерции коромысла (Звено 3) относительно точки подвеса D (J0)
        // L3_m - длина в метрах
        const L3_m = L3 * C_TO_M;
        // J0 для стержня относительно конца = (m * L^2) / 3
        const J0 = (m3 * L3_m * L3_m) / 3;

        // --- Функции кинематики (упрощенные из оригинала) ---
        function getKinematics(angleDeg) {
            const theta = toRad(angleDeg);
            const L0_cm = L0;
            const L1_cm = L1;
            
            // Координаты шарниров (Y вниз для Canvas, но для расчетов нам важна геометрия)
            const Ax = 0, Ay = 0;
            const Dx = L0_cm, Dy = 0;
            
            const Bx = Ax + L1_cm * Math.cos(theta);
            const By = Ay - L1_cm * Math.sin(theta); // Y вверх или вниз не важно для длин

            const r1 = L2;
            const r2 = L3;
            const dx = Dx - Bx;
            const dy = Dy - By;
            const d = Math.hypot(dx, dy);

            // Проверка собираемости
            if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
                return { valid: false };
            }

            const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
            const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
            
            const x2 = Bx + a * dx / d;
            const y2 = By + a * dy / d;
            
            // Точка C (сборка "коленом вверх" или вниз - берем один вариант как в оригинале)
            const Cx = x2 + (h * dy) / d;
            const Cy = y2 - (h * dx) / d;

            // Углы звеньев
            const angleCD = Math.atan2(-(Cy - Dy), Cx - Dx);
            const angleBC = Math.atan2(-(Cy - By), Cx - Bx);
            const angleAB = theta;

            // --- Расчет скоростей (Аналог скоростей) ---
            // Решаем систему для omegaBC и omegaCD
            // Vb = omega * L1
            const Vb_x = -omega * L1 * Math.sin(angleAB); // проекции вектора скорости B
            const Vb_y = omega * L1 * Math.cos(angleAB);

            // Матрица Якоби (упрощенно через проекции на звенья)
            // L2*w2*sin(phi2) + L3*w3*sin(phi3) = ... 
            // Используем формулы из оригинала через определитель
            const a_mat = -L2 * Math.sin(angleBC);
            const b_mat = L3 * Math.sin(angleCD);
            const c_mat = L2 * Math.cos(angleBC);
            const d_mat = -L3 * Math.cos(angleCD);
            const det = a_mat * d_mat - b_mat * c_mat;

            if (Math.abs(det) < 1e-5) return { valid: false };

            const RHS_x = -Vb_x; // Right Hand Side уравнений
            const RHS_y = -Vb_y;

            // Решаем систему методом Крамера или подстановкой (как в оригинале)
            // В оригинале: 
            // Vx = -Vb_vec.x; Vy = -Vb_vec.y;
            // omegaBC = (Vx * d - b * Vy) / det;
            // omegaCD = (a * Vy - Vx * c) / det;
            
            // Внимание: знаки в оригинале зависели от системы координат. 
            // Воспроизводим логику оригинала:
            const Vb_mag = omega * L1; 
            const theta_Vb = angleAB + Math.PI / 2;
            const Vb_vec_x = Vb_mag * Math.cos(theta_Vb);
            const Vb_vec_y = Vb_mag * Math.sin(theta_Vb);
            
            const Vx_orig = -Vb_vec_x;
            const Vy_orig = -Vb_vec_y;

            const omegaCD = (a_mat * Vy_orig - Vx_orig * c_mat) / det;

            return { valid: true, omegaCD: omegaCD };
        }

        // --- Основной цикл расчета ---
        const data = GRAPH_STEPS.map(angle => {
            const kin = getKinematics(angle);
            
            if (!kin.valid) {
                return { angle, A_ud: 0, N_ud: 0, valid: false };
            }

            // Формула (4): A_ud = (J0 * omega^2) / 2
            // Используем omegaCD (скорость коромысла), так как инерция коромысла
            const w_rocker = kin.omegaCD;
            const A_ud = (J0 * w_rocker * w_rocker) / 2;

            // Формула (5): N_ud = f * A
            const N_ud = freq * A_ud;

            return {
                angle,
                A_ud, // Джоули
                N_ud, // Ватты
                valid: true
            };
        });

        return data.filter(d => d.valid);

    }, [L0, L1, L2, L3, omega, m3]);

    // =================================================================
    // 2. ПОДГОТОВКА SVG (Масштабирование)
    // =================================================================
    const svgData = useMemo(() => {
        const dynamicWidth = 700;
        const chartW = dynamicWidth - 2 * PADDING;
        const chartH = BASE_HEIGHT - 2 * PADDING;

        if (chartData.length === 0) return null;

        // Находим макс значения для масштаба
        const maxA = Math.max(...chartData.map(d => d.A_ud));
        const maxN = Math.max(...chartData.map(d => d.N_ud));
        
        // Защита от деления на 0
        const scaleMaxA = maxA || 1;
        const scaleMaxN = maxN || 1;

        // Функции масштабирования (X - угол, Y - значение)
        const scaleX = (deg) => PADDING + (deg / 360) * chartW;
        
        // Y инвертирован (0 внизу)
        const scaleY_A = (val) => (BASE_HEIGHT - PADDING) - (val / scaleMaxA) * chartH;
        const scaleY_N = (val) => (BASE_HEIGHT - PADDING) - (val / scaleMaxN) * chartH;

        // Генерация путей (Polyline points)
        const pointsA = chartData.map(d => `${scaleX(d.angle)},${scaleY_A(d.A_ud)}`).join(' ');
        const pointsN = chartData.map(d => `${scaleX(d.angle)},${scaleY_N(d.N_ud)}`).join(' ');

        // Генерация меток оси X
        const xLabels = [0, 90, 180, 270, 360].map(deg => ({
            val: deg,
            x: scaleX(deg)
        }));

        // Генерация меток оси Y (делаем 5 делений, берем макс значение как референс)
        const yTicks = [0, 0.25, 0.5, 0.75, 1].map(k => ({
            pos: (BASE_HEIGHT - PADDING) - k * chartH,
            valA: (k * scaleMaxA).toFixed(2),
            valN: (k * scaleMaxN).toFixed(2)
        }));

        return {
            width: dynamicWidth,
            pointsA,
            pointsN,
            xLabels,
            yTicks,
            maxA: scaleMaxA,
            maxN: scaleMaxN
        };

    }, [chartData]);

    if (!isShow) return null;

    if (!svgData) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded">
                Ошибка расчета данных. Проверьте входные параметры (L0, L1...).
            </div>
        );
    }

    return (
        <div className={styles['container']}>
            <h3 className={styles['title']}>График: Энергия и Мощность удара</h3>

            <svg viewBox={`0 0 ${svgData.width} ${BASE_HEIGHT}`} width="100%" height={BASE_HEIGHT}>
                {/* Сетка и Оси */}
                <g stroke="#ccc" strokeWidth="1">
                    {/* Горизонтальные линии */}
                    {svgData.yTicks.map((tick, i) => (
                        <line key={i} x1={PADDING} y1={tick.pos} x2={svgData.width - PADDING} y2={tick.pos} />
                    ))}
                    {/* Вертикальные линии */}
                    {svgData.xLabels.map((tick, i) => (
                        <line key={i} x1={tick.x} y1={PADDING} x2={tick.x} y2={BASE_HEIGHT - PADDING} />
                    ))}
                </g>

                {/* Рамка */}
                <rect 
                    x={PADDING} y={PADDING} 
                    width={svgData.width - 2 * PADDING} 
                    height={BASE_HEIGHT - 2 * PADDING} 
                    fill="none" stroke="#374151" strokeWidth="1"
                />

                {/* Графики */}
                <polyline 
                    points={svgData.pointsA} 
                    fill="none" 
                    stroke={LINE_COLORS.A} 
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <polyline 
                    points={svgData.pointsN} 
                    fill="none" 
                    stroke={LINE_COLORS.N} 
                    strokeWidth="2"
                    strokeDasharray="5,5" // Пунктир для мощности, так как форма графика совпадает
                    strokeLinecap="round"
                />

                {/* Подписи Осей */}
                <g fontSize="10" fontFamily="sans-serif">
                    {/* Ось X */}
                    {svgData.xLabels.map((tick, i) => (
                        <text key={i} x={tick.x} y={BASE_HEIGHT - PADDING + 15} textAnchor="middle" fill="#374151">
                            {tick.val}°
                        </text>
                    ))}
                    
                    {/* Ось Y (Слева - Работа) */}
                    {svgData.yTicks.map((tick, i) => (
                        <text key={`L-${i}`} x={PADDING - 5} y={tick.pos + 3} textAnchor="end" fill={LINE_COLORS.A} fontWeight="bold">
                            {tick.valA}
                        </text>
                    ))}
                    
                    {/* Ось Y (Справа - Мощность) */}
                    {svgData.yTicks.map((tick, i) => (
                        <text key={`R-${i}`} x={svgData.width - PADDING + 5} y={tick.pos + 3} textAnchor="start" fill={LINE_COLORS.N} fontWeight="bold">
                            {tick.valN}
                        </text>
                    ))}
                </g>

                {/* Заголовки осей */}
                <text x={svgData.width / 2} y={BASE_HEIGHT - 5} textAnchor="middle" fontSize="12" fill="#374151">
                    Угол поворота кривошипа (град)
                </text>
                <text 
                    x={15} y={BASE_HEIGHT / 2} 
                    textAnchor="middle" 
                    transform={`rotate(-90, 15, ${BASE_HEIGHT / 2})`} 
                    fontSize="12" fill={LINE_COLORS.A} fontWeight="bold"
                >
                    A (Дж)
                </text>
                <text 
                    x={svgData.width - 15} y={BASE_HEIGHT / 2} 
                    textAnchor="middle" 
                    transform={`rotate(90, ${svgData.width - 15}, ${BASE_HEIGHT / 2})`} 
                    fontSize="12" fill={LINE_COLORS.N} fontWeight="bold"
                >
                    N (Вт)
                </text>

                {/* Легенда */}
                <g transform={`translate(${PADDING + 20}, ${PADDING + 10})`}>
                    <rect x="0" y="0" width="140" height="50" fill="white" stroke="#e5e7eb" rx="4" />
                    
                    <line x1="10" y1="15" x2="30" y2="15" stroke={LINE_COLORS.A} strokeWidth="3" />
                    <text x="35" y="19" fontSize="11" fill="#374151">A<sub>уд</sub> (Работа)</text>
                    
                    <line x1="10" y1="35" x2="30" y2="35" stroke={LINE_COLORS.N} strokeWidth="2" strokeDasharray="5,5" />
                    <text x="35" y="39" fontSize="11" fill="#374151">N<sub>уд</sub> (Мощность)</text>
                </g>
            </svg>
        </div>
    );
}