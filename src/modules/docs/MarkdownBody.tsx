import { Fragment, type ReactNode } from "react";

interface MarkdownBodyProps {
  text: string;
}

interface Block {
  kind: "h1" | "h2" | "h3" | "p" | "ul" | "code";
  content: string[];
}

function tokenize(raw: string): Block[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ kind: "code", content: code });
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push({ kind: "h3", content: [trimmed.slice(4)] });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ kind: "h2", content: [trimmed.slice(3)] });
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push({ kind: "h1", content: [trimmed.slice(2)] });
      i++;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.startsWith("- ") || t.startsWith("* ")) {
          items.push(t.slice(2));
          i++;
        } else {
          break;
        }
      }
      blocks.push({ kind: "ul", content: items });
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].trim().match(/^(#|-|\*|```)/)) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ kind: "p", content: [para.join(" ")] });
  }

  return blocks;
}

function renderInline(s: string): ReactNode {
  const matches = Array.from(s.matchAll(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g));
  if (matches.length === 0) return s;
  const parts: ReactNode[] = [];
  let last = 0;
  matches.forEach((m, k) => {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(s.slice(last, idx));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("*")) {
      parts.push(<em key={k}>{tok.slice(1, -1)}</em>);
    } else {
      parts.push(<code key={k}>{tok.slice(1, -1)}</code>);
    }
    last = idx + tok.length;
  });
  if (last < s.length) parts.push(s.slice(last));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export function MarkdownBody({ text }: MarkdownBodyProps) {
  const blocks = tokenize(text);
  if (blocks.length === 0) {
    return (
      <p style={{ color: "var(--color-fg-faint)" }}>
        Empty document. Click <b>Edit</b> to start writing.
      </p>
    );
  }
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "h1") return <h1 key={i}>{renderInline(b.content[0])}</h1>;
        if (b.kind === "h2") return <h2 key={i}>{renderInline(b.content[0])}</h2>;
        if (b.kind === "h3") return <h3 key={i}>{renderInline(b.content[0])}</h3>;
        if (b.kind === "ul") {
          return (
            <ul key={i}>
              {b.content.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (b.kind === "code") {
          return (
            <pre key={i}>
              <code>{b.content.join("\n")}</code>
            </pre>
          );
        }
        return (
          <p key={i}>
            <Fragment>{renderInline(b.content[0])}</Fragment>
          </p>
        );
      })}
    </>
  );
}
