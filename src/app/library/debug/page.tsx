import { readdirSync } from 'fs'
import path from 'path'

const rootdir: string[] = readdirSync('/');
let anothers: string[] = [];
if (rootdir.indexOf('bundle') != -1) {
    anothers.push('bundle\n' + readdirSync('/bundle').join('\n'));
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
