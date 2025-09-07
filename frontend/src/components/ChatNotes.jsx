import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import jsPDF from 'jspdf';

// Test jsPDF import
console.log('jsPDF imported:', jsPDF);

export const ChatNotes = ({ isOpen, onClose }) => {
  const { currentChatNotes, updateChatNotes, chatSessions, currentChatId } = useChat();
  const [notes, setNotes] = useState(currentChatNotes || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Safety check
  if (!chatSessions || !currentChatId) {
    return null;
  }

  // Update local notes when switching chats
  useEffect(() => {
    setNotes(currentChatNotes || '');
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
    console.log('PDF Export function called'); // Debug log
    const currentSession = chatSessions.find(s => s.id === currentChatId);
    if (!currentSession) {
      console.log('No current session found');
      return;
    }

    console.log('Creating PDF document'); // Debug log
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add text with automatic line wrapping
    const addText = (text, fontSize = 12, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = doc.splitTextToSize(text, maxLineWidth);
      
      // Check if we need a new page
      if (yPosition + (lines.length * fontSize * 0.5) > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * fontSize * 0.5 + 5;
    };

    // Title
    addText(`Notes for: ${currentSession.title}`, 16, true);
    yPosition += 5;

    // Metadata
    addText(`Created: ${new Date(currentSession.createdAt).toLocaleString()}`, 10);
    addText(`Last Updated: ${new Date(currentSession.updatedAt).toLocaleString()}`, 10);
    yPosition += 10;

    // Chat Messages Section
    addText('Chat Messages:', 14, true);
    yPosition += 5;

    currentSession.messages.forEach((msg, index) => {
      const sender = msg.sender === 'user' ? 'You' : 'AI Tutor';
      addText(`${sender}:`, 11, true);
      addText(msg.text, 10);
      yPosition += 5;
    });

    // Notes Section
    yPosition += 10;
    addText('My Notes:', 14, true);
    yPosition += 5;
    
    const notesText = notes || 'No notes added yet.';
    addText(notesText, 10);

    // Save the PDF
    const fileName = `ai-tutor-notes-${currentSession.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
    doc.save(fileName);
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
                  className="p-2 rounded-md hover:bg-blue-50 text-blue-600 border border-blue-200 transition-colors"
                  title="Export chat with notes as PDF"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m0 4h8m-8-8h2" />
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
