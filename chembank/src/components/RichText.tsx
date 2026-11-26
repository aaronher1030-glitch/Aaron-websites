import { Fragment, useMemo, type ReactNode } from "react";
import { Tex } from "./Tex";

const ALLOWED = new Set(["SUB", "SUP", "B", "STRONG", "I", "EM", "BR"]);

function nodesFromHtml(html: string, keyPrefix: string): ReactNode[] {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return [];
  const walk = (node: Node, key: string): ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as HTMLElement;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return null;
    const children = Array.from(el.childNodes).map((child, i) => walk(child, `${key}-${i}`));
    if (!ALLOWED.has(el.tagName)) return <Fragment key={key}>{children}</Fragment>;
    switch (el.tagName) {
      case "SUB": return <sub key={key}>{children}</sub>;
      case "SUP": return <sup key={key}>{children}</sup>;
      case "B": case "STRONG": return <strong key={key}>{children}</strong>;
      case "I": case "EM": return <em key={key}>{children}</em>;
      case "BR": return <br key={key} />;
      default: return <>{children}</>;
    }
  };
  return Array.from(root.childNodes).map((child, i) => walk(child, `${keyPrefix}-${i}`));
}

const TOKEN = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const parts = useMemo(() => text.split(TOKEN), [text]);
  return (
    <span className={`rich-text ${className}`.trim()}>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
          return <span className="math-block" key={index}><Tex display>{part.slice(2, -2)}</Tex></span>;
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return <Tex key={index}>{part.slice(1, -1)}</Tex>;
        }
        return <span key={index}>{nodesFromHtml(part, `t${index}`)}</span>;
      })}
    </span>
  );
}
