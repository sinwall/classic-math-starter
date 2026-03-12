import TopBar from '../TopBar'
// import BottomBar from '../BottomBar'
import DiagramViewer from "./DiagramViewer"
import TextViewer from "./TextViewer"
import SectionNavigator from "./SectionNavigator"
// import type {ReaderProps as Props} from '../../context/ReaderContext'
import {IdName, SectionContent} from '../../utils/utils'
import { KineticDiagramConfig } from '@/diagrams/on-spirals'

type Props = {
    author: IdName,
    book: IdName,
    section: IdName,
    sections: IdName[],
    content: SectionContent
}

export default (props: Props) => (
    <div style={{boxSizing: "border-box", height: "100vh", width: "100vw"}}>
        <TopBar title="Mathematica Classica per Linguas Figurasque"/>
        <div style={{display: "flex", boxSizing: "border-box", height: "calc(100% - 65px)"}}>
            <SectionNavigator 
                author={props.author} book={props.book} sections={props.sections}
            />
            <DiagramViewer 
                book={props.book}
                section={props.section} 
                // n_steps={props.diagram_config.n_steps} 
                // construction={props.diagram_config.construction} 
                // params_vals={props.diagram_config.params_vals} 
                // style_vals={props.diagram_config.style_vals}
            />
            <TextViewer 
                author={props.author} 
                book={props.book} 
                section={props.section} 
                n_columns={Math.min(3,props.content.layers.length)} 
                content={props.content} 
            />
        </div>
    </div>
)