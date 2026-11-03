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
    // query neon db once to get (1) sections in the same book, from which author name, book name, section name are read,
    // and (2) paragraphs in the selected section. If section_id is empty, the first section of the book is selected.
    // json_agg returns NULL (not []) when there is no row.
    const [fetched] = await query<{sections: SectionsData[] | null, paragraphs: ParagraphsData[] | null}>(
        `WITH s AS (
             SELECT *
             FROM texts.sections
             WHERE book_title_id = $1
         ),
         target AS (
             SELECT COALESCE(NULLIF($2::text, ''), (SELECT section_id FROM s ORDER BY id LIMIT 1)) AS section_id
         )
         SELECT
             (SELECT json_agg(s ORDER BY s.id) FROM s) AS sections,
             (SELECT json_agg(p ORDER BY p.id)
              FROM texts.paragraphs p
              WHERE p.book_title_id = $1 AND p.section_id = (SELECT section_id FROM target)) AS paragraphs`,
        [book_id, section_id]
    );
    const section_rows: SectionsData[] = fetched.sections ?? [];
    if (section_rows.length === 0) {
        throw new Error("해당하는 자료를 찾을 수 없습니다.")
    }
    let row_selected: SectionsData = section_rows[0];
    const author: IdName = {id: row_selected.author_id, name: row_selected.author_name};
    const book: IdName = {id: book_id, name: row_selected.book_title_name};
    section_id = (section_id === '') ? row_selected.section_id : section_id;
    const section: IdName = {
        id: section_id,
        name: row_selected.section_name
    }
    const sections: IdName[] = section_rows.map(row => ({id: row.section_id, name: row.section_name}));
    const dgm_authors: string[] = row_selected.image_names.split(';').filter(name => name !== '').map(name => name.slice(name.indexOf('_') + 1).replace(/\.png$/, ''));
    const paragraph_rows: ParagraphsData[] = fetched.paragraphs ?? [];

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