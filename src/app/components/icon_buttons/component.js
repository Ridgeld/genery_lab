import styles from './component.module.scss'


export default function IconButton({icon, onClick}){

    return(
        <button 
            className={`${styles['button']}`}
            onClick={onClick}>
            {icon}
        </button>
    )

}