import { readFileSync } from 'fs'
import Reader from '../../../../components/reader/Reader'
import {IdName, LayerContent, SectionContent} from '../../../../utils/utils'

type RouteParams = {
    book_id__section_id: string
}

class TSVrow {
    map: Map<string, string>;

    constructor() {
        this.map = new Map<string, string>();
    }

    get(key: string): string {
        let result: string | undefined = this.map.get(key);
        if (result === undefined) {
            throw new Error('Key not found');
        }
        return result;
    }

}

class TSVframe {
    map: Map<string, string[]>;

    constructor(filePath: string) {
        this.map = new Map<string, string[]>;
        let lines: string[][] = readFileSync(filePath, 'utf-8').split(/\r?\n/).map(line => line.split('\t'));
        const keys: string[] = lines[0]; 
        for (let col: number=0; col<keys.length; ++col) {
            const key = keys[col];
            let value = [];
            for (let ln: number=1; ln<lines.length; ++ln) {
                value.push(lines[ln][col]);
            }
            this.map.set(key, value);
        }
    }

    get(key: string): string[] {
        let result: string[] | undefined = this.map.get(key);
        if (result === undefined) {
            throw new Error('Key not found')
        }
        return result;
    }

    keys(): string[] {
        return [...this.map.keys()];
    }

    size(): number {
        return this.get('no').length;
    }

    selectRow(index: number) {
        let result: TSVrow = new TSVrow();
        for (let key of this.map.keys()) {
            result.map.set(key, this.get(key)[index]);
        }
        return result;
    }
}

const sections_dict = new TSVframe('public/texts/sections.tsv');
const paragraphs_dict = new TSVframe('public/texts/paragraphs.tsv');


export default async function Home(
    context: { params: Promise<RouteParams> }
) {
    const params: RouteParams = await context.params;
    const book_id_section_id: string[] = params.book_id__section_id.split('__');
    let author: IdName = {id: '', name: ''};
    let book: IdName = {id: book_id_section_id[0], name: ''};
    let section: IdName = {id: book_id_section_id[1], name: ''};
    let sections: IdName[] = [];
    for (let ln: number=0; ln<sections_dict.size(); ++ln) {
        let line: TSVrow = sections_dict.selectRow(ln);
        if (line.get('book_id') === book.id) {
            author.id = line.get('author_id');
            author.name = line.get('author_name');
            book.name = line.get('book_name');
            if (section.id === '') {
                section.id = line.get('section_id');
            }
            if (section.id === line.get('section_id')) {
                section.name = line.get('section_name');
            }
            sections.push({id: line.get('section_id'), name: line.get('section_name')});
        }
    }
    let paragraphs: SectionContent = {
        n_layers: 0,
        layer_types: [],
        layers: []
    };
    for (let ln: number=0; ln<sections_dict.size(); ++ln) {
        if ((sections_dict.get('book_id')[ln] === book.id) && (sections_dict.get('section_id')[ln] === section.id)) {
            for (let key of sections_dict.keys()) {
                if (key.startsWith('has_layer_') && (sections_dict.get(key)[ln] === '1')) {
                    // paragraphs.n_layers += 1;
                    // paragraphs.layer_names.push(key.split('has_layer_')[1]);
                    // paragraphs.layers.push({ n_paragraphs: 0, layer_type: key.split('has_layer_')[1], contents: []});
                }
            }
            break;
        }
    }
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
    return (
        <Reader author={author} book={book} section={section} sections={sections} content={paragraphs}/>
    );

}

