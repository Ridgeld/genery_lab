// import { sub, add, mul, len, norm, perp } from './kinematics';

// /* ----------------------
//  КИНЕМАТИКА: расчет ускорений
//  ---------------------- */
// /**
//  * Вычисляет ускорения для заданного положения механизма.
//  * @param {object} sol - Геометрическое решение механизма (точки A, B, C, D).
//  * @param {object} vdata - Результаты расчета скоростей (Vb, Vcb, Vcd).
//  * @param {number} L1_cm - Длина звена 1 (см).
//  * @param {number} L2_cm - Длина звена 2 (см).
//  * @param {number} L3_cm - Длина звена 3 (см).
//  * @param {number} omega - Угловая скорость звена 1 (рад/с).
//  * @returns {object|null} Данные ускорений или null, если решение невозможно.
//  */

// // ГЕНИЙ


// export function buildAccelerationForAngle(sol, vdata, L1_cm, L2_cm, L3_cm, omega){
//     if (!sol.valid || !vdata.valid) return null;

//  // 1. Вычисляем нормальные ускорения
//     const { A, B, C, D } = sol;
//     const { Vb_mm, Vcb_mm, Vcd_mm } = vdata;
    
 
//  // Перевод длин L1, L2, L3 из см в мм для расчетов:
//     const L1_mm = L1_cm * 10;
//     const L2_mm = L2_cm * 10;
//     const L3_mm = L3_cm * 10;

//  // Нормальное ускорение AB (кривошип): aB_n = omega^2 * L1.
//  // Направлено от B к A (вдоль звена BA).
//     const aB_n_mag = omega * omega * L1_mm; // в мм/с^2
//     const rAB = sub(B, A);
//     const u_BA = norm(mul(rAB, -1)); // Единичный вектор BA
//     const aB_n_vec = mul(u_BA, aB_n_mag);
 
//  // Касательное ускорение AB: aB_t = epsilon * L1. Так как omega = const, epsilon = 0.
//     const aB_t_vec = { x: 0, y: 0 };
    
//     // Полное ускорение B: aB = aB_n + aB_t
//     const aB_vec = add(aB_n_vec, aB_t_vec);

//     // Нормальное ускорение BC (шатун): aCB_n = Vcb^2 / L2.
//     // Направлено от C к B (вдоль звена CB).
//     const aCB_n_mag = (Vcb_mm * Vcb_mm) / L2_mm;
//     const rBC = sub(C, B);
//     const u_CB = norm(mul(rBC, -1)); // Единичный вектор CB
//     const aCB_n_vec = mul(u_CB, aCB_n_mag);

//     // Нормальное ускорение CD: aCD_n = Vcd^2 / L3.
//     // Направлено от C к D (вдоль звена DC).
//     const aCD_n_mag = (Vcd_mm * Vcd_mm) / L3_mm;
//     const rCD = sub(D, C);
//     const u_DC = norm(mul(rCD, -1)); // Единичный вектор DC
//     const aCD_n_vec = mul(u_DC, aCD_n_mag);

//     // 2. Решаем векторное уравнение для касательных ускорений
//     // a_B + a_CB^n + a_CB^t = a_D + a_CD^n + a_CD^t
//     // a_D = 0 (точка D неподвижна)
//     // a_B + a_CB^n - a_CD^n = a_CD^t - a_CB^t
    
//     // Левая часть (известные векторы):
//     const LHS_vec = sub(add(aB_vec, aCB_n_vec), aCD_n_vec);
    
//     // Правая часть (неизвестные): a_CD^t - a_CB^t
//     // a_CB^t = s * u_CB_t; a_CD^t = t * u_CD_t
//     const rCB = sub(B, C);
//     const u_CB_t = norm(perp(rCB)); // Единичный вектор, перпендикулярный BC
//     const u_CD_t = norm(perp(rCD)); // Единичный вектор, перпендикулярный CD

//     // Уравнение: t * u_CD_t - s * u_CB_t = LHS_vec
//     // [u_CD_t.x, -u_CB_t.x; u_CD_t.y, -u_CB_t.y] * [t; s] = [LHS.x; LHS.y]
//     const a = u_CD_t.x, b = -u_CB_t.x, c = u_CD_t.y, d = -u_CB_t.y;
//     const Ax = LHS_vec.x, Ay = LHS_vec.y;
//     const det = a*d - b*c;

