'use client'
import { useState, useEffect } from "react"
import { GeneralDOM } from '@/diagrams/on-spirals'
import { IdName } from '@/utils/utils'
import {configs as dgm_configs} from '../../diagrams/on-spirals'

type Props = {
    book: IdName,
    section: IdName,
    // n_steps: number,
    // params_vals: number[][],
    // style_vals: any[]
}

export default (props: Props) => {
    let [layer_idx, set_layer_idx] = useState(0);
    let [step, set_step] = useState(0);
    let n_steps: number = 0;
    let params_vals: number[][] = [[]];
    let style_vals: any[] = [];
    let geometries: any[] = [];
    for (let dgm_config of dgm_configs) {
        if (dgm_config.section_id === props.section.id) {
            n_steps = dgm_config.n_steps;
            params_vals = dgm_config.params_vals;
            style_vals = dgm_config.style_vals;
            geometries = dgm_config.construction(params_vals[step]);
            break;
        }
    }
    let styles = style_vals[step];
    return <div>
        <div style={{boxSizing: "border-box", width: "100%", height: "20px"}}>
            <span>
                <input type="radio" id="dgm-type-kinetic" onChange={(e) => {}}/>
                <label htmlFor="dgm-type-kinetic">Kinetic</label>
            </span>
        </div>
        <div style={{boxSizing: "border-box", width: "100%", height: "calc(100%-20px)"}}>
        <div>
        <svg width="100%" height="100%" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
            <g transform={"translate(5 5)"}>{geometries.map((g, idx) => 
            <GeneralDOM key={idx} geometry={g} style={styles[idx]}/>
            )}</g>
        </svg>
        </div>
    <input type="range" min="0" max={n_steps} defaultValue="0" step="1" 
        onChange={(e) => {set_step(Number(e.target.value))}} />
    </div>
    </div>
}