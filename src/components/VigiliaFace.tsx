import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, Eye, EyeOff, Volume2, VolumeX, Maximize, Minimize, 
  Sparkles, Activity, Shield, RefreshCw, Save, Film, Layers, 
  UserCheck, UserX, SlidersHorizontal, Palette, Sliders, Zap
} from 'lucide-react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
}

interface WaveRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

type PaletteType = 'ESMERALDA' | 'NEON' | 'SOLAR' | 'CRYO';
type CameraFilterType = 'SURVEILLANCE' | 'NIGHT_VISION' | 'CYBER_DARK' | 'RAW';

const COLOR_PALETTES: Record<PaletteType, {
  name: string;
  primary: string;
  secondary: string;
  glow: string;
  accent: string;
  bgGrad: string;
}> = {
  ESMERALDA: {
    name: 'ESMERALDA CIBER',
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.8)',
    accent: '#a7f3d0',
    bgGrad: 'rgba(2, 6, 4, '
  },
  NEON: {
    name: 'NEÓN SPECTRAL',
    primary: '#ec4899',
    secondary: '#a855f7',
    glow: 'rgba(236, 72, 153, 0.8)',
    accent: '#38bdf8',
    bgGrad: 'rgba(6, 2, 7, '
  },
  SOLAR: {
    name: 'SOLAR GOLD',
    primary: '#f59e0b',
    secondary: '#ef4444',
    glow: 'rgba(245, 158, 11, 0.8)',
    accent: '#fde047',
    bgGrad: 'rgba(7, 4, 2, '
  },
  CRYO: {
    name: 'CRYO MATRIX',
    primary: '#38bdf8',
    secondary: '#818cf8',
    glow: 'rgba(56, 189, 248, 0.8)',
    accent: '#ffffff',
    bgGrad: 'rgba(2, 5, 9, '
  }
};

// Structural anatomical lines for authentic cybernetic face mesh
const CYBER_FACIAL_LINES: [number, number][] = [
  // Jawline
  [234, 93], [93, 132], [132, 58], [58, 172], [172, 136], [136, 150], [150, 149],
  [149, 176], [176, 148], [148, 152], [152, 377], [377, 400], [400, 378], [378, 379],
  [379, 365], [365, 397], [397, 288], [288, 361], [361, 323], [323, 454],
  // Cheeks to nose bridge
  [234, 116], [116, 117], [117, 118], [118, 119], [119, 120], [120, 197],
  [454, 345], [345, 346], [346, 347], [347, 348], [348, 349], [349, 197],
  // Nose bridge & structure
  [168, 6], [6, 197], [197, 195], [195, 5], [5, 4], [4, 1], [1, 19], [19, 94], [94, 2],
  [98, 97], [97, 2], [2, 326], [326, 327],
  // Eyebrows
  [70, 63], [63, 105], [105, 66], [66, 107], [107, 55],
  [336, 296], [296, 334], [334, 293], [293, 300], [300, 285],
  // Eyebrows to forehead triangulation
  [107, 168], [168, 336], [10, 109], [109, 67], [67, 103], [103, 54],
  [10, 338], [338, 297], [297, 332], [332, 284],
  // Eye sockets
  [33, 160], [160, 158], [158, 133], [133, 153], [153, 144], [144, 33],
  [362, 385], [385, 387], [387, 263], [263, 373], [373, 380], [380, 362],
  // Lip contours
  [61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314], [314, 405],
  [405, 321], [321, 375], [375, 291], [291, 308], [308, 324], [324, 318],
  [318, 402], [402, 317], [317, 14], [14, 87], [87, 178], [178, 88], [88, 95], [95, 61],
  [78, 95], [95, 88], [88, 178], [178, 87], [87, 14], [14, 317], [317, 402],
  [402, 318], [318, 324], [324, 308], [308, 415], [415, 310], [310, 311],
  [311, 312], [312, 13], [13, 82], [82, 81], [81, 80], [80, 191], [191, 78],
  // Chin to mouth triangulation
  [61, 152], [291, 152], [14, 152], [13, 1], [61, 1], [291, 1]
];

