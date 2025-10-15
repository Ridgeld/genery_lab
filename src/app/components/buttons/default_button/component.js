import styles from './component.module.scss'

export default function DefaultButton({name, onClick}){


    return(

        <button className={styles['body']}
                onClick={onClick}>
            {name}
        </button>
    )
}