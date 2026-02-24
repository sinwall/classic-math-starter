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

export type {IdName, LayerContent, SectionContent};
export {arange};