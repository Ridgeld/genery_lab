// utils/torques.js

/**
 * Расчет сил инерции и моментов.
 * ПРИМЕЧАНИЕ: sol, vdata, adata содержат координаты и ускорения в САНТИМЕТРАХ и см/с^2.
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
    // Ускорения aCD_n_vec и aCD_t_vec также нужно перевести, если они возвращаются в см/с²
    // Мы предполагаем, что вся adata возвращает ускорения в см/с².
    const aC_m = { 
        x: (adata.aCD_n_vec.x + adata.aCD_t_vec.x) * C_TO_M, 
        y: (adata.aCD_n_vec.y + adata.aCD_t_vec.y) * C_TO_M 
    };

    // --- Координаты центров масс (в метрах) ---
    // Используем точки в метрах
    const S2_x = B_m.x + (C_m.x - B_m.x) / 2;
    const S2_y = B_m.y + (C_m.y - B_m.y) / 2;

    const S3_x = D_m.x + (C_m.x - D_m.x) / 2; // S3 находится посередине CD. Используем D как начало отсчета звена CD.
    const S3_y = D_m.y + (C_m.y - D_m.y) / 2;
    // P.S. В вашем коде S3_x = sol.C.x + (sol.D.x - sol.C.x) / 2, это неправильно для звена DC, 
    // но в силу того, что это середина, это то же самое, что и D + (C-D)/2, только C_m и D_m должны быть началом и концом
    // Let's stick to the geometrically correct S3 = D + 0.5 * DC vector:
    const S3_x_correct = D_m.x + 0.5 * (C_m.x - D_m.x);
    const S3_y_correct = D_m.y + 0.5 * (C_m.y - D_m.y);


    // --- Ускорения центров масс (в м/с²) ---
    
    // 1. Ускорение S2: aS2 = aB + aS2/B. aB уже в м/с² (aB_m).
    const L_BS2 = L2 / 2; // L2 в метрах
    const aS2n_mag = vdata.omegaBC * vdata.omegaBC * L_BS2;
    const aS2t_mag = adata.epsilonBC * L_BS2;
    
    // Векторы aS2/B_n и aS2/B_t
    const aS2n_x = -aS2n_mag * Math.cos(sol.angleBC);
    const aS2n_y = -aS2n_mag * Math.sin(sol.angleBC);
    const aS2t_x = -aS2t_mag * Math.sin(sol.angleBC);
    const aS2t_y = aS2t_mag * Math.cos(sol.angleBC);
    
    // Теперь все в метрах/с²
    const aS2_x = aB_m.x + aS2n_x + aS2t_x; 
    const aS2_y = aB_m.y + aS2n_y + aS2t_y; 
    
    // 2. Ускорение S3: aS3 = aD + aS3/D (aD=0).
    const L_DS3 = L3 / 2; // L3 в метрах
    const aS3n_mag = vdata.omegaCD * vdata.omegaCD * L_DS3;
    const aS3t_mag = adata.epsilonCD * L_DS3;

    // Векторы aS3/D_n и aS3/D_t относительно D
    const aS3n_x = -aS3n_mag * Math.cos(sol.angleCD);
    const aS3n_y = -aS3n_mag * Math.sin(sol.angleCD);
    const aS3t_x = -aS3t_mag * Math.sin(sol.angleCD);
    const aS3t_y = aS3t_mag * Math.cos(sol.angleCD);

    // Ускорение D равно 0. 
    // aS3 = aS3/D_n + aS3/D_t
    const aS3_x = aS3n_x + aS3t_x;
    const aS3_y = aS3n_y + aS3t_y;

    // --- Силы инерции (в Н) ---
    const Fi2_x = -m2 * aS2_x;
    const Fi2_y = -m2 * aS2_y;
    const Fi3_x = -m3 * aS3_x;
    const Fi3_y = -m3 * aS3_y;

    // --- Моменты сил инерции вращения (в Н·м) ---
    const Mi2 = -J2 * adata.epsilonBC; 
    const Mi3 = -J3 * adata.epsilonCD; 

    // --- Момент внешней силы F (в Н·м) ---
    // F приложена к C по оси X. Плечо rC (в метрах)
    const F_vec = { x: F, y: 0 }; 
    const MF_mag = C_m.x * F_vec.y - C_m.y * F_vec.x; // rC x F, rC в метрах, F в Ньютонах -> Н·м

    // --- Момент Md (Приводящий момент, в Н·м) ---
    // Упрощенный метод: Сумма моментов сил инерции и внешней силы относительно A.
    // Md + M_Fi2_A + M_Fi3_A + Mi2 + Mi3 + M_F_A = 0
    
    // M_Fi2_A: Момент Fi2 относительно A
    const M_Fi2_A = S2_x * Fi2_y - S2_y * Fi2_x; // rS2 x Fi2. rS2 в метрах

    // M_Fi3_A: Момент Fi3 относительно A
    const M_Fi3_A = S3_x_correct * Fi3_y - S3_y_correct * Fi3_x; // rS3 x Fi3. rS3 в метрах

    // M_F_A: Момент F относительно A. (F приложена к C)
    const M_F_A = C_m.x * F_vec.y - C_m.y * F_vec.x; // rC x F. rC в метрах

    const Md = -(M_Fi2_A + M_Fi3_A + Mi2 + Mi3 + M_F_A); 

    return {
        valid: true,
        Md: Md, 
        MJ2: Mi2, 
        MJ3: Mi3, 
    };
}