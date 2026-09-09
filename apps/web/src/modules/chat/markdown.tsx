import { useState, useMemo, type ReactNode } from "react";
import katex from "katex";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access unavailable in some test environments
    }
  };

  return (
    <div className="chat-code-block" role="region" aria-label={`${language || "Code"} snippet`}>
      <div className="chat-code-header">
        <span className="chat-code-lang">{language || "text"}</span>
        <button
          type="button"
          className="chat-code-copy"
          data-testid="copy-code-btn"
          onClick={handleCopy}
          aria-label={copied ? "Code copied" : "Copy code"}
        >
          {copied ? (
            <>
              <Check aria-hidden="true" className="chat-icon-s" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy aria-hidden="true" className="chat-icon-s" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="chat-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderMathSafe(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return math;
  }
}

/**
 * Render inline math and text safely:
 * Supports $...$ (ignoring currency like $50), and \(...\).
 */
function renderInlineContent(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Tokenize for inline math, inline code, bold, italic
  // Regex matches: inline code `...`, inline math $...$, \(...\), bold **...**, italic *...*
  const pattern = /(`[^`]+`|\$\$(?:[^\$]+)\$\$|\$(?!\s|\d+(?:\.\d+)?(?:\s|$))(?:[^\$\n]+?)\$|\\\([^\)]+\\\)|(?:\*\*[^*]+\*\*)|(?:\*[^*]+\*))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("$$") && token.endsWith("$$")) {
      const math = token.slice(2, -2);
      const html = renderMathSafe(math, true);
      nodes.push(<span key={match.index} className="chat-math-block" dangerouslySetInnerHTML={{ __html: html }} />);
    } else if (token.startsWith("$") && token.endsWith("$") && token.length > 2) {
      const math = token.slice(1, -1);
      const html = renderMathSafe(math, false);
      nodes.push(<span key={match.index} className="chat-math-inline" dangerouslySetInnerHTML={{ __html: html }} />);
    } else if (token.startsWith("\\(") && token.endsWith("\\)")) {
      const math = token.slice(2, -2);
      const html = renderMathSafe(math, false);
      nodes.push(<span key={match.index} className="chat-math-inline" dangerouslySetInnerHTML={{ __html: html }} />);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(<code key={match.index} className="chat-inline-code">{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else {
      nodes.push(token);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

interface StreamingMarkdownProps {
  content: string;
}

export function StreamingMarkdown({ content }: StreamingMarkdownProps) {
  const elements = useMemo(() => {
    if (!content) return null;

    const lines = content.split("\n");
    const result: ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeBuffer: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let keyCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code fence detection
      if (line.trim().startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          result.push(
            <CodeBlock
              key={`code-${keyCounter++}`}
              language={codeLanguage}
              code={codeBuffer.join("\n")}
            />
          );
          codeBuffer = [];
          codeLanguage = "";
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Display math $$...$$ block
      if (line.trim().startsWith("$$")) {
        const mathLines: string[] = [];
        let cur = line.trim().slice(2);
        if (cur.endsWith("$$") && cur.length >= 2) {
          // Single line block math
          const math = cur.slice(0, -2);
          const html = renderMathSafe(math, true);
          result.push(
            <div
              key={`math-${keyCounter++}`}
              className="chat-math-block"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
          continue;
        }

        mathLines.push(cur);
        i++;
        while (i < lines.length && !lines[i].trim().endsWith("$$")) {
          mathLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          const endLine = lines[i].trim();
          mathLines.push(endLine.slice(0, -2));
        }
        const fullMath = mathLines.join("\n");
        const html = renderMathSafe(fullMath, true);
        result.push(
          <div
            key={`math-${keyCounter++}`}
            className="chat-math-block"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        continue;
      }

      // Markdown Table detection: lines with |
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        // Table separator line check
        if (/^\|[-:\s|]+\|$/.test(trimmed)) {
          // Header divider row, ignore in data
          continue;
        }
        const cells = trimmed
          .slice(1, -1)
          .split("|")
          .map(c => c.trim());
        if (!inTable) {
          inTable = true;
          tableRows = [cells];
        } else {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        // Flush table
        inTable = false;
        const [headers, ...rows] = tableRows;
        result.push(
          <div key={`table-${keyCounter++}`} className="chat-table-wrapper">
            <table className="chat-table">
              {headers && (
                <thead>
                  <tr>
                    {headers.map((h, hi) => (
                      <th key={hi}>{renderInlineContent(h)}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{renderInlineContent(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        result.push(<h3 key={`h3-${keyCounter++}`}>{renderInlineContent(trimmed.slice(4))}</h3>);
        continue;
      }
      if (trimmed.startsWith("## ")) {
        result.push(<h2 key={`h2-${keyCounter++}`}>{renderInlineContent(trimmed.slice(3))}</h2>);
        continue;
      }
      if (trimmed.startsWith("# ")) {
        result.push(<h1 key={`h1-${keyCounter++}`}>{renderInlineContent(trimmed.slice(2))}</h1>);
        continue;
      }

      // Blockquotes
      if (trimmed.startsWith("> ")) {
        result.push(
          <blockquote key={`bq-${keyCounter++}`}>
            {renderInlineContent(trimmed.slice(2))}
          </blockquote>
        );
        continue;
      }

      // Unordered List
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        result.push(
          <li key={`li-${keyCounter++}`} className="chat-list-item">
            {renderInlineContent(trimmed.slice(2))}
          </li>
        );
        continue;
      }

      // Ordered List
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        result.push(
          <li key={`oli-${keyCounter++}`} value={olMatch[1]} className="chat-list-item-ordered">
            {renderInlineContent(olMatch[2])}
          </li>
        );
        continue;
      }

      // Paragraph / text
      if (trimmed.length > 0) {
        result.push(<p key={`p-${keyCounter++}`}>{renderInlineContent(line)}</p>);
      }
    }

    // Flush unclosed code block during active stream
    if (inCodeBlock && codeBuffer.length > 0) {
      result.push(
        <CodeBlock
          key={`code-streaming-${keyCounter++}`}
          language={codeLanguage}
          code={codeBuffer.join("\n")}
        />
      );
    }

    // Flush unclosed table
    if (inTable && tableRows.length > 0) {
      const [headers, ...rows] = tableRows;
      result.push(
        <div key={`table-streaming-${keyCounter++}`} className="chat-table-wrapper">
          <table className="chat-table">
            {headers && (
              <thead>
                <tr>
                  {headers.map((h, hi) => (
                    <th key={hi}>{renderInlineContent(h)}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{renderInlineContent(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return result;
  }, [content]);

  return <div className="chat-markdown">{elements}</div>;
}
