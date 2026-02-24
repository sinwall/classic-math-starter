// import {SectionContent} from '../../utils/utils'
// import Footnote from './Footnote'

// type Props = {
//     layer_type: string,
//     content: SectionContent
// }

// const footnote_re = /<note n="(\d+)">(.*?)<\/note>/;

// function preprocess_footnotes(paragraph: string, layer_type: string) {
//     let splitted: string[] = paragraph.split(footnote_re);
//     let result = [];
//     for (let n: number=0; n<splitted.length; ++n) {
//         if (n%3 === 0) {
//             result.push(<span key={n} lang={layer_type==="ELH"? "el" : "en"} style={{hyphens: "auto"}}>{splitted[n]}</span>)
//         } else {
//             result.push(<Footnote key={n} n={splitted[n]} content={splitted[n+1]} />)
//             ++n;
//         }
//     }
//     return result;
// }

// export default (props: Props) => (
//     <div style={{
//         flexBasis: "99%", 
//         overflowY: "auto",
//         // height: 60vh;
//         // overflow-y: scroll;
//         // whiteSpace: "break-spaces",

//         backgroundColor: "rgba(255, 255, 255, 0.85)",
//         padding: "0 1rem 0 1rem",
//         borderRadius: "1rem",
//         boxShadow: "0 0 8px rgba(0,0,0,0.1)",
//         // marginBottom: "1rem",
//     }}>{props.content.layers[props.content.layer_types.indexOf(props.layer_type)].paragraphs.map((paragraph, num) =>
//         <div key={num} style={{
//             padding: "0.5rem 0 0.5rem 0",
//             borderBottom: "1px dashed #d8cbb2"
//         }}>{preprocess_footnotes(paragraph, props.layer_type)}</div>
//     )}</div>
// )