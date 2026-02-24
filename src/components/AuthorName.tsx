import {ReactElement} from 'react'
import styles from './AuthorName.module.css'

type Props = {
    name: string,
    children: ReactElement[]
}

export default (props: Props) => (
    <div className={styles.authorName}>
        <div><span>{props.name}</span></div>
        {props.children}
    </div>
)