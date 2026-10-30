import Image from "next/image"
import Reader from '../../../../components/reader/Reader'
import {IdName, LayerContent, SectionContent, SectionsData, ParagraphsData} from '../../../../utils/utils'
import {query} from '../../../../db/query'
import { JSX } from "react"

type RouteParams = {
    book_id__section_id: string
}


export default async function Home(
    context: { params: Promise<RouteParams> }
) {
    const params: RouteParams = await context.params;

    // read and parse book_id and section_id from params
    let [book_id, section_id, ..._]: string[] = params.book_id__section_id.split('__');
    // let dgm_elements: JSX.Element[] = [];
    // query neon db to find author name, book name, section name, and sections in the same book
    const section_rows: SectionsData[] = await query<SectionsData>(
        `SELECT *
         FROM texts.sections
         WHERE book_title_id = $1
         ORDER BY id`,
        [book_id]
    );
    if (section_rows.length === 0) {
        throw new Error("해당하는 자료를 찾을 수 없습니다.")
    }
    let row_selected: SectionsData = section_rows[0];
    const author: IdName = {id: row_selected.author_id, name: row_selected.author_name};
    const book: IdName = {id: book_id, name: row_selected.book_title_name};
    section_id = (section_id === '') ? row_selected.section_id : section_id;
    const row_found: SectionsData | undefined = section_rows.find(row => row.section_id === section_id);
    if (row_found === undefined) {
        throw new Error("해당하는 자료를 찾을 수 없습니다.")
    }
    row_selected = row_found;
    const section: IdName = {
        id: section_id,
        name: row_selected.section_name
    }
    const sections: IdName[] = section_rows.map(row => ({id: row.section_id, name: row.section_name}));
    const dgm_authors: string[] = row_selected.image_names.split(';').filter(name => name !== '').map(name => name.slice(name.indexOf('_') + 1).replace(/\.png$/, ''));
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
    const paragraph_rows: ParagraphsData[] = await query<ParagraphsData>(
        `SELECT *
         FROM texts.paragraphs
         WHERE book_title_id = $1 AND section_id = $2
         ORDER BY id`,
        [book.id, section.id]
    );
    // layer_type_id and layer_type_name pairs, in order of first appearance
    const layer_types: IdName[] = [];
    for (const row of paragraph_rows) {
        if (!layer_types.some(layer_type => layer_type.id === row.layer_type_id)) {
            layer_types.push({id: row.layer_type_id, name: row.layer_type_name});
        }
    }
    const layers: LayerContent[] = layer_types.map(layer_type => {
        const contents: string[] = paragraph_rows
            .filter(row => row.layer_type_id === layer_type.id)
            .map(row => row.content);
        return {n_paragraphs: contents.length, layer_type: layer_type, paragraphs: contents};
    });
    const paragraphs: SectionContent = {
        n_layers: layer_types.length, 
        layer_types: layer_types, 
        layers: layers
    };
    return (
        <Reader author={author} book={book} section={section} 
        sections={sections} content={paragraphs} dgm_authors={dgm_authors}/>
    );
}