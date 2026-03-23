'use client'
import { createContext, useState, useReducer, ActionDispatch, JSX } from 'react'
import { IdName, SectionContent } from "@/utils/utils"
import DiagramViewer from "./DiagramViewer"
import TextViewer from "./TextViewer"
import ProgressContext from '@/context/ProgressContext'

type Props = {
    author: IdName,
    book: IdName,
    section: IdName,
    n_columns: number,
    content: SectionContent,
    dgm_authors: string[]
}

function reducer(state: {pgh: number, step: number}, action: {type: string, value: number}) {
    if (action.type == 'pgh') {
        return {pgh: action.value, step: -1};
    } else {
        return {pgh: -1, step: action.value};
    }
}

export default (props: Props) => {
    const [state, dispatch] = useReducer(reducer, {pgh: 0, step: -1});

    return <>
    <ProgressContext.Provider value={{
                pgh: state.pgh, step: state.step, 
                set_pgh: (pgh: number) => dispatch({type: 'pgh', value: pgh}),
                set_step: (step: number) => dispatch({type: 'step', value: step})
            }}
        >{/* This context provides synchronized progress 
        state between the diagram and text viewers */}
        <div style={{boxSizing: "border-box", height: "100%", width: "25%"}}>
            <DiagramViewer 
                book={props.book}
                section={props.section}
                dgm_authors={props.dgm_authors} 
            />
        </div>
        <div style={{boxSizing: "border-box", width: "75%"}}>
            <TextViewer 
                author={props.author} 
                book={props.book} 
                section={props.section} 
                n_columns={props.n_columns} 
                content={props.content} 
            />
        </div>
    </ProgressContext.Provider>
    </>
}