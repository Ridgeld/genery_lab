'use client'
import React, { useMemo } from 'react';
import { solveMechanism, buildVelocityForAngle } from '../../../utils/kinematics'; 
import { buildAccelerationForAngle } from '../../../utils/acceleration'; 
import styles from './component.module.scss';
import DefaultButton from '../../buttons/default_button/component';

export default function AccelerationTable({ L0, L1, L2, L3, angle, omega }) {
  const calculationData = useMemo(() => {
    const invalid = { valid: false };

    if (![L0, L1, L2, L3].every(v => typeof v === 'number' && v > 0) || typeof angle !== 'number' || typeof omega !== 'number') {
      return invalid;
    }

    const sol = solveMechanism(L0, L1, L2, L3, angle);
    if (!sol.valid) return invalid;

    const vdata = buildVelocityForAngle(sol, L1, omega);
    if (!vdata.valid) return invalid;

    const adata = buildAccelerationForAngle(sol, vdata, L1, L2, L3, omega);
    if (!adata.valid) return invalid;

    const L2_m = L2 / 100;
    const L3_m = L3 / 100;
    const SCALE = 1000;

    const aCBt_m_s2 = adata.aCBt_mag / SCALE;
    const aCDt_m_s2 = adata.aCDt_mag / SCALE;

    const epsCB = L2_m > 1e-6 ? aCBt_m_s2 / L2_m : 0;
    const epsCD = L3_m > 1e-6 ? aCDt_m_s2 / L3_m : 0;

    const signCB = (adata.aCB_t_vec.x * (sol.C.y - sol.B.y) - adata.aCB_t_vec.y * (sol.C.x - sol.B.x)) > 0 ? 1 : -1;
    const signCD = (adata.aCD_t_vec.x * (sol.C.y - sol.D.y) - adata.aCD_t_vec.y * (sol.C.x - sol.D.x)) > 0 ? 1 : -1;

    return {
      valid: true,
      aB: adata.aB_mag / SCALE,
      aC: adata.aC_mag / SCALE,
      aCB_n: adata.aCB_n_mag / SCALE,
      aCD_n: adata.aCD_n_mag / SCALE,
      aCB_t: aCBt_m_s2,
      aCD_t: aCDt_m_s2,
      epsilonCB: epsCB,
      epsilonCD: epsCD,
      signCB: signCB > 0 ? 'Против ч.с.' : 'По ч.с.',
      signCD: signCD > 0 ? 'Против ч.с.' : 'По ч.с.'
    };
  }, [L0, L1, L2, L3, angle, omega]);

  if (!calculationData.valid) {
    return (
      <div className={styles['wrapper']}>
        <h2 className={styles['title']}>Результаты ускорений</h2>
        <p className={styles['error']}>Невозможно выполнить расчёты. Проверьте входные данные.</p>
      </div>
    );
  }

  const tableData = [
    { label: 'aB', value: calculationData.aB, unit: 'м/с²'},
    { label: 'aC/Bⁿ', value: calculationData.aCB_n, unit: 'м/с²'},
    { label: 'aC/Dⁿ', value: calculationData.aCD_n, unit: 'м/с²'},
    { label: 'aC/Bᵗ', value: calculationData.aCB_t, unit: 'м/с²'},
    { label: 'aC/Dᵗ', value: calculationData.aCD_t, unit: 'м/с²'},
    { label: 'aC (полное)', value: calculationData.aC, unit: 'м/с²'}
  ];

  const angularData = [
    { label: 'εBC', value: Math.abs(calculationData.epsilonCB), unit: 'рад/с²', direction: calculationData.signCB},
    { label: 'εCD', value: Math.abs(calculationData.epsilonCD), unit: 'рад/с²', direction: calculationData.signCD}
  ];

    const exportToCSV = () => {
      const headers = ["Тип", "Параметр", "Значение", "Ед. изм.", "Направление"];

      const rows = [
        ...tableData.map(item => [
          "Линейное ускорение",
          item.label,
          item.value.toFixed(6),
          item.unit,
          ""
        ]),
        ...angularData.map(item => [
          "Угловое ускорение",
          item.label,
          item.value.toFixed(6),
          item.unit,
          item.direction || ""
        ])
        ];

    // Формируем CSV-строку
      const csvContent = [
        headers.join(";"),
        ...rows.map(r => r.join(";"))
      ].join("\n");

      // Добавляем BOM, чтобы Excel понял UTF-8
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "acceleration_results.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
};

  return (
    <div className={styles['wrapper']}>
      <h2 className={styles['title']}>Таблица результатов ускорений</h2>

      {/* Основная таблица */}
      <div className={styles['table-block']}>
        <h3 className={styles['subtitle']}>Линейные ускорения</h3>
        <table className={styles['table']}>
          <thead>
            <tr>
              <th>Параметр</th>
              <th>Значение</th>
              <th>Ед. изм.</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, i) => (
              <tr key={i}>
                <td>{item.label}</td>
                <td>{item.value.toFixed(6)}</td>
                <td>{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Угловые ускорения */}
      <div className={styles['table-block']}>
        <h3 className={styles['subtitle']}>Угловые ускорения</h3>
        <table className={styles['table']}>
          <thead>
            <tr>
              <th>Параметр</th>
              <th>Величина</th>
            </tr>
          </thead>
          <tbody>
            {angularData.map((item, i) => (
              <tr key={i}>
                <td>{item.label}</td>
                <td>{item.value.toFixed(6)} {item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        <div className={styles['button-wrapper']}>
            <DefaultButton
            
                name={'Экспортировать в CSV'}
                onClick={exportToCSV}/>
        </div>
    </div>
  );
}
