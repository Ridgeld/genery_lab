'use client'
import styles from "./page.module.scss";
import Header from "./components/header/component";
import Toolbar from "./components/toolbar/component";
import tools from './tools.js'
import WorkPanel from "./components/work_panel/component";
import { useState } from "react";
import GraphicsPlace from "./components/graphics_place/component";
import VelocityTable from "./components/tables/velocity_table/component";
import SpeedDiagram from "./components/diagram/speed_diagram/component";
import AccelerationDiagram from "./components/acceleration_diagram/component";
import AccelerationTable from "./components/tables/acceleration_table/component";
import VelocityGraphsSVG from "./components/diagrams/speed/component";
import AccelerationGraphsSVG from "./components/diagrams/accelerate/component";
import TorquesGraphsSVG from "./components/diagrams/strength/component";

export default function Home() {
  const [mechanismData, setMechanismData] = useState([
    { name: "L1", value: 0 },
    { name: "L2", value: 0 },
    { name: "L3", value: 0 },
    { name: "L0", value: 0 },
    { name: "angle", value: 90 },
    { name: 'omega', value: 0},
    { name: 'L1_m', value: 1},
    { name: 'L2_m', value: 1},
    { name: 'L3_m', value: 1},
    { name: 'F_ext', value: 1},
  ]);
  const [isInputShow, setIsInputShow] = useState(false);
  const [isTableShow, setITablesShow] = useState(false);
  const [isAccelerationShow, setIsAccelerationShow] = useState(false);
  const [isDiagramsShow, setIsDiagramsShow] = useState(false)
  const [isStop, setIsStop] = useState(true);

  // Обновление всех данных механизма
  const handleWorkPanelChange = (data) => {
    setMechanismData(data);
    console.log(data)
  };

  // Универсальный обработчик изменения угла
  const handleAngleChange = (newAngle) => {
    setMechanismData((prev) => {
      const updated = [...prev];
      if (updated[4]) {
        updated[4] = { ...updated[4], value: newAngle };
      } else {
        updated[4] = { name: "angle", value: newAngle };
      }
      return updated;
    });
  };

  const handleToolClick = (id) => {
    if (id === 1) setIsInputShow(!isInputShow);
    if (id === 2) setITablesShow(!isTableShow);
    if (id === 3) setIsAccelerationShow(!isAccelerationShow)
    if (id === 4) setIsDiagramsShow(!isDiagramsShow)
  };

  const handleButtonClick = (isStop) => {
    setIsStop(isStop);
  };

  return (
    <div className={styles['container']}>
      <Header onButtonClick={handleButtonClick} />
      <Toolbar tools={tools} toolClick={handleToolClick}>
        <WorkPanel
            isShow={isInputShow}
            angle={mechanismData[4]?.value ?? 90}        
            onAngleChange={handleAngleChange}       
            onDataChange={handleWorkPanelChange}
          />
      </Toolbar>

      <div className={styles['group-column']}>
          <div className={styles['group-row']}>
            <GraphicsPlace
              isStop={isStop}
              L1={mechanismData[0]?.value ?? 0}
              L2={mechanismData[1]?.value ?? 0}
              L3={mechanismData[2]?.value ?? 0}
              L0={mechanismData[3]?.value ?? 0}
              angle={mechanismData[4]?.value ?? 90}
              onAngleChange={handleAngleChange}             // обновление при анимации
            />
            <SpeedDiagram
                L1={mechanismData[0]?.value ?? 0}
                L2={mechanismData[1]?.value ?? 0}
                L3={mechanismData[2]?.value ?? 0}
                L0={mechanismData[3]?.value ?? 0}
                angle={mechanismData[4]?.value ?? 90}         // ← единый источник
                omega={mechanismData[5]?.value ?? 0.157}
              />
          </div>
            <VelocityTable
                L1={mechanismData[0]?.value ?? 0}
                L2={mechanismData[1]?.value ?? 0}
                L3={mechanismData[2]?.value ?? 0}
                L0={mechanismData[3]?.value ?? 0}
                omega={mechanismData[5]?.value ?? 0.157}
                isShow={isTableShow}
            />
            <div className={styles['group-row']}>
              {isAccelerationShow && <>
              
                <AccelerationDiagram
                  L1={mechanismData[0]?.value ?? 0}
                  L2={mechanismData[1]?.value ?? 0}
                  L3={mechanismData[2]?.value ?? 0}
                  L0={mechanismData[3]?.value ?? 0}
                  angle={mechanismData[4]?.value ?? 90}        
                  omega={mechanismData[5]?.value ?? 0.157}/>
                <AccelerationTable
                  L1={mechanismData[0]?.value ?? 0}
                  L2={mechanismData[1]?.value ?? 0}
                  L3={mechanismData[2]?.value ?? 0}
                  L0={mechanismData[3]?.value ?? 0}
                  angle={mechanismData[4]?.value ?? 90}         
                  omega={mechanismData[5]?.value ?? 0.157}/>
                </>}
            </div>
            <div className={styles['group-row']}>
              <VelocityGraphsSVG
                L1={mechanismData[0]?.value ?? 0}
                L2={mechanismData[1]?.value ?? 0}
                L3={mechanismData[2]?.value ?? 0}
                L0={mechanismData[3]?.value ?? 0}
                omega={mechanismData[5]?.value ?? 0.157}
                isShow={isDiagramsShow}/>
              <AccelerationGraphsSVG
                L1={mechanismData[0]?.value ?? 0}
                L2={mechanismData[1]?.value ?? 0}
                L3={mechanismData[2]?.value ?? 0}
                L0={mechanismData[3]?.value ?? 0}
                angle={mechanismData[4]?.value ?? 90} 
                omega={mechanismData[5]?.value ?? 0.157}
                isShow={isDiagramsShow}/>
            </div>
            <div className={styles['group-row']}>
              <TorquesGraphsSVG
                L1={mechanismData[0]?.value ?? 0}
                L2={mechanismData[1]?.value ?? 0}
                L3={mechanismData[2]?.value ?? 0}
                L0={mechanismData[3]?.value ?? 0}
                omega={mechanismData[5]?.value ?? 0.157}
                m1={mechanismData[6]?.value ?? 1}
                m2={mechanismData[7]?.value ?? 1}
                m3={mechanismData[8]?.value ?? 1}
                F_ext={mechanismData[9]?.value ?? 1} 
                isShow={isDiagramsShow}/>
            </div>
      </div>
    </div>
  );
}
