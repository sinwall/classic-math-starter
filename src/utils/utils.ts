type IdName = {
    id: string,
    name: string
}

type LayerContent = {
    n_paragraphs: number,
    layer_type: IdName,
    paragraphs: string[]
}

type SectionContent = {
    n_layers: number,
    layer_types: IdName[],
    layers: LayerContent[]
}

type SectionsData = {
    id: number,
    book_title_id: string,
    book_title_name: string,
    author_id: string,
    author_name: string,
    section_id: string,
    section_name: string,
    has_layer_ELH: number,
    has_layer_KOR: number,
    has_layer_MAT: number,
    image_names: string
}

type ParagraphsData = {
    id: number,
    book_title_id: string,
    book_title_name: string,
    author_id: string,
    author_name: string,
    section_id: string,
    section_name: string,
    paragraph_no: number,
    layer_type_id: string,
    layer_type_name: string,
    content: string
}

function arange(lb: number, ub: number | undefined = undefined): number[] {
    if (ub === undefined) {
        ub = lb; lb = 0;
    }
    let result: number[] = [];
    for (let num: number=lb; num<ub; ++num) {
        result.push(num);
    }
    return result;
}

export type {IdName, LayerContent, SectionContent, SectionsData, ParagraphsData};
export {arange};