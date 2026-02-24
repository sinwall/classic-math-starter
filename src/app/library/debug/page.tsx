import { readdirSync } from 'fs'
import path from 'path'

const rootdir: string[] = readdirSync('/');
let anothers: string[] = [];
if (rootdir.indexOf('dev') != -1) {
    anothers.push(readdirSync('/dev').join('\n'));
}

export default async function Home() {
    return (
        <div> 
            <div>{"cwd: "}{process.cwd()}</div>
            <div>{"__dirname: "}{__dirname}</div>
            <div>{"rootdir: "}{readdirSync('/').join('\n')}</div>
            <div>{"curdir: "}{readdirSync(process.cwd()).join('\n')}</div>
            <div>{"another: "}{anothers[0]}</div>
        </div>
    );
}
