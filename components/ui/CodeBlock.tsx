"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language: string;
  children: string;
  className?: string;
}

export function CodeBlock({ language, children, className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`not-prose relative group rounded-lg overflow-hidden my-4 border border-[#30363d] ${className}`}>
      {/* Header: language label + copy button */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-b border-[#30363d]">
        <span className="text-xs font-medium text-[#8b949e]">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "0.75rem 1rem",
          backgroundColor: "#0d1117",
          fontSize: "0.8125rem",
          lineHeight: "1.6",
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          },
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
