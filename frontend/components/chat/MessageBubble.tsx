"use client";

import { memo, useState } from "react";
import { User, Bot, Loader2, Terminal, Copy, Check } from "lucide-react"; 
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from "framer-motion";

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [isCopied, setIsCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return !inline && match ? (
    <div className="rounded-lg overflow-hidden my-4 border border-border shadow-sm bg-zinc-950 group/code">
      <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{match[1]}</span>
        </div>
        
        <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover/code:opacity-100"
        >
            {isCopied ? (
                <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                </>
            )}
        </button>
      </div>
      
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1.5rem', fontSize: '13px', background: 'transparent' }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className="bg-accent px-1.5 py-0.5 rounded text-primary font-mono text-xs border border-border" {...props}>
      {children}
    </code>
  );
};

const TableComponent = ({ children }: any) => (
  <div className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm bg-card">
    <table className="w-full text-left border-collapse text-sm">{children}</table>
  </div>
);

const MARKDOWN_COMPONENTS = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-7">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-3 space-y-1.5 text-inherit marker:text-muted-foreground">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-3 space-y-1.5 text-inherit marker:text-muted-foreground">{children}</ol>,
  li: ({ children }: any) => <li className="pl-1">{children}</li>,
  strong: ({ children }: any) => <span className="font-bold text-foreground">{children}</span>,
  h1: ({ children }: any) => <h1 className="text-2xl font-kodaSync font-bold mb-4 mt-6 text-foreground border-b border-border pb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xl font-kodaSync font-bold mb-3 mt-5 text-foreground">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-lg font-kodaSync font-bold mb-2 mt-4 text-foreground">{children}</h3>,
  table: TableComponent,
  thead: ({ children }: any) => <thead className="bg-muted text-foreground font-semibold">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="text-muted-foreground divide-y divide-border">{children}</tbody>,
  tr: ({ children }: any) => <tr className="hover:bg-accent/50 transition-colors">{children}</tr>,
  th: ({ children }: any) => <th className="px-4 py-3 text-xs uppercase tracking-wider">{children}</th>,
  td: ({ children }: any) => <td className="px-4 py-3 align-top border-r border-border last:border-0">{children}</td>,
  code: CodeBlock,
};

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

const MessageBubble = ({ role, content, loading }: MessageBubbleProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex w-full ${role === "user" ? "justify-end" : "justify-start"} group mb-6`}
    >
      <div className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${role === "user" ? "flex-row-reverse" : "flex-row"}`}>
        
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border mt-1 ${
          role === "user" 
            ? "bg-primary border-primary text-primary-foreground" 
            : "bg-card border-border text-primary"
        }`}>
          {role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

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
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
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
  return prev.content === next.content && prev.loading === next.loading;
});