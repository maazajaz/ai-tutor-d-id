import { useEffect, useState, useCallback } from 'react';
import YouTubeAnalyzerUtil from '../utils/youtubeAnalyzer';

export const YouTubeAnalyzer = ({ url, onComplete, onError }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const analyze = useCallback(async () => {
    if (!url || analyzing) return;

    try {
      setAnalyzing(true);
      setProgress(0);

      // Initialize analyzer
      const analyzer = new YouTubeAnalyzerUtil();
      
      // Extract video ID
      const videoId = YouTubeAnalyzerUtil.extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Update progress
      setProgress(25);

      // Start analysis
      const analysis = await analyzer.analyzeVideo(videoId);
      setProgress(75);

      // Format results
      const summary = `📺 **YouTube Video Analysis**

**${analysis.title}**
⏱️ Duration: ${Math.floor(analysis.duration / 60)}:${String(Math.floor(analysis.duration % 60)).padStart(2, '0')}

📊 **Key Points in Video:**
${analysis.keyMoments.map((moment, i) => 
  `${i + 1}. [${moment.timestamp}] - Key segment ${i + 1}`
).join('\\n')}

🔍 **Overview:**
- Analyzed ${Math.floor(analysis.duration / 60)} minutes of content
- Identified ${analysis.keyMoments.length} key segments
- Video ID: ${analysis.videoId}

💡 **Tip:** Click any timestamp to jump to that part of the video`;

      setProgress(100);
      onComplete(summary);

    } catch (error) {
      console.error('Analysis error:', error);
      onError(error.message);
    } finally {
      setAnalyzing(false);
    }
  }, [url, onComplete, onError, analyzing]);

  // Start analysis when URL changes
  useEffect(() => {
    analyze();
  }, [analyze]);

  if (!analyzing) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-lg border-2 border-blue-500 p-4 max-w-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-blue-800 truncate">Analyzing Video Content</h3>
          <p className="text-xs text-blue-600">{progress}% complete</p>
        </div>
      </div>
      <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="mt-2 text-xs text-gray-500 text-center">
        Using direct audio/visual analysis
      </p>
    </div>
  );
};