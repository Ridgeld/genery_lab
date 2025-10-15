function toRad(deg){ return deg * Math.PI/180 }
function len(v){ return Math.hypot(v.x, v.y) }
function norm(v){ const L = len(v) || 1; return {x: v.x/L, y: v.y/L} }
function perp(v){ return {x: -v.y, y: v.x} } // 90° CCW (in canvas system)
function add(a,b){ return {x: a.x+b.x, y: a.y+b.y} }
function sub(a,b){ return {x: a.x-b.x, y: a.y-b.y} }
function mul(v,s){ return {x: v.x*s, y: v.y*s} }


/* ----------------------
 КИНЕМАТИКА: координаты точек
 ---------------------- */
const SCALE_MECH = 10; // 1 см -> 10 px for mechanism drawing

function solveMechanism(L0_cm, L1_cm, L2_cm, L3_cm, angleDeg){
 // A at origin (shifted later for drawing)
 const A = {x:0,y:0};
 const D = {x: L0_cm*SCALE_MECH, y:0};
 const theta = toRad(angleDeg);

 // B from A by L1 at angle theta (canvas: positive y down -> we'll invert sign for y)
 const B = {
  x: A.x + L1_cm*SCALE_MECH * Math.cos(theta),
  y: A.y - L1_cm*SCALE_MECH * Math.sin(theta)
 };

 // C as intersection of circles centered at B (r=L2) and D (r=L3)
 const r1 = L2_cm*SCALE_MECH;
 const r2 = L3_cm*SCALE_MECH;
 const dx = D.x - B.x, dy = D.y - B.y;
 const d = Math.hypot(dx,dy);

 if (d > r1 + r2 || d < Math.abs(r1 - r2)) {
  return {A,B,C:null,D,valid:false};
 }
 // choose "elbow-up" (positive h)
 const a = (r1*r1 - r2*r2 + d*d) / (2 * d);
 const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
 const xm = B.x + a * dx/d;
 const ym = B.y + a * dy/d;
 // intersection:
 const Cx = xm + (h * dy) / d;
 const Cy = ym - (h * dx) / d;
 const C = {x: Cx, y: Cy};

 return {A,B,C,D,valid:true};
}


/* ----------------------
 КИНЕМАТИКА: расчет скоростей
 ---------------------- */
function buildVelocityForAngle(sol, L1_cm, omega){
 // sol: {A,B,C,D} in px coordinates (SCALE_MECH px per cm)
 const {A,B,C,D,valid} = sol;
 if(!valid) return null;

 // unit perpendicular directions (we will use them as vectors in the velocity plane)
 const vAB = sub(B,A);
 const vBC = sub(C,B);
 const vCD = sub(D,C);

 // Направления, перпендикулярные звеньям (в Canvas-системе)
 const u_ab = norm(perp(vAB)); // направление V_b
 const u_bc = norm(perp(vBC)); // направление V_cb
 const u_cd = norm(perp(vCD)); // направление V_cd

 // magnitude of Vb in mm/s: omega(rad/s) * L1 (cm) -> convert to mm: *10
 const Vb_mm = omega * (L1_cm * 10);

 // P_mm - полюс в системе координат скоростей (в мм-единицах), берем (0,0)
 const P_mm = { x: 0, y: 0 };
 const Vb_vec_mm = { x: u_ab.x * Vb_mm, y: u_ab.y * Vb_mm }; // Вектор Vb от P_mm

 // Решаем уравнение: P + s * u_bc = (P + Vb) + t * u_cd
 // => s*u_bc - t*u_cd = Vb_vec_mm
 // Используем метод Крамера или прямое решение 2x2:
 const a = u_bc.x, b = -u_cd.x, c = u_bc.y, d = -u_cd.y;
 const Vx = Vb_vec_mm.x, Vy = Vb_vec_mm.y;
 const det = a*d - b*c;
 
 if (Math.abs(det) < 1e-9) {
  // параллельные прямые -> нет пересечения
  return { Vb_mm, Vcb_mm: null, Vcd_mm: null, u_ab, u_bc, u_cd, P_mm, Vb_vec_mm, valid:false };
 }
 const s = (Vx*d - b*Vy) / det;
 const t = (a*Vy - Vx*c) / det;

 // s = |V_cb| (мм/с) (со знаком)
 // t = |V_cd| (мм/с) (со знаком)
 
 // Координаты точки пересечения (V_c) в мм:
 const inter_mm = add(P_mm, mul(u_bc, s));

 return {
  Vb_mm,
  Vcb_mm: s,
  Vcd_mm: t,
  u_ab, u_bc, u_cd,
  P_mm,
  Vb_vec_mm,
  inter_mm, // Координаты Vc
  valid:true
 };
}

export { solveMechanism, toRad, len, norm, perp, add, sub, mul, buildVelocityForAngle };