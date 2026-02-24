// // "use client";
// // import { useEffect } from "react";
// import { MathJax } from "@mathjax/src/js/components/global.js";
// import { insert } from '@mathjax/src/js/util/Options.js';
// import '@mathjax/src/js/components/startup.js';
// import '@mathjax/src/components/js/core/core.js';
// import '@mathjax/src/components/js/adaptors/liteDOM/liteDOM.js';

// import '@mathjax/src/components/js/input/tex-base/tex-base.js';
// import '@mathjax/src/components/js/input/tex/extensions/ams/ams.js';
// import '@mathjax/src/components/js/input/tex/extensions/newcommand/newcommand.js';
// import '@mathjax/src/components/js/input/tex/extensions/color/color.js';

// import '@mathjax/src/components/js/output/chtml/chtml.js';

// // import {MathJaxTexFont} from '@mathjax/mathjax-tex-font/js/chtml.js';
// import {MathJaxTexFont} from '@mathjax/mathjax-tex-font/js/chtml.js';

// insert(MathJax.config, {
//   tex: {
//     packages: {'[+]': ['ams', 'newcommand', 'color']}
//   },
//   chtml: {
//     fontData: MathJaxTexFont
//   }
// }, false);

// MathJax.config.startup.ready();

// const math = '\\frac{1}{2}';
// const adaptor = MathJax.config.startup.adaptor;
// console.log(adaptor.outerHTML(MathJax.config.tex2chtml(math)));


// export default function MathJaxUpdater() {
//   // useEffect(() => {
//   //   // MathJax.typesetPromise(['body']);
//   //   console.log("AAA");
//   // }, []);

//   return null;
// }