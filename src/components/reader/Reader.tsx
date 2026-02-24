import styles from './Reader.module.css'
import TopBar from '../TopBar'
import BottomBar from '../BottomBar'
import TextViewer from "./TextViewer"
import SectionNavigator from "./SectionNavigator"
// import type {ReaderProps as Props} from '../../context/ReaderContext'
import {IdName, SectionContent} from '../../utils/utils'

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
            <SectionNavigator author={props.author} book={props.book} sections={props.sections}/>
            <TextViewer author={props.author} book={props.book} section={props.section} n_columns={Math.min(3,props.content.layers.length)} content={props.content} />
        </div>
    </div>
)