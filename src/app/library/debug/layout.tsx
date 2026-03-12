import type { Metadata } from "next";
import Script from 'next/script'

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
      <>
        {/* <script src={"https://www.geogebra.org/apps/deployggb.js"} />
        <script dangerouslySetInnerHTML={{__html:`
var params = {"appName": "suite", "width": 800, "height": 600, "showToolBar": false, "showAlgebraInput": false, "showMenuBar": false, "material_id": "hm8edeed" };
var applet = new GGBApplet(params, true);
window.addEventListener("load", function() {
    applet.inject('ggb-wrapper');
});
        `}}/> */}
        {children}
      </>
  );
}
