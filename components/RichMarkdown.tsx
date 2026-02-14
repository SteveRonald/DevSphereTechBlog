"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Image from "next/image";
import Link from "next/link";
import { CodeBlock } from "@/components/ui/CodeBlock";

interface RichMarkdownProps {
  content: string;
  className?: string;
}

export function RichMarkdown({ content, className = "" }: RichMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      className={`prose prose-gray dark:prose-invert max-w-none prose-headings:scroll-mt-20 ${className}`}
      components={{
        // Headings with proper spacing
        h1: ({ children, ...props }) => (
          <h1 className="text-3xl md:text-4xl font-bold mt-8 mb-4 first:mt-0" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="text-2xl md:text-3xl font-semibold mt-8 mb-4 first:mt-0" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 className="text-xl md:text-2xl font-semibold mt-6 mb-3 first:mt-0" {...props}>
            {children}
          </h3>
        ),
        h4: ({ children, ...props }) => (
          <h4 className="text-lg md:text-xl font-semibold mt-6 mb-3 first:mt-0" {...props}>
            {children}
          </h4>
        ),
        h5: ({ children, ...props }) => (
          <h5 className="text-base md:text-lg font-semibold mt-4 mb-2 first:mt-0" {...props}>
            {children}
          </h5>
        ),
        h6: ({ children, ...props }) => (
          <h6 className="text-sm md:text-base font-semibold mt-4 mb-2 first:mt-0" {...props}>
            {children}
          </h6>
        ),

        // Paragraphs with proper spacing
        p: ({ children, ...props }) => (
          <p className="mb-4 last:mb-0 leading-relaxed" {...props}>
            {children}
          </p>
        ),

        // Lists with proper spacing
        ul: ({ children, ...props }) => (
          <ul className="mb-4 pl-6 list-disc space-y-1" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="mb-4 pl-6 list-decimal space-y-1" {...props}>
            {children}
          </ol>
        ),
        li: ({ children, ...props }) => (
          <li className="leading-relaxed" {...props}>
            {children}
          </li>
        ),

        // Blockquotes with styling
        blockquote: ({ children, ...props }) => (
          <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground" {...props}>
            {children}
          </blockquote>
        ),

        // Code blocks with proper dark/light mode support
        code: ({ inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          const language = match?.[1] || "text";

          if (inline) {
            return (
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700" {...props}>
                {children}
              </code>
            );
          }
          
          return (
            <CodeBlock language={language}>
              {String(children).replace(/\n$/, "")}
            </CodeBlock>
          );
        },

        // Links with external link handling
        a: ({ href, children, ...props }) => {
          const isExternal = href?.startsWith("http");
          if (isExternal) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline"
                {...props}
              >
                {children}
                <span className="sr-only">(opens in new tab)</span>
              </a>
            );
          }
          return (
            <Link
              href={href || "#"}
              className="text-primary hover:text-primary/80 underline"
              {...props}
            >
              {children}
            </Link>
          );
        },

        // Images with Next.js optimization
        img: ({ src, alt, width, height, ...props }: any) => {
          if (!src) return null;
          
          // Check if it's an external URL
          if (src.startsWith("http")) {
            return (
              <img
                src={src}
                alt={alt || ""}
                className="rounded-lg my-4 max-w-full h-auto"
                {...props}
              />
            );
          }
          
          // For local images, use Next.js Image component
          return (
            <div className="relative my-4">
              <Image
                src={src}
                alt={alt || ""}
                width={800}
                height={400}
                className="rounded-lg"
              />
            </div>
          );
        },

        // Tables
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-border" {...props}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children, ...props }) => (
          <thead className="bg-muted" {...props}>
            {children}
          </thead>
        ),
        th: ({ children, ...props }) => (
          <th className="border border-border px-4 py-2 text-left font-semibold" {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td className="border border-border px-4 py-2" {...props}>
            {children}
          </td>
        ),

        // Horizontal rule
        hr: ({ ...props }) => (
          <hr className="my-8 border-border" {...props} />
        ),

        // Strong/bold text
        strong: ({ children, ...props }) => (
          <strong className="font-semibold" {...props}>
            {children}
          </strong>
        ),

        // Emphasis/italic text
        em: ({ children, ...props }) => (
          <em className="italic" {...props}>
            {children}
          </em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
