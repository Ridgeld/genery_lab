'use client'
import React, { useMemo } from 'react';
import styles from './component.module.scss'; 
import DefaultButton from '../../buttons/default_button/component';

const POSITIONS = [0, 45, 90, 135, 180, 225, 270, 315];

export default function DynamicsTable8Positions({ 
    L0, L1, L2, L3, 
    omega, 
    m1, m2, m3, F_ext, isShow
}) {

    const calculateRow = (angle) => {
        // Проверка типов
        if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0)) {
            return { valid: false, error: "Err" };
        }

        const C_TO_M = 0.01;
        const toRad = (deg) => deg * Math.PI / 180;
        
        // Константы
        const L1_m = L1 * C_TO_M;
        const L2_m = L2 * C_TO_M;
        const L3_m = L3 * C_TO_M;
        const L0_cm = L0; 
        const externalForce = F_ext || 0;
        const J2 = m2 * L2_m * L2_m / 12; 
        const J3 = m3 * L3_m * L3_m / 12;

        // 1. Геометрия
        const theta = toRad(angle);
        const D = { x: L0_cm, y: 0 };
        const B = { x: L1 * Math.cos(theta), y: -L1 * Math.sin(theta) }; // Y Down
        
        const dx = D.x - B.x; 
        const dy = D.y - B.y;
        const d = Math.hypot(dx, dy);

        // Проверка существования
        if (d > L2 + L3 || d < Math.abs(L2 - L3) || d === 0) {
            return { valid: false, error: "Геом." }; // Геометрически невозможно
        }
        
        const a_dist = (L2*L2 - L3*L3 + d*d) / (2*d);
        const h = Math.sqrt(Math.max(0, L2*L2 - a_dist*a_dist));
        const xm = B.x + a_dist * dx / d;
        const ym = B.y + a_dist * dy / d;
        const C = { x: xm + (h * dy) / d, y: ym - (h * dx) / d };

        const angleBC = Math.atan2(-(C.y - B.y), C.x - B.x);
        const angleCD = Math.atan2(-(C.y - D.y), C.x - D.x);

        // 2. Скорости
        const Vb_mag = omega * L1; 
        const aM = -L2 * Math.sin(angleBC);
        const bM = L3 * Math.sin(angleCD);
        const cM = L2 * Math.cos(angleBC);
        const dM = -L3 * Math.cos(angleCD);
        const detV = aM * dM - bM * cM;
        
        if (Math.abs(detV) < 1e-5) return { valid: false, error: "Мертв." };
        
        const Vb_vec_cms = { x: Vb_mag * Math.cos(theta + Math.PI/2), y: Vb_mag * Math.sin(theta + Math.PI/2) };
        const Vx = -Vb_vec_cms.x; 
        const Vy = -Vb_vec_cms.y;
        const omegaBC = (Vx * dM - bM * Vy) / detV;
        const omegaCD = (aM * Vy - Vx * cM) / detV;

        // 3. Ускорения
        const aB_mag = omega * omega * L1;
        const aB_vec = { x: aB_mag * Math.cos(theta + Math.PI), y: aB_mag * Math.sin(theta + Math.PI) };
        const aC_B_n_mag = omegaBC * omegaBC * L2;
        const aC_D_n_mag = omegaCD * omegaCD * L3;
        const aC_B_n = { x: aC_B_n_mag * Math.cos(angleBC + Math.PI), y: aC_B_n_mag * Math.sin(angleBC + Math.PI) };
        const aC_D_n = { x: aC_D_n_mag * Math.cos(angleCD + Math.PI), y: aC_D_n_mag * Math.sin(angleCD + Math.PI) };

        const Ax = aC_D_n.x - aC_B_n.x - aB_vec.x;
        const Ay = aC_D_n.y - aC_B_n.y - aB_vec.y;
        const epsilonBC = (Ax * dM - bM * Ay) / detV;
        const epsilonCD = (aM * Ay - Ax * cM) / detV;

        // 4. Динамика
        const B_m = { x: B.x * C_TO_M, y: -B.y * C_TO_M }; 
        const C_m = { x: C.x * C_TO_M, y: -C.y * C_TO_M };
        const D_m = { x: D.x * C_TO_M, y: -D.y * C_TO_M };
        const aB_m = { x: aB_vec.x * C_TO_M, y: aB_vec.y * C_TO_M };

        const S2_m = { x: (B_m.x + C_m.x)/2, y: (B_m.y + C_m.y)/2 };
        const S3_m = { x: (D_m.x + C_m.x)/2, y: (D_m.y + C_m.y)/2 };

        const L_BS2 = L2_m / 2;
        const L_DS3 = L3_m / 2;
        
        const aS2n_mag = omegaBC * omegaBC * L_BS2;
        const aS2t_mag = epsilonBC * L_BS2;
        const aS2x = aB_m.x + aS2n_mag * Math.cos(angleBC + Math.PI) + aS2t_mag * Math.cos(angleBC + Math.PI/2);
        const aS2y = aB_m.y + aS2n_mag * Math.sin(angleBC + Math.PI) + aS2t_mag * Math.sin(angleBC + Math.PI/2);
        
        const aS3n_mag = omegaCD * omegaCD * L_DS3;
        const aS3t_mag = epsilonCD * L_DS3;
        const aS3x = aS3n_mag * Math.cos(angleCD + Math.PI) + aS3t_mag * Math.cos(angleCD + Math.PI/2);
        const aS3y = aS3n_mag * Math.sin(angleCD + Math.PI) + aS3t_mag * Math.sin(angleCD + Math.PI/2);

        const Fi2 = { x: -m2 * aS2x, y: -m2 * aS2y };
        const Fi3 = { x: -m3 * aS3x, y: -m3 * aS3y };
        const Mi2 = -J2 * epsilonBC; 
        const Mi3 = -J3 * epsilonCD;

        const F_vec = { x: externalForce, y: 0 };
        const M_F_A = C_m.x * F_vec.y - C_m.y * F_vec.x;
        const M_Fi2_A = S2_m.x * Fi2.y - S2_m.y * Fi2.x;
        const M_Fi3_A = S3_m.x * Fi3.y - S3_m.y * Fi3.x;
        const Md = -(M_Fi2_A + M_Fi3_A + Mi2 + Mi3 + M_F_A);

        return {
            valid: true,
            Fi2: Math.hypot(Fi2.x, Fi2.y),
            Fi3: Math.hypot(Fi3.x, Fi3.y),
            Mi2,
            Mi3,
            M_ext: M_F_A,
            Md
        };
    };


    const tableRows = useMemo(() => {
        return POSITIONS.map(angle => {
            const data = calculateRow(angle);
            return { angle, ...data };
        });
    }, [L0, L1, L2, L3, omega, m1, m2, m3, F_ext]);

    // Функция экспорта в CSV
    const exportToCSV = () => {
        const headers = [
            "Угол (град)", 
            "Fu2 (Сила ин. 2) [Н]", 
            "Fu3 (Сила ин. 3) [Н]", 
            "Mu2 (Момент ин. 2) [Нм]",
            "Mu3 (Момент ин. 3) [Нм]",
            "M ext (Внешний) [Нм]",
            "Md (Приводящий) [Нм]"
        ];

        const rows = tableRows.map(row => {
            if (!row.valid) return [row.angle, "Ошибка", "", "", "", "", ""];
            return [
                row.angle,
                row.Fi2.toFixed(4),
                row.Fi3.toFixed(4),
                row.Mi2.toFixed(4),
                row.Mi3.toFixed(4),
                row.M_ext.toFixed(4),
                row.Md.toFixed(4)
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
        link.setAttribute("download", "dynamics_8_positions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isShow) return null;

    return (
        <div className={styles['container']}>
            <h2 className={styles['title']}>Сводная таблица (8 положений)</h2>
            
            <div className={styles['table-block']}>
                <table className={styles['table']}>
                    <thead>
                        <tr>
                            <th>φ₁</th>
                            <th>F инерц. 2 (Н)</th>
                            <th>F инерц. 3 (Н)</th>
                            <th>M инерц. 2 (Нм)</th>
                            <th>M инерц. 3 (Нм)</th>
                            <th>M внеш. (Нм)</th>
                            <th>Md (Нм)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableRows.map((row, i) => (
                            <tr key={i} >
                                <td style={{ fontWeight: 'bold' }}>{row.angle}°</td>
                                
                                {row.valid ? (
                                    <>
                                        <td>{row.Fi2.toFixed(2)}</td>
                                        <td>{row.Fi3.toFixed(2)}</td>
                                        <td>{row.Mi2.toFixed(4)}</td>
                                        <td>{row.Mi3.toFixed(4)}</td>
                                        <td>{row.M_ext.toFixed(2)}</td>
                                        <td style={{ fontWeight: 'bold', color: '#3f51b5' }}>{row.Md.toFixed(2)}</td>
                                    </>
                                ) : (
                                    <td colSpan="6" className={styles.error}>
                                        {row.error === "Геом." ? "Геом. невозм." : "Особое положение"}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles['button-wrapper']}>
                <DefaultButton
                    name={'Скачать таблицу (CSV)'}
                    onClick={exportToCSV}
                />
            </div>
        </div>
    );
}