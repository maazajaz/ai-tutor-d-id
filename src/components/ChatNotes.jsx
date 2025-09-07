import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';

export const ChatNotes = ({ isOpen, onClose }) => {
  const { currentChatNotes, updateChatNotes, chatSessions, currentChatId } = useChat();
  const [notes, setNotes] = useState(currentChatNotes);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update local notes when switching chats
  useEffect(() => {
    setNotes(currentChatNotes);
    setHasUnsavedChanges(false);
  }, [currentChatNotes, currentChatId]);

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    setHasUnsavedChanges(e.target.value !== currentChatNotes);
  };

  const saveNotes = () => {
    updateChatNotes(notes);
    setHasUnsavedChanges(false);
  };

  const discardChanges = () => {
    setNotes(currentChatNotes);
    setHasUnsavedChanges(false);
  };

  const getCurrentChatTitle = () => {
    const currentSession = chatSessions.find(s => s.id === currentChatId);
    return currentSession?.title || 'Current Chat';
  };

  const exportNotes = () => {
    const currentSession = chatSessions.find(s => s.id === currentChatId);
    if (!currentSession) return;

    const content = `# Notes for: ${currentSession.title}
Created: ${new Date(currentSession.createdAt).toLocaleString()}
Last Updated: ${new Date(currentSession.updatedAt).toLocaleString()}

## Chat Messages:
${currentSession.messages.map(msg => 
  `**${msg.sender === 'user' ? 'You' : 'AI Tutor'}:** ${msg.text}`
).join('\n\n')}

## My Notes:
${notes || 'No notes added yet.'}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-tutor-notes-${currentSession.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Notes Panel */}
      <div className={`
        fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        md:w-72 lg:w-80
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Notes</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportNotes}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                  title="Export chat with notes"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="md:hidden p-1 rounded-md hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-1 truncate">
              {getCurrentChatTitle()}
            </p>
            
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={saveNotes}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={discardChanges}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                >
                  Discard
                </button>
              </div>
            )}
          </div>

          {/* Notes Editor */}
          <div className="flex-1 p-4">
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Add your notes about this conversation here...

You can include:
• Key points learned
• Questions to ask later
• Important concepts
• Practice problems to review"
              className="w-full h-full resize-none border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Auto-saved per chat session</span>
              {hasUnsavedChanges && (
                <span className="text-amber-600">• Unsaved changes</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