//     if (Math.abs(det) < 1e-9) {
//         return { aB_n_mag, aC_mag: null, aCB_mag: null, aCD_mag: null, valid: false };
//     }

//     const t = (Ax*d - b*Ay) / det; // t = |a_CD^t| (со знаком)
//     const s = (a*Ay - Ax*c) / det; // s = |a_CB^t| (со знаком)
    
//     const aCB_t_vec = mul(u_CB_t, s);
//     const aCD_t_vec = mul(u_CD_t, t);

//     // 3. Полные ускорения
//     const aCB_vec = add(aCB_n_vec, aCB_t_vec);
//     const aC_vec = add(add(aB_vec, aCB_n_vec), aCB_t_vec); // a_C = a_B + a_CB

//     return {
//     // Магнитуды
//         aB_mag: len(aB_vec), 
//         aCB_n_mag: aCB_n_mag,
//         aCD_n_mag: aCD_n_mag,
//         aCBt_mag: 0,
//         aCDt_mag: 0,
//         aC_mag: len(aC_vec),
//         aCB_mag: len(aCB_vec),
//         aCD_mag: len(aCD_t_vec) / len(u_CD_t), // Магнитуда aCD^t
        
//         // Векторы
//         aB_vec, aCB_n_vec, aCB_t_vec, aCD_n_vec, aCD_t_vec, aC_vec,
        
//         // Дополнительные данные для рисования
//         aP_mm: {x:0, y:0}, // Полюс ускорений (aA, aD)
//         aB_end_mm: aB_vec,
//         Dn_end_mm: 9, 
//         aCB_n_end: add(aB_vec, aCB_n_vec),
//         aC_end_mm: aC_vec, 
//         u_CB_t, u_CD_t,
        
//         valid: true
//     };
// }
import { sub, add, mul, len } from './kinematics';

// Вспомогательные функции (предполагается, что они есть в kinematics.js)
const norm = (v) => {
    const l = len(v);
    return l > 1e-9 ? { x: v.x / l, y: v.y / l } : { x: 0, y: 0 };
};
const perp = (v) => ({ x: -v.y, y: v.x });


/* ----------------------
 КИНЕМАТИКА: расчет ускорений
 ---------------------- */
/**
 * Вычисляет ускорения для заданного положения механизма.
 * @param {object} sol - Геометрическое решение механизма (точки A, B, C, D).
 * @param {object} vdata - Результаты расчета скоростей (Vb, Vcb, Vcd).
 * @param {number} L1_cm - Длина звена 1 (см).
 * @param {number} L2_cm - Длина звена 2 (см).
 * @param {number} L3_cm - Длина звена 3 (см).
 * @param {number} omega - Угловая скорость звена 1 (рад/с).
 * @returns {object|null} Данные ускорений или null, если решение невозможно.
 */
