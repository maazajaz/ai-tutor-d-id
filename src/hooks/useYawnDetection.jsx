import { useEffect, useRef, useState } from 'react';

/**
 * Yawn Detection Hook
 * Based on: https://github.com/tyrerodr/real-time-drowsy-driving-detection
 * 
 * Uses MediaPipe Face Mesh to detect facial landmarks and calculates:
 * - MAR (Mouth Aspect Ratio) to detect yawning
 * - EAR (Eye Aspect Ratio) to detect drowsiness/microsleep
 * 
 * This replaces the previous emotion detection system.
 * 
 * NOTE: MediaPipe is loaded from CDN (not npm) to avoid bundling issues
 * and ensure proper browser compatibility.
 */
export const useYawnDetection = ({ onYawnDetected, onDrowsinessDetected, enabled = true }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectionStats, setDetectionStats] = useState({
    yawns: 0,
    blinks: 0,
    microsleeps: 0,
    yawnDuration: 0,
    microsleepDuration: 0
  });

  const detectionIntervalRef = useRef(null);
  const faceMeshRef = useRef(null);
  
  // Tracking state
  const yawnInProgressRef = useRef(false);
  const yawnStartTimeRef = useRef(null);
  const leftEyeClosedRef = useRef(false);
  const rightEyeClosedRef = useRef(false);
  const eyesClosedStartRef = useRef(null);
  const lastAlertTimeRef = useRef({});

  // Face Mesh landmark indices (MediaPipe Face Mesh)
  // Based on the repository's point IDs: [187, 411, 152, 68, 174, 399, 298]
  const LANDMARKS = {
    // Mouth landmarks for MAR calculation
    MOUTH_TOP: 13,        // Upper lip top
    MOUTH_BOTTOM: 14,     // Lower lip bottom  
    MOUTH_LEFT: 61,       // Left corner
    MOUTH_RIGHT: 291,     // Right corner
    MOUTH_INNER_TOP: 13,
    MOUTH_INNER_BOTTOM: 14,
    
    // Left eye landmarks for EAR calculation
    LEFT_EYE_TOP: 159,
    LEFT_EYE_BOTTOM: 145,
    LEFT_EYE_LEFT: 33,
    LEFT_EYE_RIGHT: 133,
    
    // Right eye landmarks for EAR calculation
    RIGHT_EYE_TOP: 386,
    RIGHT_EYE_BOTTOM: 374,
    RIGHT_EYE_LEFT: 362,
    RIGHT_EYE_RIGHT: 263
  };

  // Thresholds (tuned for educational engagement monitoring)
  const THRESHOLDS = {
    MAR_YAWN: 0.6,           // Mouth Aspect Ratio threshold for yawn
    EAR_CLOSED: 0.2,          // Eye Aspect Ratio threshold for closed eyes
    YAWN_DURATION_ALERT: 3.0, // Seconds of continuous yawning before alert (reduced from 7.0)
    MICROSLEEP_ALERT: 2.5,    // Seconds of eyes closed before alert (reduced from 4.0)
    ALERT_COOLDOWN: 180000    // 3 minutes between same type of alerts (was 2 minutes)
  };

  /**
   * Calculate Euclidean distance between two points
   */
  const calculateDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  /**
   * Calculate MAR (Mouth Aspect Ratio)
   * MAR = (vertical_distance) / (horizontal_distance)
   * High MAR indicates open mouth (yawning)
   */
  const calculateMAR = (landmarks) => {
    const top = landmarks[LANDMARKS.MOUTH_TOP];
    const bottom = landmarks[LANDMARKS.MOUTH_BOTTOM];
    const left = landmarks[LANDMARKS.MOUTH_LEFT];
    const right = landmarks[LANDMARKS.MOUTH_RIGHT];

    if (!top || !bottom || !left || !right) return 0;

    const verticalDist = calculateDistance(top, bottom);
    const horizontalDist = calculateDistance(left, right);

    return horizontalDist > 0 ? verticalDist / horizontalDist : 0;
  };

  /**
   * Calculate EAR (Eye Aspect Ratio)
   * EAR = (vertical_distance) / (horizontal_distance)
   * Low EAR indicates closed eyes
   */
  const calculateEAR = (landmarks, isLeftEye) => {
    const top = isLeftEye ? landmarks[LANDMARKS.LEFT_EYE_TOP] : landmarks[LANDMARKS.RIGHT_EYE_TOP];
    const bottom = isLeftEye ? landmarks[LANDMARKS.LEFT_EYE_BOTTOM] : landmarks[LANDMARKS.RIGHT_EYE_BOTTOM];
    const left = isLeftEye ? landmarks[LANDMARKS.LEFT_EYE_LEFT] : landmarks[LANDMARKS.RIGHT_EYE_LEFT];
    const right = isLeftEye ? landmarks[LANDMARKS.LEFT_EYE_RIGHT] : landmarks[LANDMARKS.RIGHT_EYE_RIGHT];

    if (!top || !bottom || !left || !right) return 1;

    const verticalDist = calculateDistance(top, bottom);
    const horizontalDist = calculateDistance(left, right);

    return horizontalDist > 0 ? verticalDist / horizontalDist : 1;
  };

  /**
   * Process face mesh results and detect yawning/drowsiness
   */
  const processFaceLandmarks = (results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      console.log('⚠️ No face detected');
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const now = Date.now();

    // Calculate MAR for yawn detection
    const mar = calculateMAR(landmarks);
    
    // Calculate EAR for both eyes
    const leftEAR = calculateEAR(landmarks, true);
    const rightEAR = calculateEAR(landmarks, false);
    const avgEAR = (leftEAR + rightEAR) / 2;

    console.log('👁️ Detection metrics:', {
      MAR: mar.toFixed(3),
      leftEAR: leftEAR.toFixed(3),
      rightEAR: rightEAR.toFixed(3),
      avgEAR: avgEAR.toFixed(3)
    });

    // Yawn Detection
    if (mar > THRESHOLDS.MAR_YAWN) {
      if (!yawnInProgressRef.current) {
        // Yawn started
        yawnInProgressRef.current = true;
        yawnStartTimeRef.current = now;
        setDetectionStats(prev => ({ ...prev, yawns: prev.yawns + 1 }));
        console.log('😮 Yawn detected!');
      } else {
        // Yawn continuing - update duration
        const duration = (now - yawnStartTimeRef.current) / 1000;
        setDetectionStats(prev => ({ ...prev, yawnDuration: duration }));

        // Alert if yawning too long
        if (duration > THRESHOLDS.YAWN_DURATION_ALERT) {
          if (!lastAlertTimeRef.current.yawn || now - lastAlertTimeRef.current.yawn > THRESHOLDS.ALERT_COOLDOWN) {
            console.log('⚠️ Prolonged yawning detected - user might be tired');
            onYawnDetected?.('prolonged_yawn', 'I notice YOU are yawning a lot. Let\'s take a quick break! How about a fun quiz to refresh your mind? I\'ll ask you a simple question about what we just covered. Ready? 🎯');
            lastAlertTimeRef.current.yawn = now;
          }
        }
      }
    } else {
      if (yawnInProgressRef.current) {
        // Yawn ended
        yawnInProgressRef.current = false;
        const finalDuration = (now - yawnStartTimeRef.current) / 1000;
        console.log(`😮 Yawn ended - Duration: ${finalDuration.toFixed(2)}s`);
        setDetectionStats(prev => ({ ...prev, yawnDuration: 0 }));
      }
    }

    // Eye Closure / Drowsiness Detection
    const leftClosed = leftEAR < THRESHOLDS.EAR_CLOSED;
    const rightClosed = rightEAR < THRESHOLDS.EAR_CLOSED;

    if (leftClosed && rightClosed) {
      if (!leftEyeClosedRef.current && !rightEyeClosedRef.current) {
        // Eyes just closed
        leftEyeClosedRef.current = true;
        rightEyeClosedRef.current = true;
        eyesClosedStartRef.current = now;
        setDetectionStats(prev => ({ ...prev, blinks: prev.blinks + 1 }));
        console.log('👁️ Blink detected');
      } else {
        // Eyes still closed - might be microsleep
        const duration = (now - eyesClosedStartRef.current) / 1000;
        setDetectionStats(prev => ({ ...prev, microsleepDuration: duration }));

        // Alert if eyes closed too long
        if (duration > THRESHOLDS.MICROSLEEP_ALERT) {
          if (!lastAlertTimeRef.current.microsleep || now - lastAlertTimeRef.current.microsleep > THRESHOLDS.ALERT_COOLDOWN) {
            console.log('⚠️ Prolonged eye closure detected - user might be drowsy');
            onDrowsinessDetected?.('microsleep', 'Hey! I notice YOUR eyes are getting heavy. 💤 Let\'s wake you up with a quick interactive question! This will help you stay focused. Should I start? 🎮');
            lastAlertTimeRef.current.microsleep = now;
          }
        }
      }
    } else {
      if (leftEyeClosedRef.current && rightEyeClosedRef.current) {
        // Eyes just opened
        leftEyeClosedRef.current = false;
        rightEyeClosedRef.current = false;
        const closedDuration = (now - eyesClosedStartRef.current) / 1000;
        console.log(`👁️ Eyes opened - Closed duration: ${closedDuration.toFixed(2)}s`);
        setDetectionStats(prev => ({ ...prev, microsleepDuration: 0 }));
      }
    }

    // Draw landmarks on canvas (optional - for debugging)
    if (canvasRef.current) {
      drawLandmarks(landmarks);
    }
  };

  /**
   * Draw face landmarks on canvas for debugging
   */
  const drawLandmarks = (landmarks) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw mouth landmarks (red)
    ctx.fillStyle = 'red';
    [LANDMARKS.MOUTH_TOP, LANDMARKS.MOUTH_BOTTOM, LANDMARKS.MOUTH_LEFT, LANDMARKS.MOUTH_RIGHT].forEach(idx => {
      const point = landmarks[idx];
      if (point) {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw eye landmarks (blue)
    ctx.fillStyle = 'blue';
    const eyeIndices = [
      LANDMARKS.LEFT_EYE_TOP, LANDMARKS.LEFT_EYE_BOTTOM, LANDMARKS.LEFT_EYE_LEFT, LANDMARKS.LEFT_EYE_RIGHT,
      LANDMARKS.RIGHT_EYE_TOP, LANDMARKS.RIGHT_EYE_BOTTOM, LANDMARKS.RIGHT_EYE_LEFT, LANDMARKS.RIGHT_EYE_RIGHT
    ];
    eyeIndices.forEach(idx => {
      const point = landmarks[idx];
      if (point) {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  /**
   * Initialize MediaPipe Face Mesh
   */
  useEffect(() => {
    console.log('🎯 useYawnDetection useEffect triggered. Enabled:', enabled);
    
    if (!enabled) {
      console.log('⚠️ Yawn detection is disabled, skipping initialization');
      setIsLoading(false);
      setIsInitialized(false);
      return;
    }

    let stream = null;
    let animationId = null;

    const initializeFaceMesh = async () => {
      try {
        console.log('🔄 Loading MediaPipe Face Mesh...');
        console.log('📍 Step 1: Starting initialization');
        setIsLoading(true);
        console.log('📍 Step 2: Set isLoading to true');
        setError(null);

        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          // Check if it's HTTPS issue
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const isHTTPS = window.location.protocol === 'https:';
          
          if (!isLocalhost && !isHTTPS) {
            throw new Error('Camera requires HTTPS. Please use: https://' + window.location.host);
          } else {
            throw new Error('getUserMedia not supported on this device');
          }
        }
        console.log('📍 Step 3: getUserMedia is available');

        // Load MediaPipe Face Mesh from CDN
        console.log('📍 Step 4: Loading MediaPipe Face Mesh from CDN...');
        
        // Load the script if not already loaded
        if (!window.FaceMesh) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        console.log('📍 Step 5: MediaPipe loaded successfully');

        const faceMesh = new window.FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          }
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false, // Disable for faster performance
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults(processFaceLandmarks);
        faceMeshRef.current = faceMesh;

        console.log('✅ MediaPipe Face Mesh initialized');

        // Initialize camera using native getUserMedia (mobile compatible)
        // Wait for video element to be available
        if (!videoRef.current) {
          console.log('⏳ Waiting for video element to mount...');
          // Wait a bit for the DOM to be ready
          await new Promise(resolve => setTimeout(resolve, 500)); // Increased to 500ms
        }

        if (videoRef.current) {
          console.log('📹 Requesting camera access...');
          console.log('📺 Video element exists:', !!videoRef.current);
          
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
              }
            });

            console.log('✅ Camera stream obtained');
            videoRef.current.srcObject = stream;
            
            // Wait for video to be ready with LONGER timeout for mobile
            await Promise.race([
              new Promise((resolve, reject) => {
                const video = videoRef.current;
                
                const onMetadata = () => {
                  console.log('📐 Video metadata loaded:', {
                    width: video.videoWidth,
                    height: video.videoHeight,
                    readyState: video.readyState
                  });
                  
                  // Try to play
                  video.play()
                    .then(() => {
                      console.log('▶️ Video playing');
                      
                      // Wait a bit more to ensure video is actually playing
                      setTimeout(() => {
                        if (video.readyState >= 2) {
                          resolve();
                        } else {
                          reject(new Error('Video not ready after play'));
                        }
                      }, 500);
                    })
                    .catch(err => {
                      console.error('❌ Video play error:', err);
                      reject(err);
                    });
                };
                
                video.addEventListener('loadedmetadata', onMetadata);
                
                // If already loaded
                if (video.readyState >= 1) {
                  onMetadata();
                }
                
                // Longer timeout for mobile - 30 seconds
                setTimeout(() => reject(new Error('Video load timeout')), 30000);
              })
            ]);

            console.log('✅ Camera stream started');
            setIsInitialized(true);
            setIsLoading(false);
            setError(null);

            // Start detection loop
            const detectLoop = async () => {
              if (faceMeshRef.current && videoRef.current && videoRef.current.readyState === 4) {
                try {
                  await faceMeshRef.current.send({ image: videoRef.current });
                } catch (error) {
                  console.error('❌ Detection error:', error);
                }
              }
              animationId = requestAnimationFrame(detectLoop);
            };

            detectLoop();
            console.log('✅ Yawn detection loop started');
            
          } catch (cameraError) {
            console.error('❌ Camera error:', cameraError);
            setIsLoading(false);
            if (cameraError.name === 'NotAllowedError') {
              setError('Camera permission denied. Please allow camera access.');
            } else if (cameraError.name === 'NotFoundError') {
              setError('No camera found on device.');
            } else if (cameraError.name === 'NotReadableError') {
              setError('Camera is already in use by another app.');
            } else {
              setError('Failed to access camera: ' + cameraError.message);
            }
            throw cameraError;
          }
        } else {
          // Video element not available
          console.error('❌ Video element not available');
          setIsLoading(false);
          setError('Video element not ready. Please refresh the page.');
        }
      } catch (error) {
        console.error('❌ Error initializing Face Mesh:', error);
        setIsInitialized(false);
        setIsLoading(false);
        setError(error.message || 'Failed to initialize face detection');
      }
    };

    initializeFaceMesh();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, [enabled]);

  return {
    videoRef,
    canvasRef,
    isInitialized,
    isLoading,
    error,
    detectionStats
  };
};
