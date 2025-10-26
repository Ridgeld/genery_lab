'use client'
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { solveMechanism, buildVelocityForAngle } from '../../../utils/kinematics';
import styles from './component.module.scss';

/**
 * Вспомогательная функция для рисования стрелки
 */
const lineColors = ['#105CFF', '#FF6969', '#FF10CF', '#10FF78']
const BgColors = ['#171717ff', '#6c6c6cff', '#']

function drawArrow(ctx, from, to, color) {
    const headlen = 20;
    const dx = to.x - from.x, dy = to.y - from.y;
    const ang = Math.atan2(dy, dx);
    ctx.strokeStyle = color || "#000";
    ctx.fillStyle = color || "#000";
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headlen * Math.cos(ang - Math.PI / 6), to.y - headlen * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(to.x - headlen * Math.cos(ang + Math.PI / 6), to.y - headlen * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

/**
 * Основная функция рисования диаграммы скоростей
 */
function drawVelocityDiagram(canvas, vdata, width, height) {
    if (!canvas) return;
    const vctx = canvas.getContext('2d');

    vctx.clearRect(0, 0, width, height);
    vctx.save();

    const offsetX = width / 2;
    const offsetY = height / 2;
    const margin = 20;

    // Сетка
    vctx.strokeStyle = BgColors[0];
    for (let x = 0; x < width; x += 40) {
        vctx.beginPath();
        vctx.moveTo(x, 0);
        vctx.lineTo(x, height);
        vctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
        vctx.beginPath();
        vctx.moveTo(0, y);
        vctx.lineTo(width, y);
        vctx.stroke();
    }

    // Оси
    vctx.strokeStyle = BgColors[1];
    vctx.lineWidth = 1;
    vctx.beginPath(); vctx.moveTo(offsetX, 0); vctx.lineTo(offsetX, height); vctx.stroke();
    vctx.beginPath(); vctx.moveTo(0, offsetY); vctx.lineTo(width, offsetY); vctx.stroke();

    if (!vdata || !vdata.valid) {
        vctx.fillStyle = lineColors[1];
        vctx.font = "14px sans-serif";
        vctx.fillText("Нет решения для плана скоростей.", 10, 20);
        vctx.restore();
        return;
    }

    // Масштаб
    const maxV = Math.max(vdata.Vb_mm, Math.abs(vdata.Vcb_mm || 0), Math.abs(vdata.Vcd_mm || 0));
    const scaleVel = ((width / 2) - margin) / maxV;

    const P_px = { x: offsetX + vdata.P_mm.x * scaleVel, y: offsetY + vdata.P_mm.y * scaleVel };
    const tip_px = {
        x: offsetX + (vdata.P_mm.x + vdata.Vb_vec_mm.x) * scaleVel,
        y: offsetY + (vdata.P_mm.y + vdata.Vb_vec_mm.y) * scaleVel
    };
    const inter_px = {
        x: offsetX + vdata.inter_mm.x * scaleVel,
        y: offsetY + vdata.inter_mm.y * scaleVel
    };

    // Конструктивные линии
    // vctx.strokeStyle = "#2c788280";
    // vctx.lineWidth = 1;
    // const u_bc_px_scale = { x: vdata.u_bc.x * scaleVel, y: vdata.u_bc.y * scaleVel };
    // vctx.beginPath();
    // vctx.moveTo(P_px.x - u_bc_px_scale.x * 1000, P_px.y - u_bc_px_scale.y * 1000);
    // vctx.lineTo(P_px.x + u_bc_px_scale.x * 1000, P_px.y + u_bc_px_scale.y * 1000);
    // vctx.stroke();

    // vctx.strokeStyle = "#e67e22";
    // vctx.beginPath();
    // const u_cd_px_scale = { x: vdata.u_cd.x * scaleVel, y: vdata.u_cd.y * scaleVel };
    // vctx.moveTo(tip_px.x - u_cd_px_scale.x * 1000, tip_px.y - u_cd_px_scale.y * 1000);
    // vctx.lineTo(tip_px.x + u_cd_px_scale.x * 1000, tip_px.y + u_cd_px_scale.y * 1000);
    // vctx.stroke();

    // Векторы скоростей
    drawArrow(vctx, P_px, tip_px, lineColors[0]);
    drawArrow(vctx, P_px, inter_px, lineColors[2]);
    drawArrow(vctx, tip_px, inter_px, lineColors[3]);

    // Точки и подписи
    vctx.fillStyle = "#000";
    vctx.strokeStyle = "#fff";
    vctx.lineWidth = 4;
    for (const p of [P_px, tip_px, inter_px]) {
        vctx.beginPath();
        vctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        vctx.fill();
        vctx.stroke();
    }

    vctx.fillStyle = "#fff";
    vctx.font = "13px sans-serif";
    vctx.fillText("P (a, d)", P_px.x + 8, P_px.y - 8);
    vctx.fillText("Vb", tip_px.x + 8, tip_px.y - 8);
    vctx.fillText("Vc", inter_px.x + 8, inter_px.y - 8);

    // Значения
    vctx.fillStyle = lineColors[0];
    vctx.font = "14px sans-serif";
    vctx.fillText("Vb = " + (vdata.Vb_mm / 1000).toFixed(3) + " м/с", 10, 20);
    vctx.fillStyle = lineColors[2];
    vctx.fillText("Vcb = " + (vdata.Vcb_mm / 1000).toFixed(3) + " м/с", 10, 40);
    vctx.fillStyle = lineColors[3];
    vctx.fillText("Vcd = " + (vdata.Vcd_mm / 1000).toFixed(3) + " м/с", 10, 60);

    vctx.restore();
}

export default function SpeedDiagram({ L0, L1, L2, L3, angle, omega }) {
    const canvasRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });

    // 🔹 Пересчитываем ширину при изменении размера окна
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

    const vdata = useMemo(() => {
        if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0) ||
            typeof angle !== 'number' || typeof omega !== 'number') {
            return null;
        }

        const sol = solveMechanism(L0, L1, L2, L3, angle);
        if (!sol.valid) return null;

        return buildVelocityForAngle(sol, L1, omega);
    }, [L0, L1, L2, L3, angle, omega]);

    useEffect(() => {
        drawVelocityDiagram(canvasRef.current, vdata, canvasSize.width, canvasSize.height);
    }, [vdata, canvasSize]);

    return (
        <div className={styles['container']}>
            <h3 className={styles['title']}>Диаграмма скоростей</h3>
            <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                style={{
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                    // border: '1px solid #ccc',
                    display: 'block',
                    margin: '0 auto'
                }}
            />
        </div>
    );
}
