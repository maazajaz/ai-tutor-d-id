import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export const useEmotionDetection = ({ onEmotionDetected, enabled = true }) => {
  const videoRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const detectionIntervalRef = useRef(null);
  const lastAlertTimeRef = useRef({});
  const onEmotionDetectedRef = useRef(onEmotionDetected);
  
  // Keep the callback ref updated
  useEffect(() => {
    onEmotionDetectedRef.current = onEmotionDetected;
  }, [onEmotionDetected]);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('🔄 Loading face-api models...');
        const MODEL_URL = '/models';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        
        console.log('✅ Models loaded successfully');
        setIsModelLoaded(true);
      } catch (error) {
        console.error('❌ Error loading models:', error);
      }
    };

    loadModels();
  }, []);

  // Initialize camera and start detection
  useEffect(() => {
    if (!enabled || !isModelLoaded) return;

    let stream = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initializeCamera = async () => {
      try {
        console.log('📹 Initializing camera...');
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // CRITICAL FIX: Force video playback for hidden video elements
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(() => {
              console.log('▶️ Video playback started successfully');
              console.log('📐 Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
              console.log('📊 Video state:', {
                readyState: videoRef.current.readyState,
                paused: videoRef.current.paused,
                currentTime: videoRef.current.currentTime
              });
            }).catch(err => {
              console.error('❌ Failed to start video playback:', err);
            });
          };

          console.log('✅ Webcam started successfully');
          startDetection();
        }
      } catch (error) {
        console.error('❌ Error accessing webcam:', error);
        
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 Retrying camera initialization (${retryCount}/${MAX_RETRIES})...`);
          setTimeout(initializeCamera, 2000);
        }
      }
    };

    const startDetection = () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }

      detectionIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          try {
            // Detect face with same settings as debug page
            const detection = await faceapi
              .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.5
              }))
              .withFaceLandmarks()
              .withFaceExpressions();

            if (detection) {
              const expressions = detection.expressions;
              
              // Use natural emotion detection - no custom thresholds
              let dominantEmotion = Object.keys(expressions).reduce((a, b) => 
                expressions[a] > expressions[b] ? a : b
              );
              
              const confidence = expressions[dominantEmotion];

              // Log all emotions for debugging
              console.log('🎭 Emotions detected:', {
                neutral: expressions.neutral?.toFixed(3),
                happy: expressions.happy?.toFixed(3),
                sad: expressions.sad?.toFixed(3),
                angry: expressions.angry?.toFixed(3),
                surprised: expressions.surprised?.toFixed(3),
                fearful: expressions.fearful?.toFixed(3),
                disgusted: expressions.disgusted?.toFixed(3),
                dominant: dominantEmotion
              });

              setCurrentEmotion({ emotion: dominantEmotion, confidence });
              
              // Update emotion history (keep last 5)
              setEmotionHistory(prev => {
                const newHistory = [...prev, dominantEmotion].slice(-5);
                
                // Analyze patterns when we have enough data
                if (newHistory.length >= 5) {
                  analyzeEmotionPattern(newHistory);
                }
                
                return newHistory;
              });
            } else {
              console.log('⚠️ No face detected');
            }
          } catch (error) {
            console.error('❌ Detection error:', error);
          }
        }
      }, 3000); // Check every 3 seconds
    };

    const analyzeEmotionPattern = (recentEmotions) => {
      const now = Date.now();

      // Check for sadness (offer encouragement and jokes)
      const sadCount = recentEmotions.filter(e => e === 'sad').length;
      
      if (sadCount >= 3) {
        // Detected sad state multiple times
        if (!lastAlertTimeRef.current.sad || now - lastAlertTimeRef.current.sad > 120000) {
          console.log('😢 User appears sad - offering encouragement');
          onEmotionDetectedRef.current?.('sad', 'I am feeling a bit sad. Can you crack some jokes to cheer me up? 😄');
          lastAlertTimeRef.current.sad = now;
        }
      }

      // Check for frustration (angry)
      const angryCount = recentEmotions.filter(e => e === 'angry').length;
      if (angryCount >= 3) {
        if (!lastAlertTimeRef.current.angry || now - lastAlertTimeRef.current.angry > 120000) {
          console.log('😤 User appears frustrated');
          onEmotionDetectedRef.current?.('angry', 'I am feeling frustrated with this topic. Can you help me understand it better? 🎯');
          lastAlertTimeRef.current.angry = now;
        }
      }

      // Check for happiness (positive reinforcement)
      const happyCount = recentEmotions.filter(e => e === 'happy').length;
      if (happyCount >= 3) {
        if (!lastAlertTimeRef.current.happy || now - lastAlertTimeRef.current.happy > 300000) {
          console.log('😊 User appears happy - reinforcing positivity');
          onEmotionDetectedRef.current?.('happy', 'Great energy! You\'re doing amazing! Keep it up! 🌟');
          lastAlertTimeRef.current.happy = now;
        }
      }
    };

    initializeCamera();

    // Cleanup
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [enabled, isModelLoaded]); // Removed onEmotionDetected - using ref instead

  return {
    videoRef,
    isModelLoaded,
    currentEmotion,
    emotionHistory
  };
};
