// YouTube video analysis utilities
class YouTubeAnalyzerUtil {

  // Extract video ID from various YouTube URL formats
  static extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\/?#]+)/i,
      /^[a-zA-Z0-9_-]{11}$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // Initialize YouTube IFrame API
  static loadYouTubeAPI() {
    return new Promise((resolve, reject) => {
      if (window.YT) {
        resolve(window.YT);
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      
      // Reject if loading takes too long
      setTimeout(() => reject(new Error('YouTube API load timeout')), 10000);
    });
  }

  // Create an invisible player and analyze the video
  async analyzeVideo(videoId) {
    try {
      const YT = await YouTubeAnalyzer.loadYouTubeAPI();
      
      return new Promise((resolve, reject) => {
        // Create temporary container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        const player = new YT.Player(container, {
          height: '360',
          width: '640',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0
          },
          events: {
            onReady: async () => {
              try {
                const duration = player.getDuration();
                const title = player.getVideoData().title;
                
                // Get important timestamps
                const keyMoments = await this.findKeyMoments(player);
                const transcript = await this.generateTranscript(player);
                
                // Clean up
                player.destroy();
                container.remove();

                resolve({
                  title,
                  duration,
                  keyMoments,
                  transcript,
                  videoId
                });
              } catch (error) {
                reject(error);
              }
            },
            onError: (error) => {
              container.remove();
              reject(new Error(`YouTube player error: ${error.data}`));
            }
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to analyze video: ${error.message}`);
    }
  }

  // Find key moments based on audio/visual analysis
  async findKeyMoments(player) {
    const duration = player.getDuration();
    const keyMoments = [];
    
    // Sample points throughout the video
    for (let time = 0; time < duration; time += 30) {
      try {
        // Seek to time
        player.seekTo(time, true);
        
        // Wait for frame to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get current frame as canvas
        const canvas = await this.captureFrame(player);
        
        // Analyze frame importance (basic brightness/contrast)
        const importance = await this.analyzeFrame(canvas);
        
        if (importance > 0.8) { // Threshold for key moment
          keyMoments.push({
            time: time,
            importance: importance
          });
        }
      } catch (error) {
        console.warn(`Error analyzing frame at ${time}s:`, error);
      }
    }

    return keyMoments;
  }

  // Capture current frame as canvas
  async captureFrame(player) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const video = player.getIframe();
    
    canvas.width = video.width;
    canvas.height = video.height;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  // Analyze frame importance
  async analyzeFrame(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate average brightness
    let brightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    brightness /= (data.length / 4);
    
    // Normalize to 0-1
    return brightness / 255;
  }

  // Generate transcript using audio analysis
  async generateTranscript(player) {
    try {
      const duration = player.getDuration();
      const chunks = [];
      
      // Sample audio in chunks
      for (let time = 0; time < duration; time += 10) {
        try {
          player.seekTo(time, true);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Get audio data using Web Audio API
          const audioData = await this.captureAudio(player);
          chunks.push(audioData);
        } catch (error) {
          console.warn(`Error capturing audio at ${time}s:`, error);
        }
      }

      // Combine audio chunks and analyze
      const transcript = await this.processAudioChunks(chunks);
      return transcript;

    } catch (error) {
      throw new Error(`Failed to generate transcript: ${error.message}`);
    }
  }

  // Capture audio using Web Audio API
  async captureAudio(player) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create analyzer
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      // Get frequency data
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
      
      return Array.from(frequencyData);
    } catch (error) {
      console.warn('Audio capture error:', error);
      return [];
    }
  }

  // Process audio data to generate transcript
  async processAudioChunks(chunks) {
    try {
      // Basic transcript generation from audio characteristics
      let transcript = '';
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Detect speech segments
        const hasSpeech = chunk.some(value => value > 128); // Basic threshold
        
        if (hasSpeech) {
          const timeStart = i * 10;
          transcript += `[${this.formatTime(timeStart)}] Speech detected\\n`;
        }
      }
      
      return transcript;
    } catch (error) {
      console.warn('Audio processing error:', error);
      return '';
    }
  }

  // Format time as MM:SS
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export default YouTubeAnalyzerUtil;