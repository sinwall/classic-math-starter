import { readFileSync } from "fs"
import path from 'path'

const assets_dir = path.join(process.cwd(), 'private')

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

const sections_dict = new TSVframe(path.join(assets_dir, 'texts/sections.tsv'));
const paragraphs_dict = new TSVframe(path.join(assets_dir, 'texts/paragraphs.tsv'));
export {assets_dir, sections_dict, paragraphs_dict}