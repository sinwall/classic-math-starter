'use client'
import { useState, useContext } from "react"
import Image from "next/image"
import { GeneralDOM } from '@/diagrams/on-spirals'
import { IdName } from '@/utils/utils'
import {configs as dgm_configs} from '../../diagrams/on-spirals'
import ProgressContext from "@/context/ProgressContext"

type Props = {
    book: IdName,
    section: IdName
}

function KineticDiagramViewer(props: Props) {
    const progress_context = useContext(ProgressContext);
    if (progress_context === undefined) {
        throw new Error("ProgressContext is undefined");
    }
    let step = progress_context.step;
    let n_steps: number = 0;
    let params_vals: number[][] = [[]];
    let style_vals: any[] = [];
    let geometries: any[] = [];
    let paragraph_to_step: number[] = [];
    for (let dgm_config of dgm_configs) {
        if (dgm_config.section_id === props.section.id) {
            paragraph_to_step = dgm_config.paragraph_to_step;
            if (step === -1) {
                step = (
                    (progress_context.pgh < paragraph_to_step.length) ? 
                    paragraph_to_step[progress_context.pgh] : 0
                );
            }
            n_steps = dgm_config.n_steps;
            params_vals = dgm_config.params_vals;
            style_vals = dgm_config.style_vals;
            geometries = dgm_config.construction(params_vals[step]);
            break;
        }
    }
    let styles = style_vals[step];
    return <>
        <input type="range" min="0" max={n_steps} value={step} step="1"
            onChange={(e) => {progress_context.set_step(Number(e.target.value))}} />
        <div>
            <svg width="100%" height="100%" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
                <g transform={"translate(5 5)"}>{geometries.map((g, idx) => 
                    <GeneralDOM key={idx} geometry={g} style={styles[idx]}/>
                )}</g>
            </svg>
        </div>
    </>
}

export default (props: Props) => {
    const [layer_idx, set_layer_idx] = useState([0]);
    const progress_context = useContext(ProgressContext);
    if (progress_context === undefined) {
        throw new Error("ProgressContext is undefined");
    }
    return <>
        <div style={{boxSizing: "border-box", width: "100%", height: "20px"}}>
            <span>
                <input type="radio" id="dgm-type-kinetic" checked={layer_idx[0]===0}
                    onChange={(e) => {set_layer_idx([0])}}/>
                <label htmlFor="dgm-type-kinetic">Kinetic</label>
                <input type="radio" id="dgm-type-printed" checked={layer_idx[0]===1}
                    onChange={(e) => {set_layer_idx([1])}}/>
                <label htmlFor="dgm-type-printed">Printed</label>
            </span>
        </div>
        <div style={{boxSizing: "border-box", width: "100%", height: "calc(100% - 20px)"}}>
            {(() => {
                if (layer_idx[0] === 0) {
                    return <KineticDiagramViewer book={props.book} section={props.section} />
                } else if (layer_idx[0] === 1) {
                    return <div style={{boxSizing: "border-box", width: "100%", position: "relative"}}>
                        <Image src={`/diagrams/on-spirals/${props.section.id}__Heiberg.png`} alt="Heiberg's diagram" width={0} height={0} style={{objectFit: "contain", width:"100%", height:"auto"}} sizes={"100vw"}/>
                        <div style={{textAlign: "center"}}>Heiberg's diagram</div>
                    </div>
                } else {
                    return <></>
                }
            })()}
        </div>
    </>
}