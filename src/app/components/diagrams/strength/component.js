'use client'
import React, { useMemo } from 'react';
import styles from './component.module.scss';

// Увеличил PADDING до 50, чтобы метки с минусами/плюсами точно помещались
const PADDING = 50;     
const BASE_HEIGHT = 400; 
const EIGHT_POSITIONS = Array.from({ length: 8 }, (_, i) => i * 45);

const LINE_COLORS = ['#3f51b5', '#00bcd4', '#ff9800']; 
const SCALE_FACTOR = 1000; 

export default function TorquesGraphsSVG({ 
    L0, L1, L2, L3,
    omega, m1, m2, m3, F_ext,
    isShow 
}) {
    const C_TO_M = 0.01;
    const toRad = (deg) => deg * Math.PI / 180;
    const len = (v) => Math.hypot(v.x, v.y);
    const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
    const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });

    const L0_m = L0 * C_TO_M;
    const L1_m = L1 * C_TO_M;
    const L2_m = L2 * C_TO_M;
    const L3_m = L3 * C_TO_M;

    const J2 = m2 * L2_m * L2_m / 12; 
    const J3 = m3 * L3_m * L3_m / 12;

    const externalForce = F_ext === undefined || F_ext === null ? 0 : F_ext;

    const fullTableData = useMemo(() => {
        if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0) || 
            typeof omega !== 'number' || 
            typeof m1 !== 'number' || typeof m2 !== 'number' || typeof m3 !== 'number') {
            return [];
        }

        function solveMechanismInternal(L0_cm, L1_cm, L2_cm, L3_cm, angleDeg) {
            const A = { x: 0, y: 0 };
            const D = { x: L0_cm, y: 0 }; 
            const theta = toRad(angleDeg);

            const B = {
                x: A.x + L1_cm * Math.cos(theta), 
                y: A.y - L1_cm * Math.sin(theta)
            };

            const r1 = L2_cm; 
            const r2 = L3_cm; 
            const dx = D.x - B.x;
            const dy = D.y - B.y;
            const d = Math.hypot(dx, dy);

            if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
                return { A, B, C: null, D, valid: false, angleAB: theta, angleBC: null, angleCD: null };
            }
            
            const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
            const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
            const xm = B.x + a * dx / d;
            const ym = B.y + a * dy / d;
            
            const Cx = xm + (h * dy) / d;
            const Cy = ym - (h * dx) / d;
            const C = { x: Cx, y: Cy };

            const angleBC = Math.atan2(-(C.y - B.y), C.x - B.x);
            const angleCD = Math.atan2(-(C.y - D.y), C.x - D.x);

            return { A, B, C, D, valid: true, angleAB: theta, angleBC, angleCD };
        }

        function buildVelocityInternal(sol, L1_cm, omega) {
            const { C, D, angleBC, angleCD, valid } = sol;
            if (!valid) return { valid: false };

            const Vb_mag_cms = omega * L1_cm;
            const theta_Vb = sol.angleAB + Math.PI / 2; 
            const Vb_vec_cms = {
                x: Vb_mag_cms * Math.cos(theta_Vb),
                y: Vb_mag_cms * Math.sin(theta_Vb)
            };

            const L2_cm = len(sub(C, sol.B)); 
            const L3_cm = len(sub(D, C)); 

            const a = -L2_cm * Math.sin(angleBC);
            const b = L3_cm * Math.sin(angleCD);
            const c = L2_cm * Math.cos(angleBC);
            const d = -L3_cm * Math.cos(angleCD);
            const det = a * d - b * c;

            if (Math.abs(det) < 1e-5) { 
                return { valid: false, error: 'Особое положение (скорость)' };
            }

            const Vx = -Vb_vec_cms.x;
            const Vy = -Vb_vec_cms.y;

            const omegaBC = (Vx * d - b * Vy) / det;
            const omegaCD = (a * Vy - Vx * c) / det;
            
            const Vc_vec_cms = {
                x: -omegaCD * L3_cm * Math.sin(angleCD),
                y: omegaCD * L3_cm * Math.cos(angleCD)
            };

            return {
                omegaAB: omega,
                omegaBC: omegaBC,
                omegaCD: omegaCD,
                Vc_vec: Vc_vec_cms, 
                valid: true
            };
        }

        function buildAccelerationInternal(sol, vdata, L1_cm, L2_cm, L3_cm, omega) {
            const { angleBC, angleCD, valid } = sol;
            if (!valid) return { valid: false };
            
            const omegaBC = vdata.omegaBC;
            const omegaCD = vdata.omegaCD;

            const aB_mag = omega * omega * L1_cm;
            const theta_aB = sol.angleAB + Math.PI;
            const aB_vec_cms = {
                x: aB_mag * Math.cos(theta_aB),
                y: aB_mag * Math.sin(theta_aB)
            };

            const aC_B_n_mag = omegaBC * omegaBC * L2_cm;
            const aC_D_n_mag = omegaCD * omegaCD * L3_cm;

            const aC_B_n_vec = {
                x: aC_B_n_mag * Math.cos(angleBC + Math.PI),
                y: aC_B_n_mag * Math.sin(angleBC + Math.PI)
            };
            const aC_D_n_vec = {
                x: aC_D_n_mag * Math.cos(angleCD + Math.PI),
                y: aC_D_n_mag * Math.sin(angleCD + Math.PI)
            };

            const Ax = aC_D_n_vec.x - aC_B_n_vec.x - aB_vec_cms.x;
            const Ay = aC_D_n_vec.y - aC_B_n_vec.y - aB_vec_cms.y;

            const a = L2_cm * Math.sin(angleBC);
            const b = -L3_cm * Math.sin(angleCD);
            const c = -L2_cm * Math.cos(angleBC);
            const d = L3_cm * Math.cos(angleCD);
            const det = a * d - b * c;

            if (Math.abs(det) < 1e-5) {
                return { valid: false, error: 'Особое положение (ускорение)' };
            }

            const epsilonBC = (Ax * d - b * Ay) / det;
            const epsilonCD = (a * Ay - Ax * c) / det;

            const aC_D_t_vec = {
                x: -epsilonCD * L3_cm * Math.sin(angleCD),
                y: epsilonCD * L3_cm * Math.cos(angleCD)
            };
            const aC_vec = add(aC_D_n_vec, aC_D_t_vec); 

            return {
                epsilonBC: epsilonBC,
                epsilonCD: epsilonCD,
                aB_vec: aB_vec_cms,
                aC_vec: aC_vec,
                valid: true
            };
        }

        function buildTorquesInternal(sol, vdata, adata, L1_m, L2_m, L3_m, m2, m3, J2, J3, F) {
            if (!adata || !adata.valid) return { valid: false };

            const B_m = { x: sol.B.x * C_TO_M, y: -sol.B.y * C_TO_M }; 
            const C_m = { x: sol.C.x * C_TO_M, y: -sol.C.y * C_TO_M }; 
            const D_m = { x: sol.D.x * C_TO_M, y: -sol.D.y * C_TO_M }; 

            const aB_m = { x: adata.aB_vec.x * C_TO_M, y: adata.aB_vec.y * C_TO_M };
            
            const S2_m = {
                x: B_m.x + (C_m.x - B_m.x) / 2,
                y: B_m.y + (C_m.y - B_m.y) / 2
            };
            const S3_m = {
                x: D_m.x + (C_m.x - D_m.x) / 2,
                y: D_m.y + (C_m.y - D_m.y) / 2
            };

            const L_BS2 = L2_m / 2; 
            const aS2n_mag = vdata.omegaBC * vdata.omegaBC * L_BS2;
            const aS2t_mag = adata.epsilonBC * L_BS2; 
            
            const aS2n_vec = {
                x: aS2n_mag * Math.cos(sol.angleBC + Math.PI),
                y: aS2n_mag * Math.sin(sol.angleBC + Math.PI)
            };
            const aS2t_vec = {
                x: aS2t_mag * Math.cos(sol.angleBC + Math.PI/2),
                y: aS2t_mag * Math.sin(sol.angleBC + Math.PI/2)
            };
            
            const aS2_x = aB_m.x + aS2n_vec.x + aS2t_vec.x; 
            const aS2_y = aB_m.y + aS2n_vec.y + aS2t_vec.y; 
            
            const L_DS3 = L3_m / 2; 
            const aS3n_mag = vdata.omegaCD * vdata.omegaCD * L_DS3;
            const aS3t_mag = adata.epsilonCD * L_DS3;
            
            const aS3n_vec = {
                x: aS3n_mag * Math.cos(sol.angleCD + Math.PI),
                y: aS3n_mag * Math.sin(sol.angleCD + Math.PI)
            };
            const aS3t_vec = {
                x: aS3t_mag * Math.cos(sol.angleCD + Math.PI/2),
                y: aS3t_mag * Math.sin(sol.angleCD + Math.PI/2)
            };
            
            const aS3_x = aS3n_vec.x + aS3t_vec.x;
            const aS3_y = aS3n_vec.y + aS3t_vec.y;

            const Fi2_x = -m2 * aS2_x;
            const Fi2_y = -m2 * aS2_y;
            const Fi3_x = -m3 * aS3_x;
            const Fi3_y = -m3 * aS3_y;

            const Mi2 = -J2 * adata.epsilonBC;
            const Mi3 = -J3 * adata.epsilonCD; 

            const F_vec = { x: externalForce, y: 0 }; 
            const M_F_A = C_m.x * F_vec.y - C_m.y * F_vec.x; 

            const M_Fi2_A = S2_m.x * Fi2_y - S2_m.y * Fi2_x; 
            const M_Fi3_A = S3_m.x * Fi3_y - S3_m.y * Fi3_x; 

            const Md = -(M_Fi2_A + M_Fi3_A + Mi2 + Mi3 + M_F_A); 

            return {
                valid: true,
                Md: Md, 
                MJ2: Mi2, 
                MJ3: Mi3, 
            };
        }

        return EIGHT_POSITIONS.map(angle => {
            const sol = solveMechanismInternal(L0, L1, L2, L3, angle);
            
            if (!sol.valid) {
                return { angle, Md: null, MJ2: null, MJ3: null, ok: false, error: "Геом. невозм." };
            }
            
            const vdata = buildVelocityInternal(sol, L1, omega);
            if (!vdata.valid) {
                return { angle, Md: null, MJ2: null, MJ3: null, ok: false, error: "Прямые ||" };
            }

            const adata = buildAccelerationInternal(sol, vdata, L1, L2, L3, omega); 
            if (!adata.valid) {
                return { angle, Md: null, MJ2: null, MJ3: null, ok: false, error: "Ускор. невозм." };
            }
            
            const Tdata = buildTorquesInternal(sol, vdata, adata, L1_m, L2_m, L3_m, m2, m3, J2, J3, externalForce);
            
            if (!Tdata.valid) {
                return { angle, Md: null, MJ2: null, MJ3: null, ok: false, error: "Моменты невозм." };
            }

            return {
                angle,
                Md: Tdata.Md / SCALE_FACTOR,
                MJ2: Tdata.MJ2 / SCALE_FACTOR,
                MJ3: Tdata.MJ3 / SCALE_FACTOR,
                ok: true
            };
        });
    }, [L0, L1, L2, L3, omega, m1, m2, m3, externalForce, L0_m, L1_m, L2_m, L3_m, J2, J3]); 
    

    const validData = fullTableData.filter(d => 
        d.ok && 
        isFinite(d.Md) && 
        isFinite(d.MJ2) && 
        isFinite(d.MJ3)
    );

    const { 
        pointsData: pData, 
        yAxisLabels: yLabels, 
        zeroY: zY, 
        xLabels: xL, 
        viewBoxWidth: vW 
    } = useMemo(() => {
        const dynamicWidth = 700; 
        
        if (validData.length === 0) {
            return { 
                pointsData: { Md: "", MJ2: "", MJ3: "" },
                yAxisLabels: [], 
                zeroY: BASE_HEIGHT - PADDING, 
                xLabels: [],
                viewBoxWidth: dynamicWidth
            };
        }

        const allY = validData.flatMap(d => [d.Md, d.MJ2, d.MJ3]);
        const yMinRaw = Math.min(0, ...allY); 
        const yMaxRaw = Math.max(0, ...allY);
        
        const maxAbsValue = Math.max(Math.abs(yMinRaw), Math.abs(yMaxRaw));
        const scaleBase = Math.max(maxAbsValue, 1e-6); 
        const yMax = scaleBase * 1.1; 
        const yMin = -scaleBase * 1.1; 
        
        const xMin = 0;
        const xMax = 360;

        const chartWidth = dynamicWidth - 2 * PADDING;
        const chartHeight = BASE_HEIGHT - 2 * PADDING;

        const scaleX = (angle) => PADDING + (angle - xMin) / (xMax - xMin) * chartWidth;
        // Математика scaleY делает так, что yMax (самое большое положительное) имеет самую маленькую Y координату (то есть находится на самом верху SVG)
        const scaleY = (torque) => PADDING + chartHeight - ((torque - yMin) / (yMax - yMin) * chartHeight);
        
        const calculatedZeroY = scaleY(0);

        const generatePoints = (key) => 
            validData.map(d => `${scaleX(d.angle)},${scaleY(d[key])}`).join(' ');

        const pointsData = {
            Md: generatePoints('Md'),
            MJ2: generatePoints('MJ2'),
            MJ3: generatePoints('MJ3'),
        };
        
        let decimals = 2;
        if (scaleBase < 0.001) decimals = 5;
        else if (scaleBase < 0.01) decimals = 4;
        else if (scaleBase < 0.1) decimals = 3;

        // Генерация меток от положительных (верх) к отрицательным (низ)
        const labels = [1, 0.5, 0, -0.5, -1].map(factor => {
            const value = scaleBase * factor;
            let labelStr = "0";
            
            // Если значение не ноль, добавляем соответствующий знак
            if (Math.abs(value) > 1e-10) {
                const fixed = Math.abs(value).toFixed(decimals);
                // Явно добавляем + для верха и - для низа
                labelStr = value > 0 ? `+${fixed}` : `-${fixed}`;
            }

            return {
                value: value,
                y: scaleY(value),
                label: labelStr,
            };
        });

        const xAxisLabels = EIGHT_POSITIONS.map(angle => ({
            angle: angle, 
            x: scaleX(angle)
        }));

        return { 
            pointsData, 
            yAxisLabels: labels, 
            zeroY: calculatedZeroY, 
            xLabels: xAxisLabels,
            viewBoxWidth: dynamicWidth
        };
    }, [fullTableData]); 
    
    if (!isShow) {
        return null;
    }
    
    if (validData.length === 0) {
        return (
            <div className={styles['container']}>
                <h3 className={styles['title']}>Графики моментов сил</h3>
                <p className={styles['error']}>
                    Нет достаточных данных для построения графиков. Проверьте входные параметры (особенно геометрию L0, L1, L2, L3) и консоль на наличие ошибок.
                </p>
            </div>
        );
    }
    
    return (
        <div className={styles['container']}>
            <h3 className={styles['title']}>Графики моментов сил</h3>
            
            <svg viewBox={`0 0 ${vW} ${BASE_HEIGHT}`} width="100%" height={BASE_HEIGHT}>
                
                {/* 1. Сетка и Оси */}
                <g>
                    {/* Горизонтальная ось (M=0) */}
                    <line 
                        x1={PADDING} 
                        y1={zY} 
                        x2={vW - PADDING} 
                        y2={zY} 
                        stroke="var(--foreground, #ededed)" 
                        strokeWidth="1" 
                    />
                    
                    {/* Вертикальные линии */}
                    {xL.map((l, index) => (
                        <line 
                            key={index}
                            x1={l.x} 
                            y1={PADDING} 
                            x2={l.x} 
                            y2={BASE_HEIGHT - PADDING} 
                            stroke="var(--third, #818181)" 
                            strokeDasharray="4 4" 
                        />
                    ))}
                    
                    {/* Рамка области графика */}
                    <rect 
                        x={PADDING} 
                        y={PADDING} 
                        width={vW - 2 * PADDING} 
                        height={BASE_HEIGHT - 2 * PADDING} 
                        fill="none" 
                        stroke="var(--border, #252525)" 
                        strokeWidth="1" 
                    />
                </g>

                {/* 2. Линии графиков */}
                <g>
                    <polyline fill="none" stroke={LINE_COLORS[0]} strokeWidth="2" points={pData.Md} />
                    <polyline fill="none" stroke={LINE_COLORS[1]} strokeWidth="2" points={pData.MJ2} />
                    <polyline fill="none" stroke={LINE_COLORS[2]} strokeWidth="2" points={pData.MJ3} />
                </g>
                
                {/* 3. Точки данных */}
                <g>
                    {pData.Md.split(' ').filter(Boolean).map((point, index) => {
                        const [cx, cy] = point.split(',');
                        return <circle key={`Md-${index}`} cx={cx} cy={cy} r="4" fill={LINE_COLORS[0]} />;
                    })}
                    {pData.MJ2.split(' ').filter(Boolean).map((point, index) => {
                        const [cx, cy] = point.split(',');
                        return <circle key={`MJ2-${index}`} cx={cx} cy={cy} r="4" fill={LINE_COLORS[1]} />;
                    })}
                    {pData.MJ3.split(' ').filter(Boolean).map((point, index) => {
                        const [cx, cy] = point.split(',');
                        return <circle key={`MJ3-${index}`} cx={cx} cy={cy} r="4" fill={LINE_COLORS[2]} />;
                    })}
                </g>

                {/* 4. Метки осей */}
                <g>
                    {/* Метки оси Y (Момент) - теперь с плюсами для верха и минусами для низа */}
                    {yLabels.map((l, index) => (
                        <text key={`y-label-${index}`} x={PADDING - 8} y={l.y + 4} textAnchor="end" fontSize="10" fill="var(--foreground, #ededed)">
                            {l.label}
                        </text>
                    ))}
                    {/* Метки оси X (Угол) */}
                    {xL.map((l, index) => (
                        <text key={`x-label-${index}`} x={l.x} y={BASE_HEIGHT - PADDING + 15} textAnchor="middle" fontSize="10" fill="var(--foreground, #ededed)">
                            {l.angle}°
                        </text>
                    ))}
                    
                    <text x={vW / 2} y={BASE_HEIGHT} textAnchor="middle" fontSize="12" fill="var(--foreground, #ededed)">
                        Угол &alpha; (°)
                    </text>
                    
                    <text x={12} y={BASE_HEIGHT / 2} textAnchor="middle" fontSize="12" fill="var(--foreground, #ededed)" transform={`rotate(-90, 12, ${BASE_HEIGHT / 2})`}>
                        Момент (кН·м)
                    </text>
                </g>
                
                {/* 5. Легенда */}
                <g transform={`translate(${vW - PADDING - 150}, ${10})`}> 
                    <rect x="0" y="0" width="150" height="80" fill="var(--secondary, #2a2a2a)" stroke="var(--border, #252525)" rx="3"/>
                    
                    <line x1="5" y1="12" x2="25" y2="12" stroke={LINE_COLORS[0]} strokeWidth="2"/>
                    <text x="30" y="15" fontSize="10" fill="var(--foreground, #ededed)">Md (Приводящий)</text>
                    
                    <line x1="5" y1="32" x2="25" y2="32" stroke={LINE_COLORS[1]} strokeWidth="2"/>
                    <text x="30" y="35" fontSize="10" fill="var(--foreground, #ededed)">M ин. звена 2</text>
                    
                    <line x1="5" y1="52" x2="25" y2="52" stroke={LINE_COLORS[2]} strokeWidth="2"/>
                    <text x="30" y="55" fontSize="10" fill="var(--foreground, #ededed)">M ин. звена 3</text>
                </g>
            </svg>
        </div>
    );
    
}