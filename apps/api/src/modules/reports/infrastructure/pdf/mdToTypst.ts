import { marked, type Token, type Tokens } from "marked";

/**
 * Escape Typst special characters in plain text content.
 */
function escapeTypstText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/#/g, "\\#")
    .replace(/\$/g, "\\$")
    .replace(/"/g, '\\"')
    .replace(/</g, "\\<")
    .replace(/>/g, "\\>");
}

/**
 * Render inline tokens (bold, italic, code, links, plain text)
 * into Typst inline markup.
 */
function renderInline(tokens: Token[]): string {
  let out = "";
  for (const token of tokens) {
    switch (token.type) {
      case "strong": {
        const inner = renderInline((token as Tokens.Strong).tokens || []);
        out += `#strong[${inner}]`;
        break;
      }
      case "em": {
        const inner = renderInline((token as Tokens.Em).tokens || []);
        out += `#emph[${inner}]`;
        break;
      }
      case "codespan": {
        out += `#raw(${JSON.stringify((token as Tokens.Codespan).text)})`;
        break;
      }
      case "link": {
        const linkToken = token as Tokens.Link;
        const text = renderInline(linkToken.tokens || []);
        out += `#link("${linkToken.href}")[${text}]`;
        break;
      }
      case "text": {
        const textToken = token as Tokens.Text;
        if (textToken.tokens && textToken.tokens.length > 0) {
          out += renderInline(textToken.tokens);
        } else {
          out += escapeTypstText(textToken.text || "");
        }
        break;
      }
      case "br": {
        out += "\n";
        break;
      }
      case "html": {
        // Strip raw HTML — not renderable in Typst
        break;
      }
      default: {
        if ("text" in token && typeof (token as Tokens.Generic).text === "string") {
          out += escapeTypstText((token as Tokens.Generic).text);
        }
      }
    }
  }
  return out;
}

/**
 * Render block-level AST tokens into Typst markup.
 */
function renderTokens(tokens: Token[]): string {
  let out = "";
  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        const heading = token as Tokens.Heading;
        const prefix = "=".repeat(heading.depth);
        out += `\n${prefix} ${renderInline(heading.tokens || [])}\n\n`;
        break;
      }
      case "text": {
        // Tight list items in marked produce block-level `text` tokens, not paragraphs.
        // These may contain inline children (bold, italic, etc.) that need rendering.
        const textToken = token as Tokens.Text;
        if (textToken.tokens && textToken.tokens.length > 0) {
          out += renderInline(textToken.tokens);
        } else {
          out += escapeTypstText(textToken.text || "");
        }
        out += "\n";
        break;
      }
      case "paragraph": {
        out += `${renderInline((token as Tokens.Paragraph).tokens || [])}\n\n`;
        break;
      }
      case "blockquote": {
        const body = renderTokens((token as Tokens.Blockquote).tokens || []);
        out += `#block(inset: (left: 12pt, y: 6pt), stroke: (left: 3pt + rgb(30, 58, 138)), fill: rgb(248, 250, 252))[${body.trim()}]\n\n`;
        break;
      }
      case "list": {
        const list = token as Tokens.List;
        for (const item of list.items) {
          const marker = list.ordered ? "+ " : "- ";
          const itemBody = renderTokens(item.tokens || []).trim();
          out += `${marker}${itemBody}\n`;
        }
        out += "\n";
        break;
      }
      case "table": {
        const table = token as Tokens.Table;

        // Emit a `#context` block so Typst measures each header cell at render
        // time and uses the exact width as the column definition — font-agnostic,
        // zero JS estimation. Last column always 1fr.
        const headerLabels = table.header
          .slice(0, -1)
          .map(h => `[#strong[${renderInline(h.tokens || [])}]]`);
        // measure() returns text content width only — add 2 × cell inset (12pt each side = 24pt)
        // so the column is wide enough to actually contain the header without wrapping.
        const measuredWidths = headerLabels.map((_, i) => `measure(_h${i}).width + 24pt`).join(", ");
        const letBindings = headerLabels.map((label, i) => `  let _h${i} = ${label}`).join("\n");

        out += `#context {\n${letBindings}\n  let _cols = (${measuredWidths}, 1fr)\n`;
        out += `  table(\n    columns: _cols,\n    stroke: 0.5pt + rgb(203, 213, 225),\n    fill: (col, row) => if row == 0 { rgb(241, 245, 249) } else { none },\n`;

        // Header cells — indented for context block
        for (const h of table.header) {
          out += `    [#box[#strong[${renderInline(h.tokens || [])}]]],\n`;
        }
        // Row cells
        for (const row of table.rows) {
          for (const cell of row) {
            out += `    [${renderInline(cell.tokens || [])}],\n`;
          }
        }
        out += `  )\n}\n\n`; // close table, then context block
        break;
      }
      case "code": {
        const code = token as Tokens.Code;
        const lang = code.lang || "text";
        out += `#raw(block: true, lang: "${lang}", ${JSON.stringify(code.text)})\n\n`;
        break;
      }
      case "hr": {
        out += `#line(length: 100%, stroke: 0.5pt + rgb(203, 213, 225))\n\n`;
        break;
      }
      case "space":
        break;
      case "html":
        // Strip raw HTML
        break;
      default: {
        if ("text" in token && typeof (token as Tokens.Generic).text === "string") {
          out += `${escapeTypstText((token as Tokens.Generic).text)}\n\n`;
        }
      }
    }
  }
  return out;
}

/**
 * Convert markdown string to Typst markup via AST tokenization.
 * Uses `marked.lexer()` for deterministic, regex-free parsing.
 */
export function markdownToTypst(md: string): string {
  const tokens = marked.lexer(md);
  return renderTokens(tokens);
}
