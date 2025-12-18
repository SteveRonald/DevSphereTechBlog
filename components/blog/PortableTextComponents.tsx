import Image from "next/image";
import { urlFor } from "@/lib/sanity";
import type { PortableTextComponents } from "@portabletext/react";

export const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset) {
        return null;
      }
      
      const imageUrl = urlFor(value)
        .width(800)
        .height(600)
        .fit("max")
        .auto("format")
        .url();
      
      return (
        <div className="my-8">
          <Image
            src={imageUrl}
            alt={value.alt || "Blog post image"}
            width={800}
            height={600}
            className="w-full h-auto rounded-lg shadow-lg"
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
          {value.alt && (
            <p className="text-sm text-muted-foreground mt-2 text-center italic">
              {value.alt}
            </p>
          )}
        </div>
      );
    },
    code: ({ value }) => {
      return (
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
          <code className="text-sm">{value.code}</code>
        </pre>
      );
    },
  },
  block: {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-bold mt-5 mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-xl font-bold mt-4 mb-2">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-bold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    code: ({ children }) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const target = value?.href?.startsWith("http") ? "_blank" : undefined;
      const rel = target === "_blank" ? "noopener noreferrer" : undefined;
      return (
        <a
          href={value?.href}
          target={target}
          rel={rel}
          className="text-primary underline hover:text-primary/80"
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-2 ml-4">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="ml-2">{children}</li>
    ),
    number: ({ children }) => (
      <li className="ml-2">{children}</li>
    ),
  },
};


