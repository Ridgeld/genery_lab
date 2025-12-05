'use client';
import React, { useRef, useEffect, useState } from 'react';
import { solveMechanism } from '../../utils/kinematics'; 
import styles from './component.module.scss'


const CONST_CANVAS_WIDTH = 800;
const CONST_CANVAS_HEIGHT = 400;




const colors = ['#105CFF', '#FF10CF', '#10FF78']


function drawLink(mctx, p, q, color) {
    mctx.lineWidth = 10; 
    mctx.strokeStyle = color;
    mctx.beginPath(); 
    mctx.moveTo(p.x, p.y); 
    mctx.lineTo(q.x, q.y); 
    mctx.stroke();
}


function drawMechanismReact(canvas, L0, L1, L2, L3, angle, actualWidth, actualHeight) {
    if (!canvas) return;
    const mctx = canvas.getContext('2d');
    

    const originX = actualWidth * 0.1;  // Смещение начала координат по X (10% от ширины)
    const originY = actualHeight * 0.8; // Смещение начала координат по Y (80% от высоты)
    

    mctx.canvas.width = actualWidth;
    mctx.canvas.height = actualHeight;

    // Очистка и настройка контекста
    mctx.clearRect(0, 0, actualWidth, actualHeight);
    mctx.save();
    mctx.translate(originX, originY); 

    // Сетка
    mctx.strokeStyle = "#171717ff"; mctx.lineWidth = 1;

    // Ось X
    for (let x = 0; x < actualWidth - originX; x += 50) {
        mctx.beginPath(); mctx.moveTo(x, -originY); mctx.lineTo(x, actualHeight - originY); mctx.stroke();
    }
    // Ось Y
    for (let y = -originY; y < actualHeight - originY; y += 50) {
        mctx.beginPath(); mctx.moveTo(-originX, y); mctx.lineTo(actualWidth - originX, y); mctx.stroke();
    }

    // Решаем кинематику
    const sol = solveMechanism(L0, L1, L2, L3, angle);
    const { A, B, C, D, valid } = sol;

    if (!valid) {
        mctx.fillStyle = "red"; 
        mctx.font = "16px sans-serif";
        mctx.fillText("Нет геометрического решения (звенья не достигают)", 10, -originY + 20);
        mctx.restore();
        return;
    }

    // Рисуем базу AD
    mctx.lineWidth = 3; mctx.strokeStyle = "#fff";
    mctx.beginPath(); mctx.moveTo(A.x, A.y); mctx.lineTo(D.x, D.y); mctx.stroke();

    // Рисуем звенья: AB (кривошип), BC (шатун), CD
    drawLink(mctx, A, B, colors[0]); // Синий
    drawLink(mctx, B, C, colors[1]); // Зеленый
    drawLink(mctx, C, D, colors[2]); 

    // 3. Рисуем шарниры (Joints)
    mctx.fillStyle = "#000"; mctx.strokeStyle = "#fff"; mctx.lineWidth = 8;
    for (const p of [A, B, C, D]) {
        mctx.beginPath(); mctx.arc(p.x, p.y, 10, 0, Math.PI * 2); mctx.fill(); mctx.stroke();
    }
    
    // 4. Метки
    mctx.fillStyle = "#ffffffff"; mctx.font = "20px sans-serif";
    mctx.fillText("A", A.x - 18, A.y + 30);
    mctx.fillText("B", B.x - 6, B.y - 19);
    mctx.fillText("C", C.x + 6, C.y - 10);
    mctx.fillText("D", D.x + 20, D.y + 18);

    mctx.restore();
    return sol;
}

/**
 * React компонент для отображения механизма.
 */
export default function GraphicsPlace({ L0, L1, L2, L3, angle, isStop, onAngleChange }) {
    const canvasRef = useRef(null);
    const animIdRef = useRef(null);
    const angleRef = useRef(angle);

    const omega = 1; // скорость вращения
    const dt = 1 / 60;
    

    const [canvasSize, setCanvasSize] = useState({ width: CONST_CANVAS_WIDTH, height: CONST_CANVAS_HEIGHT });
    
    // Пересчитываем ширину при изменении размера окна
    useEffect(() => {
        const updateCanvasSize = () => {

            const containerWidth = canvasRef.current.parentElement.clientWidth;

            const newWidth = Math.min(containerWidth, 800); 

            
            setCanvasSize(prev => ({ width: newWidth, height: CONST_CANVAS_HEIGHT }));
        };


        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []); 


    useEffect(() => {
        if ([L0, L1, L2, L3, angle].every(v => typeof v === 'number' && !isNaN(v))) {
            drawMechanismReact(
                canvasRef.current, 
                L0, L1, L2, L3, angle, 
                canvasSize.width, canvasSize.height // Передаем актуальные размеры
            );
        }
    }, [L0, L1, L2, L3, angle, canvasSize.width, canvasSize.height]); // Зависимости


    useEffect(() => {
        if (!isStop) {

          const step = () => {

            angleRef.current = (angleRef.current + (omega * dt * 180 / Math.PI)) % 360;

            drawMechanismReact(
                canvasRef.current, 
                L0, L1, L2, L3, angleRef.current, 
                canvasSize.width, canvasSize.height
            );

            if (onAngleChange) {
              onAngleChange(angleRef.current);
            }

            animIdRef.current = requestAnimationFrame(step);
          };
          animIdRef.current = requestAnimationFrame(step);
        } else {

          if (animIdRef.current) {
            cancelAnimationFrame(animIdRef.current);
            animIdRef.current = null;
          }
        }


        return () => {
          if (animIdRef.current) {
            cancelAnimationFrame(animIdRef.current);
            animIdRef.current = null;
          }
        };
    }, [isStop, L0, L1, L2, L3, canvasSize.width, canvasSize.height]);


    return (
        <canvas 
            ref={canvasRef} 

            width={canvasSize.width} 
            height={canvasSize.height}
            className={styles['graphic']}
            style={{

                width: `${canvasSize.width}px`, 
                height: `${canvasSize.height}px`,
                display: 'block',
                margin: '0 auto'
            }}
        />
    );
}