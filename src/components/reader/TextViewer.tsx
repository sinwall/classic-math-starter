'use client'
import {useState} from 'react'
import {IdName, SectionContent, arange} from '../../utils/utils'
// import TextColumn from './TextColumn'
import LayerTypeSelecter from './LayerTypeSelecter'
import ParagraphGrid from './ParagraphGrid'

type Props = {
    author: IdName,
    book: IdName,
    section: IdName,
    n_columns: number,
    content: SectionContent
}

export default function (props: Props) {
    // let n_paragraphs: number = Math.max(...props.content.layers.map(layer => layer.n_paragraphs));

    const [selected_layer_idxs, set_selected_layers] = useState(arange(props.n_columns));

    return <div style={{boxSizing: "border-box", height: "100%", width: "90%", padding: "1rem 1rem"}}>
        <div style={{boxSizing: "border-box", height: "20px"}}>
            {props.author.name}, <i>{props.book.name}</i>, {props.section.name}
        </div>
        <div style={{boxSizing: "border-box", height: "20px"}}>
            <LayerTypeSelecter layer_types={props.content.layer_types} initial_idxs={selected_layer_idxs} idxs_setter={set_selected_layers} />
        </div>
        <div style={{
            boxSizing: "border-box", 
            height: "calc(100% - 40px)",
            overflowY: "auto"
        }}>
            <ParagraphGrid initial_idxs={selected_layer_idxs} layers={props.content.layers} />
        </div>
        {/* <div style={{boxSizing: "border-box", height: "calc(100% - 20px)", display: "flex"}}>{arange(props.n_columns).map(num => 
            <TextColumn key={num} layer_type={props.content.layer_names[num]} content={props.content}/>
        )}</div> */}
    </div>
}