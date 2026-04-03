import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Wrap bare URLs in angle brackets so GFM auto-links them */
function ensureUrlsAreLinked(text: string): string {
  // Match plain URLs that aren't already inside markdown links [text](url) or angle brackets <url>
  return text.replace(
    /(?<!\(|<)(https?:\/\/[^\s)>\]]+)/g,
    (match, url, offset, str) => {
      // Check if this URL is inside a markdown link
      const before = str.slice(Math.max(0, offset - 2), offset);
      if (before.endsWith("](") || before.endsWith("<")) return match;
      return `<${url}>`;
    }
  );
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const processed = ensureUrlsAreLinked(markdown);
  const tokens = marked.lexer(processed);
  return tokens.map((token) => token.raw);
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 break-all"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ));
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
