'use client'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { IdName } from '@/utils/utils';
import Footnote from './Footnote'

const footnote_re = /<note n="(\d+)">(.*?)<\/note>/;

function preprocess_footnotes(paragraph: string, layer_type: string) {
    let splitted: string[] = paragraph.split(footnote_re);
    let result = [];
    for (let n: number=0; n<splitted.length; ++n) {
        if (n%3 === 0) {
            // result.push(<span key={n} style={{hyphens: "auto"}}>{splitted[n]}</span>)
            result.push(<span key={n} lang={layer_type==="ELH"? "el" : "en"} style={{hyphens: "auto"}}>{splitted[n]}</span>)
        } else {
            result.push(<Footnote key={n} n={splitted[n]} content={splitted[n+1]} />)
            ++n;
        }
    }
    return result;
}


function ParagraphELH (props: {content: string}) {
    return <div>
        {preprocess_footnotes(props.content, 'ELH')}
    </div>
}

function ParagraphKOR(props: {content: string}) {
    return <div>
        {preprocess_footnotes(props.content, 'KOR')}
    </div>
}

function ParagraphMAT(props: {content: string}) {
    const ref = useRef(null);
    useEffect(() => {
        const mathjax = (global as any).MathJax;
        if (mathjax !== undefined) {
            try {
                mathjax.typeset([ref.current]);
            } catch (error) {
                console.log(error);
            }
        } else {
            console.log('undef')
        }
    }, []);
    return <div ref={ref}>
        {preprocess_footnotes(props.content, 'MAT')}
    </div>
}

type Props = {
    layer_type: IdName,
    content: string
}

export default function (props: Props) {
    if (props.layer_type.id === 'ELH') {
        return <ParagraphELH content={props.content}/>
    } else if (props.layer_type.id === 'KOR') {
        return <ParagraphKOR content={props.content}/>
    } else {
        return <ParagraphMAT content={props.content}/>
    } 
    // useEffect(() => {
    //     if (props.layer_type !== 'MAT') { return; }
    //     try {
    //         (global as any).MathJax.typeset();
    //         console.log('aaaa');
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }, []);
    // return <div lang={props.layer_type === "ELH"? "el": undefined}>
    //     {preprocess_footnotes(props.content, props.layer_type)}
    // </div>
}