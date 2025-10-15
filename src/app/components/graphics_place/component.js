// 'use client';
// import React, { useRef, useEffect, use, useState } from 'react';
// // ✅ Исправленный путь: теперь импортируем из 'utils/kinematics'
// import { solveMechanism } from '../../utils/kinematics'; 
// import styles from './component.module.scss'

// // Константы для рисования
// const CANVAS_WIDTH = 800;
// const CANVAS_HEIGHT = 400;
// const scaleMech = 10; // 1 см -> 10 px
// const originX = 80;   // Смещение начала координат по X
// const originY = CANVAS_HEIGHT * 0.8; // Смещение начала координат по Y (нижняя часть)

// /**
//  * Вспомогательная функция для рисования одного звена.
//  */
// function drawLink(mctx, p, q, color) {
//     mctx.lineWidth = 5; 
//     mctx.strokeStyle = color;
//     mctx.beginPath(); 
//     mctx.moveTo(p.x, p.y); 
//     mctx.lineTo(q.x, q.y); 
//     mctx.stroke();
// }

// /**
//  * Основная функция рисования механизма.
//  */
// function drawMechanismReact(canvas, L0, L1, L2, L3, angle, isStop) {
//     if (!canvas) return;
//     const mctx = canvas.getContext('2d');
    
//     // Очистка и настройка контекста
//     mctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
//     mctx.save();
//     mctx.translate(originX, originY); // Перенос начала координат

//     // Рисуем сетку
//     mctx.strokeStyle = "#171717ff"; mctx.lineWidth = 1;
//     for (let x = -50; x < CANVAS_WIDTH - originX; x += 50) {
//         mctx.beginPath(); mctx.moveTo(x, -originY); mctx.lineTo(x, CANVAS_HEIGHT - originY); mctx.stroke();
//     }
//     for (let y = -originY; y < CANVAS_HEIGHT - originY; y += 50) {
//         mctx.beginPath(); mctx.moveTo(-originX, y); mctx.lineTo(CANVAS_WIDTH - originX, y); mctx.stroke();
//     }

//     // Решаем кинематику
//     const sol = solveMechanism(L0, L1, L2, L3, angle);
//     const { A, B, C, D, valid } = sol;

//     if (!valid) {
//         mctx.fillStyle = "red"; 
//         mctx.font = "16px sans-serif";
//         mctx.fillText("Нет геометрического решения (звенья не достигают)", 10, -360);
//         mctx.restore();
//         return;
//     }

//     // 1. Рисуем базу AD
//     mctx.lineWidth = 3; mctx.strokeStyle = "#fff";
//     mctx.beginPath(); mctx.moveTo(A.x, A.y); mctx.lineTo(D.x, D.y); mctx.stroke();

//     // 2. Рисуем звенья: AB (кривошип), BC (шатун), CD
//     drawLink(mctx, A, B, "#1e90ff"); // Синий
//     drawLink(mctx, B, C, "#27ae60"); // Зеленый
//     drawLink(mctx, C, D, "#e67e22"); // Оранжевый

//     // 3. Рисуем шарниры (Joints)
//     mctx.fillStyle = "#000"; mctx.strokeStyle = "#fff"; mctx.lineWidth = 4;
//     for (const p of [A, B, C, D]) {
//         mctx.beginPath(); mctx.arc(p.x, p.y, 10, 0, Math.PI * 2); mctx.fill(); mctx.stroke();
//     }
    
//     // 4. Метки
//     mctx.fillStyle = "#ffffffff"; mctx.font = "20px sans-serif";
//     mctx.fillText("A", A.x - 18, A.y + 30);
//     mctx.fillText("B", B.x - 6, B.y - 19);
//     mctx.fillText("C", C.x + 6, C.y - 10);
//     mctx.fillText("D", D.x + 20, D.y + 18);

//     mctx.restore();
//     // Возвращаем решение для возможного использования в плане скоростей
//     return sol;
// }

// /**
//  * React компонент для отображения механизма.
//  */
// export default function GraphicsPlace({ L0, L1, L2, L3, angle, isStop, onAngleChange }) {


