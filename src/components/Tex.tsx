import { useMemo } from "react";
import katex from "katex";
import "katex/contrib/mhchem";
import "katex/dist/katex.min.css";

export function Tex({ children, display = false }: { children: string; display?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        output: "html",
      });
    } catch {
      return children;
    }
  }, [children, display]);
  return <span className={`tex ${display ? "tex-display" : ""}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
}
