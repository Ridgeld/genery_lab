'use client'
import Image from 'next/image'
import styles from './component.module.scss'
import Tool from '../tool/component'


export default function Toolbar({tools, toolClick, children}){


    // const onToolHandleClick = (id) =>{
    //     console.log(id)
    // }
    return(
        <section className={styles['toolbar']}>
            <div className={styles['body']}>
                {tools.map((tool) => (
                    <Tool 
                        id={tool.id}
                        key={tool.id}
                        name={tool.name}
                        img={tool.img}
                        onClick={toolClick}
                        />
                ))}
            </div>
            <div className={styles['tabs']}>
                {children}
            </div>
        </section>
    )

}