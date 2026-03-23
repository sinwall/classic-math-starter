import Link from 'next/link'
import {IdName} from '../../utils/utils'

type Props = {
    author: IdName,
    book: IdName,
    sections: IdName[],
}

export default (props: Props) => (
    <>
        <div>{props.author.name}</div>
        <div><i>{props.book.name}</i></div>
        {props.sections.map(section => (
            <div key={section.id} style={{
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
            }}>
                {/* <a href={`/library/reader/${props.book.id}__${section.id}`}>{section.name}</a> */}
                <Link href={`/library/reader/${props.book.id}__${section.id}`}>{section.name}</Link>
            </div>
        ))}
    </>
)