export function buildAccelerationForAngle(sol, vdata, L1_cm, L2_cm, L3_cm, omega){
    if (!sol.valid || !vdata.valid) return null;

 // 1. Вычисляем нормальные ускорения
    const { A, B, C, D } = sol;
    const { Vcb_mm, Vcd_mm } = vdata;
    
 // Перевод длин L1, L2, L3 из см в мм для расчетов:
    const L1_mm = L1_cm * 10;
    const L2_mm = L2_cm * 10;
    const L3_mm = L3_cm * 10;

 // Нормальное ускорение AB (кривошип): aB_n = omega^2 * L1.
 // Направлено от B к A (вдоль звена BA).
    const aB_n_mag = omega * omega * L1_mm; // в мм/с^2
    const rAB = sub(A, B);
    const u_BA = norm(mul(rAB, -1)); // Единичный вектор BA
    const aB_n_vec = mul(u_BA, aB_n_mag);
 
 // Касательное ускорение AB: aB_t = epsilon * L1. Так как omega = const, epsilon = 0.
    const aB_t_vec = { x: 0, y: 0 };
    
    // Полное ускорение B: aB = aB_n + aB_t
    const aB_vec = add(aB_n_vec, aB_t_vec);

    // Нормальное ускорение BC (шатун): aCB_n = Vcb^2 / L2.
    // Направлено от C к B (вдоль звена CB).
    const aCB_n_mag = (Vcb_mm * Vcb_mm) / L2_mm;
    const rBC = sub(C, B);
    const u_CB = norm(mul(rBC, -1)); // Единичный вектор CB
    const aCB_n_vec = mul(u_CB, aCB_n_mag);

    // Нормальное ускорение CD: aCD_n = Vcd^2 / L3.
    // Направлено от C к D (вдоль звена DC).
    const aCD_n_mag = (Vcd_mm * Vcd_mm) / L3_mm;
    const rCD = sub(D, C);
    const u_DC = norm(mul(rCD, -1)); // Единичный вектор DC
    const aCD_n_vec = mul(u_DC, aCD_n_mag);
    
    // Точка Dn на плане ускорений: a_Dn = a_D + a_CD^n. Поскольку a_D = 0 (полюс), a_Dn = a_CD^n.
    const Dn_end_vec = aCD_n_vec; 

    // 2. Решаем векторное уравнение для касательных ускорений
    // a_B + a_CB^n + a_CB^t = a_D + a_CD^n + a_CD^t  (a_D = 0)
    // a_B + a_CB^n - a_CD^n = a_CD^t - a_CB^t
    
    // Левая часть (известные векторы):
    const LHS_vec = sub(add(aB_vec, aCB_n_vec), aCD_n_vec);
    
    // Правая часть (неизвестные): a_CD^t - a_CB^t
    const rCB_for_perp = sub(C, B); // Вектор CB для перпендикуляра
    const rCD_for_perp = sub(C, D); // Вектор CD для перпендикуляра
    const u_CB_t = norm(perp(rCB_for_perp)); // Единичный вектор, перпендикулярный BC
    const u_CD_t = norm(perp(rCD_for_perp)); // Единичный вектор, перпендикулярный CD

    // Уравнение: t * u_CD_t - s * u_CB_t = LHS_vec
    // [u_CD_t.x, -u_CB_t.x; u_CD_t.y, -u_CB_t.y] * [t; s] = [LHS.x; LHS.y]
    const a = u_CD_t.x, b = -u_CB_t.x, c = u_CD_t.y, d = -u_CB_t.y;
    const Ax = LHS_vec.x, Ay = LHS_vec.y;
    const det = a*d - b*c;

    if (Math.abs(det) < 1e-9) {
        return { aB_n_mag, aC_mag: null, aCB_mag: null, aCD_mag: null, valid: false };
    }

    const t = (Ax*d - b*Ay) / det; // t = |a_CD^t| (со знаком)
    const s = (a*Ay - Ax*c) / det; // s = |a_CB^t| (со знаком)
    
    const aCB_t_vec = mul(u_CB_t, s);
    const aCD_t_vec = mul(u_CD_t, t);

    // 3. Полные ускорения
    // a_C = a_D + a_CD^n + a_CD^t = Dn_end_vec + aCD_t_vec
    const aC_vec = add(Dn_end_vec, aCD_t_vec); 

    return {
    // Магнитуды
        aB_mag: len(aB_vec), 
        aCB_n_mag: aCB_n_mag,
        aCD_n_mag: aCD_n_mag,
        aCBt_mag: Math.abs(s),
        aCDt_mag: Math.abs(t),
        aC_mag: len(aC_vec),
        
        // Векторы
        aB_vec, aCB_n_vec, aCB_t_vec, aCD_n_vec, aCD_t_vec, aC_vec,
        
        // Дополнительные данные для рисования (точки на плане ускорений)
        aP_mm: {x:0, y:0}, // Полюс ускорений (aA, aD)
        aB_end_mm: aB_vec,
        Dn_end_mm: Dn_end_vec, // Конец aCD^n от полюса P
        aCB_n_end: add(aB_vec, aCB_n_vec), // Конец aB + aCB^n (точка Cn)
        aC_end_mm: aC_vec, 
        u_CB_t, u_CD_t,
        
        valid: true
    };
}