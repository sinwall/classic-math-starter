import styles from './MidBar.module.css'

type Props = {
    author_name: string,
    book_name: string
}

export default (props: Props) => (
    <div className={styles.midBar}>{props.author_name}, <i>{props.book_name}</i></div>
)