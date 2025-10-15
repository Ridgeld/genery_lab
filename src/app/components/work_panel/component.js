'use client'
import { useEffect, useMemo, useState } from 'react'
import NumberInput from '../inputs/number_input/component'
import styles from './component.module.scss'


export default function WorkPanel({isShow, onDataChange, angle}){

    const inputs = useMemo(() => [
        { id:'length', name: 'L1', placeholder: 'см', init: 3 },
        { id:'length', name: 'L2', placeholder: 'см', init: 3 },
        { id:'length', name: 'L3', placeholder: 'см', init: 3 },
        { id:'length', name: 'L0', placeholder: 'см', init: 3 },
        { id:'speed', name: 'Угол', placeholder: '°', init: angle ?? 45 },
        { id:'speed', name: 'W', placeholder: 'рад/c', init: 157.08 },
    ], [angle]);


    useEffect(() => {
        setInputsValue(prev => 
            prev.map(item =>
                item.name === 'Угол'
                    ? { ...item, value: angle }
                    : item
            )
        );
    }, [angle]);

    const [inputsValue, setInputsValue] = useState(
        inputs.map(input => ({ name: input.name, value: input.init ?? 0 }))
    );

    const handleInputChange = (name, newValue) => {
        console.log(name, newValue)
        const updatedValues = inputsValue.map(item => 
            item.name === name ? { ...item, value: Number(newValue) } : item
        );

        setInputsValue(updatedValues);

        if (onDataChange) {
            onDataChange(updatedValues); 
        }
    };


    return(
        <section className={styles['body']}
            style={{
                marginTop: isShow ? '0' : '-300px'
            }}>
            <div className={styles['group-row']}>
                <div className={styles['group-column']}>
                    <h3 className={styles['name']}>
                        Параметры механизма
                    </h3>
                    <div className={styles['group']}>
                        {inputs
                            .filter((input) => input.id === 'length')
                            .map((input) => (
                            <NumberInput
                                key={input.name}
                                name={input.name}
                                init={input.name === 'Угол' ? angle : input.init}
                                placeholder={input.placeholder}
                                onChange={(name, newValue) => handleInputChange(name, newValue)}
                            />
                            ))}
                    </div>
                </div>
                <div className={styles['group-column']}>
                    <h3 className={styles['name']}>
                        Параметры вращения
                    </h3>
                    <div className={styles['group']}>
                        {inputs
                            .filter((input) => input.id === 'speed')
                            .map((input) => (
                            <NumberInput
                                key={input.name}
                                name={input.name}
                                init={input.name === 'Угол' ? angle : input.init}
                                placeholder={input.placeholder}
                                onChange={(name, newValue) => handleInputChange(name, newValue)}
                            />
                            ))}
                    </div>
                </div>
            </div>
        </section>
    )
}