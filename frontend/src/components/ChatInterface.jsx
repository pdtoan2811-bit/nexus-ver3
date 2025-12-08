import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, BrainCircuit } from 'lucide-react';

const ChatInterface = ({ 
  history, 
  onSendMessage, 
  dominantModule, 
  contextCount,
  isLoading 
}) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  // REQ-CHAT-02: Citation Parsing & Markdown
  const components = {
    // Custom renderer for text to handle citations
    p: ({children}) => {
        // Flatten children to string if possible, or handle array
        // This is complex with ReactMarkdown. 
        // Simpler approach: Use a plugin or just post-process string?
        // Let's stick to standard markdown for now, and handle citations via regex replace before rendering?
        // Or just render citations as simple text and let user read them.
        return <p className="mb-2 last:mb-0">{children}</p>;
    }
  };
  
  // Pre-process content to make citations bold/clickable (simulated)
  const formatContent = (content) => {
    if (!content) return "";
    // Bold citations [NODE-ID] -> **[NODE-ID]**
    return content.replace(/\[([A-Z]+-[0-9]+|README\.md|SRS-[A-Z]+-[0-9]+)\]/g, '**[$1]**');
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 border-l border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-900 shadow-md">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <BrainCircuit className="w-5 h-5 text-blue-500" />
                Nexus Chat
            </h2>
            {dominantModule && (
                <span className="px-2 py-1 bg-purple-900 text-purple-200 text-xs rounded-full border border-purple-700">
                    {dominantModule}
                </span>
            )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
            Context: {contextCount} nodes loaded
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm text-center">
                <p>Select nodes on the graph,</p>
                <p>set your depth (F1/F2),</p>
                <p>and click "Chat with Selection" to begin.</p>
            </div>
        ) : (
            history.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-blue-300" />
                        </div>
                    )}
                    
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-gray-700 text-gray-200 rounded-bl-none border border-gray-600'
                    }`}>
                        {msg.role === 'assistant' ? (
                           <div className="leading-relaxed prose prose-invert prose-sm max-w-none">
                               <ReactMarkdown>
                                   {formatContent(msg.content)}
                               </ReactMarkdown>
                           </div> 
                        ) : (
                            msg.content
                        )}
                    </div>

                    {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-gray-300" />
                        </div>
                    )}
                </div>
            ))
        )}
        {isLoading && (
            <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-300" />
                </div>
                <div className="bg-gray-700 p-3 rounded-lg rounded-bl-none text-sm text-gray-400 animate-pulse">
                    Thinking...
                </div>
            </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="relative">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the selected context..."
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
                disabled={contextCount === 0 || isLoading}
            />
            <button 
                type="submit"
                disabled={contextCount === 0 || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="w-5 h-5" />
            </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;

