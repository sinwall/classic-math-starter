// import { readdirSync, statSync } from 'fs'
// import path from 'path'
import Script from 'next/script'

// const rootdir: string[] = readdirSync('/');
// let anothers: string[] = [];
// if (rootdir.indexOf('dev') != -1) {
//     anothers.push(readdirSync('/dev').join('\n'));
// }
// if (anothers.length > 0) {
//     for (let boo of readdirSync('/dev')) {
//         if (statSync(`/dev/${boo}`).isDirectory()) {
//             anothers.push(readdirSync(`/dev/${boo}`).join('\n'));
//         }
//     }
// }

export default async function Home() {
    return (
        <>
        {/* <div> 
            <div>{"cwd: "}{process.cwd()}</div>
            <div>{"__dirname: "}{__dirname}</div>
            <div>{"rootdir: "}{readdirSync('/').join('\n')}</div>
            <div>{"curdir: "}{readdirSync(process.cwd()).join('\n')}</div>
            <div>{anothers.map((x,num) => <div key={num}>{x}</div>)}</div>
        </div> */}
        <div id="ggb-wrapper">
            {/* <Script dangerouslySetInnerHTML={{__html:`
    var params = {"appName": "graphing", "width": 800, "height": 600, "showToolBar": true, "showAlgebraInput": true, "showMenuBar": true };
    var applet = new GGBApplet(params, true);
    window.addEventListener("load", function() {
        applet.inject('ggb-element');
    });
            `}}/> */}
        </div>
        {/* <SOO /> */}
        </>
    );
}