export const VigiliaFace: React.FC = () => {
  // Modes
  const MODES = {
    MIRADA: { id: 'MIRADA', name: '01 · COSMOS MIRADA', desc: 'Enjambre nebular de 400 partículas impulsadas por la pupila' },
    GESTO: { id: 'GESTO', name: '02 · TOPOLOGÍA CYBER', desc: 'Malla sagrada poligonal, auras de tensión y erupción de energía' },
    ORGANISMO: { id: 'ORGANISMO', name: '03 · ORGANISMO VIVO', desc: 'Entidad simbiótica biomórfica que respira y muta con tu rostro' }
  };

  const [activeMode, setActiveMode] = useState<keyof typeof MODES>('GESTO');
  const [activePalette, setActivePalette] = useState<PaletteType>('ESMERALDA');
  const [cameraFilter, setCameraFilter] = useState<CameraFilterType>('CYBER_DARK');

  // Interactive controls
  const [sensitivity, setSensitivity] = useState(1.5);
  const [cameraOpacity, setCameraOpacity] = useState(0.45);
  const [particleDensity] = useState(380);

  // EMA (Exponential Moving Average) Smoothing Factor for anti-jitter
  const [emaAlpha, setEmaAlpha] = useState(0.42);
  const emaAlphaRef = useRef(emaAlpha);
  useEffect(() => {
    emaAlphaRef.current = emaAlpha;
  }, [emaAlpha]);

  // Toggles
  const [trackEyes, setTrackEyes] = useState(true);
  const [trackBrows, setTrackBrows] = useState(true);
  const [trackMouth, setTrackMouth] = useState(true);
  const [trackHead, setTrackHead] = useState(true);
  const [showMesh, setShowMesh] = useState(true);
  const [showCameraBg, setShowCameraBg] = useState(true);
  const [showHUD, setShowHUD] = useState(true);

  // Audio system state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // Status & Telemetry
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isInstallationMode, setIsInstallationMode] = useState(false);
  const [fps, setFps] = useState(60);
  const [faceDetected, setFaceDetected] = useState(false);

  // Recording & Capture
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoFormat, setVideoFormat] = useState<'mp4' | 'mov' | 'webm'>('mp4');

  // Live metrics for UI
  const [metrics, setMetrics] = useState({
    gazeX: 0,
    gazeY: 0,
    blinkLeft: 0,
    blinkRight: 0,
    jawOpen: 0,
    browUp: 0,
    headRoll: 0,
    faceScale: 1
  });

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordingCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Offscreen Downsampled Canvas Ref for Ultra-Fast (10x) Inference
  const downscaleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Detection & Tracking Refs
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);
  const lastDetectTimeRef = useRef(0);
  const lastTimestampMsRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Simulation time ref
  const simAngleRef = useRef(0);

  // Decoupled Landmark Buffers for Butter-Smooth 60 FPS
  const currentLandmarksRef = useRef<any[] | null>(null);
  const targetLandmarksRef = useRef<any[] | null>(null);
  const currentBlendshapesRef = useRef<Record<string, number>>({});
  const targetBlendshapesRef = useRef<Record<string, number>>({});
  const realFaceDetectedRef = useRef(false);
  const missCountRef = useRef(0);

  // EMA (Exponential Moving Average) Smoothing Persistent State Buffers
  const emaLandmarksRef = useRef<{ x: number; y: number; z: number }[] | null>(null);
  const emaBlendshapesRef = useRef<Record<string, number>>({});

  // Audio Context & Nodes Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const droneOsc1Ref = useRef<OscillatorNode | null>(null);
  const droneOsc2Ref = useRef<OscillatorNode | null>(null);
  const harmonicOscRef = useRef<OscillatorNode | null>(null);

  // Generative State
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<WaveRipple[]>([]);
  const lastBlinkStateRef = useRef({ left: false, right: false });
  const smoothedMetricsRef = useRef({
    gazeX: 0,
    gazeY: 0,
    blinkLeft: 0,
    blinkRight: 0,
    jawOpen: 0,
    browUp: 0,
    headRoll: 0,
    faceScale: 1
  });
  const lastMetricsUpdateRef = useRef(0);

  const activePaletteRef = useRef(COLOR_PALETTES[activePalette]);
  useEffect(() => {
    activePaletteRef.current = COLOR_PALETTES[activePalette];
  }, [activePalette]);

  const sensitivityRef = useRef(sensitivity);
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  // Web Audio Synthesizer Initialization
  const initAudio = async () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.01, ctx.currentTime);

      let panner: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(0, ctx.currentTime);
      }

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.setValueAtTime(4.5, ctx.currentTime);

      // Warm cinematic drone
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(82.41, ctx.currentTime); // E2

      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(110.2, ctx.currentTime); // A2 Shimmer

      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(0.18, ctx.currentTime);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.22, ctx.currentTime);
      const g3 = ctx.createGain();
      g3.gain.setValueAtTime(0.12, ctx.currentTime);

      osc1.connect(g1);
      osc2.connect(g2);
      osc3.connect(g3);

      g1.connect(filter);
      g2.connect(filter);
      g3.connect(filter);

      if (panner) {
        filter.connect(panner);
        panner.connect(masterGain);
      } else {
        filter.connect(masterGain);
      }

      masterGain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc3.start();

      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
      filterNodeRef.current = filter;
      pannerNodeRef.current = panner;
      droneOsc1Ref.current = osc1;
      droneOsc2Ref.current = osc2;
      harmonicOscRef.current = osc3;

      setIsAudioInitialized(true);
      setAudioEnabled(true);
    } catch (e) {
      console.warn("Audio init error:", e);
    }
  };

  const toggleAudio = async () => {
    if (!isAudioInitialized) {
      await initAudio();
    } else {
      if (audioEnabled) {
        if (masterGainRef.current && audioCtxRef.current) {
          masterGainRef.current.gain.setTargetAtTime(0.0001, audioCtxRef.current.currentTime, 0.1);
        }
        setAudioEnabled(false);
      } else {
        if (audioCtxRef.current?.state === 'suspended') {
          await audioCtxRef.current.resume();
        }
        if (masterGainRef.current && audioCtxRef.current) {
          masterGainRef.current.gain.setTargetAtTime(0.24, audioCtxRef.current.currentTime, 0.1);
        }
        setAudioEnabled(true);
      }
    }
  };

  const playBlinkSound = useCallback(() => {
    if (!audioEnabled || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // safe
    }
  }, [audioEnabled]);

  // Load MediaPipe Model
  useEffect(() => {
    let isMounted = true;

    // Create downscaled canvas (320x240) for 10x faster inference
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 320;
    offCanvas.height = 240;
    downscaleCanvasRef.current = offCanvas;

    async function loadLandmarker() {
      try {
        setIsLoadingModel(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (!isMounted) return;

        let landmarker: FaceLandmarker;
        try {
          landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 1
          });
        } catch {
          landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "CPU"
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 1
          });
        }

        if (isMounted) {
          landmarkerRef.current = landmarker;
          setIsLoadingModel(false);
        }
      } catch (e) {
        if (isMounted) {
          setIsLoadingModel(false);
          setCameraError("Modelo no disponible. Activando modo simulado.");
          setIsSimulated(true);
        }
      }
    }

    loadLandmarker();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  // Initialize Camera cleanly at optimal 640x480 resolution (smooth & fast)
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Sin soporte de cámara. Modo simulado disponible.");
      setIsSimulated(true);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30, max: 30 }
          }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn("Video play error:", e);
        }
        setIsSimulated(false);
      }
    } catch (err: any) {
      setCameraError("No se pudo iniciar la cámara.");
      setIsSimulated(true);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Keyboard shortcut 'F' or 'Esc' for Installation Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        setIsInstallationMode(prev => !prev);
      } else if (e.key === 'Escape' && isInstallationMode) {
        setIsInstallationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInstallationMode]);

  // Fullscreen document change handler
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isInstallationMode) {
        setIsInstallationMode(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isInstallationMode]);

  const toggleInstallationMode = async () => {
    if (!isInstallationMode) {
      setIsInstallationMode(true);
      if (containerRef.current && containerRef.current.requestFullscreen) {
        try {
          await containerRef.current.requestFullscreen();
        } catch {
          // ignore
        }
      }
    } else {
      setIsInstallationMode(false);
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // ignore
        }
      }
    }
  };

  // Initialize Particles
  useEffect(() => {
    const count = particleDensity;
    const initialParticles: Particle[] = [];
    const pal = activePaletteRef.current;
    for (let i = 0; i < count; i++) {
      initialParticles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3.5 + 1.2,
        alpha: Math.random() * 0.7 + 0.3,
        life: 0.8 + Math.random() * 0.2,
        maxLife: 1.0,
        color: Math.random() > 0.4 ? pal.primary : pal.accent
      });
    }
    particlesRef.current = initialParticles;
  }, [particleDensity, activePalette]);

  // ULTRA-FAST ASYNCHRONOUS INFERENCE LOOP (Runs on downsampled canvas without blocking UI)
  useEffect(() => {
    let isCancelled = false;

    const runInference = () => {
      if (isCancelled) return;

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      const offCanvas = downscaleCanvasRef.current;

      if (!isDetectingRef.current && landmarker && video && offCanvas && video.readyState >= 2 && video.videoWidth > 0 && !isSimulated) {
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
        if (offCtx) {
          isDetectingRef.current = true;

          // Downscale video in 1ms on GPU
          offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

          let ts = Math.floor(performance.now());
          if (ts <= lastTimestampMsRef.current) ts = lastTimestampMsRef.current + 1;
          lastTimestampMsRef.current = ts;

          try {
            // High-speed inference on 320x240 image
            const results = landmarker.detectForVideo(offCanvas, ts);
            if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
              const rawLms = results.faceLandmarks[0];
              const baseAlpha = emaAlphaRef.current;

              // Apply EMA (Exponential Moving Average) filter across all 478 facial landmarks
              if (!emaLandmarksRef.current || emaLandmarksRef.current.length !== rawLms.length) {
                emaLandmarksRef.current = rawLms.map(pt => ({ x: pt.x, y: pt.y, z: pt.z || 0 }));
              } else {
                const emaLms = emaLandmarksRef.current;
                for (let i = 0; i < rawLms.length; i++) {
                  const raw = rawLms[i];
                  const prev = emaLms[i];
                  if (raw && prev) {
                    // Adaptive EMA: small tremors receive heavy smoothing, fast gestures track instantly
                    const dist = Math.hypot(raw.x - prev.x, raw.y - prev.y);
                    const dynamicAlpha = Math.min(0.90, Math.max(baseAlpha, baseAlpha + dist * 5.0));

                    prev.x = dynamicAlpha * raw.x + (1 - dynamicAlpha) * prev.x;
                    prev.y = dynamicAlpha * raw.y + (1 - dynamicAlpha) * prev.y;
                    prev.z = dynamicAlpha * (raw.z || 0) + (1 - dynamicAlpha) * (prev.z || 0);
                  }
                }
              }

              targetLandmarksRef.current = emaLandmarksRef.current;
              realFaceDetectedRef.current = true;
              missCountRef.current = 0;

              // Apply EMA filter across face blendshapes (eyebrows, jaw, blinks)
              if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                const cats = results.faceBlendshapes[0].categories;
                const bMap: Record<string, number> = {};
                for (let i = 0; i < cats.length; i++) {
                  const name = cats[i].categoryName;
                  const rawScore = cats[i].score;
                  const prevScore = emaBlendshapesRef.current[name] ?? rawScore;
                  const diff = Math.abs(rawScore - prevScore);
                  const dynamicAlpha = Math.min(0.90, Math.max(baseAlpha, baseAlpha + diff * 3.5));
                  const smoothed = dynamicAlpha * rawScore + (1 - dynamicAlpha) * prevScore;
                  emaBlendshapesRef.current[name] = smoothed;
                  bMap[name] = smoothed;
                }
                targetBlendshapesRef.current = bMap;
              }
            } else {
              missCountRef.current += 1;
              if (missCountRef.current > 12) {
                realFaceDetectedRef.current = false;
              }
            }
          } catch {
            // Drop frame smoothly
          } finally {
            isDetectingRef.current = false;
          }
        }
      }

      // Schedule next inference frame (~22-25 FPS inference is optimal for CPU/GPU balance)
      if (!isCancelled) {
        setTimeout(runInference, 42);
      }
    };

    runInference();

    return () => {
      isCancelled = true;
    };
  }, [isSimulated]);

  // MAIN RENDER LOOP: BUTTER-SMOOTH 60 FPS GRAPHICS & AUDIO SYNTHESIS
  useEffect(() => {
    let frameCount = 0;
    let fpsTimer = performance.now();

    const loop = () => {
      const now = performance.now();
      frameCount++;
      if (now - fpsTimer >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTimer = now;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const video = videoRef.current;

      if (!canvas || !ctx) {
        animFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const cw = canvas.width || 1280;
      const ch = canvas.height || 720;

      if (video && video.videoWidth > 0 && canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // SYNTHETIC SIMULATION GENERATOR (Only when explicitly activated)
      if (isSimulated) {
        simAngleRef.current += 0.03;
        const sa = simAngleRef.current;

        const sGazeX = Math.sin(sa * 0.8) * 0.6;
        const sGazeY = Math.cos(sa * 0.5) * 0.4;
        const sBlink = Math.sin(sa * 1.5) > 0.94 ? 0.95 : 0.04;
        const sJaw = Math.max(0, Math.sin(sa * 0.7) * 0.7);
        const sBrow = Math.max(0, Math.sin(sa * 0.9) * 0.6);
        const sRoll = Math.sin(sa * 0.4) * 0.18;
        const sScale = 1.0 + Math.sin(sa * 0.3) * 0.12;

        const cx = 0.5 + Math.sin(sa * 0.4) * 0.05;
        const cy = 0.44 + Math.cos(sa * 0.3) * 0.03;
        const eyeOffset = 0.09 * sScale;

        const fakeLandmarks: any[] = [];
        fakeLandmarks[1] = { x: cx, y: cy, z: 0 };
        fakeLandmarks[33] = { x: cx - eyeOffset, y: cy - 0.08, z: 0 };
        fakeLandmarks[133] = { x: cx - eyeOffset + 0.03, y: cy - 0.08, z: 0 };
        fakeLandmarks[263] = { x: cx + eyeOffset, y: cy - 0.08, z: 0 };
        fakeLandmarks[362] = { x: cx + eyeOffset - 0.03, y: cy - 0.08, z: 0 };
        fakeLandmarks[70] = { x: cx - eyeOffset, y: cy - 0.13 - (sBrow * 0.03), z: 0 };
        fakeLandmarks[300] = { x: cx + eyeOffset, y: cy - 0.13 - (sBrow * 0.03), z: 0 };
        fakeLandmarks[13] = { x: cx, y: cy + 0.10, z: 0 };
        fakeLandmarks[14] = { x: cx, y: cy + 0.10 + (sJaw * 0.08), z: 0 };
        fakeLandmarks[61] = { x: cx - 0.06, y: cy + 0.10, z: 0 };
        fakeLandmarks[291] = { x: cx + 0.06, y: cy + 0.10, z: 0 };
        fakeLandmarks[152] = { x: cx, y: cy + 0.24 + (sJaw * 0.05), z: 0 };
        fakeLandmarks[10] = { x: cx, y: cy - 0.22, z: 0 };
        fakeLandmarks[234] = { x: cx - 0.18 * sScale, y: cy, z: 0 };
        fakeLandmarks[454] = { x: cx + 0.18 * sScale, y: cy, z: 0 };
        fakeLandmarks[468] = { x: cx - eyeOffset + (sGazeX * 0.015), y: cy - 0.08 + (sGazeY * 0.015), z: 0 };
        fakeLandmarks[473] = { x: cx + eyeOffset + (sGazeX * 0.015), y: cy - 0.08 + (sGazeY * 0.015), z: 0 };

        targetLandmarksRef.current = fakeLandmarks;
        targetBlendshapesRef.current = {
          eyeBlinkLeft: sBlink,
          eyeBlinkRight: sBlink,
          jawOpen: sJaw,
          browInnerUp: sBrow,
          eyeLookInLeft: sGazeX > 0 ? sGazeX : 0,
          eyeLookOutLeft: sGazeX < 0 ? -sGazeX : 0,
          eyeLookInRight: sGazeX < 0 ? -sGazeX : 0,
          eyeLookOutRight: sGazeX > 0 ? sGazeX : 0,
          eyeLookUpLeft: sGazeY < 0 ? -sGazeY : 0,
          eyeLookDownLeft: sGazeY > 0 ? sGazeY : 0
        };
        realFaceDetectedRef.current = true;
      }

      // SMOOTH LERP INTERPOLATION (Eliminates all jitter)
      const targetLms = targetLandmarksRef.current;
      if (targetLms) {
        if (!currentLandmarksRef.current || currentLandmarksRef.current.length !== targetLms.length) {
          currentLandmarksRef.current = targetLms.map(pt => pt ? { ...pt } : null);
        } else {
          const cur = currentLandmarksRef.current;
          const lerpRate = 0.38;
          for (let i = 0; i < targetLms.length; i++) {
            if (targetLms[i] && cur[i]) {
              cur[i].x += (targetLms[i].x - cur[i].x) * lerpRate;
              cur[i].y += (targetLms[i].y - cur[i].y) * lerpRate;
              cur[i].z += (targetLms[i].z - cur[i].z) * lerpRate;
            } else if (targetLms[i]) {
              cur[i] = { ...targetLms[i] };
            }
          }
        }
      }

      const tBlends = targetBlendshapesRef.current;
      const cBlends = currentBlendshapesRef.current;
      for (const k in tBlends) {
        cBlends[k] = (cBlends[k] || 0) + (tBlends[k] - (cBlends[k] || 0)) * 0.4;
      }

      // DUAL BIOMETRIC EXTRACTION: BLENDSHAPES + EUCLIDEAN GEOMETRY
      const activeLms = currentLandmarksRef.current;
      const sens = sensitivityRef.current;

      let rawJaw = 0;
      let rawBrow = 0;
      let rawGazeX = 0;
      let rawGazeY = 0;
      let hRoll = 0;
      let fScale = 1.0;

      if (activeLms && activeLms[10] && activeLms[152]) {
        const faceH = Math.hypot(activeLms[152].x - activeLms[10].x, activeLms[152].y - activeLms[10].y) || 0.4;
        
        if (activeLms[14] && activeLms[13]) {
          const mouthH = Math.hypot(activeLms[14].x - activeLms[13].x, activeLms[14].y - activeLms[13].y);
          rawJaw = Math.min(1.0, Math.max(0, (mouthH / faceH - 0.035) * 7.5));
        }

        if (activeLms[70] && activeLms[33] && activeLms[300] && activeLms[263]) {
          const browEyeL = Math.hypot(activeLms[70].x - activeLms[33].x, activeLms[70].y - activeLms[33].y);
          const browEyeR = Math.hypot(activeLms[300].x - activeLms[263].x, activeLms[300].y - activeLms[263].y);
          const avgBrow = (browEyeL + browEyeR) / 2;
          rawBrow = Math.min(1.0, Math.max(0, (avgBrow / faceH - 0.11) * 6.0));
        }

        if (activeLms[468] && activeLms[33] && activeLms[133]) {
          const eyeCenterX = (activeLms[33].x + activeLms[133].x) / 2;
          const eyeCenterY = (activeLms[33].y + activeLms[133].y) / 2;
          const eyeWidth = Math.abs(activeLms[133].x - activeLms[33].x) || 0.05;
          rawGazeX = (activeLms[468].x - eyeCenterX) / (eyeWidth * 0.45);
          rawGazeY = (activeLms[468].y - eyeCenterY) / (eyeWidth * 0.35);
        }

        if (activeLms[33] && activeLms[263]) {
          const lx = activeLms[33].x;
          const ly = activeLms[33].y;
          const rx = activeLms[263].x;
          const ry = activeLms[263].y;
          hRoll = Math.atan2(ry - ly, rx - lx);
          const eyeDist = Math.hypot(rx - lx, ry - ly);
          fScale = Math.min(2.5, Math.max(0.6, eyeDist / 0.18));
        }
      }

      const bLeft = Math.min(1, (cBlends['eyeBlinkLeft'] || 0) * sens);
      const bRight = Math.min(1, (cBlends['eyeBlinkRight'] || 0) * sens);
      const jOpen = Math.min(1, Math.max(cBlends['jawOpen'] || 0, rawJaw) * sens);
      const bUp = Math.min(1, Math.max(cBlends['browInnerUp'] || 0, rawBrow) * sens);

      let gX = rawGazeX;
      let gY = rawGazeY;
      if (cBlends['eyeLookInLeft'] !== undefined) {
        const bsGX = ((cBlends['eyeLookOutLeft'] || 0) - (cBlends['eyeLookInLeft'] || 0)) * 2;
        const bsGY = ((cBlends['eyeLookDownLeft'] || 0) - (cBlends['eyeLookUpLeft'] || 0)) * 2;
        gX = (gX * 0.6 + bsGX * 0.4) * sens;
        gY = (gY * 0.6 + bsGY * 0.4) * sens;
      }

      const sm = smoothedMetricsRef.current;
      sm.gazeX += (gX - sm.gazeX) * 0.28;
      sm.gazeY += (gY - sm.gazeY) * 0.28;
      sm.blinkLeft += (bLeft - sm.blinkLeft) * 0.45;
      sm.blinkRight += (bRight - sm.blinkRight) * 0.45;
      sm.jawOpen += (jOpen - sm.jawOpen) * 0.28;
      sm.browUp += (bUp - sm.browUp) * 0.28;
      sm.headRoll += (hRoll - sm.headRoll) * 0.2;
      sm.faceScale += (fScale - sm.faceScale) * 0.2;

      // Throttle React Telemetry state to 6 Hz
      if (now - lastMetricsUpdateRef.current > 150) {
        lastMetricsUpdateRef.current = now;
        setMetrics({
          gazeX: sm.gazeX,
          gazeY: sm.gazeY,
          blinkLeft: sm.blinkLeft,
          blinkRight: sm.blinkRight,
          jawOpen: sm.jawOpen,
          browUp: sm.browUp,
          headRoll: sm.headRoll,
          faceScale: sm.faceScale
        });
        setFaceDetected(realFaceDetectedRef.current);
      }

      // AUDIO MODULATION
      if (audioEnabled && audioCtxRef.current && masterGainRef.current) {
        const actTime = audioCtxRef.current.currentTime;
        const bothEyesClosed = sm.blinkLeft > 0.8 && sm.blinkRight > 0.8;
        const targetGain = bothEyesClosed ? 0.005 : (0.06 + sm.jawOpen * 0.4);
        masterGainRef.current.gain.setTargetAtTime(targetGain, actTime, 0.08);

        if (filterNodeRef.current) {
          const targetFreq = 300 + sm.browUp * 3400;
          filterNodeRef.current.frequency.setTargetAtTime(targetFreq, actTime, 0.08);
        }

        if (pannerNodeRef.current) {
          const pan = Math.max(-1, Math.min(1, -sm.gazeX * 2.2));
          pannerNodeRef.current.pan.setTargetAtTime(pan, actTime, 0.1);
        }

        if (droneOsc1Ref.current && droneOsc2Ref.current) {
          const baseFreq = 55 * sm.faceScale;
          droneOsc1Ref.current.frequency.setTargetAtTime(baseFreq, actTime, 0.1);
          droneOsc2Ref.current.frequency.setTargetAtTime(baseFreq * 1.5, actTime, 0.1);
        }
      }

      // SHOCKWAVE TRIGGER ON BLINK
      const isBlinkingLeft = sm.blinkLeft > 0.68;
      const isBlinkingRight = sm.blinkRight > 0.68;
      if ((isBlinkingLeft && !lastBlinkStateRef.current.left) || 
          (isBlinkingRight && !lastBlinkStateRef.current.right)) {
        
        playBlinkSound();

        const eyeX = cw * (1 - (activeLms?.[33]?.x || 0.5));
        const eyeY = ch * (activeLms?.[33]?.y || 0.45);
        ripplesRef.current.push({
          x: eyeX,
          y: eyeY,
          radius: 12,
          maxRadius: 280 + sm.browUp * 180,
          alpha: 0.95,
          color: activePaletteRef.current.accent
        });
      }
      lastBlinkStateRef.current = { left: isBlinkingLeft, right: isBlinkingRight };

      // MOUTH OPENING: LUMINESCENT NEBULA ERUPTION (No cheap discs!)
      if (trackMouth && sm.jawOpen > 0.22 && activeLms?.[14]) {
        const mouthX = (1 - activeLms[14].x) * cw;
        const mouthY = activeLms[14].y * ch;
        const pal = activePaletteRef.current;
        for (let k = 0; k < 5; k++) {
          particlesRef.current.push({
            x: mouthX + (Math.random() - 0.5) * 35,
            y: mouthY + (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 5 - (sm.gazeX * 4),
            vy: Math.random() * 5 + 2.5,
            size: Math.random() * 4.5 + 2,
            alpha: 1.0,
            life: 1.0,
            maxLife: 1.0,
            color: Math.random() > 0.4 ? pal.accent : pal.primary
          });
        }
      }

      // CANVAS DRAWING PASS
      ctx.save();
      const pal = activePaletteRef.current;

      // Persistence Trail Fade
      ctx.fillStyle = `${pal.bgGrad}${activeMode === 'MIRADA' ? '0.22)' : '0.16)'}`;
      ctx.fillRect(0, 0, cw, ch);

      // STYLED VIDEO FILTERING (Substantial Cyberpunk / Surveillance Look)
      if (showCameraBg && video && video.readyState >= 2 && video.videoWidth > 0 && !isSimulated) {
        ctx.save();
        ctx.globalAlpha = cameraOpacity;
        ctx.translate(cw, 0);
        ctx.scale(-1, 1);

        if (cameraFilter === 'CYBER_DARK') {
          ctx.filter = 'grayscale(80%) contrast(180%) brightness(85%)';
        } else if (cameraFilter === 'SURVEILLANCE') {
          ctx.filter = 'sepia(80%) hue-rotate(85deg) contrast(170%) brightness(95%)';
        } else if (cameraFilter === 'NIGHT_VISION') {
          ctx.filter = 'hue-rotate(60deg) saturate(250%) contrast(200%) brightness(90%)';
        } else {
          ctx.filter = 'contrast(120%) brightness(100%)';
        }

        ctx.drawImage(video, 0, 0, cw, ch);
        ctx.restore();

        // Dark Vignette Overlay for cinematic atmospheric depth
        const grad = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.7);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(2, 6, 4, 0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
      }

      const toScreen = (pt: { x: number; y: number }) => ({
        x: (1 - pt.x) * cw,
        y: pt.y * ch
      });

      // Global spatial transformation
      if (trackHead && realFaceDetectedRef.current) {
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate(-sm.headRoll * 0.95);
        ctx.scale(sm.faceScale, sm.faceScale);
        ctx.translate(-cw / 2, -ch / 2);
      }

      const bothEyesClosed = sm.blinkLeft > 0.82 && sm.blinkRight > 0.82;

      if (!bothEyesClosed && activeLms && realFaceDetectedRef.current) {
        // AUTHENTIC SACRED CYBER WIREFRAME MESH
        if (showMesh) {
          ctx.save();
          ctx.strokeStyle = `rgba(52, 211, 153, ${0.35 + sm.browUp * 0.45})`;
          ctx.lineWidth = 1.2;
          ctx.shadowColor = pal.primary;
          ctx.shadowBlur = 8;

          ctx.beginPath();
          CYBER_FACIAL_LINES.forEach(([idxA, idxB]) => {
            if (activeLms[idxA] && activeLms[idxB]) {
              const pA = toScreen(activeLms[idxA]);
              const pB = toScreen(activeLms[idxB]);
              ctx.moveTo(pA.x, pA.y);
              ctx.lineTo(pB.x, pB.y);
            }
          });
          ctx.stroke();

          // Nodes at key junctions
          ctx.fillStyle = pal.accent;
          [1, 10, 152, 33, 263, 61, 291, 13, 14, 70, 300].forEach(idx => {
            if (activeLms[idx]) {
              const p = toScreen(activeLms[idx]);
              ctx.beginPath();
              ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          });

          ctx.restore();
        }

        // MODE 01: COSMOS MIRADA (400+ Gaze Particle Vector Stream)
        if (activeMode === 'MIRADA') {
          const gazeForceX = -sm.gazeX * 8.5;
          const gazeForceY = sm.gazeY * 8.5;

          const parts = particlesRef.current;
          ctx.lineWidth = 1;
          for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.vx += (gazeForceX - p.vx) * 0.08;
            p.vy += (gazeForceY - p.vy) * 0.08;
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = cw;
            if (p.x > cw) p.x = 0;
            if (p.y < 0) p.y = ch;
            if (p.y > ch) p.y = 0;

            ctx.fillStyle = p.color;
            ctx.shadowColor = pal.primary;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            if (i % 3 === 0 && i > 0) {
              const prev = parts[i - 1];
              const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
              if (dist < 80) {
                ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - dist / 80) * 0.45})`;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(prev.x, prev.y);
                ctx.stroke();
              }
            }
          }
          ctx.shadowBlur = 0;

          // Retinal Target Optic Crosshairs
          if (trackEyes && activeLms[468] && activeLms[473]) {
            const leftIris = toScreen(activeLms[468]);
            const rightIris = toScreen(activeLms[473]);

            [leftIris, rightIris].forEach((iris, idx) => {
              const rot = (now * 0.003) * (idx === 0 ? 1 : -1);
              ctx.save();
              ctx.translate(iris.x, iris.y);
              ctx.rotate(rot);

              // Circular dial
              ctx.strokeStyle = pal.accent;
              ctx.lineWidth = 1.8;
              ctx.shadowColor = pal.primary;
              ctx.shadowBlur = 15;
              ctx.beginPath();
              ctx.arc(0, 0, 18, 0, Math.PI * 2);
              ctx.stroke();

              // Ticks
              for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
                ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22);
                ctx.stroke();
              }

              ctx.restore();

              // Gaze vector laser beam
              ctx.strokeStyle = pal.primary;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(iris.x, iris.y);
              ctx.lineTo(iris.x + gazeForceX * 28, iris.y + gazeForceY * 28);
              ctx.stroke();
            });
          }
        }

        // MODE 02: GESTO (Energy Aura & Kinetic Vortex)
        else if (activeMode === 'GESTO') {
          // Cranial Energy Aura Crown
          if (activeLms[10] && activeLms[152]) {
            const top = toScreen(activeLms[10]);
            const chin = toScreen(activeLms[152]);
            const centerHead = { x: (top.x + chin.x) / 2, y: (top.y + chin.y) / 2 };
            const auraRadius = Math.hypot(top.x - chin.x, top.y - chin.y) * (0.65 + sm.browUp * 0.55);

            ctx.save();
            ctx.strokeStyle = pal.primary;
            ctx.lineWidth = 2.5 + sm.browUp * 4;
            ctx.shadowColor = pal.primary;
            ctx.shadowBlur = 22;
            ctx.setLineDash([14, 16]);
            ctx.beginPath();
            ctx.arc(centerHead.x, centerHead.y, auraRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = pal.secondary;
            ctx.setLineDash([4, 10]);
            ctx.beginPath();
            ctx.arc(centerHead.x, centerHead.y, auraRadius * 1.35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Eyebrow Neon Arcs
          if (trackBrows && activeLms[70] && activeLms[300]) {
            const lb = toScreen(activeLms[70]);
            const rb = toScreen(activeLms[300]);

            ctx.strokeStyle = pal.accent;
            ctx.lineWidth = 3.5 + sm.browUp * 5;
            ctx.shadowColor = pal.accent;
            ctx.shadowBlur = 25;

            ctx.beginPath();
            ctx.moveTo(lb.x - 45, lb.y);
            ctx.lineTo(lb.x + 45, lb.y - sm.browUp * 32);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(rb.x - 45, rb.y - sm.browUp * 32);
            ctx.lineTo(rb.x + 45, rb.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Mouth Kinetic Soundwave Rings (Clean & High-tech, no solid green disc!)
          if (trackMouth && sm.jawOpen > 0.15 && activeLms[13] && activeLms[14] && activeLms[61] && activeLms[291]) {
            const lipTop = toScreen(activeLms[13]);
            const lipBot = toScreen(activeLms[14]);
            const lipLeft = toScreen(activeLms[291]);
            const lipRight = toScreen(activeLms[61]);

            const mCX = (lipTop.x + lipBot.x) / 2;
            const mCY = (lipTop.y + lipBot.y) / 2;
            const mW = Math.hypot(lipLeft.x - lipRight.x, lipLeft.y - lipRight.y);
            const mH = Math.hypot(lipTop.x - lipBot.x, lipTop.y - lipBot.y);

            // Expanding acoustic rings
            for (let ring = 1; ring <= 3; ring++) {
              ctx.strokeStyle = `rgba(16, 185, 129, ${(0.8 / ring) * sm.jawOpen})`;
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.ellipse(mCX, mCY, (mW * 0.5) * (1 + ring * 0.35 * sm.jawOpen), (mH * 0.6) * (1 + ring * 0.45 * sm.jawOpen), 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }

        // MODE 03: ORGANISMO (Symbiotic Fractal Creature blooming over face)
        else if (activeMode === 'ORGANISMO') {
          const t = now * 0.0025;
          const nose = activeLms[1] ? toScreen(activeLms[1]) : { x: cw / 2, y: ch / 2 };

          ctx.save();
          ctx.translate(nose.x, nose.y);

          const layers = 3;
          for (let l = 0; l < layers; l++) {
            const petals = 8 + l * 4;
            const dir = l % 2 === 0 ? 1 : -1;
            ctx.rotate(t * 0.25 * dir);

            const radius = (60 + l * 35 + sm.browUp * 50 + sm.jawOpen * 45) * sm.faceScale;
            for (let p = 0; p < petals; p++) {
              const angle = (p * Math.PI * 2) / petals;
              const dist = radius + Math.sin(t * 3 + p * 2) * (15 + l * 8);
              const px = Math.cos(angle) * dist;
              const py = Math.sin(angle) * dist;

              ctx.strokeStyle = p % 2 === 0 ? pal.primary : pal.accent;
              ctx.lineWidth = 1.8;
              ctx.shadowColor = pal.primary;
              ctx.shadowBlur = 14;

              ctx.beginPath();
              ctx.arc(px, py, 8 + sm.jawOpen * 16, 0, Math.PI * 2);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.quadraticCurveTo(px * 0.5, py * 1.5, px, py);
              ctx.stroke();
            }
          }

          ctx.restore();
        }

        // EXPANDING SHOCKWAVES (Blinks)
        for (let r = ripplesRef.current.length - 1; r >= 0; r--) {
          const rip = ripplesRef.current[r];
          rip.radius += 8;
          rip.alpha -= 0.024;

          if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
            ripplesRef.current.splice(r, 1);
            continue;
          }

          ctx.strokeStyle = rip.color;
          ctx.lineWidth = 3.5;
          ctx.globalAlpha = rip.alpha;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      } else if (bothEyesClosed) {
        ctx.fillStyle = pal.primary;
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = pal.primary;
        ctx.shadowBlur = 18;
        ctx.fillText('// HIBERNACIÓN: OJOS CERRADOS //', cw / 2, ch / 2);
        ctx.shadowBlur = 0;
      } else if (!realFaceDetectedRef.current && !isSimulated) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('// BUSCANDO ROSTRO EN CÁMARA //', cw / 2, ch / 2);
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('Encuadra tu rostro frente a la cámara web', cw / 2, ch / 2 + 24);
      }

      ctx.restore();

      // IN-CANVAS HUD TELEMETRY OVERLAY
      if (showHUD && !isInstallationMode) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(15, 15, 245, 125);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.strokeRect(15, 15, 245, 125);

        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillStyle = pal.primary;
        ctx.fillText(`VIGILIA // 478 LANDMARKS`, 25, 32);

        // Boca Bar
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText(`BOCA: ${(sm.jawOpen * 100).toFixed(0)}% ${sm.jawOpen > 0.25 ? '⚡ EMANANDO' : ''}`, 25, 50);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(115, 42, 125, 8);
        ctx.fillStyle = pal.primary;
        ctx.fillRect(115, 42, 125 * Math.min(1, sm.jawOpen), 8);

        // Cejas Bar
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText(`CEJAS: ${(sm.browUp * 100).toFixed(0)}%`, 25, 68);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(115, 60, 125, 8);
        ctx.fillStyle = pal.secondary;
        ctx.fillRect(115, 60, 125 * Math.min(1, sm.browUp), 8);

        // Mirada Vector
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText(`MIRADA: X:${sm.gazeX.toFixed(2)} Y:${sm.gazeY.toFixed(2)}`, 25, 88);
        ctx.fillText(`FPS: ${fps} // EMA: α=${emaAlpha.toFixed(2)} [ANTI-JITTER]`, 25, 103);
        ctx.fillText(`PALETA: ${activePalette} // FILTRO: ${cameraFilter}`, 25, 118);
        ctx.restore();
      }

      // RECORDING FRAME CAPTURE
      if (isRecording && recordingCanvasRef.current) {
        const rCanvas = recordingCanvasRef.current;
        const rCtx = rCanvas.getContext('2d');
        if (rCtx) {
          if (rCanvas.width !== cw || rCanvas.height !== ch) {
            rCanvas.width = cw;
            rCanvas.height = ch;
          }
          rCtx.clearRect(0, 0, cw, ch);
          rCtx.drawImage(canvas, 0, 0);

          rCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          rCtx.fillRect(0, ch - 35, cw, 35);
          rCtx.fillStyle = pal.primary;
          rCtx.font = 'bold 12px "JetBrains Mono", monospace';
          rCtx.fillText(`VIGILIA · ROSTRO // [${activeMode}] // ${new Date().toLocaleTimeString()}`, 20, ch - 12);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [activeMode, trackEyes, trackBrows, trackMouth, trackHead, showMesh, showCameraBg, showHUD, audioEnabled, isSimulated, isRecording, cameraOpacity, cameraFilter, playBlinkSound]);

  // Video Recording Logic
  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setRecordingTime(0);
    } else {
      if (!recordingCanvasRef.current) return;
      const stream = recordingCanvasRef.current.captureStream(30);

      const mimeCandidates: Record<string, string[]> = {
        mp4: ['video/mp4;codecs=avc1', 'video/mp4;codecs=h264', 'video/mp4', 'video/webm'],
        mov: ['video/quicktime', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm'],
        webm: ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
      };

      let selectedMime = '';
      for (const m of mimeCandidates[videoFormat]) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      let recorder: MediaRecorder;
      try {
        recorder = selectedMime ? new MediaRecorder(stream, { mimeType: selectedMime }) : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const actualMime = recorder.mimeType || selectedMime || 'video/mp4';
        const blob = new Blob(recordedChunksRef.current, { type: actualMime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const ext = videoFormat === 'mov' ? 'mov' : videoFormat === 'mp4' ? 'mp4' : 'webm';
        a.download = `VIGILIA_ROSTRO_${activeMode}_${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 200);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    }
  };

  useEffect(() => {
    let timer: number;
    if (isRecording) {
      timer = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Snapshot Capture
  const takeSnapshot = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, tempCanvas.height - 35, tempCanvas.width, 35);
    ctx.fillStyle = activePaletteRef.current.primary;
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`NÚCLEO COLECTIVO // VIGILIA · ROSTRO // ${activeMode} // ${new Date().toISOString()}`, 20, tempCanvas.height - 12);

    const link = document.createElement('a');
    link.download = `VIGILIA_ROSTRO_${activeMode}_${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-[#020503] text-green-500 font-mono select-none overflow-hidden flex flex-col ${
        isInstallationMode ? 'cursor-none' : ''
      }`}
    >
      {/* Off-screen video element (continuous hardware decoding) */}
      <video 
        ref={videoRef} 
        playsInline 
        muted 
        autoPlay 
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '640px',
          height: '480px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }} 
      />
      <canvas ref={recordingCanvasRef} className="hidden" />

      {/* Top Header */}
      {!isInstallationMode && (
        <header className="h-12 border-b border-green-950/60 bg-black/85 backdrop-blur-md px-4 flex items-center justify-between z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[9px] bg-green-950/80 border border-green-700/50 text-green-400 font-bold tracking-widest rounded-sm">
              MOD · 02
            </span>
            <h1 className="text-sm font-black tracking-widest text-white flex items-center gap-1.5">
              VIGILIA <span className="text-green-500">· ROSTRO / FACE INTERFACE</span>
            </h1>

            {/* Tracking Status indicator */}
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-green-950">
              {faceDetected ? (
                <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold">
                  <UserCheck size={13} className="text-green-400" />
                  ROSTRO CONECTADO (60 FPS)
                </span>
              ) : isSimulated ? (
                <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold">
                  <Activity size={12} />
                  SENSOR SIMULADO
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-bold animate-pulse">
                  <UserX size={13} />
                  BUSCANDO ROSTRO EN CÁMARA...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Toggle Real Camera / Simulated Sensor */}
            <button
              onClick={() => {
                setIsSimulated(prev => !prev);
                if (isSimulated) {
                  startCamera();
                }
              }}
              className={`px-2.5 py-1 rounded-sm border text-[9px] font-bold transition-all ${
                isSimulated 
                  ? 'bg-yellow-950/60 border-yellow-600 text-yellow-300' 
                  : 'bg-green-950/40 border-green-800 text-green-400 hover:border-green-500'
              }`}
            >
              {isSimulated ? 'MODO: SIMULADO' : 'MODO: CÁMARA REAL'}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`px-3 py-1 rounded-sm border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                audioEnabled 
                  ? 'bg-green-900/60 border-green-500 text-green-300 shadow-[0_0_12px_rgba(34,197,94,0.4)]' 
                  : 'border-neutral-800 text-neutral-500 hover:text-green-400'
              }`}
            >
              {audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              {audioEnabled ? 'AUDIO: ON' : 'ACTIVAR AUDIO'}
            </button>

            {/* Installation Mode Toggle */}
            <button
              onClick={toggleInstallationMode}
              className="px-3 py-1 rounded-sm border border-green-800 hover:border-green-400 bg-green-950/50 text-green-300 text-[10px] font-bold flex items-center gap-1.5 transition-all hover:bg-green-900/60 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
              title="Presiona 'F' para alternar pantalla completa"
            >
              <Maximize size={13} />
              MODO INSTALACIÓN
            </button>
          </div>
        </header>
      )}

      {/* Main Workspace */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* Visual Canvas Display Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-contain"
          />

          {/* Installation Mode Exit Button */}
          {isInstallationMode && (
            <div className="absolute top-4 right-4 z-40 flex items-center gap-3">
              <button
                onClick={toggleInstallationMode}
                className="p-2.5 bg-black/70 hover:bg-black/90 border border-green-800 hover:border-green-400 text-green-400 rounded-full transition-all opacity-30 hover:opacity-100"
                title="Salir del Modo Instalación (Esc o F)"
              >
                <Minimize size={18} />
              </button>
            </div>
          )}

          {/* Privacy badge */}
          {!isInstallationMode && (
            <div className="absolute bottom-2 left-3 z-20 flex items-center gap-2 text-[9px] text-green-800 bg-black/80 px-2.5 py-1 border border-green-950 rounded">
              <Shield size={10} className="text-green-600" />
              <span>El procesamiento del rostro ocurre localmente en este dispositivo. No se envía video al servidor.</span>
            </div>
          )}

          {/* Camera Warning Banner */}
          {cameraError && !isInstallationMode && (
            <div className="absolute top-4 left-4 z-30 max-w-md bg-yellow-950/90 border border-yellow-700/70 p-3 rounded text-[11px] text-yellow-300 backdrop-blur-md">
              <p className="text-[10px] text-yellow-200/80 mb-2">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-3 py-1 bg-yellow-800 hover:bg-yellow-700 text-white rounded text-[9px] font-bold tracking-wider"
              >
                REINTENTAR CÁMARA
              </button>
            </div>
          )}

          {/* Model Loading Spinner */}
          {isLoadingModel && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-40">
              <RefreshCw className="w-10 h-10 text-green-500 animate-spin mb-3" />
              <p className="text-xs tracking-widest text-green-400 font-bold">CARGANDO MODELO DE VISIÓN MEDIAPIPE...</p>
              <p className="text-[10px] text-green-700 mt-1">Cálculo 100% privado en cliente</p>
            </div>
          )}
        </div>

        {/* Technical Control Panel */}
        {!isInstallationMode && (
          <aside className="w-full md:w-80 lg:w-88 border-t md:border-t-0 md:border-l border-green-950/60 bg-[#040805] p-3 flex flex-col gap-3 overflow-y-auto">
            {/* Mode Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-green-600 tracking-wider flex items-center gap-1.5">
                <Sparkles size={11} /> MODO ARTÍSTICO
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {(Object.keys(MODES) as (keyof typeof MODES)[]).map((modeKey) => (
                  <button
                    key={modeKey}
                    onClick={() => setActiveMode(modeKey)}
                    className={`p-2 rounded text-left border transition-all ${
                      activeMode === modeKey
                        ? 'bg-green-950/80 border-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                        : 'border-green-950/60 text-green-700 hover:text-green-400 hover:border-green-800'
                    }`}
                  >
                    <div className="text-xs font-black tracking-wider">{MODES[modeKey].name}</div>
                    <div className="text-[9px] opacity-70 mt-0.5">{MODES[modeKey].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette Selector */}
            <div className="border-t border-green-950/60 pt-2 space-y-1.5">
              <span className="text-[10px] font-bold text-green-600 tracking-wider flex items-center gap-1.5">
                <Palette size={11} /> PALETA CROMÁTICA
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(COLOR_PALETTES) as PaletteType[]).map((palKey) => {
                  const pal = COLOR_PALETTES[palKey];
                  return (
                    <button
                      key={palKey}
                      onClick={() => setActivePalette(palKey)}
                      className={`p-1.5 rounded border text-left flex items-center gap-2 transition-all ${
                        activePalette === palKey
                          ? 'border-green-500 bg-green-950/50 text-white'
                          : 'border-neutral-900 text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.primary }}></span>
                      <span className="text-[9px] font-bold tracking-wider">{pal.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video Processing Filter */}
            <div className="border-t border-green-950/60 pt-2 space-y-1.5">
              <span className="text-[10px] font-bold text-green-600 tracking-wider flex items-center gap-1.5">
                <Camera size={11} /> TRATAMIENTO ÓPTICO (CÁMARA)
              </span>
              <div className="grid grid-cols-2 gap-1 text-[9px]">
                {[
                  { id: 'CYBER_DARK', label: 'CIBER OSCURO' },
                  { id: 'SURVEILLANCE', label: 'CCTV PHOSPHOR' },
                  { id: 'NIGHT_VISION', label: 'VISIÓN NOCTURNA' },
                  { id: 'RAW', label: 'NATURAL' }
                ].map(flt => (
                  <button
                    key={flt.id}
                    onClick={() => setCameraFilter(flt.id as CameraFilterType)}
                    className={`py-1 px-2 rounded border font-bold text-left transition-all ${
                      cameraFilter === flt.id 
                        ? 'bg-green-950/70 border-green-500 text-white' 
                        : 'border-neutral-900 text-neutral-500 hover:text-green-400'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Dynamic Sliders */}
            <div className="border-t border-green-950/60 pt-2 space-y-2">
              <span className="text-[10px] font-bold text-green-600 tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal size={11} /> CALIBRACIÓN EN VIVO
              </span>

              {/* Sensibilidad */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-neutral-400">
                  <span>SENSIBILIDAD GESTUAL</span>
                  <span className="text-green-400">{sensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.1"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-900 rounded appearance-none cursor-pointer accent-green-500"
                />
              </div>

              {/* Filtro de Suavizado EMA (Anti-Jitter) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Zap size={10} className="text-green-400" />
                    SUAVIZADO EMA (ANTI-JITTER)
                  </span>
                  <span className="text-green-400 font-mono">
                    {emaAlpha <= 0.25 ? 'MÁXIMO' : emaAlpha <= 0.55 ? 'EQUILIBRADO' : 'REACTIVO'} (α={emaAlpha.toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.85"
                  step="0.05"
                  value={emaAlpha}
                  onChange={(e) => setEmaAlpha(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-900 rounded appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-[8px] text-neutral-500 font-mono">
                  <span>← Menos temblor (estable)</span>
                  <span>Más reactivo →</span>
                </div>
              </div>

              {/* Opacidad Fondo Cámara */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-neutral-400">
                  <span>VISIBILIDAD CÁMARA (FONDO)</span>
                  <span className="text-green-400">{(cameraOpacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.85"
                  step="0.05"
                  value={cameraOpacity}
                  onChange={(e) => setCameraOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-900 rounded appearance-none cursor-pointer accent-green-500"
                />
              </div>
            </div>

            {/* Tracking Layer Toggles */}
            <div className="border-t border-green-950/60 pt-2 space-y-1.5">
              <span className="text-[10px] font-bold text-green-600 tracking-wider flex items-center gap-1.5">
                <Layers size={11} /> CAPAS & SENSORES
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                <button
                  onClick={() => setShowMesh(!showMesh)}
                  className={`py-1.5 px-2 rounded border font-bold flex items-center justify-between ${
                    showMesh ? 'bg-green-950/60 border-green-600 text-green-300' : 'border-neutral-900 text-neutral-600'
                  }`}
                >
                  <span>MALLA FACIAL 3D</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                </button>

                <button
                  onClick={() => setTrackEyes(!trackEyes)}
                  className={`py-1.5 px-2 rounded border font-bold flex items-center justify-between ${
                    trackEyes ? 'bg-green-950/60 border-green-600 text-green-300' : 'border-neutral-900 text-neutral-600'
                  }`}
                >
                  <span>RETÍCULAS OJOS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                </button>

                <button
                  onClick={() => setTrackBrows(!trackBrows)}
                  className={`py-1.5 px-2 rounded border font-bold flex items-center justify-between ${
                    trackBrows ? 'bg-green-950/60 border-green-600 text-green-300' : 'border-neutral-900 text-neutral-600'
                  }`}
                >
                  <span>AURAS CEJAS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                </button>

                <button
                  onClick={() => setTrackMouth(!trackMouth)}
                  className={`py-1.5 px-2 rounded border font-bold flex items-center justify-between ${
                    trackMouth ? 'bg-green-950/60 border-green-600 text-green-300' : 'border-neutral-900 text-neutral-600'
                  }`}
                >
                  <span>BOCA / PARTÍCULAS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                </button>

                <button
                  onClick={() => setTrackHead(!trackHead)}
                  className={`py-1.5 px-2 rounded border font-bold flex items-center justify-between ${
                    trackHead ? 'bg-green-950/60 border-green-600 text-green-300' : 'border-neutral-900 text-neutral-600'
                  }`}
                >
                  <span>CABEZA / ESPACIO</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                </button>

                <button
                  onClick={() => setShowCameraBg(!showCameraBg)}
                  className={`py-1.5 px-2 rounded border font-bold flex items-center justify-between ${
                    showCameraBg ? 'bg-green-950/60 border-green-600 text-green-300' : 'border-neutral-900 text-neutral-600'
                  }`}
                >
                  <span>FONDO CÁMARA</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                </button>

                <button
                  onClick={() => setShowHUD(!showHUD)}
                  className={`py-1.5 px-2 rounded border font-bold flex items-center justify-between ${
                    showHUD ? 'bg-green-950/60 border-green-600 text-green-300' : 'border-neutral-900 text-neutral-600'
                  }`}
                >
                  <span>VÚMETROS EN LIENZO</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                </button>
              </div>
            </div>

            {/* Real-time Facial Telemetry */}
            <div className="border-t border-green-950/60 pt-2 space-y-1">
              <span className="text-[10px] font-bold text-green-600 tracking-wider flex items-center gap-1.5">
                <Activity size={11} /> MONITOR DE RESPUESTA
              </span>
              <div className="bg-black/80 p-2 rounded border border-green-950 text-[9px] space-y-1.5 font-mono">
                <div>
                  <div className="flex justify-between text-neutral-400 mb-0.5">
                    <span>APERTURA BOCA:</span>
                    <span className="text-green-400 font-bold">{(metrics.jawOpen * 100).toFixed(0)}% {metrics.jawOpen > 0.25 ? '⚡ EMANANDO' : ''}</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded overflow-hidden">
                    <div className="bg-green-500 h-full transition-all" style={{ width: `${Math.min(100, metrics.jawOpen * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 mb-0.5">
                    <span>ELEVACIÓN CEJAS:</span>
                    <span className="text-green-400 font-bold">{(metrics.browUp * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all" style={{ width: `${Math.min(100, metrics.browUp * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex justify-between border-t border-neutral-900 pt-1 text-[8px] text-neutral-400">
                  <span>MIRADA VECTOR:</span>
                  <span className="text-green-300 font-bold">({metrics.gazeX.toFixed(2)}, {metrics.gazeY.toFixed(2)})</span>
                </div>
                <div className="flex justify-between text-[8px] text-neutral-400">
                  <span>GIRO CABEZA:</span>
                  <span className="text-green-300 font-bold">{(metrics.headRoll * 180 / Math.PI).toFixed(1)}°</span>
                </div>
                <div className="flex justify-between text-[8px] text-neutral-400">
                  <span>FILTRO EMA:</span>
                  <span className="text-green-400 font-bold">α = {emaAlpha.toFixed(2)} (ESTABLE)</span>
                </div>
                <div className="flex justify-between text-[8px] text-neutral-400">
                  <span>RENDER ENGINE:</span>
                  <span className="text-green-400 font-bold">{fps} FPS</span>
                </div>
              </div>
            </div>

            {/* Capture & Recording Controls */}
            <div className="border-t border-green-950/60 pt-2 space-y-2">
              <span className="text-[10px] font-bold text-green-600 tracking-wider flex items-center gap-1.5">
                <Film size={11} /> CAPTURA & REGISTRO
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleRecording}
                  className={`py-2 px-3 rounded text-[10px] font-black tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
                    isRecording
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : 'border-green-800 text-green-300 hover:bg-green-950/60'
                  }`}
                >
                  <Film size={10} />
                  {isRecording ? `REC ${recordingTime}s` : `GRABAR .${videoFormat.toUpperCase()}`}
                </button>

                <button
                  onClick={takeSnapshot}
                  className="py-2 px-3 rounded text-[10px] font-black tracking-wider flex items-center justify-center gap-1.5 border border-green-800 text-green-300 hover:bg-green-950/60 transition-all"
                >
                  <Save size={10} /> FOTO HD
                </button>
              </div>

              <div className="flex items-center justify-between text-[9px] bg-black/60 p-1.5 rounded border border-green-950">
                <span className="text-neutral-500 font-bold">FORMATO VIDEO:</span>
                <div className="flex gap-1">
                  {(['mp4', 'mov', 'webm'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setVideoFormat(fmt)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all ${
                        videoFormat === fmt 
                          ? 'bg-green-500 text-black shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                          : 'bg-neutral-900 text-neutral-500 hover:text-green-300'
                      }`}
                    >
                      .{fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
