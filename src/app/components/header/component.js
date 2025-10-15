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
                <div className={styles['icon']}>
                    <Image src={'icon.svg'} width={30} height={30} alt='logo'/>
                </div>
                <h2>Genery LAB</h2>
            </div>
            <div className={styles['controls']}>
                <StartButton 
                    isStop={isStop}
                    onClick={handleButtonClick}/>
            </div>
        </header>
    )
}