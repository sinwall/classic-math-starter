import styles from './AuthorName.module.css'

type Props = {
    book_id: string,
    book_name: string,
    complete: boolean
}

export default (props: Props) => (
    <div className={styles.authorWork}>
        <span><a href={"library/reader/"+props.book_id+'__'}>{props.book_name}</a> {props.complete? "" : "(incomplete)"}</span>
    </div>
)