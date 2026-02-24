import {arange, LayerContent} from '../../utils/utils'
import Paragraph from './Paragraph';

type Props = {
    initial_idxs: number[],
    layers: LayerContent[]
}

export default function (props: Props) {
    let n_paragraphs: number = Math.max(...props.layers.map(layer => layer.n_paragraphs));

    return <div>{arange(n_paragraphs).map(row => 
        <div key={`text-${row}`} style={{
            boxSizing: "border-box", 
            display: "flex",
            borderBottom: "1px dashed #d8cbb2"
        }}>{props.initial_idxs.map((idx, col) =>
            <div key={`text-${row}-${col}`} style={{
                boxSizing: "border-box", 
                flexBasis: "99%",

                backgroundColor: "rgba(255, 255, 255, 0.85)",
                padding: "0.5rem 1rem 0.5rem 1rem",
                // borderRadius: "1rem",
                // boxShadow: "0 0 8px rgba(0,0,0,0.1)",
                margin:  "0 0.2rem 0 0.2rem",
                // borderRight: "1px dashed #d8cbb2"
            }}>
                {/* {preprocess_footnotes(props.layers[idx].contents[row], props.layers[idx].layer_type)} */}
                <Paragraph layer_type={props.layers[idx].layer_type} content={props.layers[idx].paragraphs[row]} />
            </div>
        )}</div>
    )}</div>
}