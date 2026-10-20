import { contentBlocks, inlineTokens } from "@/lib/formatted-text.mjs";

function Inline({ text }) {
  function render(tokens) {
    return tokens.map((token, index) => {
      if (typeof token === "string") return token;
      const children = render(token.children);
      if (token.type === "link") return <a key={index} href={token.href} target="_blank" rel="noopener noreferrer">{children}</a>;
      if (token.type === "strong") return <strong key={index}>{children}</strong>;
      if (token.type === "delete") return <del key={index}>{children}</del>;
      return <em key={index}>{children}</em>;
    });
  }
  return render(inlineTokens(text));
}

export default function FormattedText({ text, className = "" }) {
  if (!text) return null;
  return <div className={`formatted-text ${className}`} dir="auto">
    {contentBlocks(text).map((block, index) => {
      if (block.type === "divider") return <hr key={index} />;
      if (block.type === "heading") {
        const Heading = block.level === 1 ? "h3" : block.level === 2 ? "h4" : "h5";
        return <Heading key={index}><Inline text={block.text} /></Heading>;
      }
      if (block.type === "quote") return <blockquote key={index}><Inline text={block.text} /></blockquote>;
      if (block.items) {
        const List = block.type === "ordered" ? "ol" : "ul";
        return <List key={index} start={block.start}>{block.items.map((item, itemIndex) => <li key={itemIndex}><Inline text={item} /></li>)}</List>;
      }
      return <p key={index}><Inline text={block.text} /></p>;
    })}
  </div>;
}
