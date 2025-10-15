// 'use client'
// import React, { useRef, useEffect, useMemo } from 'react';
// // Импортируем solveMechanism, buildVelocityForAngle и хелперы из kinematics
// // Путь изменен на более короткий для разрешения ошибки
// import { solveMechanism, buildVelocityForAngle, add, mul, len, sub } from '../../utils/kinematics'; 
// // Импортируем функцию ускорений из нового файла
// // Путь изменен на более короткий для разрешения ошибки
// import { buildAccelerationForAngle } from '../../utils/acceleration'; 
// import styles from './component.module.scss';

// const CANVAS_WIDTH = 400;
// const CANVAS_HEIGHT = 400;

// /**
//  * Вспомогательная функция для рисования стрелки
//  */
// function drawArrow(ctx, from, to, color) {
//     const headlen = 8;
//     const dx = to.x - from.x, dy = to.y - from.y;
//     const ang = Math.atan2(dy, dx);
//     ctx.strokeStyle = color || "#000";
//     ctx.fillStyle = color || "#000";
//     ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
//     ctx.beginPath();
//     ctx.moveTo(to.x, to.y);
//     ctx.lineTo(to.x - headlen * Math.cos(ang - Math.PI / 6), to.y - headlen * Math.sin(ang - Math.PI / 6));
//     ctx.lineTo(to.x - headlen * Math.cos(ang + Math.PI / 6), to.y - headlen * Math.sin(ang + Math.PI / 6));
//     ctx.closePath(); ctx.fill();
// }


// /**
//  * Основная функция рисования диаграммы ускорений
//  */
// function drawAccelerationDiagram(canvas, adata) {
//     if (!canvas) return;
//     const actx = canvas.getContext('2d');
    
//     actx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
//     actx.save();
    
//     const offsetX = CANVAS_WIDTH / 2, offsetY = CANVAS_HEIGHT / 2;
//     const margin = 20;

//     // background grid
//     actx.strokeStyle = "#f0f0f0";
//     for (let x = 0; x < CANVAS_WIDTH; x += 40) { actx.beginPath(); actx.moveTo(x, 0); actx.lineTo(x, CANVAS_HEIGHT); actx.stroke(); }
//     for (let y = 0; y < CANVAS_HEIGHT; y += 40) { actx.beginPath(); actx.moveTo(0, y); actx.lineTo(CANVAS_WIDTH, y); actx.stroke(); }
//     actx.strokeStyle = "#ddd"; actx.lineWidth = 1;
//     actx.beginPath(); actx.moveTo(offsetX, 0); actx.lineTo(offsetX, CANVAS_HEIGHT); actx.stroke();
//     actx.beginPath(); actx.moveTo(0, offsetY); actx.lineTo(CANVAS_WIDTH, offsetY); actx.stroke();
    
//     if (!adata || !adata.valid) {
//         actx.fillStyle = "#a00"; actx.font = "14px sans-serif";
//         actx.fillText("Нет решения для плана ускорений.", 10, 20);
//         actx.restore(); return;
//     }

//     // Determine acceleration scale (Scale Accel)
//     const allAccelMags = [adata.aB_mag, adata.aC_mag, adata.aCB_mag, adata.aCD_mag];
//     const maxA = Math.max(...allAccelMags);
    
//     // Scale so max acceleration fits half the canvas size (minus margin)
//     const scaleAccel = ((CANVAS_WIDTH / 2) - margin) / maxA; // px per mm/s^2

//     // Points in px coords (aP - pole (0,0), aB - end of aB, aCBn - end of aB+aCB^n, aC - end of aC)
//     const toPx = (v_mm_s2) => ({
//         x: offsetX + v_mm_s2.x * scaleAccel,
//         y: offsetY + v_mm_s2.y * scaleAccel
//     });
    
//     const aP_px = toPx(adata.aP_mm);
//     const aB_px = toPx(adata.aB_end_mm);
//     const aCBn_px = toPx(adata.aCB_n_end);
//     const aC_px = toPx(adata.aC_end_mm); // Intersection point

//     // --- Draw construction lines ---
    
//     // 1. Линия для a_CB^t (проходит через конец a_CB^n)
//     // actx.strokeStyle = "#2c788280"; actx.lineWidth = 1; 
//     // const u_CB_t_px_scale = { x: adata.u_CB_t.x * scaleAccel, y: adata.u_CB_t.y * scaleAccel };
//     // actx.beginPath();
//     // actx.moveTo(aCBn_px.x - u_CB_t_px_scale.x * 1000, aCBn_px.y - u_CB_t_px_scale.y * 1000);
//     // actx.lineTo(aCBn_px.x + u_CB_t_px_scale.x * 1000, aCBn_px.y + u_CB_t_px_scale.y * 1000);
//     // actx.stroke();

//     // 2. Линия для a_CD^t (проходит через полюс aP)
//     // actx.strokeStyle = "#e67e2280"; actx.lineWidth = 1; 
//     // const u_CD_t_px_scale = { x: adata.u_CD_t.x * scaleAccel, y: adata.u_CD_t.y * scaleAccel };
//     // actx.beginPath();
//     // actx.moveTo(aP_px.x - u_CD_t_px_scale.x * 1000, aP_px.y - u_CD_t_px_scale.y * 1000);
//     // actx.lineTo(aP_px.x + u_CD_t_px_scale.x * 1000, aP_px.y + u_CD_t_px_scale.y * 1000);
//     // actx.stroke();


//     // --- Draw acceleration vectors (Polygon aP -> aB -> aCBn -> aC) ---
    
