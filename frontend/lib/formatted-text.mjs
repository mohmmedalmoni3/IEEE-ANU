export const DESCRIPTION_LIMIT = 12000;

// Stored as text, rendered as React nodes. HTML is never interpreted.
export function safeContentLink(value) {
  const url = String(value || "").trim();
  if (/[\u0000-\u0020\u007f]/.test(url)) return null;
  try {
    const parsed = new URL(url);
    return ["https:", "http:", "mailto:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export function contentBlocks(value) {
  const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = null;
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join("\n") });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };
  for (const line of lines) {
    const text = line.trim();
    const heading = /^(#{1,3})\s+(.+)$/.exec(text);
    const bullet = /^[-*+]\s+(.+)$/.exec(text);
    const numbered = /^(\d+)[.)]\s+(.+)$/.exec(text);
    const quote = /^>\s?(.*)$/.exec(text);
    if (!text || heading || quote || /^---+$/.test(text)) {
      flushParagraph();
      flushList();
      if (heading) blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      else if (quote) {
        const previous = blocks.at(-1);
        if (previous?.type === "quote") previous.text += `\n${quote[1]}`;
        else blocks.push({ type: "quote", text: quote[1] });
      } else if (text) blocks.push({ type: "divider" });
    } else if (bullet || numbered) {
      flushParagraph();
      const type = numbered ? "ordered" : "unordered";
      if (list?.type !== type) {
        flushList();
        list = { type, start: numbered ? Number(numbered[1]) : undefined, items: [] };
      }
      list.items.push(numbered ? numbered[2] : bullet[1]);
    } else {
      flushList();
      // Accept the explicit line-break suffix commonly pasted with Markdown.
      paragraph.push(line.replace(/(?:\\| {2,})$/, ""));
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function inlineTokens(value, depth = 0) {
  if (depth > 5) return [String(value)];
  const pattern = /\\([\\*_~\[\]])|\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^\n]+?)\*\*|__([^\n]+?)__|~~([^\n]+?)~~|\*([^*\n]+?)\*/g;
  const tokens = [];
  let cursor = 0;
  for (const match of String(value).matchAll(pattern)) {
    if (match.index > cursor) tokens.push(value.slice(cursor, match.index));
    if (match[1]) tokens.push(match[1]);
    else if (match[2]) {
      const href = safeContentLink(match[3]);
      tokens.push(href ? { type: "link", href, children: inlineTokens(match[2], depth + 1) } : match[2]);
    } else {
      const type = match[4] || match[5] ? "strong" : match[6] ? "delete" : "emphasis";
      tokens.push({ type, children: inlineTokens(match[4] || match[5] || match[6] || match[7], depth + 1) });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) tokens.push(value.slice(cursor));
  return tokens;
}
