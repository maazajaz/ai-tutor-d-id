import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import jsPDF from 'jspdf';

// Test jsPDF import
console.log('jsPDF imported:', jsPDF);

export const ChatNotes = ({ isOpen, onClose }) => {
  const { currentChatNotes, saveCurrentChatNotes, generateAINotes, chatSessions, currentChatId, chatHistory, loading } = useChat();
  const [notes, setNotes] = useState(currentChatNotes || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  // Update local notes when switching chats
  useEffect(() => {
    setNotes(currentChatNotes || '');
    setHasUnsavedChanges(false);
  }, [currentChatNotes, currentChatId]);

  // Safety check - return early after hooks
  if (!chatSessions || !currentChatId) {
    return null;
  }

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    setHasUnsavedChanges(e.target.value !== currentChatNotes);
  };

  const saveNotes = async () => {
    await saveCurrentChatNotes(notes);
    setHasUnsavedChanges(false);
  };

  const discardChanges = () => {
    setNotes(currentChatNotes);
    setHasUnsavedChanges(false);
  };

  const handleGenerateAINotes = async () => {
    if (chatHistory.length === 0) {
      alert('No conversation history available to generate notes from.');
      return;
    }

    try {
      setIsGeneratingNotes(true);
      const aiNotes = await generateAINotes();
      
      if (aiNotes) {
        // Append AI notes to existing notes if any
        const newNotes = notes ? `${notes}\n\n## AI Generated Summary:\n\n${aiNotes}` : `## AI Generated Summary:\n\n${aiNotes}`;
        setNotes(newNotes);
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error('Failed to generate AI notes:', error);
      alert('Failed to generate AI notes. Please try again.');
    } finally {
      setIsGeneratingNotes(false);
    }
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
    const margin = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add text with automatic line wrapping and better formatting
    const addText = (text, fontSize = 12, isBold = false, color = 'black') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      // Set text color
      if (color === 'gray') {
        doc.setTextColor(100, 100, 100);
      } else {
        doc.setTextColor(0, 0, 0);
      }
      
      const lines = doc.splitTextToSize(text, maxLineWidth);
      
      // Check if we need a new page
      const lineHeight = fontSize * 0.6;
      const totalHeight = lines.length * lineHeight;
      
      if (yPosition + totalHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(lines, margin, yPosition);
      yPosition += totalHeight + 8;
      
      return yPosition;
    };

    // Function to process and format markdown-like text
    const processNotesText = (text) => {
      if (!text) return;
      
      const lines = text.split('\n');
      
      for (let line of lines) {
        line = line.trim();
        
        if (!line) {
          yPosition += 5; // Add space for empty lines
          continue;
        }
        
        // Handle different header levels
        if (line.startsWith('## ')) {
          // H2 - Medium header
          const headerText = line.replace('## ', '');
          addText(headerText, 16, true);
        } else if (line.startsWith('# ')) {
          // H1 - Large header
          const headerText = line.replace('# ', '');
          addText(headerText, 18, true);
        } else if (line.startsWith('### ')) {
          // H3 - Small header
          const headerText = line.replace('### ', '');
          addText(headerText, 14, true);
        } else if (line.startsWith('- ')) {
          // Bullet points
          const bulletText = '• ' + line.replace('- ', '');
          addText(bulletText, 11, false);
        } else if (line.match(/^\d+\. /)) {
          // Numbered lists
          addText(line, 11, false);
        } else if (line.startsWith('**') && line.endsWith('**')) {
          // Bold text
          const boldText = line.replace(/\*\*/g, '');
          addText(boldText, 12, true);
        } else if (line.startsWith('```')) {
          // Code blocks - skip the markdown syntax
          continue;
        } else {
          // Regular text
          addText(line, 12, false);
        }
      }
    };

    // Add a subtle line separator
    const addSeparator = () => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;
    };

    // Title with better formatting
    addText('📝 Learning Notes', 20, true);
    yPosition += 5;
    
    // Session info
    addText(`Topic: ${currentSession.title}`, 14, true);
    
    // Date with proper formatting
    const createdDate = currentSession.createdAt ? new Date(currentSession.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    addText(`Date: ${createdDate}`, 11, false, 'gray');
    
    addSeparator();

    // Check if user has any notes
    const userNotes = notes?.trim();
    
    if (userNotes && userNotes.length > 0) {
      addText('My Personal Notes:', 16, true);
      yPosition += 5;
      
      // Process the user's notes with proper markdown formatting
      processNotesText(userNotes);
    } else {
      addText('My Personal Notes:', 16, true);
      yPosition += 5;
      addText('No personal notes added yet.', 12, false, 'gray');
      yPosition += 20;
      
      // Add some helpful prompts
      addText('Ideas for notes:', 14, true);
      addText('• Key concepts you learned', 11, false);
      addText('• Questions to explore further', 11, false);
      addText('• Important formulas or code snippets', 11, false);
      addText('• Personal insights and connections', 11, false);
      addText('• Areas that need more practice', 11, false);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    yPosition = pageHeight - margin;
    addText('Generated by AI Digital Tutor', 8, false, 'gray');

    // Save the PDF with a cleaner filename
    const topicName = currentSession.title.substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const fileName = `study-notes-${topicName}.pdf`;
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
                  onClick={handleGenerateAINotes}
                  disabled={isGeneratingNotes || chatHistory.length === 0}
                  className="p-1 rounded-md hover:bg-blue-50 text-blue-600 disabled:text-gray-400 disabled:hover:bg-transparent"
                  title="Generate AI notes summary"
                >
                  {isGeneratingNotes ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={exportNotes}
                  className="p-2 rounded-md hover:bg-blue-50 text-blue-600 border border-blue-200 transition-colors"
                  title="Export your personal notes as PDF"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m0 4h8m-8-8h2" />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                  title="Close notes"
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

✏️ Manual notes: Type your own insights and thoughts
💡 AI-generated: Click the lightbulb icon to generate summary notes automatically

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
