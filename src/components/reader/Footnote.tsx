'use client'
type Props = {
    n: string,
    content: string
}

export default (props: Props) => (
    <span onClick={() => alert(`[${props.n}] ` + props.content)}><a href="#"><sup style={{color: "blue"}}>{`[${props.n}]`}</sup></a></span>
)