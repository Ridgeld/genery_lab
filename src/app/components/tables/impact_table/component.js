'use client'
import React, { useMemo } from 'react';
import styles from './component.module.scss'; 
import DefaultButton from '../../buttons/default_button/component';

const POSITIONS = Array.from({ length: 8 }, (_, i) => i * 45);

export default function ImpactPowerTable({ 
    L0, L1, L2, L3, 
    omega, 
    m1, m2, m3, isShow
}) {

    // Функция для отображения очень маленьких чисел
    const formatTableValue = (val) => {
        if (val === 0) return "0";
        const absV = Math.abs(val);
        if (absV < 0.001) return val.toExponential(2); // Например: 1.23e-5
        return val.toFixed(4);
    };

    const calculateRow = (angle) => {
        // Проверка входных данных
        if (![L0, L1, L2, L3, omega, m3].every(v => typeof v === 'number' && !isNaN(v))) {
            return { valid: false, error: "Err" };
        }

        const C_TO_M = 0.01; 
        const toRad = (deg) => deg * Math.PI / 180;
        
        // Перевод в метры для корректных Джоулей
        const l0 = L0 * C_TO_M;
        const l1 = L1 * C_TO_M;
        const l2 = L2 * C_TO_M;
        const l3 = L3 * C_TO_M;

        // Момент инерции коромысла (J0)
        const J0 = (m3 * l3 * l3) / 3;
        const freq = Math.abs(omega) / (2 * Math.PI);

        const theta1 = toRad(angle);
        
        // Координаты шарнира B
        const Bx = l1 * Math.cos(theta1);
        const By = l1 * Math.sin(theta1);
        
        // Расстояние до опоры D(l0, 0)
        const dx = l0 - Bx;
        const dy = -By;
        const d = Math.hypot(dx, dy);

        // Проверка собираемости
        if (d > l2 + l3 || d < Math.abs(l2 - l3) || d === 0) {
            return { valid: false, error: "Геом." }; 
        }
        
        // Нахождение точки C (пересечение окружностей)
        const a_dist = (l2*l2 - l3*l3 + d*d) / (2*d);
        const h2 = l2*l2 - a_dist*a_dist;
        const h = Math.sqrt(Math.max(0, h2));

        const xm = Bx + a_dist * dx / d;
        const ym = By + a_dist * dy / d;
        const Cx = xm - (h * dy) / d;
        const Cy = ym + (h * dx) / d;

        // Углы для скоростей
        const theta2 = Math.atan2(Cy - By, Cx - Bx);
        const theta3 = Math.atan2(Cy, Cx - l0);

        const sinDiff = Math.sin(theta3 - theta2);
        
        // Особое положение (мертвая точка)
        if (Math.abs(sinDiff) < 0.001) {
            return { valid: false, error: "Особое" };
        }
        
        // Угловая скорость коромысла
        const omegaCD = (omega * l1 * Math.sin(theta1 - theta2)) / (l3 * sinDiff);

        const A_ud = 0.5 * J0 * omegaCD * omegaCD;
        const N_ud = freq * A_ud;

        return {
            valid: true,
            omegaCD: omegaCD,
            J0: J0,
            A_ud: A_ud,
            N_ud: N_ud
        };
    };

    const tableRows = useMemo(() => {
        return POSITIONS.map(angle => {
            const data = calculateRow(angle);
            return { angle, ...data };
        });
    }, [L0, L1, L2, L3, omega, m3]);

    const exportToCSV = () => {
        const headers = ["Угол (град)", "omega3 (рад/с)", "J0 (кг·м2)", "A уд (Дж)", "N уд (Вт)"];
        const rows = tableRows.map(row => {
            if (!row.valid) return [row.angle, row.error, "", "", ""];
            return [
                row.angle,
                row.omegaCD.toFixed(6),
                row.J0.toExponential(4), 
                row.A_ud.toExponential(4),
                row.N_ud.toExponential(4)
            ];
        });

        const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "impact_data.csv");
        link.click();
    };

    if (!isShow) return null;

    return (
        <div className={styles.container}>
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
                                    <td style={{ fontWeight: 'bold', color: '#e91e63' }}>
                                        {formatTableValue(row.A_ud)}
                                    </td>
                                    <td style={{ fontWeight: 'bold', color: '#673ab7' }}>
                                        {formatTableValue(row.N_ud)}
                                    </td>
                                </>
                            ) : (
                                <td colSpan="4" style={{ color: '#ff4d4f', fontStyle: 'italic', textAlign: 'center' }}>
                                    {row.error === "Геом." ? "Разрыв цепи" : "Особое положение"}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className={styles['button-wrapper']} style={{ marginTop: '20px' }}>
                <DefaultButton
                    name={'Скачать таблицу (CSV)'}
                    onClick={exportToCSV}
                />
            </div>
        </div>
    );
}