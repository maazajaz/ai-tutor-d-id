import React from 'react';
import DIDAgentAvatar from './DIDAgentAvatar';
// import DIDTalksAvatar from './DIDTalksAvatar';

export const DIDExperience = () => {
  return (
    <div className="w-full h-full relative">
      <DIDAgentAvatar />
      {/* Using Agent API - has better compatibility */}
    </div>
  );
};

export default DIDExperience;
