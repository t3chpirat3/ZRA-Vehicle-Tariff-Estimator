import React from 'react';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Simple markdown parser
  const renderLine = (line: string, i: number) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-2xl font-black text-[color:var(--text)] mt-8 mb-4 tracking-tight border-b border-[color:var(--border)] pb-2">{line.replace('## ', '')}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-xl font-bold text-[color:var(--text)] mt-6 mb-3">{line.replace('### ', '')}</h3>;
    }
    if (line.startsWith('* **')) {
      // List item with bold start
      const parts = line.replace('* ', '').split('**');
      if (parts.length >= 3) {
        return (
          <li key={i} className="text-[color:var(--text-muted)] mb-2 ml-4 list-disc">
            <strong className="text-[color:var(--text)]">{parts[1]}</strong>
            {parseInline(parts.slice(2).join('**'))}
          </li>
        );
      }
      return <li key={i} className="text-[color:var(--text-muted)] mb-2 ml-4 list-disc">{parseInline(line.replace('* ', ''))}</li>;
    }
    if (line.startsWith('* ')) {
      return <li key={i} className="text-[color:var(--text-muted)] mb-2 ml-4 list-disc">{parseInline(line.replace('* ', ''))}</li>;
    }
    if (line.startsWith('> **')) {
      const parts = line.replace('> ', '').split('**');
      return (
        <div key={i} className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4 rounded-r-lg">
          <strong className="text-amber-800">{parts[1]}</strong>
          <span className="text-amber-900 ml-1">{parseInline(parts.slice(2).join('**'))}</span>
        </div>
      );
    }
    if (line.startsWith('|')) {
      // naive table row
      const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
      if (cells[0] && cells[0].includes('---')) return null; // skip divider
      
      const isHeader = line.includes('Best For');
      return (
        <tr key={i} className={isHeader ? "bg-[color:var(--surface-soft)]" : "border-b border-slate-100"}>
          {cells.map((cell, idx) => (
             isHeader 
             ? <th key={idx} className="p-3 text-left font-bold text-[color:var(--text-muted)]">{cell}</th> 
             : <td key={idx} className="p-3 text-[color:var(--text-muted)]">{parseInline(cell)}</td>
          ))}
        </tr>
      );
    }
    if (line.trim() === '') {
      return <br key={i} />;
    }
    
    // Default paragraph
    return <p key={i} className="text-[color:var(--text-muted)] mb-4 leading-relaxed">{parseInline(line)}</p>;
  };

  const parseInline = (text: string) => {
    // Basic bold parsing: **bold**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-[color:var(--text)]">{part.slice(2, -2)}</strong>;
      }
      // Parse italics: *italics*
      const iParts = part.split(/(\*.*?\*)/g);
      return iParts.map((ip, idx) => {
        if (ip.startsWith('*') && ip.endsWith('*') && ip.length > 2) {
          return <em key={idx} className="italic text-[color:var(--text-muted)]">{ip.slice(1, -1)}</em>;
        }
        // inline code: `code`
        const cParts = ip.split(/(`.*?`)/g);
        return cParts.map((cp, cIdx) => {
           if (cp.startsWith('`') && cp.endsWith('`') && cp.length > 2) {
             return <code key={cIdx} className="bg-[color:var(--surface-soft)] text-rose-600 px-1 py-0.5 rounded text-sm font-mono">{cp.slice(1, -1)}</code>;
           }
           return <span key={cIdx}>{cp}</span>;
        });
      });
    });
  };

  const lines = content.split('\n');
  const rendered = [];
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|')) {
      inTable = true;
      tableRows.push(renderLine(line, i));
    } else {
      if (inTable) {
        rendered.push(
          <div key={`table-${i}`} className="overflow-x-auto my-6">
            <table className="w-full border-collapse border border-[color:var(--border)] bg-[color:var(--surface)] rounded-lg overflow-hidden shadow-sm">
              <tbody>{tableRows}</tbody>
            </table>
          </div>
        );
        inTable = false;
        tableRows = [];
      }
      rendered.push(renderLine(line, i));
    }
  }

  if (inTable) {
    rendered.push(
      <div key={`table-end`} className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-[color:var(--border)] bg-[color:var(--surface)] rounded-lg overflow-hidden shadow-sm">
          <tbody>{tableRows}</tbody>
        </table>
      </div>
    );
  }

  return <div className="markdown-container font-sans">{rendered}</div>;
}
