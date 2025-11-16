'use client'
import Image from 'next/image'
import styles from './component.module.scss'
import { useState } from 'react'
import StartButton from '../buttons/start_button/component'
export default function Header({onButtonClick}){
    
    const [isStop, setIsStop] = useState(false)

    const handleButtonClick = () =>{
        setIsStop(!isStop)
        onButtonClick(isStop)
    }

    return(
        <header className={styles['header']}>
            <div className={styles['logo']}>
                <h2>Расчет механизма</h2>
            </div>
            <div className={styles['controls']}>
                <StartButton 
                    isStop={isStop}
                    onClick={handleButtonClick}/>
            </div>
        </header>
    )
}