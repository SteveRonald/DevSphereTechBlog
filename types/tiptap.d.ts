import "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontFamily: {
      setFontFamily: (fontFamily: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
    };
    fontSize: {
      setFontSize: (fontSize: string | null) => ReturnType;
    };
    lineHeight: {
      setLineHeight: (lineHeight: string | null) => ReturnType;
    };
    color: {
      setColor: (color: string) => ReturnType;
      unsetColor: () => ReturnType;
    };
    highlight: {
      toggleHighlight: (attrs?: { color?: string }) => ReturnType;
      unsetHighlight: () => ReturnType;
    };
    table: {
      insertTable: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => ReturnType;
      addRowAfter: () => ReturnType;
      addColumnAfter: () => ReturnType;
      deleteTable: () => ReturnType;
    };
  }
}
