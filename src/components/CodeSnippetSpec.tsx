import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Terminal,
} from "lucide-react";
import { CodeSnippetSpec as CodeSnippetSpecType } from "../types/guide";

export interface CodeSnippetSpecProps {
  snippets: CodeSnippetSpecType[];
  title?: string;
}

export const CodeSnippetSpec: React.FC<CodeSnippetSpecProps> = ({
  snippets,
  title = "Composio Integration Code Snippets",
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!snippets || snippets.length === 0) {
    return null;
  }

  const currentSnippet = snippets[activeTab] || snippets[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const isTested =
    currentSnippet.validationStatus === "tested_against_sdk";

  return (
    <div className="rounded-xl glass-card overflow-hidden border border-slate-800">
      {/* Header with Title and Language Tabs */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-sm text-slate-100">{title}</span>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950/70 border border-slate-800">
          {snippets.map((snippet, idx) => (
            <button
              key={`${snippet.language}-${idx}`}
              onClick={() => {
                setActiveTab(idx);
                setCopied(false);
              }}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                activeTab === idx
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {snippet.language === "python" ? "Python" : "TypeScript"}
            </button>
          ))}
        </div>
      </div>

      {/* Epistemic Validation Status Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950/60 border-b border-slate-850 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Runtime Verification:</span>
          {isTested ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>[Tested in Runtime]</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/60 text-amber-400 border border-amber-500/40">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>[Adapted from Docs — Needs Validation]</span>
            </span>
          )}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
          title="Copy snippet to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Block with line numbering */}
      <div className="relative bg-black/90 p-4 font-mono text-xs overflow-x-auto text-slate-200 leading-relaxed">
        <pre className="table">
          {currentSnippet.code.split("\n").map((line, idx) => (
            <div key={idx} className="table-row">
              <span className="table-cell text-right pr-4 select-none text-slate-600 text-[11px]">
                {idx + 1}
              </span>
              <span className="table-cell whitespace-pre">{line}</span>
            </div>
          ))}
        </pre>
      </div>

      {/* Validation Note Footer */}
      <div className="p-3 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-start gap-1.5">
          <span className="text-slate-300 font-medium">Note:</span>
          <span>{currentSnippet.validationNote}</span>
        </div>
        {currentSnippet.sourceDocUrl && (
          <a
            href={currentSnippet.sourceDocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline shrink-0"
          >
            <span>SDK Reference Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
export default CodeSnippetSpec;
