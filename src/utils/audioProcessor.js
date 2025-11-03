// Audio processing for echo cancellation and ducking
export class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.agentGainNode = null;
    this.microphoneNode = null;
    this.isInitialized = false;
    this.isSpeaking = false;
    this.lastAudioLevel = 0;
    this.silenceStart = Date.now();
    this.audioHistory = new Array(10).fill(0); // Keep track of last 10 audio levels
    this.historyIndex = 0;
    this.speakingThreshold = 0.15; // More sensitive threshold
    this.silenceThreshold = 0.1; // Lower threshold for silence
    this.minSilenceDuration = 500; // Minimum silence duration in ms
    this.isAgentPlaying = false; // Track if agent is currently playing audio
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create gain node for agent's audio
      this.agentGainNode = this.audioContext.createGain();
      this.agentGainNode.gain.value = 1.0; // Start at full volume
      this.agentGainNode.connect(this.audioContext.destination);
      
      this.isInitialized = true;
      console.log('🎵 Audio processor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize audio processor:', error);
    }
  }

  // Connect agent's video element to audio processing
  connectAgentAudio(videoElement) {
    if (!this.isInitialized) return;
    try {
      const source = this.audioContext.createMediaElementSource(videoElement);
      source.connect(this.agentGainNode);
      console.log('🔊 Agent audio connected to processor');
    } catch (error) {
      console.error('❌ Failed to connect agent audio:', error);
    }
  }

  // Start microphone monitoring with enhanced voice activity detection
  async startMicrophoneMonitoring() {
    if (!this.isInitialized) return;

    try {
      // Get microphone access with noise suppression and echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create analyzer for microphone input
      const micSource = this.audioContext.createMediaStreamSource(stream);
      const analyzer = this.audioContext.createAnalyser();
      analyzer.fftSize = 1024; // Increased for better frequency resolution
      analyzer.smoothingTimeConstant = 0.8; // Smooth out audio analysis
      
      micSource.connect(analyzer);
      
      // Monitor microphone with enhanced voice activity detection
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      
      const checkMicVolume = () => {
        if (!this.isInitialized) return;
        
        analyzer.getFloatFrequencyData(dataArray);
        
        // Calculate RMS value for better speech detection
        let sum = 0;
        let speechFrequencies = 0;
        
        // Focus on speech frequencies (85-255 Hz fundamental frequency)
        for (let i = 2; i < bufferLength; i++) {
          const amplitude = Math.pow(10, dataArray[i] / 20);
          sum += amplitude * amplitude;
          
          // Check if this frequency is in speech range
          const frequency = i * this.audioContext.sampleRate / analyzer.fftSize;
          if (frequency >= 85 && frequency <= 255) {
            speechFrequencies += amplitude;
          }
        }
        
        const rms = Math.sqrt(sum / bufferLength);
        this.audioHistory[this.historyIndex] = rms;
        this.historyIndex = (this.historyIndex + 1) % this.audioHistory.length;
        
        // Calculate moving average
        const average = this.audioHistory.reduce((a, b) => a + b) / this.audioHistory.length;
        
        // Detect significant audio level change
        const audioChange = Math.abs(average - this.lastAudioLevel);
        this.lastAudioLevel = average;
        
        const now = Date.now();
        
        // Check if this is likely human speech
        const isSpeechLike = speechFrequencies > 0.1; // Threshold for speech frequencies
        
        if (average > this.speakingThreshold && isSpeechLike && (!this.isAgentPlaying || audioChange > 0.1)) {
          if (!this.isSpeaking) {
            console.log('🗣️ Speech detected:', {average, speechFrequencies, audioChange});
            this.isSpeaking = true;
            this.duckAgentAudio();
          }
          this.silenceStart = now;
        } else if (average < this.silenceThreshold || !isSpeechLike) {
          // Check if we've been silent long enough
          if (this.isSpeaking && (now - this.silenceStart > this.minSilenceDuration)) {
            console.log('🤫 Silence detected');
            this.isSpeaking = false;
            this.restoreAgentAudio();
          }
        }
        
        // Continue monitoring
        requestAnimationFrame(checkMicVolume);
      };
      
      checkMicVolume();
      console.log('🎤 Enhanced voice monitoring started');
      
    } catch (error) {
      console.error('❌ Failed to start microphone monitoring:', error);
    }
  }
  
  // Set agent playback state
  setAgentPlaybackState(isPlaying) {
    this.isAgentPlaying = isPlaying;
    console.log('🔊 Agent playback state:', isPlaying);
  }

  // Duck (lower) agent's audio
  duckAgentAudio() {
    if (!this.agentGainNode) return;
    // Smoothly reduce volume to 20%
    this.agentGainNode.gain.linearRampToValueAtTime(
      0.2,
      this.audioContext.currentTime + 0.1
    );
  }

  // Restore agent's audio
  restoreAgentAudio() {
    if (!this.agentGainNode) return;
    // Smoothly restore volume to 100%
    this.agentGainNode.gain.linearRampToValueAtTime(
      1.0,
      this.audioContext.currentTime + 0.2
    );
  }

  // Clean up resources
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.agentGainNode = null;
      this.isInitialized = false;
      console.log('🧹 Audio processor cleaned up');
    }
  }
}