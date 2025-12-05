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
import DynamicsTable from "./components/tables/torque_table/component";
import ImpactPowerGraph from "./components/diagrams/impact/component";
import ImpactPowerTable from "./components/tables/impact_table/component";

export default function Home() {

  const [mechanismData, setMechanismData] = useState([
    { name: "L1", value: 0 },
    { name: "L2", value: 0 },
    { name: "L3", value: 0 },
    { name: "L0", value: 0 },
    { name: "angle", value: 90 },
    { name: 'omega', value: 0.157},
    { name: 'L1_m', value: 1},
    { name: 'L2_m', value: 1},
    { name: 'L3_m', value: 1},
    { name: 'F_ext', value: 1},
  ]);


  const [views, setViews] = useState({
    input: false,
    table: false,
    acceleration: false,
    diagrams: false
  });
  
  const [isStop, setIsStop] = useState(true);


  const L1 = mechanismData[0]?.value ?? 0;
  const L2 = mechanismData[1]?.value ?? 0;
  const L3 = mechanismData[2]?.value ?? 0;
  const L0 = mechanismData[3]?.value ?? 0;
  const angle = mechanismData[4]?.value ?? 90;
  const omega = mechanismData[5]?.value ?? 0.157;
  const m1 = mechanismData[6]?.value ?? 1;
  const m2 = mechanismData[7]?.value ?? 1;
  const m3 = mechanismData[8]?.value ?? 1;
  const F_ext = mechanismData[9]?.value ?? 1;



  const handleWorkPanelChange = (data) => {
    setMechanismData(data);
    console.log(data);
  };

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
    setViews(prev => ({
      ...prev,
      input: id === 1 ? !prev.input : prev.input,
      table: id === 2 ? !prev.table : prev.table,
      acceleration: id === 3 ? !prev.acceleration : prev.acceleration,
      diagrams: id === 4 ? !prev.diagrams : prev.diagrams,
    }));
  };

  const handleButtonClick = (val) => {
    setIsStop(val);
  };



  return (
    <div className={styles['container']}>
      <Header onButtonClick={handleButtonClick} />
      <Toolbar tools={tools} toolClick={handleToolClick}>
        <WorkPanel
            isShow={views.input}
            angle={angle}        
            onAngleChange={handleAngleChange}       
            onDataChange={handleWorkPanelChange}
          />
      </Toolbar>

      <div className={styles['group-column']}>
          <div className={styles['group-row']}>
            <GraphicsPlace
              isStop={isStop}
              L1={L1} L2={L2} L3={L3} L0={L0} angle={angle}
              onAngleChange={handleAngleChange}
            />
            <SpeedDiagram 
              L1={L1} L2={L2} L3={L3} L0={L0} angle={angle} omega={omega}
            />
          </div>

          <VelocityTable
            L1={L1} L2={L2} L3={L3} L0={L0} omega={omega}
            isShow={views.table}
          />

          <div className={styles['group-row']}>
            {views.acceleration && <>
              <AccelerationDiagram 
                L1={L1} L2={L2} L3={L3} L0={L0} angle={angle} omega={omega}
              />
              <AccelerationTable 
                L1={L1} L2={L2} L3={L3} L0={L0} angle={angle} omega={omega}
              />
            </>}
          </div>

          <div className={styles['group-row']}>
            <VelocityGraphsSVG 
              L1={L1} L2={L2} L3={L3} L0={L0} omega={omega} 
              isShow={views.diagrams}
            />
            <AccelerationGraphsSVG 
              L1={L1} L2={L2} L3={L3} L0={L0} angle={angle} omega={omega} 
              isShow={views.diagrams}
            />
          </div>

          <div className={styles['group-row']}>
            <TorquesGraphsSVG 
              L1={L1} L2={L2} L3={L3} L0={L0} omega={omega} 
              m1={m1} m2={m2} m3={m3} F_ext={F_ext} 
              isShow={views.diagrams}
            />
            <DynamicsTable 
              L1={L1} L2={L2} L3={L3} L0={L0} omega={omega} 
              m1={m1} m2={m2} m3={m3} F_ext={F_ext} 
              isShow={views.diagrams}
            />
          </div>

          <div className={styles['group-row']}>
            <ImpactPowerGraph 
              L1={L1} L2={L2} L3={L3} L0={L0} omega={omega} 
              m1={m1} m2={m2} m3={m3} F_ext={F_ext} 
              isShow={views.diagrams}
            />
            <ImpactPowerTable 
              L1={L1} L2={L2} L3={L3} L0={L0} omega={omega} 
              m1={m1} m2={m2} m3={m3} F_ext={F_ext} 
              isShow={views.diagrams}
            />
          </div>
      </div>
    </div>
  );
}