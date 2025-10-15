import styles from './component.module.scss'


export default function StartButton({isStop, onClick}){

    return(
        <button 
            className={`${styles['start_button']} ${isStop ? styles['anactive'] : styles['active']}`}
            onClick={onClick}>
            {isStop ? 'Пауза' : 'Старт'}
        </button>
    )

}