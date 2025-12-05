'use client'
import React, { useMemo } from 'react';
import styles from './component.module.scss'; // Раскомментируйте это в вашем проекте
import DefaultButton from '../../buttons/default_button/component';


const POSITIONS = Array.from({ length: 8 }, (_, i) => i * 45);

export default function ImpactPowerTable({ 
    L0, L1, L2, L3, 
    omega, 
    m1, m2, m3, isShow
}) {
    // =================================================================
    // ФУНКЦИЯ РАСЧЕТА ДЛЯ ОДНОГО УГЛА
    // =================================================================
    const calculateRow = (angle) => {
        // Проверка входных данных
        if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0) || 
            typeof omega !== 'number' || 
            typeof m3 !== 'number') {
            return { valid: false, error: "Err" };
        }

        const C_TO_M = 0.01; // Перевод см -> м
        const toRad = (deg) => deg * Math.PI / 180;
        
        // --- 1. Константы ---
        const L3_m = L3 * C_TO_M;
        // Момент инерции коромысла J0 (относительно точки подвеса)
        // Формула для стержня за конец: J = m*L^2 / 3
        const J0 = (m3 * L3_m * L3_m) / 3;
        
        // Частота вращения кривошипа f (Гц)
        const freq = Math.abs(omega) / (2 * Math.PI);

        // --- 2. Кинематика (Находим omegaCD) ---
        const theta = toRad(angle);
        const L0_cm = L0;
        
        // Координаты шарниров
        const D = { x: L0_cm, y: 0 };
        const B = { x: L1 * Math.cos(theta), y: -L1 * Math.sin(theta) };
        
        const dx = D.x - B.x; 
        const dy = D.y - B.y;
        const d = Math.hypot(dx, dy);

        // Проверка собираемости механизма
        if (d > L2 + L3 || d < Math.abs(L2 - L3) || d === 0) {
            return { valid: false, error: "Геом." }; 
        }
        
        const a_dist = (L2*L2 - L3*L3 + d*d) / (2*d);
        const h = Math.sqrt(Math.max(0, L2*L2 - a_dist*a_dist));
        const xm = B.x + a_dist * dx / d;
        const ym = B.y + a_dist * dy / d;
        const C = { x: xm + (h * dy) / d, y: ym - (h * dx) / d };

        // Углы звеньев
        const angleBC = Math.atan2(-(C.y - B.y), C.x - B.x);
        const angleCD = Math.atan2(-(C.y - D.y), C.x - D.x);

        // --- 3. Скорости ---
        // Vb = omega * L1
        const Vb_mag = omega * L1; 
        const theta_Vb = theta + Math.PI / 2;
        const Vx = -(Vb_mag * Math.cos(theta_Vb)); 
        const Vy = -(Vb_mag * Math.sin(theta_Vb));

        // Матрица Якоби (аналог)
        const aM = -L2 * Math.sin(angleBC);
        const bM = L3 * Math.sin(angleCD);
        const cM = L2 * Math.cos(angleBC);
        const dM = -L3 * Math.cos(angleCD);
        const detV = aM * dM - bM * cM;
        
        if (Math.abs(detV) < 1e-5) return { valid: false, error: "Мертв." };
        
        // Угловая скорость коромысла
        const omegaCD = (aM * Vy - Vx * cM) / detV;

        // --- 4. Целевые расчеты (Формулы с фото) ---
        const A_ud = (J0 * omegaCD * omegaCD) / 2;
        const N_ud = freq * A_ud;

        return {
            valid: true,
            omegaCD: omegaCD,
            J0: J0,
            A_ud: A_ud,
            N_ud: N_ud
        };
    };

    // =================================================================
    // ГЕНЕРАЦИЯ ДАННЫХ
    // =================================================================
    const tableRows = useMemo(() => {
        return POSITIONS.map(angle => {
            const data = calculateRow(angle);
            return { angle, ...data };
        });
    }, [L0, L1, L2, L3, omega, m1, m2, m3]);

    // Функция экспорта в CSV
    const exportToCSV = () => {
        const headers = [
            "Угол (град)", 
            "omega CD (рад/с)", 
            "J0 (кг·м²)", 
            "A уд (Работа) [Дж]",
            "N уд (Мощность) [Вт]"
        ];

        const rows = tableRows.map(row => {
            if (!row.valid) return [row.angle, "Ошибка", "", "", ""];
            return [
                row.angle,
                row.omegaCD.toFixed(4),
                row.J0.toExponential(4), 
                row.A_ud.toFixed(4),
                row.N_ud.toFixed(4)
            ];
        });

        const csvContent = [
            headers.join(";"),
            ...rows.map(r => r.join(";"))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "impact_power_8_positions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isShow) return null;

    return (
        <div className={styles.container}>
            {/* Внедряем стили для предпросмотра */}
            {/* <style>{cssStyles}</style> */}

            <h2 className={styles.title}>Таблица: Энергия и Мощность удара</h2>
            
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>φ₁ (град)</th>
                        <th>ω₃ (рад/с)</th>
                        <th>J₀ (кг·м²)</th> 
                        <th>A уд. (Дж)</th>
                        <th>N уд. (Вт)</th>
                    </tr>
                </thead>
                <tbody>
                    {tableRows.map((row, i) => (
                        <tr key={i}>
                            <td>{row.angle}°</td>
                            
                            {row.valid ? (
                                <>
                                    <td>{row.omegaCD.toFixed(3)}</td>
                                    <td>{row.J0.toExponential(2)}</td>
                                    {/* Inline стили для акцентов, так как они не были в базовом SCSS */}
                                    <td style={{ fontWeight: 'bold', color: '#e91e63' }}>{row.A_ud.toFixed(3)}</td>
                                    <td style={{ fontWeight: 'bold', color: '#673ab7' }}>{row.N_ud.toFixed(3)}</td>
                                </>
                            ) : (
                                <td colSpan="4" className={styles.error}>
                                    {row.error === "Геом." ? "Геом. невозм." : "Особое положение"}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className={styles['button-wrapper']}>
                <DefaultButton
                    name={'Скачать таблицу (CSV)'}
                    onClick={exportToCSV}
                />
            </div>
        </div>
    );
}