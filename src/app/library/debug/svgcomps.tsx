// 'use client'
// import { JSX } from 'react';
// import {useState} from 'react'
// import { arange } from '@/utils/utils';
// import { GeneralDOM } from '@/diagrams/on-spirals'
// import {geometry_construction, n_steps, params_vals, style_vals} from '@/diagrams/on-spirals'


// export default () => {
//     let [step, setStep] = useState(0);
//     let geometries = geometry_construction(params_vals[step]);
//     let styles = style_vals[step];

//     return <><div style={{width: "30%", height: "100%"}}>
//         <div>
//         <svg width="100%" height="100%" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
//             <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
//             <g transform={"translate(5 5)"}>{geometries.map((g, idx) => 
//             <GeneralDOM key={idx} geometry={g} style={styles[idx]}/>
//             )}</g>
//         </svg>
//         </div>
//     <input type="range" min="0" max={n_steps} defaultValue="0" step="1" 
//         onChange={(e) => {setStep(Number(e.target.value))}} />
//     </div>
//     {/* <button onClick={(e) => {setStep((step+1)%n_steps);}}>{"abcde"}</button> */}
//     </>
// }