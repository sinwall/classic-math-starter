import { readdirSync } from 'fs'
import path from 'path'

export default async function Home() {
    return (
        <div> 
            <div>{"cwd: "}{process.cwd()}</div>
            <div>{"__dirname: "}{__dirname}</div>
            <div>{"rootdir: "}{readdirSync('/')}</div>
            <div>{"curdir: "}{readdirSync(process.cwd())}</div>
        </div>
    );
}