'use client'
import React, { useMemo } from 'react';
import { solveMechanism, buildVelocityForAngle } from '../../../utils/kinematics';
import styles from './component.module.scss';
import DefaultButton from '../../buttons/default_button/component';

// 8 положений: 0, 45, 90, ..., 315
const EIGHT_POSITIONS = Array.from({ length: 8 }, (_, i) => i * 45);

export default function VelocityTable({ L0, L1, L2, L3, omega, isShow }) {
    

    const tableData = useMemo(() => {
        if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0) || typeof omega !== 'number') {
            return [];
        }

        const data = EIGHT_POSITIONS.map(angle => {
            const sol = solveMechanism(L0, L1, L2, L3, angle);
            
            if (!sol.valid) {

                return { angle, Vb: null, Vcb: null, Vcd: null, ok: false, error: "Геом. невозм." };
            }
            
            const vdata = buildVelocityForAngle(sol, L1, omega);
            
            if (!vdata || !vdata.valid) {

                return { angle, Vb: vdata.Vb_mm / 1000, Vcb: null, Vcd: null, ok: false, error: "Прямые параллельны" };
            }
            
            // Все значения в м/с (V_mm / 1000)
            return {
                angle,
                Vb: vdata.Vb_mm / 1000,
                Vcb: vdata.Vcb_mm / 1000,
                Vcd: vdata.Vcd_mm / 1000,
                ok: true
            };
        });
        return data;
    }, [L0, L1, L2, L3, omega]);


    const exportToCSV = () => {
        // Заголовки
        const header = "Угол (°);Vb (м/с);Vcb (м/с);Vcd (м/с)\n";

  // Строки данных
        const rows = tableData.map(row =>
            row.ok
            ? `${row.angle};${row.Vb.toFixed(3)};${row.Vcb.toFixed(3)};${row.Vcd.toFixed(3)}`
            : `${row.angle};${row.Vb !== null ? row.Vb.toFixed(3) : ''};${row.error || ''};`
        );

        // Добавляем BOM (для Excel)
        const csvContent = "\uFEFF" + header + rows.join("\n");

        // Создание Blob и скачивание файла
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "velocity_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        (isShow && 
            <div className={styles['container']}>
                <h3 className={styles['title']}>Таблица скоростей (8 положений)</h3>
                <table className={styles['table']}>
                    <thead>
                        <tr>
                            <th>Угол (°)</th>
                            <th>Vb (м/с)</th>
                            <th>Vcb (м/с)</th>
                            <th>Vcd (м/с)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((r, index) => (
                            <tr key={index}>
                                <td>{r.angle}°</td>
                                {r.ok ? (
                                    <>
                                        <td>{r.Vb.toFixed(3)}</td>
                                        <td>{r.Vcb.toFixed(3)}</td>
                                        <td>{r.Vcd.toFixed(3)}</td>
                                    </>
                                ) : (
                                    <>
                                        {/* Vb известен, даже если нет решения Vcb, Vcd */}
                                        <td>{r.Vb !== null ? (r.Vb.toFixed(3)) : '—'}</td> 
                                        <td colSpan="2" className={styles['error']}>{r.error}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className={styles['button-wrapper']}>
                    <DefaultButton 
                        name={'Экспортировать в CSV'}
                        onClick={exportToCSV}/>
                </div>
            </div>
        )
    );
}