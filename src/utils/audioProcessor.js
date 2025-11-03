// Audio processing for echo cancellation and ducking
export class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.agentGainNode = null;
    this.microphoneNode = null;
    this.isInitialized = false;
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

  // Start microphone monitoring for ducking
  async startMicrophoneMonitoring() {
    if (!this.isInitialized) return;

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create analyzer for microphone input
      const micSource = this.audioContext.createMediaStreamSource(stream);
      const analyzer = this.audioContext.createAnalyser();
      analyzer.fftSize = 256;
      
      micSource.connect(analyzer);
      
      // Monitor microphone volume for ducking
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkMicVolume = () => {
        if (!this.isInitialized) return;
        
        analyzer.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        // Duck agent's audio when user is speaking
        if (average > 30) { // Threshold for speech detection
          this.duckAgentAudio();
        } else {
          this.restoreAgentAudio();
        }
        
        // Continue monitoring
        requestAnimationFrame(checkMicVolume);
      };
      
      checkMicVolume();
      console.log('🎤 Microphone monitoring started');
      
    } catch (error) {
      console.error('❌ Failed to start microphone monitoring:', error);
    }
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