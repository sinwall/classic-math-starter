import MathJax from "@mathjax/src"

await MathJax.init({
    loader: {load: ['input/tex', 'output/svg']}
});

export async function renderMath(latexSrc) {
    return await MathJax.tex2svgPromise(latexSrc);
}