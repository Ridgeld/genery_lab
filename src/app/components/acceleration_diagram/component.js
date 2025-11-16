'use client'
import React, { useRef, useEffect, useMemo, useState } from 'react';

import { solveMechanism, buildVelocityForAngle, add, mul, len, sub } from '../../utils/kinematics'; 

import { buildAccelerationForAngle } from '../../utils/acceleration'; 
import styles from './component.module.scss';



const INITIAL_CANVAS_SIZE = 400;

const colors = ['#105CFF', '#FF10CF', '#10FF78', '#FF6969']
/**
 * Вспомогательная функция для рисования стрелки
 */
function drawArrow(ctx, from, to, color) {
    const headlen = 8;
    const dx = to.x - from.x, dy = to.y - from.y;
    const ang = Math.atan2(dy, dx);
    ctx.strokeStyle = color || "#fff";
    ctx.fillStyle = color || "#fff";
    ctx.lineWidth = 2; // Установлена здесь
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headlen * Math.cos(ang - Math.PI / 6), to.y - headlen * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(to.x - headlen * Math.cos(ang + Math.PI / 6), to.y - headlen * Math.sin(ang + Math.PI / 6));
    ctx.closePath(); ctx.fill();
}

/**
 * Вспомогательная функция для рисования точки/сустава
 */
function drawPoint(ctx, p, label, color = '#000', size = 5) {
    ctx.fillStyle = color; 
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath(); 
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2); 
    ctx.fill(); 
    ctx.stroke();

    ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif";
    ctx.fillText(label, p.x + 8, p.y - 8);
}

/**
 * Основная функция рисования диаграммы ускорений
 */
