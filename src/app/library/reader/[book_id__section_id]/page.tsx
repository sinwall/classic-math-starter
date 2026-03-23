import Image from "next/image"
import Reader from '../../../../components/reader/Reader'
import {IdName, SectionContent} from '../../../../utils/utils'
import {sections_dict, paragraphs_dict, assets_dir} from '../../../../utils/library'
import { JSX } from "react"

type RouteParams = {
    book_id__section_id: string
}


export default async function Home(
    context: { params: Promise<RouteParams> }
) {
    const params: RouteParams = await context.params;

    // read and parse book_id and section_id from params
    const book_id_section_id: string[] = params.book_id__section_id.split('__');
    let author: IdName = {id: '', name: ''};
    let book: IdName = {id: book_id_section_id[0], name: ''};
    let section: IdName = {id: book_id_section_id[1], name: ''};
    let sections: IdName[] = [];
    // let dgm_elements: JSX.Element[] = [];
    let dgm_authors: string[] = [];
    // query sections_dict to find author name, book name, section name, and sections in the same book
    for (let ln: number=0; ln<sections_dict.size(); ++ln) {
        const line = sections_dict.selectRow(ln);
        if (line.get('book_id') === book.id) {
            author.id = line.get('author_id');
            author.name = line.get('author_name');
            book.name = line.get('book_name');
            if (section.id === '') {
                section.id = line.get('section_id');
            }
            if (section.id === line.get('section_id')) {
                section.name = line.get('section_name');
                for (let key of sections_dict.keys()) {
                    if (key.startsWith('has_diagram_') && line.get(key) === '1') {
                        let dgm_author_name = key.slice('has_diagram_'.length);
                        dgm_authors.push(dgm_author_name);
                        // dgm_elements.push(
                        //     <div key={dgm_author_name} style={{boxSizing: "border-box", width: "100%", position: "relative"}}>
                        //         <Image src={`/diagrams/on-spirals/${section.id}__${dgm_author_name}.png`} alt="Heiberg's diagram" width={0} height={0} style={{objectFit: "contain", width:"100%", height:"auto"}} sizes={"100vw"}/>
                        //         <div style={{textAlign: "center"}}>{dgm_author_name}'s diagram</div>
                        //     </div>
                        // )
                    }
                }
            }
            sections.push({id: line.get('section_id'), name: line.get('section_name')});
        }
    }
    // // read diagram config from src/diagrams/${book.id}.tsx
    // const {configs: diagram_configs} = await import(`../../../../diagrams/${book.id}.tsx`);
    // let dgm_config: KineticDiagramConfig = diagram_configs[0];
    // for (let c of diagram_configs) {
    //     if (c.section_id === section.id) {
    //         dgm_config = c;
    //         break;
    //     }
    // }
    // query paragraphs_dict to find paragraphs in the section, and organize them by layers
    let paragraphs: SectionContent = {
        n_layers: 0,
        layer_types: [],
        layers: []
    };
    for (let ln: number=0; ln<paragraphs_dict.size(); ++ln) {
        if (
            (paragraphs_dict.get('book_id')[ln] === book.id)
            && (paragraphs_dict.get('section_id')[ln] === section.id)
        ) {
            const layer_type: IdName = {
                id: paragraphs_dict.get('layer_type_id')[ln],
                name: paragraphs_dict.get('layer_type_name')[ln]
            };
            for (let idx: number=0; idx<=paragraphs.n_layers; ++idx) {
                if (idx === paragraphs.n_layers) {
                    paragraphs.n_layers ++;
                    paragraphs.layer_types.push(layer_type);
                    paragraphs.layers.push({ n_paragraphs: 0, layer_type: layer_type, paragraphs: []});
                }
                if (paragraphs.layer_types[idx].id === layer_type.id) {
                    const content: string = paragraphs_dict.get('content')[ln];
                    paragraphs.layers[idx].n_paragraphs += 1;
                    paragraphs.layers[idx].paragraphs.push(content);
                    break;
                }
            }
        }
    }
    const Boo = <Image src="./foo.png" alt="HAHA" />;
    return (
        <Reader author={author} book={book} section={section} 
        sections={sections} content={paragraphs} dgm_authors={dgm_authors}/>
    );
}