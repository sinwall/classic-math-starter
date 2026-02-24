type Props = {
    content: string
}

export default (props: Props) => (
    <div style={{
        backgroundColor: "#f0e6d2",
        borderTop: "2px solid #c9b798",

        boxSizing: "border-box",
        height: "7%", 
        // flexDirection: "column",
        // alignItems: "center",
    }}>{props.content.split('\\n').map((line, num) =>
        <div key={num} style={{
            display: "flex",
            justifyContent: "center",
        }}>{line}</div>
    )}</div>
)