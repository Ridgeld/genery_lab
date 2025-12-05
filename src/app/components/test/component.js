'use client'

import CM_TO_PX from "@/app/utils/cm_to_px";
import React, {useEffect, useRef} from "react"




export default function MySelfMechanism(){
    const canvasRef = useRef(null)

    const L1 = 8, L2 = 24, L3 = 16, L0 = 16;

    useEffect(() => {
        // 2. Получить ссылку на DOM-элемент
        const canvas = canvasRef.current;
        if (!canvas) return; 

        // 3. Получить контекст рисования
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.translate(canvas.width / 2, canvas.height/2);
        ctx.scale(1,-1)
        
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(10, CM_TO_PX(L2));
        ctx.strokeStyle = 'red'
        ctx.stroke()

    }, []);



    return(
        <div>
            <canvas ref={canvasRef} width={300} height={300}
                style={{
                    background: 'white'
                }}>

            </canvas>
        </div>
    )
}