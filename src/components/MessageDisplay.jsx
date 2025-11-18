import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const MessageDisplay = ({ message }) => {
  return (
    <div className="message-content text-amber-50">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom code block renderer
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-4">
                <div className="bg-black/70 text-amber-100 px-3 py-1 text-xs font-semibold rounded-t-lg border border-white/10">
                  {match[1].toUpperCase()}
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="!mt-0 !rounded-t-none !border-t-0"
                  customStyle={{
                    margin: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-amber-400/10 text-amber-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          // Custom heading renderer
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-amber-100 mt-6 mb-3 border-b-2 border-amber-300/40 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-amber-100 mt-5 mb-3 border-b border-amber-300/40 pb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold text-amber-100 mt-4 mb-2">
              {children}
            </h3>
          ),
          // Custom list renderer
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-3 text-amber-50/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-3 text-amber-50/90">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-amber-50/90 leading-relaxed">
              {children}
            </li>
          ),
          // Custom paragraph renderer
          p: ({ children }) => (
            <p className="text-amber-50 leading-relaxed mb-3">
              {children}
            </p>
          ),
          // Custom blockquote renderer
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-300/60 pl-4 py-2 my-3 bg-amber-400/10 text-amber-100 italic">
              {children}
            </blockquote>
          ),
          // Custom strong/bold renderer
          strong: ({ children }) => (
            <strong className="font-bold text-white">
              {children}
            </strong>
          ),
          // Custom emphasis/italic renderer
          em: ({ children }) => (
            <em className="italic text-amber-100/80">
              {children}
            </em>
          ),
          // Custom table renderer
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-white/10 rounded-lg bg-black/40">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-white/10 px-3 py-2 text-left font-semibold text-amber-100">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-white/10 px-3 py-2 text-amber-50">
              {children}
            </td>
          ),
          // Custom link renderer
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-amber-300 hover:text-amber-200 underline"
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {message}
      </ReactMarkdown>
    </div>
  );
};
