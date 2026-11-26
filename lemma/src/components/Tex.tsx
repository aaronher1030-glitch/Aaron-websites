import { useMemo } from "react";
import katex from "katex";

interface TexProps {
  children: string;
  display?: boolean;
  className?: string;
}

/** Render a bare LaTeX string (no dollar signs). */
export function Tex({ children, display = false, className = "" }: TexProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: false,
        output: "html",
      });
    } catch {
      return children;
    }
  }, [children, display]);

  return (
    <span
      className={`tex ${display ? "tex-display" : ""} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const TOKEN = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;

function InlineText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, index) => (
        <span key={index}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </>
  );
}

interface RichTextProps {
  text: string;
  className?: string;
}

/** Render text containing $inline$ and $$display$$ LaTeX. */
export function RichText({ text, className = "" }: RichTextProps) {
  const parts = useMemo(() => text.split(TOKEN), [text]);
  return (
    <span className={`rich-text ${className}`.trim()}>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
          return (
            <span className="math-block" key={index}>
              <Tex display>{part.slice(2, -2)}</Tex>
            </span>
          );
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return <Tex key={index}>{part.slice(1, -1)}</Tex>;
        }
        return <InlineText key={index} text={part} />;
      })}
    </span>
  );
}
