/**
 * Расчет сил инерции и моментов.
 * Все расчеты в этой функции должны быть приведены к МЕТРАМ (СИ).
 * * @param {object} sol - Результат solveMechanism (в см)
 * @param {object} vdata - Результат buildVelocityForAngle (в см)
 * @param {object} adata - Результат buildAccelerationForAngle (в см/с^2)
 * @param {number} L1, L2, L3 - Длины звеньев (в МЕТРАХ)
 * @param {number} m2, m3 - Массы звеньев 2 и 3 (кг)
 * @param {number} J2, J3 - Моменты инерции звеньев 2 и 3 (кг·м²)
 * @param {number} F - Внешняя сила (Н)
 * @returns {object} - Моменты сил (в Н·м)
 */
export function buildTorquesForAngle(sol, vdata, adata, L1, L2, L3, m2, m3, J2, J3, F) {
    if (!adata.valid) return { valid: false };

    const C_TO_M = 0.01; // Коэффициент перевода из см в м

    // --- Перевод координат в метры ---
    const B_m = { x: sol.B.x * C_TO_M, y: sol.B.y * C_TO_M };
    const C_m = { x: sol.C.x * C_TO_M, y: sol.C.y * C_TO_M };
    const D_m = { x: sol.D.x * C_TO_M, y: sol.D.y * C_TO_M };
    
    // --- Перевод ускорений в метры/с² ---
    const aB_m = { x: adata.aB_vec.x * C_TO_M, y: adata.aB_vec.y * C_TO_M };
    const aC_m = { 
        x: (adata.aCD_n_vec.x + adata.aCD_t_vec.x) * C_TO_M, 
        y: (adata.aCD_n_vec.y + adata.aCD_t_vec.y) * C_TO_M 
    };


    const S2_x = B_m.x + (C_m.x - B_m.x) / 2;
    const S2_y = B_m.y + (C_m.y - B_m.y) / 2;

    const S3_x = D_m.x + (C_m.x - D_m.x) / 2;
    const S3_y = D_m.y + (C_m.y - D_m.y) / 2;
    const S3_x_correct = D_m.x + 0.5 * (C_m.x - D_m.x);
    const S3_y_correct = D_m.y + 0.5 * (C_m.y - D_m.y);



    const L_BS2 = L2 / 2;
    const aS2n_mag = vdata.omegaBC * vdata.omegaBC * L_BS2;
    const aS2t_mag = adata.epsilonBC * L_BS2;
    
    const aS2n_x = -aS2n_mag * Math.cos(sol.angleBC);
    const aS2n_y = -aS2n_mag * Math.sin(sol.angleBC);
    const aS2t_x = -aS2t_mag * Math.sin(sol.angleBC);
    const aS2t_y = aS2t_mag * Math.cos(sol.angleBC);
    
    const aS2_x = aB_m.x + aS2n_x + aS2t_x; 
    const aS2_y = aB_m.y + aS2n_y + aS2t_y; 
    
    const L_DS3 = L3 / 2; 
    const aS3n_mag = vdata.omegaCD * vdata.omegaCD * L_DS3;
    const aS3t_mag = adata.epsilonCD * L_DS3;

    const aS3n_x = -aS3n_mag * Math.cos(sol.angleCD);
    const aS3n_y = -aS3n_mag * Math.sin(sol.angleCD);
    const aS3t_x = -aS3t_mag * Math.sin(sol.angleCD);
    const aS3t_y = aS3t_mag * Math.cos(sol.angleCD);

    const aS3_x = aS3n_x + aS3t_x;
    const aS3_y = aS3n_y + aS3t_y;

    const Fi2_x = -m2 * aS2_x;
    const Fi2_y = -m2 * aS2_y;
    const Fi3_x = -m3 * aS3_x;
    const Fi3_y = -m3 * aS3_y;

    const Mi2 = -J2 * adata.epsilonBC; 
    const Mi3 = -J3 * adata.epsilonCD; 

    const F_vec = { x: F, y: 0 }; 
    const MF_mag = C_m.x * F_vec.y - C_m.y * F_vec.x;


    const M_Fi2_A = S2_x * Fi2_y - S2_y * Fi2_x; 

    const M_Fi3_A = S3_x_correct * Fi3_y - S3_y_correct * Fi3_x;

    const M_F_A = C_m.x * F_vec.y - C_m.y * F_vec.x; 

    const Md = -(M_Fi2_A + M_Fi3_A + Mi2 + Mi3 + M_F_A); 

    return {
        valid: true,
        Md: Md, 
        MJ2: Mi2, 
        MJ3: Mi3, 
    };
}