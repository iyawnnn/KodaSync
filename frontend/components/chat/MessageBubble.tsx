"use client";

import { memo, useState } from "react";
import { Loader2, Terminal, Copy, Check, Save } from "lucide-react"; 
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ... (CodeBlock, TableComponent, and MARKDOWN_COMPONENTS remain exactly the same) ...
const CodeBlock = ({ node, inline, className, children, onSave, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [isCopied, setIsCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');
  const language = match ? match[1] : 'text';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return !inline && match ? (
    <div className="rounded-lg overflow-hidden my-4 border border-border shadow-sm bg-[#1e1e1e] group/code relative">
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{language}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/code:opacity-100 transition-opacity">
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-700" onClick={() => onSave(codeString, language)}>
                            <Save className="w-3.5 h-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 text-zinc-100 border-zinc-700 text-xs"><p>Save to Studio</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <div className="w-px h-3 bg-zinc-700 mx-1" />
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
        </div>
      </div>
      <SyntaxHighlighter style={vscDarkPlus} language={language} PreTag="div" customStyle={{ margin: 0, padding: '1.25rem', fontSize: '13px', background: 'transparent' }} {...props}>
        {codeString}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className="bg-secondary/50 px-1.5 py-0.5 rounded text-primary font-mono text-xs border border-border" {...props}>
      {children}
    </code>
  );
};

const TableComponent = ({ children }: any) => (
  <div className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm bg-card">
    <table className="w-full text-left border-collapse text-sm">{children}</table>
  </div>
);

const MARKDOWN_COMPONENTS = (onSave: any) => ({
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-7">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-3 space-y-1.5 text-inherit marker:text-muted-foreground">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-3 space-y-1.5 text-inherit marker:text-muted-foreground">{children}</ol>,
  li: ({ children }: any) => <li className="pl-1">{children}</li>,
  strong: ({ children }: any) => <span className="font-bold text-foreground">{children}</span>,
  h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground border-b border-border pb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xl font-bold mb-3 mt-5 text-foreground">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-lg font-bold mb-2 mt-4 text-foreground">{children}</h3>,
  table: TableComponent,
  thead: ({ children }: any) => <thead className="bg-muted text-foreground font-semibold">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="text-muted-foreground divide-y divide-border">{children}</tbody>,
  tr: ({ children }: any) => <tr className="hover:bg-accent/50 transition-colors">{children}</tr>,
  th: ({ children }: any) => <th className="px-4 py-3 text-xs uppercase tracking-wider">{children}</th>,
  td: ({ children }: any) => <td className="px-4 py-3 align-top border-r border-border last:border-0">{children}</td>,
  code: (props: any) => <CodeBlock {...props} onSave={onSave} />,
});

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
  onSaveCode?: (code: string, lang: string) => void;
  isLast?: boolean; // 🚀 NEW PROP
}

const MessageBubble = ({ role, content, loading, onSaveCode, isLast }: MessageBubbleProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex w-full group transition-all",
        role === "user" ? "justify-end" : "justify-start",
        // 🚀 CONDITIONALLY APPLY MARGIN
        isLast ? "mb-0" : "mb-6"
      )}
    >
      <div className={`flex max-w-[95%] md:max-w-[85%]`}>
        <div className={`p-4 rounded-xl text-sm shadow-sm overflow-hidden leading-relaxed ${
          role === "user" 
            ? "bg-primary text-primary-foreground rounded-tr-none shadow-md" 
            : "bg-card text-card-foreground rounded-tl-none border border-border shadow-sm"
        }`}>
            {role === "assistant" && content === "" && loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> <span className="text-xs">Thinking...</span>
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS(onSaveCode)}>
                {content}
              </ReactMarkdown>
            )}
            {role === "assistant" && loading && content.length > 0 && (
              <span className="inline-block w-2 h-4 bg-muted-foreground ml-1 animate-pulse align-middle" />
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(MessageBubble, (prev, next) => {
  return prev.content === next.content && prev.loading === next.loading && prev.isLast === next.isLast;
});