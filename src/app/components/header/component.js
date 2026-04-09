'use client'
import Image from 'next/image'
import styles from './component.module.scss'
import { useState } from 'react'
import StartButton from '../buttons/start_button/component'
import IconButton from '../icon_buttons/component'
export default function Header({onButtonClick, onIconButtonClick}){
    
    const [isStop, setIsStop] = useState(false)
    const [isReverse, setIsReverse] = useState(false)

    const handleButtonClick = () =>{
        setIsStop(!isStop)
        onButtonClick(isStop)
    }
    const handleIconButtonClick = () =>{
        setIsReverse(!isReverse)
        onIconButtonClick(isReverse)
    }

    return(
        <header className={styles['header']}>
            <div className={styles['logo']}>
                <h2>Расчет механизма</h2>
            </div>
            <div className={styles['controls']}>
                <IconButton 
                    isReverse={isReverse}
                    icon={(
                    <svg width="38" height="44" viewBox="0 0 38 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.00844 11.9613C7.67166 10.2926 9.64836 8.96917 11.8248 8.06713C14.0013 7.16508 16.3347 6.70219 18.6907 6.70509C23.4487 6.70569 28.0116 8.59606 31.376 11.9605C34.7404 15.3249 36.6308 19.8878 36.6314 24.6458C36.6308 29.4058 34.7411 33.9711 31.3774 37.3391C28.0136 40.7071 23.4507 42.6025 18.6907 42.6091C13.9302 42.6025 9.36701 40.7068 6.00319 37.3383C2.63937 33.9698 0.749995 29.404 0.75 24.6435" stroke="white" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round"/>
                        <path d="M7.64891 0.75L5.49938 9.47937C5.30859 10.2531 5.43252 11.071 5.84398 11.7535C6.25544 12.436 6.92083 12.9275 7.69417 13.12L16.4484 15.265" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>)}
                    onClick={handleIconButtonClick}/>
                <StartButton 
                    isStop={isStop}
                    onClick={handleButtonClick}/>
            </div>
        </header>
    )
}