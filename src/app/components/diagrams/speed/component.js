'use client'
import React, { useMemo } from 'react';
import { solveMechanism, buildVelocityForAngle } from '../../../utils/kinematics'; 
import styles from './component.module.scss';


const PADDING = 40;    
const BASE_HEIGHT = 300;


const LINE_COLORS = ['#8884d8', '#82ca9d'];


// 8 положений: 0, 45, 90, ..., 315
const EIGHT_POSITIONS = Array.from({ length: 8 }, (_, i) => i * 45);

export default function VelocityGraphsSVG({ L0, L1, L2, L3, omega, isShow }) {
    

    const tableData = useMemo(() => {
        if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0) || typeof omega !== 'number') {
            return [];
        }

        return EIGHT_POSITIONS.map(angle => {
            const sol = solveMechanism(L0, L1, L2, L3, angle);
            
            if (!sol.valid) {
                return { angle, Vb: null, Vcb: null, Vcd: null, ok: false, error: "Геом. невозм." };
            }
            
            const vdata = buildVelocityForAngle(sol, L1, omega);
            
            if (!vdata || !vdata.valid) {
                return { angle, Vb: vdata.Vb_mm / 1000, Vcb: null, Vcd: null, ok: false, error: "Прямые параллельны" };
            }
            
            return {
                angle,
                Vb: vdata.Vb_mm / 1000,
                Vcb: vdata.Vcb_mm / 1000,
                Vcd: vdata.Vcd_mm / 1000,
                ok: true
            };
        });
    }, [L0, L1, L2, L3, omega]);
    
    const validData = tableData.filter(d => d.ok);


    const { pointsData, yAxisLabels, zeroY, xLabels, viewBoxWidth } = useMemo(() => {
        

        if (validData.length === 0) {
            return { 
                pointsData: { Vcb: "", Vcd: "" }, // Объекты для линий
                yAxisLabels: [], 
                zeroY: PADDING + (BASE_HEIGHT - 2 * PADDING) / 2, 
                xLabels: [],
                viewBoxWidth: 600 // Дефолтное значение для viewBox
            };
        }


        const dynamicWidth = 600; 

        const maxAbsValue = validData.reduce((max, current) => {
            const absVcb = Math.abs(current.Vcb || 0);
            const absVcd = Math.abs(current.Vcd || 0);
            return Math.max(max, absVcb, absVcd);
        }, 0);

        const yMax = maxAbsValue * 1.1 || 1; 
        const yMin = -yMax;
        
        const xMin = 0; // График начинается с 0 градусов
        const xMax = 360;

        const chartWidth = dynamicWidth - 2 * PADDING; // Рабочая область для построения
        const chartHeight = BASE_HEIGHT - 2 * PADDING;

        const scaleX = (angle) => PADDING + (angle - xMin) / (xMax - xMin) * chartWidth;
        const scaleY = (speed) => PADDING + chartHeight - ((speed - yMin) / (yMax - yMin) * chartHeight);
        
        const calculatedZeroY = scaleY(0);

        // Генерация точек для каждой линии
        const pointsVcb = validData.map(d => `${scaleX(d.angle)},${scaleY(d.Vcb)}`).join(' ');
        const pointsVcd = validData.map(d => `${scaleX(d.angle)},${scaleY(d.Vcd)}`).join(' ');

        const labels = [
            { value: yMin, y: scaleY(yMin) },
            { value: yMin / 2, y: scaleY(yMin / 2) },
            { value: 0, y: calculatedZeroY },
            { value: yMax / 2, y: scaleY(yMax / 2) },
            { value: yMax, y: scaleY(yMax) },
        ].map(l => ({
            ...l,
            label: l.value.toFixed(2), 
        }));
        
        const xAxisLabels = EIGHT_POSITIONS.map(angle => ({ // Метки для всех 8 положений
            angle: angle, 
            x: scaleX(angle)
        }));


        return { 
            pointsData: { Vcb: pointsVcb, Vcd: pointsVcd }, 
            yAxisLabels: labels, 
            zeroY: calculatedZeroY, 
            xLabels: xAxisLabels,
            viewBoxWidth: dynamicWidth
        };
    }, [tableData]); 
    

    
    if (!isShow) {
        return null;
    }
    
    if (validData.length === 0) {
        return (
            <div className={styles['container']}>
                <h3 className={styles['title']}>Графики скоростей Vcb и Vcd (SVG)</h3>
                <p className={styles['error-message']}>
                    Нет достаточных данных для построения графиков. Проверьте входные параметры.
                </p>
            </div>
        );
    }
    



    return (
        <div className={styles['container']}>
            <h3 className={styles['title']}>Графики скоростей Vcb и Vcd (SVG)</h3>
            

            <svg viewBox={`0 0 ${viewBoxWidth} ${BASE_HEIGHT}`} width="100%" height={BASE_HEIGHT}>
                
                {/* 1. Сетка и Оси */}
                <g className={styles['grid']}>
                    {/* Горизонтальная ось (V=0) */}
                    <line 
                        x1={PADDING} 
                        y1={zeroY} 
                        x2={viewBoxWidth - PADDING}
                        y2={zeroY} 
                        stroke="#000" 
                        strokeWidth="1" 
                    />
                    
                    {/* Вертикальные линии (для каждого угла) */}
                    {xLabels.map((l, index) => (
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
                        width={viewBoxWidth - 2 * PADDING} 
                        height={BASE_HEIGHT - 2 * PADDING} 
                        fill="none" 
                        stroke="#333" 
                        strokeWidth="1" 
                    />
                </g>

                {/* 2. Линии графиков (Polyline) */}
                <g className={styles['lines']}>
                    <polyline fill="none" stroke={LINE_COLORS[0]} strokeWidth="2" points={pointsData.Vcb} />
                    <polyline fill="none" stroke={LINE_COLORS[1]} strokeWidth="2" points={pointsData.Vcd} />
                </g>
                
                {/* 3. Точки данных */}
                <g className={styles['dots']}>
                    {pointsData.Vcb.split(' ').filter(Boolean).map((point, index) => { // .filter(Boolean) для пустых строк
                        const [cx, cy] = point.split(',');
                        return <circle key={`vcb-${index}`} cx={cx} cy={cy} r="4" fill={LINE_COLORS[0]} />;
                    })}
                    {pointsData.Vcd.split(' ').filter(Boolean).map((point, index) => {
                        const [cx, cy] = point.split(',');
                        return <circle key={`vcd-${index}`} cx={cx} cy={cy} r="4" fill={LINE_COLORS[1]} />;
                    })}
                </g>

                {/* 4. Метки осей */}
                <g className={styles['axis-labels']}>
                    {yAxisLabels.map((l, index) => (
                        <text key={`y-label-${index}`} x={PADDING - 5} y={l.y + 4} textAnchor="end" fontSize="10" fill="#333">
                            {l.label}
                        </text>
                    ))}
                    {xLabels.map((l, index) => (
                        <text key={`x-label-${index}`} x={l.x} y={BASE_HEIGHT - PADDING + 15} textAnchor="middle" fontSize="10" fill="#333">
                            {l.angle}°
                        </text>
                    ))}
                    
                    <text x={viewBoxWidth / 2} y={BASE_HEIGHT} textAnchor="middle" fontSize="12" fill="#333">
                        Угол α (°)
                    </text>
                    
                    <text x={10} y={BASE_HEIGHT / 2} textAnchor="middle" fontSize="12" fill="#333" transform={`rotate(-90, 10, ${BASE_HEIGHT / 2})`}>
                        Скорость (м/с)
                    </text>

                </g>

                {/* 5. Легенда */}
                <g transform={`translate(${viewBoxWidth - PADDING - 120}, ${10})`}> {/* Положение легенды */}
                    <rect x="0" y="0" width="120" height="40" fill="#fff" stroke="#ccc" rx="3"/>
                    
                    {/* Vcb */}
                    <line x1="5" y1="12" x2="25" y2="12" stroke={LINE_COLORS[0]} strokeWidth="2"/>
                    <text x="30" y="15" fontSize="10" fill="#333">Vcb (м/с)</text>
                    
                    {/* Vcd */}
                    <line x1="5" y1="32" x2="25" y2="32" stroke={LINE_COLORS[1]} strokeWidth="2"/>
                    <text x="30" y="35" fontSize="10" fill="#333">Vcd (м/с)</text>
                </g>
            </svg>
        </div>
    );
}