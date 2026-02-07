import { PortableText, PortableTextComponents } from '@portabletext/react';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity';

const components: PortableTextComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <div className="my-8 rounded-lg overflow-hidden">
          <Image
            src={urlFor(value).width(800).url()}
            alt={value.alt || 'Blog image'}
            width={800}
            height={450}
            className="w-full h-auto"
          />
          {value.caption && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              {value.caption}
            </p>
          )}
        </div>
      );
    },
    code: ({ value }: any) => {
      return (
        <div className="relative rounded-lg overflow-hidden my-6 bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800">
          {value.language && (
            <div className="bg-slate-800 dark:bg-slate-900 px-4 py-2 text-xs text-slate-400 dark:text-slate-500 border-b border-slate-700 dark:border-slate-800">
              {value.language}
            </div>
          )}
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm font-mono text-slate-50 dark:text-slate-100">{value.code}</code>
          </pre>
        </div>
      );
    },
  },
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-4xl font-bold mt-12 mb-4 tracking-tight">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-bold mt-10 mb-4 tracking-tight">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-bold mt-8 mb-3 tracking-tight">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-xl font-bold mt-6 mb-3">{children}</h4>
    ),
    h5: ({ children }: any) => (
      <h5 className="text-lg font-bold mt-6 mb-2">{children}</h5>
    ),
    h6: ({ children }: any) => (
      <h6 className="text-base font-bold mt-4 mb-2">{children}</h6>
    ),
    normal: ({ children }: any) => (
      <p className="text-base leading-relaxed mb-6 text-foreground/90">{children}</p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-outside ml-6 mb-6 space-y-2">{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal list-outside ml-6 mb-6 space-y-2">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => (
      <li className="text-base leading-relaxed text-foreground/90">{children}</li>
    ),
    number: ({ children }: any) => (
      <li className="text-base leading-relaxed text-foreground/90">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
    code: ({ children }: any) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    ),
    link: ({ value, children }: any) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined;
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className="text-primary hover:underline font-medium"
        >
          {children}
        </a>
      );
    },
  },
};

interface PortableTextRendererProps {
  value: any;
}

export function PortableTextRenderer({ value }: PortableTextRendererProps) {
  if (!value) {
    return null;
  }

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-lg">
      <PortableText value={value} components={components} />
    </div>
  );
}