//     useEffect(() => (
//             console.log(isStop)
//     ),[isStop])


//     const canvasRef = useRef(null);
//     const animIdRef = useRef(null);
//     const angleRef = useRef(angle);


//     const omega = 1; // скорость вращения в рад/с (можно передавать пропсом)
//     const dt = 1 / 60;
    
//     // Перерисовка при изменении любого из входных параметров
//     useEffect(() => {
//         // Проверяем, что все L-значения и угол являются числами
//         if ([L0, L1, L2, L3, angle].every(v => typeof v === 'number' && !isNaN(v))) {
//             drawMechanismReact(canvasRef.current, L0, L1, L2, L3, angle);
//         }
//     }, [L0, L1, L2, L3, angle]); // Зависимости


//         const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });
    
//         // 🔹 Пересчитываем ширину при изменении размера окна
//         useEffect(() => {
//             const updateCanvasSize = () => {
//                 const screenWidth = window.innerWidth;
//                 const newWidth = screenWidth > 600 ? screenWidth / 3 : screenWidth - 40;
//                 setCanvasSize({ width: newWidth, height: 400 });
//             };
    
//             updateCanvasSize();
//             window.addEventListener('resize', updateCanvasSize);
//             return () => window.removeEventListener('resize', updateCanvasSize);
//         }, []);


//     useEffect(() => {
//     if (!isStop) {
//       // ▶️ Запуск анимации
//       const step = () => {
//         angleRef.current = (angleRef.current + (omega * dt * 180 / Math.PI)) % 360;
//         drawMechanismReact(canvasRef.current, L0, L1, L2, L3, angleRef.current);

//         if (onAngleChange) {
//           onAngleChange(angleRef.current);
//         }

//         animIdRef.current = requestAnimationFrame(step);
//       };
//       animIdRef.current = requestAnimationFrame(step);
//     } else {
//       // ⏸ Остановка анимации
//       if (animIdRef.current) {
//         cancelAnimationFrame(animIdRef.current);
//         animIdRef.current = null;
//       }
//     }

//     // очистка при размонтировании
//     return () => {
//       if (animIdRef.current) {
//         cancelAnimationFrame(animIdRef.current);
//         animIdRef.current = null;
//       }
//     };
//   }, [isStop, L0, L1, L2, L3]);

//     return (
//         <canvas 
//             ref={canvasRef} 
//             className={styles['graphic']}
//             style={{
//                     width: `${canvasSize.width}px`,
//                     height: `${canvasSize.height}px`,
//                     // border: '1px solid #ccc',
//                     display: 'block',
//                     margin: '0 auto'
//             }}
//         />
//     );
// }
'use client';
import React, { useRef, useEffect, useState } from 'react';
// ✅ Исправленный путь: теперь импортируем из 'utils/kinematics'
// В рабочем проекте этот путь должен быть правильным:
import { solveMechanism } from '../../utils/kinematics'; 
import styles from './component.module.scss'

// ИСХОДНЫЕ КОНСТАНТЫ (будут заменены динамическими значениями из canvasSize)
// Эти константы теперь просто заглушки, но остаются для ясности, 
// поскольку CANVAS_HEIGHT используется для расчета originY.
const CONST_CANVAS_WIDTH = 800;
const CONST_CANVAS_HEIGHT = 400;

const scaleMech = 10; // 1 см -> 10 px

/**
 * Вспомогательная функция для рисования одного звена.
 */
function drawLink(mctx, p, q, color) {
    mctx.lineWidth = 5; 
    mctx.strokeStyle = color;
    mctx.beginPath(); 
    mctx.moveTo(p.x, p.y); 
    mctx.lineTo(q.x, q.y); 
    mctx.stroke();
}

/**
 * Основная функция рисования механизма.
 * Принимает фактические размеры canvas для корректной отрисовки.
 */
