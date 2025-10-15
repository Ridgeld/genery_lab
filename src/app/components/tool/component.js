'use client'
import styles from './component.module.scss'
import Image  from 'next/image';


export default function Tool({id, name, img, onClick}){

    return(

        <button className={styles['tool']} onClick={() => onClick(id)}>
            <div className={styles['tool_icon']}>
                <Image src={img} width={60} height={60} alt={name}/>
            </div>
            <div className={styles['tool_name']}>{name}</div>
        </button>
    )
}