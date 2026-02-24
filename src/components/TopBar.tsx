// import styles from './TopBar.module.css'
import Link from 'next/link'

type Props = {
    title: string
}

export default (props: Props) => (
    <div style={{
        backgroundColor: "#f0e6d2",
        borderBottom: "2px solid #c9b798",

        padding: "0rem 2rem",
        boxSizing: "border-box",
        height: "65px",
        display: "flex",

        alignItems: "center",
        whiteSpace: "nowrap", 
        overflow: "hidden",

        justifyContent: "space-between"
    }}>
        <span style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
        }}>{props.title}</span>
        <span><Link href={"/library/"}>{"Home"}</Link></span>
    </div>
)