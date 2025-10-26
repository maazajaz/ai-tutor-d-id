import { useEffect, useState } from 'react';
import YouTubeAnalyzer from '../utils/youtubeAnalyzer';

export function YouTubePlayer({ url, onAnalysis, onError }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const analyzeVideo = async () => {
      try {
        setAnalyzing(true);
        setProgress(0);

        // Create analyzer instance
        const analyzer = new YouTubeAnalyzer();
        
        // Extract video ID
        const videoId = YouTubeAnalyzer.extractVideoId(url);
        if (!videoId) {
          throw new Error('Invalid YouTube URL');
        }

        // Start analysis
        setProgress(10);
        const analysis = await analyzer.analyzeVideo(videoId);
        setProgress(70);

        // Format the analysis results
        const summary = `🎥 **Video Analysis: ${analysis.title}**
Duration: ${Math.floor(analysis.duration / 60)}:${String(Math.floor(analysis.duration % 60)).padStart(2, '0')}

📊 Content Overview:
${analysis.keyMoments.map((moment, i) => 
  `${i + 1}. [${Math.floor(moment.time / 60)}:${String(Math.floor(moment.time % 60)).padStart(2, '0')}] - Key moment detected (${Math.round(moment.importance * 100)}% significance)`
).join('\\n')}

🎯 Key Points:
${analysis.transcript ? '\\n' + analysis.transcript : '\\n- Direct audio analysis available (no captions needed)'}

🔍 Summary:
This video covers key topics with significant moments marked above. The content has been analyzed without relying on captions, focusing instead on visual and audio patterns to identify important segments.`;

        setProgress(100);
        onAnalysis(summary);

      } catch (error) {
        console.error('Video analysis error:', error);
        onError(error.message);
      } finally {
        setAnalyzing(false);
      }
    };

    if (url) {
      analyzeVideo();
    }
  }, [url, onAnalysis, onError]);

  if (!analyzing) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 bg-white rounded-lg shadow-xl border-2 border-blue-500 p-4 w-64">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-800">Analyzing Video</h3>
          <p className="text-xs text-blue-600">{progress}% complete</p>
        </div>
      </div>
      <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}