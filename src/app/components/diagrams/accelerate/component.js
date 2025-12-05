'use client'
import React, { useMemo } from 'react';
import { solveMechanism, buildVelocityForAngle } from '../../../utils/kinematics'; 
import { buildAccelerationForAngle } from '../../../utils/acceleration'; 
import styles from './component.module.scss';


const PADDING = 40;     
const BASE_HEIGHT = 400; 
const EIGHT_POSITIONS = Array.from({ length: 8 }, (_, i) => i * 45);

const LINE_COLORS = ['#e91e63', '#2196f3', '#ffc107']; 

export default function AccelerationGraphsSVG({ L0, L1, L2, L3, omega, isShow }) {
    

    const fullTableData = useMemo(() => {
        if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0) || typeof omega !== 'number') {
            return [];
        }

        return EIGHT_POSITIONS.map(angle => {
            const SCALE = 1000;
            const sol = solveMechanism(L0, L1, L2, L3, angle);
            
            if (!sol.valid) {
                return { angle, aC: null, aCB_t: null, aCD_t: null, ok: false, error: "Геом. невозм." };
            }
            
            const vdata = buildVelocityForAngle(sol, L1, omega);
            if (!vdata.valid) {
                return { angle, aC: null, aCB_t: null, aCD_t: null, ok: false, error: "Прямые ||" };
            }

            const adata = buildAccelerationForAngle(sol, vdata, L1, L2, L3, omega);
            if (!adata.valid) {
                return { angle, aC: null, aCB_t: null, aCD_t: null, ok: false, error: "Ускор. невозм." };
            }
            
            return {
                angle,
                aC: adata.aC_mag / SCALE,
                aCB_t: adata.aCBt_mag / SCALE,
                aCD_t: adata.aCDt_mag / SCALE,
                ok: true
            };
        });
    }, [L0, L1, L2, L3, omega]);
    
    const validData = fullTableData.filter(d => d.ok);


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
                pointsData: { aC: "", aCB_t: "", aCD_t: "" },
                yAxisLabels: [], 
                zeroY: BASE_HEIGHT - PADDING, 
                xLabels: [],
                viewBoxWidth: dynamicWidth
            };
        }

        const yMin = 0; 
        
        const maxAbsValue = validData.reduce((max, current) => {
            return Math.max(max, current.aC || 0, current.aCB_t || 0, current.aCD_t || 0);
        }, 0);

        const yMax = maxAbsValue * 1.1 || 1; 
        
        const xMin = 0;
        const xMax = 360;

        const chartWidth = dynamicWidth - 2 * PADDING;
        const chartHeight = BASE_HEIGHT - 2 * PADDING;

        const scaleX = (angle) => PADDING + (angle - xMin) / (xMax - xMin) * chartWidth;
        const scaleY = (accel) => PADDING + chartHeight - ((accel - yMin) / (yMax - yMin) * chartHeight);
        
        const calculatedZeroY = scaleY(0);

        const generatePoints = (key) => 
            validData.map(d => `${scaleX(d.angle)},${scaleY(d[key])}`).join(' ');

        const pointsData = {
            aC: generatePoints('aC'),
            aCB_t: generatePoints('aCB_t'),
            aCD_t: generatePoints('aCD_t'),
        };

        const labels = [0, 0.25, 0.5, 0.75, 1].map(factor => {
            const value = yMax * factor;
            return {
                value: value,
                y: scaleY(value),
                label: value.toFixed(2),
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

                <h3 className={styles['title']}>Графики ускорений aC, aC/Bᵗ, aC/Dᵗ (SVG)</h3>
                <p className={styles['error-message']}>
                    Нет достаточных данных для построения графиков. Проверьте входные параметры.
                </p>
            </div>
        );
    }
    
    return (
        <div className={styles['container']}>
            {/* ИСПРАВЛЕНИЕ: Используем простой текст и HTML-сущности для верхних индексов (м/с²) */}
            <h3 className={styles['title']}>Графики ускорений aC, aC/Bᵗ, aC/Dᵗ (SVG)</h3>
            
            <svg viewBox={`0 0 ${vW} ${BASE_HEIGHT}`} width="100%" height={BASE_HEIGHT}>
                
                {/* 1. Сетка и Оси */}
                <g className={styles['grid']}>
                    {/* Горизонтальная ось (a=0) */}
                    <line 
                        x1={PADDING} 
                        y1={zY} 
                        x2={vW - PADDING} 
                        y2={zY} 
                        stroke="#000" 
                        strokeWidth="1" 
                    />
                    
                    {/* Вертикальные линии (для каждого угла) */}
                    {xL.map((l, index) => (
                        <line 
                            key={index}
                            x1={l.x} 
                            y1={PADDING} 
                            x2={l.x} 
                            y2={BASE_HEIGHT - PADDING} 
                            stroke="#ccc" 
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
                        stroke="#333" 
                        strokeWidth="1" 
                    />
                </g>

                {/* 2. Линии графиков (Polyline) */}
                <g className={styles['lines']}>
                    <polyline fill="none" stroke={LINE_COLORS[0]} strokeWidth="2" points={pData.aC} />
                    <polyline fill="none" stroke={LINE_COLORS[1]} strokeWidth="2" points={pData.aCB_t} />
                    <polyline fill="none" stroke={LINE_COLORS[2]} strokeWidth="2" points={pData.aCD_t} />
                </g>
                
                {/* 3. Точки данных */}
                <g className={styles['dots']}>
                    {/* Точки aC */}
                    {pData.aC.split(' ').filter(Boolean).map((point, index) => {
                        const [cx, cy] = point.split(',');
                        return <circle key={`aC-${index}`} cx={cx} cy={cy} r="4" fill={LINE_COLORS[0]} />;
                    })}
                    {/* Точки aCB_t */}
                    {pData.aCB_t.split(' ').filter(Boolean).map((point, index) => {
                        const [cx, cy] = point.split(',');
                        return <circle key={`aCBt-${index}`} cx={cx} cy={cy} r="4" fill={LINE_COLORS[1]} />;
                    })}
                    {/* Точки aCD_t */}
                    {pData.aCD_t.split(' ').filter(Boolean).map((point, index) => {
                        const [cx, cy] = point.split(',');
                        return <circle key={`aCDt-${index}`} cx={cx} cy={cy} r="4" fill={LINE_COLORS[2]} />;
                    })}
                </g>

                {/* 4. Метки осей */}
                <g className={styles['axis-labels']}>
                    {/* Метки оси Y (Ускорение) */}
                    {yLabels.map((l, index) => (
                        <text key={`y-label-${index}`} x={PADDING - 5} y={l.y + 4} textAnchor="end" fontSize="10" fill="#333">
                            {l.label}
                        </text>
                    ))}
                    {/* Метки оси X (Угол) */}
                    {xL.map((l, index) => (
                        <text key={`x-label-${index}`} x={l.x} y={BASE_HEIGHT - PADDING + 15} textAnchor="middle" fontSize="10" fill="#333">
                            {l.angle}°
                        </text>
                    ))}
                    
                    <text x={vW / 2} y={BASE_HEIGHT} textAnchor="middle" fontSize="12" fill="#333">
                        Угол &alpha; (°)
                    </text>
                    

                    <text x={10} y={BASE_HEIGHT / 2} textAnchor="middle" fontSize="12" fill="#333" transform={`rotate(-90, 10, ${BASE_HEIGHT / 2})`}>
                        Ускорение (м/с&sup2;)
                    </text>

                </g>

                {/* 5. Легенда */}
                <g transform={`translate(${vW - PADDING - 150}, ${10})`}> 
                    <rect x="0" y="0" width="150" height="60" fill="#fff" stroke="#ccc" rx="3"/>
                    
                    {/* aC */}
                    <line x1="5" y1="12" x2="25" y2="12" stroke={LINE_COLORS[0]} strokeWidth="2"/>
                    <text x="30" y="15" fontSize="10" fill="#333">aC (полное)</text>
                    
                    {/* aCB_t */}
                    <line x1="5" y1="32" x2="25" y2="32" stroke={LINE_COLORS[1]} strokeWidth="2"/>
                    <text x="30" y="35" fontSize="10" fill="#333">aC/Bᵗ</text>
                    
                    {/* aCD_t */}
                    <line x1="5" y1="52" x2="25" y2="52" stroke={LINE_COLORS[2]} strokeWidth="2"/>
                    <text x="30" y="55" fontSize="10" fill="#333">aC/Dᵗ</text>
                </g>
            </svg>
        </div>
    );
}