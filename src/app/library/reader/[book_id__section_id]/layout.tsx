import type { Metadata } from "next";
import Script from 'next/script'
// import MathJaxUpdater from "@/components/reader/MathJaxUpdater";

export const metadata: Metadata = {
  title: "그리스 수학 도서관",
  description: ".",
};

export default function ReaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    // <html lang="en">
    //   <head>
    //   </head>
      <>
        {/* <link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css" />
        <Script async={true} defer={true} src="https://tikzjax.com/v1/tikzjax.js" />
        <Script type="text/tikz" dangerouslySetInnerHTML={{
          __html:`
        \\begin{tikzpicture}
        \\draw (0,0) circle (10pt);
        \\end{tikzpicture}
          `}} /> */}
        <Script dangerouslySetInnerHTML={{__html: `
          if (window.MathJax === undefined) {
            MathJax = {
              tex: {
                inlineMath: [['$', '$']],
                macros: {
                  mr: ["\\\\mathrm{#1}", 1]
                }
              },
              startup: {typeset: true}
            }
          }
          `}} />
        <Script async={true} defer={true} src={"https://cdn.jsdelivr.net/npm/mathjax@4/tex-svg.js"} />
        {children}
      {/* <script type={"text/javascript"}>{"window.onload = function() { console.log('aaaa');console.log('bbbb'); }"}</script> */}
      {/* <MathJaxUpdater /> */}
      </>
    // </html>
  );
}
