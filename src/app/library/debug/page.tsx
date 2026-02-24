import { readdirSync } from 'fs'
import path from 'path'

export default async function Home() {
    return (
        <div> 
            <div>{"cwd: "}{process.cwd()}</div>
            <div>{"__dirname: "}{__dirname}</div>
            <div>{"rootdir: "}{readdirSync('/').join('\n')}</div>
            <div>{"curdir: "}{readdirSync(process.cwd()).join('\n')}</div>
            <div>{"another: "}{readdirSync('/tmp').join('\n')}</div>
            <div>{"another: "}{readdirSync('/dev').join('\n')}</div>
        </div>
    );
}