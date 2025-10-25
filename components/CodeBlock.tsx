'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-7 w-7 sm:h-8 sm:w-8 bg-background hover:bg-background/95 border border-border opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
        </Button>
      </div>
      <pre className="rounded-lg border border-border/50 bg-muted/30 p-3 sm:p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        <code className={`language-${language} text-[10px] sm:text-xs md:text-sm font-mono leading-relaxed`}>{code}</code>
      </pre>
    </div>
  );
}