//     // 1. aB (от aP до aB)
//     actx.strokeStyle = "#1e90ff"; actx.lineWidth = 3;
//     actx.beginPath(); actx.moveTo(aP_px.x, aP_px.y); actx.lineTo(aB_px.x, aB_px.y); actx.stroke();
//     drawArrow(actx, aP_px, aB_px, "#1e90ff"); // Blue

//     // 2. aCB^n (от aB до aCBn)
//     actx.strokeStyle = "#27ae60"; actx.lineWidth = 3;
//     actx.beginPath(); actx.moveTo(aB_px.x, aB_px.y); actx.lineTo(aCBn_px.x, aCBn_px.y); actx.stroke();
//     drawArrow(actx, aB_px, aCBn_px, "#27ae60"); // Green (dotted to show normal)
    
//     // 3. aCB^t (от aCBn до aC)
//     actx.strokeStyle = "#27ae60"; actx.lineWidth = 3;
//     actx.beginPath(); actx.moveTo(aCBn_px.x, aCBn_px.y); actx.lineTo(aC_px.x, aC_px.y); actx.stroke();
//     drawArrow(actx, aCBn_px, aC_px, "#27ae60"); 
    
//     // --- Resultant Vectors ---

//     // aC (от aP до aC)
//     actx.strokeStyle = "#e67e22"; actx.lineWidth = 3;
//     actx.beginPath(); actx.moveTo(aP_px.x, aP_px.y); actx.lineTo(aC_px.x, aC_px.y); actx.stroke();
//     drawArrow(actx, aP_px, aC_px, "#e67e22"); // Orange

//     // --- Draw joints/labels ---

//     actx.fillStyle = "#fff"; actx.strokeStyle = "#000"; actx.lineWidth = 1;
//     // P (aA, aD)
//     actx.beginPath(); actx.arc(aP_px.x, aP_px.y, 5, 0, Math.PI * 2); actx.fill(); actx.stroke();
//     // aB
//     actx.beginPath(); actx.arc(aB_px.x, aB_px.y, 5, 0, Math.PI * 2); actx.fill(); actx.stroke();
//     // aC (Intersection)
//     actx.beginPath(); actx.arc(aC_px.x, aC_px.y, 5, 0, Math.PI * 2); actx.fill(); actx.stroke();
    
//     // Annotate points
//     actx.fillStyle = "#000"; actx.font = "13px sans-serif";
//     actx.fillText("P (aA, aD)", aP_px.x + 8, aP_px.y - 8);
//     actx.fillText("aB", aB_px.x + 8, aB_px.y - 8);
//     actx.fillText("aC", aC_px.x + 8, aC_px.y - 8);

//     // Annotate values (using values from Vb_mm / 1000 to get m/s)
//     const scaleFactor = 1000; // мм/с^2 -> м/с^2
//     actx.fillStyle = "#000"; actx.font = "14px sans-serif";
//     actx.fillText("aB = " + (adata.aB_mag / scaleFactor).toFixed(3) + " м/с²", 10, 20);
//     actx.fillStyle = "#27ae60"; actx.fillText("aCB = " + (adata.aCB_mag / scaleFactor).toFixed(3) + " м/с²", 10, 40);
//     actx.fillStyle = "#e67e22"; actx.fillText("aCD = " + (adata.aCD_mag / scaleFactor).toFixed(3) + " м/с²", 10, 60);

//     actx.restore();
// }


// export default function AccelerationDiagram({ L0, L1, L2, L3, angle, omega }) {
//     const canvasRef = useRef(null);

//     // 1. Вычисляем данные ускорений
//     const adata = useMemo(() => {
//         if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0) || typeof angle !== 'number' || typeof omega !== 'number') {
//             return null;
//         }

//         const sol = solveMechanism(L0, L1, L2, L3, angle);
//         if (!sol.valid) return null;

//         const vdata = buildVelocityForAngle(sol, L1, omega);
//         if (!vdata || !vdata.valid) return null;

//         return buildAccelerationForAngle(sol, vdata, L1, L2, L3, omega);
//     }, [L0, L1, L2, L3, angle, omega]);

//     // 2. Рисуем при изменении adata
//     useEffect(() => {
//         drawAccelerationDiagram(canvasRef.current, adata);
//     }, [adata]);

//     return (
//         <div className={styles['container']}>
//             <p className={styles['label']}>Диаграмма ускорений (План)</p>
//             <canvas 
//                 ref={canvasRef} 
//                 width={CANVAS_WIDTH}
//                 height={CANVAS_HEIGHT} 
//                 style={{ 
//                     border: '1px solid #ccc',
//                     borderRadius: '8px',
//                     backgroundColor: 'white'
//                 }} 
//             />
//         </div>
//     );
// }
'use client'
import React, { useRef, useEffect, useMemo, useState } from 'react';

import { solveMechanism, buildVelocityForAngle, add, mul, len, sub } from '../../utils/kinematics'; 

import { buildAccelerationForAngle } from '../../utils/acceleration'; 
import styles from './component.module.scss';



const INITIAL_CANVAS_SIZE = 400;

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
        actx.fillStyle = "#ff9898"; actx.font = "14px sans-serif";
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
    drawArrow(actx, aP_px, aB_px, "#1e90ff"); // aB (от P до aB) - СИНИЙ
    drawArrow(actx, aP_px, Dn_px, "#f39c12"); // aCD^n (от P до Dn) - ЖЕЛТЫЙ
    drawArrow(actx, aB_px, Cn_px, "#27ae60"); // aCB^n (от aB до Cn) - ЗЕЛЕНЫЙ


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