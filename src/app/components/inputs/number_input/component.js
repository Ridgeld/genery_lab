'use client'
import { useEffect, useState } from 'react'
import styles from './component.module.scss'

export default function NumberInput({ name, init, placeholder, onChange }) {
    const [value, setValue] = useState(init);

    // 🔄 Синхронизируем локальное состояние, если init меняется (например, из WorkPanel → angle)
    useEffect(() => {
        setValue(init.toFixed(0));
    }, [init]);

    const handleChange = (e) => {
        const newValue = e.target.value;

        setValue(newValue); 
        if (onChange) onChange(name, newValue);
    };

    return (
        <div className={styles['body']}> 
            <div className={styles['name']}>{name}</div>
            <input 
                type="number" 
                min={1} 
                value={value} 
                placeholder={placeholder} 
                onChange={handleChange} 
            />
        </div>
    );
}
