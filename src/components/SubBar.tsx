import styles from './SubBar.module.css'

type Props = {
    message: string
}

export default (props: Props) => (
    <div className={styles.subBar}>{props.message}</div>
)