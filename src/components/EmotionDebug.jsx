import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export const EmotionDebug = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);
  const detectionIntervalRef = useRef(null);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatus('Loading AI models...');
        const MODEL_URL = '/models';
        
        console.log('📦 Loading models from:', MODEL_URL);
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), // For eye detection
        ]);
        
        console.log('✅ Models loaded successfully');
        setStatus('Models loaded! Starting camera...');
        setIsModelLoaded(true);
      } catch (err) {
        console.error('❌ Error loading models:', err);
        setError('Failed to load models: ' + err.message);
        setStatus('Error loading models');
      }
    };

    loadModels();
  }, []);

  // Start video
  useEffect(() => {
    if (!isModelLoaded) return;

    const startVideo = async () => {
      try {
        setStatus('Requesting camera access...');
        console.log('📹 Requesting camera...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('✅ Camera stream started');
          setStatus('Camera active! Waiting for video to load...');
        }
      } catch (err) {
        console.error('❌ Camera error:', err);
        setError('Camera access denied: ' + err.message);
        setStatus('Camera access denied');
      }
    };

    startVideo();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isModelLoaded]);

  // Detect emotions
  useEffect(() => {
    if (!isModelLoaded || !videoRef.current) return;

    // Calculate Eye Aspect Ratio for drowsiness
    const calculateEAR = (eye) => {
      // Eye is an array of 6 points: [p0, p1, p2, p3, p4, p5]
      // Standard EAR formula uses these landmarks:
      // Vertical distances: p1-p5, p2-p4
      // Horizontal distance: p0-p3
      
      // But let's check all points and use the correct formula
      if (!eye || eye.length !== 6) {
        console.error('Invalid eye landmarks:', eye);
        return 0;
      }
      
      // Calculate vertical distances (height of eye opening)
      const vertical1 = Math.sqrt(
        Math.pow(eye[1].x - eye[5].x, 2) + 
        Math.pow(eye[1].y - eye[5].y, 2)
      );
      const vertical2 = Math.sqrt(
        Math.pow(eye[2].x - eye[4].x, 2) + 
        Math.pow(eye[2].y - eye[4].y, 2)
      );
      
      // Calculate horizontal distance (width of eye)
      const horizontal = Math.sqrt(
        Math.pow(eye[0].x - eye[3].x, 2) + 
        Math.pow(eye[0].y - eye[3].y, 2)
      );
      
      // EAR formula: (vertical1 + vertical2) / (2 * horizontal)
      // When eyes are open: numerator is larger (vertical distances are bigger)
      // When eyes are closed: numerator is smaller (vertical distances shrink)
      const ear = (vertical1 + vertical2) / (2.0 * horizontal);
      
      return ear;
    };

    const detectEmotions = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const detections = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.5
            }))
            .withFaceLandmarks()
            .withFaceExpressions();

          // Clear previous canvas
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }

          if (detections) {
            setStatus('Face detected! ✅');
            
            // Draw detection box and landmarks
            if (canvasRef.current && videoRef.current) {
              const displaySize = {
                width: videoRef.current.width,
                height: videoRef.current.height
              };
              
              faceapi.matchDimensions(canvasRef.current, displaySize);
              const resizedDetections = faceapi.resizeResults(detections, displaySize);
              faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
              faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
            }

            const expressions = detections.expressions;
            let dominantEmotion = Object.keys(expressions).reduce((a, b) => 
              expressions[a] > expressions[b] ? a : b
            );

            // Alternative sleepiness detection - based on emotion patterns
            // If neutral is very high (> 0.95) and confidence is low, person might be disengaged/sleepy
            const isHighlyNeutral = expressions.neutral > 0.95;
            const lowEngagement = expressions[dominantEmotion] > 0.99; // Too confident means no expression
            
            // Check for drowsiness using multiple methods
            let isSleepy = false;
            let earValue = null;
            let sleepyReason = '';
            
            if (detections.landmarks) {
              const leftEye = detections.landmarks.getLeftEye();
              const rightEye = detections.landmarks.getRightEye();
              
              console.log('👁️ Left eye points:', leftEye.length, leftEye);
              console.log('👁️ Right eye points:', rightEye.length, rightEye);
              
              const leftEAR = calculateEAR(leftEye);
              const rightEAR = calculateEAR(rightEye);
              const avgEAR = (leftEAR + rightEAR) / 2;
              earValue = avgEAR;
              
              console.log(`👁️ Left EAR: ${leftEAR.toFixed(3)}, Right EAR: ${rightEAR.toFixed(3)}, Avg: ${avgEAR.toFixed(3)}`);
              
              // If EAR is abnormally high (> 1.0), there's a problem with landmark detection
              if (avgEAR > 1.0) {
                console.warn('⚠️ Abnormal EAR detected - landmark detection issue');
                // Don't use this reading
                earValue = null;
              } else {
                // Lower threshold - adjust based on your face
                // Normal open: 0.25-0.35
                // Half closed: 0.18-0.24
                // Closed: < 0.18
                const EAR_THRESHOLD = 0.20; // Lowered threshold
                
                if (avgEAR < EAR_THRESHOLD) {
                  isSleepy = true;
                  dominantEmotion = 'sleepy';
                  console.log('😴 DROWSINESS DETECTED! EAR:', avgEAR.toFixed(3), '< threshold:', EAR_THRESHOLD);
                } else {
                  console.log('👁️ Eyes open, EAR:', avgEAR.toFixed(3), '>= threshold:', EAR_THRESHOLD);
                }
              }
            } else {
              console.log('⚠️ No landmarks detected');
            }

            console.log('🎭 Emotion:', dominantEmotion, expressions);

            setCurrentEmotion({
              emotion: dominantEmotion,
              confidence: isSleepy ? 0.9 : expressions[dominantEmotion],
              all: expressions,
              isSleepy,
              earValue
            });
          } else {
            setStatus('No face detected. Please face the camera.');
            setCurrentEmotion(null);
          }
        } catch (err) {
          console.error('❌ Detection error:', err);
          setError('Detection error: ' + err.message);
        }
      } else {
        console.log('⏸️ Video not ready, readyState:', videoRef.current?.readyState);
      }
    };

    // Run detection every 2 seconds
    detectionIntervalRef.current = setInterval(detectEmotions, 2000);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isModelLoaded]);

  const handleVideoLoaded = () => {
    console.log('📹 Video metadata loaded');
    setStatus('Video ready! Starting detection...');
  };

  const testSleepiness = () => {
    console.log('🧪 MANUAL SLEEPINESS TEST');
    setCurrentEmotion({
      emotion: 'sleepy',
      confidence: 0.95,
      all: {},
      isSleepy: true,
      earValue: 0.15
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">🎭 Emotion Detection Debug</h1>
        
        {/* Test Button */}
        <div className="mb-4 text-center">
          <button
            onClick={testSleepiness}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            🧪 Test Sleepiness Detection
          </button>
          <p className="text-sm text-gray-400 mt-2">Click to manually trigger sleepy state</p>
        </div>
        
        {/* Status Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isModelLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
              <span>Models: {isModelLoaded ? '✅ Loaded' : '⏳ Loading...'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${videoRef.current?.srcObject ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
              <span>Camera: {videoRef.current?.srcObject ? '✅ Active' : '⏳ Waiting...'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${currentEmotion ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
              <span>Detection: {status}</span>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Video Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Camera Feed</h2>
          <div className="relative inline-block">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              width="640"
              height="480"
              onLoadedMetadata={handleVideoLoaded}
              className="rounded-lg border-2 border-green-500"
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="absolute top-0 left-0"
            />
            
            {/* Real-time EAR Display */}
            {currentEmotion && currentEmotion.earValue && (
              <div className="absolute bottom-4 left-4 bg-black/80 rounded-lg p-3 border-2 border-green-500">
                <div className="text-sm text-white mb-1">Eye Aspect Ratio (EAR)</div>
                <div className={`text-3xl font-bold ${currentEmotion.earValue < 0.20 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                  {currentEmotion.earValue.toFixed(3)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Threshold: 0.20 {currentEmotion.earValue < 0.20 ? '🔴 SLEEPY' : '🟢 AWAKE'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Emotion Results */}
        {currentEmotion && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Current Emotion</h2>
            
            {/* Drowsiness Alert */}
            {currentEmotion.isSleepy && (
              <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg animate-pulse">
                <div className="text-2xl font-bold text-red-400">⚠️ DROWSINESS DETECTED!</div>
                <div className="text-sm mt-2">EAR Value: {currentEmotion.earValue?.toFixed(3)} (threshold: 0.23)</div>
              </div>
            )}
            
            <div className="flex items-center gap-6 mb-6">
              <div className="text-6xl">
                {currentEmotion.emotion === 'sleepy' && '😴'}
                {currentEmotion.emotion === 'happy' && '😊'}
                {currentEmotion.emotion === 'sad' && '😢'}
                {currentEmotion.emotion === 'angry' && '😠'}
                {currentEmotion.emotion === 'surprised' && '😮'}
                {currentEmotion.emotion === 'fearful' && '😨'}
                {currentEmotion.emotion === 'disgusted' && '🤢'}
                {currentEmotion.emotion === 'neutral' && '😐'}
              </div>
              <div>
                <div className="text-3xl font-bold capitalize">{currentEmotion.emotion}</div>
                <div className="text-xl text-green-400">{Math.round(currentEmotion.confidence * 100)}% confidence</div>
                {currentEmotion.earValue && (
                  <div className="text-sm text-gray-400 mt-2">
                    Eye Aspect Ratio: {currentEmotion.earValue.toFixed(3)}
                    {currentEmotion.earValue < 0.23 ? ' 👁️❌ (Closed)' : ' 👁️✅ (Open)'}
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-3">All Emotions:</h3>
            <div className="space-y-2">
              {Object.entries(currentEmotion.all)
                .sort(([, a], [, b]) => b - a)
                .map(([emotion, value]) => (
                  <div key={emotion} className="flex items-center gap-3">
                    <div className="w-24 capitalize">{emotion}</div>
                    <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full transition-all duration-300"
                        style={{ width: `${value * 100}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-right">{Math.round(value * 100)}%</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/30 border border-blue-500 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">📋 Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Allow camera access when prompted</li>
            <li>Position your face in the center of the video</li>
            <li>Make sure there's good lighting</li>
            <li>Try different expressions and watch the detection update</li>
            <li>Check the console (F12) for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
