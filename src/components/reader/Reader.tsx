import TopBar from '../TopBar'
import SectionNavigator from "./SectionNavigator"
import {IdName, SectionContent} from '../../utils/utils'
import SyncedViewer from './SyncedViewer'
import { JSX } from 'react'


type Props = {
    author: IdName,
    book: IdName,
    section: IdName,
    sections: IdName[],
    content: SectionContent,
    dgm_authors: string[]
}

export default (props: Props) => (
    <div style={{boxSizing: "border-box", height: "100vh", width: "100vw"}}>
        <TopBar title="Mathematica Classica per Linguas Figurasque"/>
        <div style={{display: "flex", boxSizing: "border-box", height: "calc(100% - 65px)"}}>
            <div style={{
                boxSizing: "border-box",padding: "1rem 1rem", width: "10%", overflow: "auto", resize: "horizontal"
            }}>
                <SectionNavigator 
                    author={props.author} book={props.book} sections={props.sections}
                />
            </div>
            <div style={{
                boxSizing: "border-box", height: "100%", width: "90%"
            }}>
                <div style={{boxSizing: "border-box", height: "20px", textAlign: "center"}}>
                    {props.author.name}, <i>{props.book.name}</i>, {props.section.name}
                </div>
                <div style={{display: "flex", boxSizing: "border-box", height: "calc(100% - 20px)"}}>
                    <SyncedViewer
                        author={props.author} 
                        book={props.book} 
                        section={props.section} 
                        n_columns={Math.min(3,props.content.layers.length)} 
                        content={props.content} 
                        dgm_authors={props.dgm_authors}
                    />
                </div>
            </div>
        </div>
    </div>
)