function drawAccelerationDiagram(canvas, adata, actualWidth, actualHeight) {
    if (!canvas) return;
    const actx = canvas.getContext('2d');
    

    actx.canvas.width = actualWidth;
    actx.canvas.height = actualHeight;
    
    actx.clearRect(0, 0, actualWidth, actualHeight);
    actx.save();
    

    const offsetX = actualWidth / 2, offsetY = actualHeight / 2;
    const margin = 40;
    const LINE_EXTENSION = 1000;

    // Сетка и оси
    actx.strokeStyle = "#171717ff"; actx.lineWidth = 1;
    for (let x = 0; x < actualWidth; x += 40) { actx.beginPath(); actx.moveTo(x, 0); actx.lineTo(x, actualHeight); actx.stroke(); }
    for (let y = 0; y < actualHeight; y += 40) { actx.beginPath(); actx.moveTo(0, y); actx.lineTo(actualWidth, y); actx.stroke(); }
    actx.strokeStyle = "#6c6c6cff"; actx.lineWidth = 1;
    actx.beginPath(); actx.moveTo(offsetX, 0); actx.lineTo(offsetX, actualHeight); actx.stroke();
    actx.beginPath(); actx.moveTo(0, offsetY); actx.lineTo(actualWidth, offsetY); actx.stroke();
    
    if (!adata || !adata.valid) {
        actx.fillStyle = colors[4]; actx.font = "14px sans-serif";
        actx.fillText("Нет решения для плана ускорений.", 10, 20);
        actx.restore(); return;
    }

    // Определение масштаба
    const allAccelMags = [adata.aB_mag, adata.aC_mag, adata.aCB_n_mag, adata.aCD_n_mag];
    const maxA = Math.max(...allAccelMags) || 1e-6; 
    
    // Масштаб для вписывания в половину ширины (или высоты, т.к. квадрат)
    // Инвертируем Y для правильного отображения декартовой системы (Y вверх)
    const scaleAccel = -(((actualWidth / 2) - margin) / maxA); // px per mm/s^2

    // Преобразование координат
    const toPx = (v_mm_s2) => {
        return {
            x: offsetX + v_mm_s2.x * scaleAccel,
            y: offsetY + v_mm_s2.y * scaleAccel
        };
    };
    
    // КООРДИНАТЫ ТОЧЕК
    const aP_px = toPx(adata.aP_mm);
    const aB_px = toPx(adata.aB_end_mm);
    const Cn_px = toPx(adata.aCB_n_end); // Конец aB + aCB^n
    const Dn_px = toPx(adata.Dn_end_mm); // Конец aCD^n от полюса P
    const aC_px = toPx(adata.aC_end_mm); // Точка пересечения

    // ОТРИСОВКА ВЕКТОРОВ
    drawArrow(actx, aP_px, aB_px, colors[0]); // aB (от P до aB) - СИНИЙ
    drawArrow(actx, aP_px, Dn_px, colors[2]); // aCD^n (от P до Dn) - ЖЕЛТЫЙ
    drawArrow(actx, aB_px, Cn_px, colors[1]); // aCB^n (от aB до Cn) - ЗЕЛЕНЫЙ


    //Строим тангенциальные векторы (от Cn до aC, от Dn до aC) ---
    drawArrow(actx, Cn_px, aC_px, "#55a852"); // aCB^t (от Cn до aC)
    drawArrow(actx, Dn_px, aC_px, "#cc5500"); // aCD^t (от Dn до aC)


    actx.lineWidth = 4; 
    drawArrow(actx, aP_px, aC_px, "#ff0000"); // aC (от P до aC)
    actx.lineWidth = 2; 

    //Рисуем точки/метки
    drawPoint(actx, aP_px, 'Π', '#0f172a'); 
    drawPoint(actx, aB_px, 'aB', '#1e90ff');
    drawPoint(actx, aC_px, 'aC', '#ff0000', 6); // Точка пересечения
    drawPoint(actx, Cn_px, 'Cn', '#27ae60'); 
    drawPoint(actx, Dn_px, 'Dn', '#f39c12'); 
    
    //Подпись значений (м/с²)
    const scaleFactor = 1000; 
    actx.fillStyle = "#fff"; actx.font = "14px sans-serif";
    actx.fillText("aB = " + (adata.aB_mag / scaleFactor).toFixed(3) + " м/с²", 10, 20);
    actx.fillStyle = "#f39c12"; actx.fillText("aCDn = " + (adata.aCD_n_mag / scaleFactor).toFixed(3) + " м/с²", 10, 40);
    actx.fillStyle = "#ff0000"; actx.fillText("aC = " + (adata.aC_mag / scaleFactor).toFixed(3) + " м/с²", 10, 60);

    actx.restore();
}


export default function AccelerationDiagram({ L0, L1, L2, L3, angle, omega }) {
    const canvasRef = useRef(null);

    const [canvasSize, setCanvasSize] = useState({ width: INITIAL_CANVAS_SIZE, height: INITIAL_CANVAS_SIZE });


    useEffect(() => {
        const updateCanvasSize = () => {            

            const screenWidth = window.innerWidth;
            const newWidth = screenWidth > 600 ? screenWidth / 3 : screenWidth - 40;
            setCanvasSize({ width: newWidth, height: 400 });
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []); 


    const adata = useMemo(() => {
        if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0) || typeof angle !== 'number' || typeof omega !== 'number') {
            return null;
        }

        const sol = solveMechanism(L0, L1, L2, L3, angle);
        if (!sol.valid) return null;

        const vdata = buildVelocityForAngle(sol, L1, omega);
        if (!vdata || !vdata.valid) return null;

        return buildAccelerationForAngle(sol, vdata, L1, L2, L3, omega);
    }, [L0, L1, L2, L3, angle, omega]);


    useEffect(() => {
        drawAccelerationDiagram(
            canvasRef.current, 
            adata, 
            canvasSize.width, 
            canvasSize.height 
        );
    }, [adata, canvasSize.width, canvasSize.height]);

    // Использование стилей из модуля
    return (
        <div className={styles['container']}>
            <h3 className={styles['title']}>Диаграмма ускорения</h3>
            <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
            />
        </div>
    );
}