function drawMechanismReact(canvas, L0, L1, L2, L3, angle, actualWidth, actualHeight) {
    if (!canvas) return;
    const mctx = canvas.getContext('2d');
    
    // --- ДИНАМИЧЕСКИЕ ПАРАМЕТРЫ ---
    const originX = actualWidth * 0.1;   // Смещение начала координат по X (10% от ширины)
    const originY = actualHeight * 0.8; // Смещение начала координат по Y (80% от высоты)
    
    // Установка размеров буфера Canvas
    mctx.canvas.width = actualWidth;
    mctx.canvas.height = actualHeight;
    // --- КОНЕЦ ДИНАМИЧЕСКИХ ПАРАМЕТРОВ ---

    // Очистка и настройка контекста
    mctx.clearRect(0, 0, actualWidth, actualHeight);
    mctx.save();
    mctx.translate(originX, originY); // Перенос начала координат

    // Рисуем сетку (используем динамические размеры)
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

    // 1. Рисуем базу AD
    mctx.lineWidth = 3; mctx.strokeStyle = "#fff";
    mctx.beginPath(); mctx.moveTo(A.x, A.y); mctx.lineTo(D.x, D.y); mctx.stroke();

    // 2. Рисуем звенья: AB (кривошип), BC (шатун), CD
    drawLink(mctx, A, B, "#1e90ff"); // Синий
    drawLink(mctx, B, C, "#27ae60"); // Зеленый
    drawLink(mctx, C, D, "#e67e22"); // Оранжевый

    // 3. Рисуем шарниры (Joints)
    mctx.fillStyle = "#000"; mctx.strokeStyle = "#fff"; mctx.lineWidth = 4;
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

    const omega = 1; // скорость вращения в рад/с
    const dt = 1 / 60;
    
    // Используем константу как начальное значение для высоты
    const [canvasSize, setCanvasSize] = useState({ width: CONST_CANVAS_WIDTH, height: CONST_CANVAS_HEIGHT });
    
    // 🔹 Пересчитываем ширину при изменении размера окна
    useEffect(() => {
        const updateCanvasSize = () => {
            // Получаем ширину родительского контейнера или окна
            const containerWidth = canvasRef.current.parentElement.clientWidth;
            // Устанавливаем ширину, например, 90% от родителя, но не более 800px
            const newWidth = Math.min(containerWidth, 800); 
            
            // Если вы хотите сделать его адаптивным к экрану:
            // const screenWidth = window.innerWidth;
            // const newWidth = screenWidth > 600 ? screenWidth / 3 : screenWidth - 40;
            
            setCanvasSize(prev => ({ width: newWidth, height: CONST_CANVAS_HEIGHT }));
        };

        // Запускаем при монтировании и при изменении размера окна
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []); // Зависимости нет, выполняется один раз

    // Перерисовка при изменении canvasSize или любых входных параметров
    useEffect(() => {
        if ([L0, L1, L2, L3, angle].every(v => typeof v === 'number' && !isNaN(v))) {
            drawMechanismReact(
                canvasRef.current, 
                L0, L1, L2, L3, angle, 
                canvasSize.width, canvasSize.height // Передаем актуальные размеры
            );
        }
    }, [L0, L1, L2, L3, angle, canvasSize.width, canvasSize.height]); // Зависимости

    // Логика анимации (только изменение угла)
    useEffect(() => {
        if (!isStop) {
          // ▶️ Запуск анимации
          const step = () => {
            // ... логика анимации ...
            angleRef.current = (angleRef.current + (omega * dt * 180 / Math.PI)) % 360;
            // Вызываем отрисовку с динамическими размерами
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
          // ⏸ Остановка анимации
          if (animIdRef.current) {
            cancelAnimationFrame(animIdRef.current);
            animIdRef.current = null;
          }
        }

        // очистка при размонтировании
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
            // 🎯 Устанавливаем атрибуты width/height из стейта canvasSize (критично!)
            width={canvasSize.width} 
            height={canvasSize.height}
            className={styles['graphic']}
            style={{
                // CSS width/height теперь может быть использован для дополнительного масштабирования
                // или может быть установлен на 100% для заполнения контейнера.
                // В данном случае, просто приводим к px.
                width: `${canvasSize.width}px`, 
                height: `${canvasSize.height}px`,
                display: 'block',
                margin: '0 auto'
            }}
        />
    );
}