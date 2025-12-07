import React from 'react';
import DIDAgentAvatar from './DIDAgentAvatar';
// import DIDTalksAvatar from './DIDTalksAvatar';

export const DIDExperience = ({ message, onMessagePlayed, onConnectionChange, speakOnly, skipChatHistory }) => {
  return (
    <div className="w-full h-full relative">
      <DIDAgentAvatar 
        customMessage={message} 
        onCustomMessagePlayed={onMessagePlayed}
        onConnectionChange={onConnectionChange}
        speakOnly={speakOnly}
        skipChatHistory={skipChatHistory}
      />
      {/* Using Agent API - has better compatibility */}
    </div>
  );
};

export default DIDExperience;
