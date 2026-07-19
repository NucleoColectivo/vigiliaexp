import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Activity, Eye, Mic, Settings, Play, Square, Terminal, Network, RefreshCw, Volume2, VolumeX, Save, FileText, Grid, Zap, Aperture, Target, Crosshair, Sparkles, MessageSquare, Share2, Radio, Trash2, Sliders, Music, MicOff, Monitor, EyeOff, Lock, Type, Moon, Sun, Disc, Shuffle, Cpu, PenTool, BarChart3, ShieldCheck, UserPlus, Fingerprint } from 'lucide-react';

interface VigiliaCoreProps {
  userName: string;
}

export const VigiliaCore: React.FC<VigiliaCoreProps> = ({ userName }) => {
  const MODES = {
    BREATH: { id: 'BREATH', label: 'RESPIRACIÓN', icon: <Activity size={14} /> },
    TRACE: { id: 'TRACE', label: 'RASTRO', icon: <Zap size={14} /> },
    PARTICLES: { id: 'PARTICLES', label: 'PARTÍCULAS', icon: <Sparkles size={14} /> },
    HEATMAP: { id: 'HEATMAP', label: 'MAPA CALOR', icon: <Grid size={14} /> },
    NETWORK: { id: 'NETWORK', label: 'CONEXIONES', icon: <Share2 size={14} /> },
    SCANNER: { id: 'SCANNER', label: 'ESCÁNER', icon: <Radio size={14} /> },
    POETIC: { id: 'POETIC', label: 'POÉTICA KINÉTICA', icon: <Type size={14} /> }
  };

  const CAMERA_FILTERS: Record<string, any> = {
    CCTV: { id: 'CCTV', label: 'CCTV B/N', filter: 'grayscale(100%) contrast(140%) brightness(110%)', icon: <Lock size={12}/> },
    RETRO: { id: 'RETRO', label: 'COLOR TV', filter: 'saturate(200%) contrast(110%) sepia(30%) hue-rotate(-10deg)', icon: <Disc size={12}/> },
    NIGHT: { id: 'NIGHT', label: 'NOCTURNO', filter: 'grayscale(100%) sepia(100%) hue-rotate(60deg) saturate(300%) contrast(1.2)', icon: <Moon size={12}/> },
    SPECTRAL: { id: 'SPECTRAL', label: 'ESPECTRAL', filter: 'invert(100%) hue-rotate(180deg) contrast(150%)', icon: <Sun size={12}/> },
    THERMAL: { id: 'THERMAL', label: 'TÉRMICA', filter: 'sepia(100%) hue-rotate(90deg) saturate(400%) contrast(1.5) invert(100%)', icon: <Activity size={12}/> },
    NEON: { id: 'NEON', label: 'NEÓN', filter: 'contrast(120%) saturate(500%) hue-rotate(0deg)', icon: <Zap size={12}/> },
    DEEP: { id: 'DEEP', label: 'SUBMARINO', filter: 'sepia(80%) hue-rotate(170deg) saturate(300%) contrast(1.2)', icon: <Zap size={12}/> }
  };

  const ZONES = [
    { id: 0, label: 'TL', x: 0, y: 0, w: 0.5, h: 0.5, role: 'BASS' },
    { id: 1, label: 'TR', x: 0.5, y: 0, w: 0.5, h: 0.5, role: 'MIDS' },
    { id: 2, label: 'BL', x: 0, y: 0.5, w: 0.5, h: 0.5, role: 'NOISE' },
    { id: 3, label: 'BR', x: 0.5, y: 0.5, w: 0.5, h: 0.5, role: 'SILENCE' },
  ];

  const BACKUP_PHRASES = [
      "EL SILENCIO ES DATOS COMPRIMIDOS",
      "LA MEMORIA ES UN ERROR DEL SISTEMA",
      "TU IMAGEN ES SOLO LUZ ATRAPADA",
      "RESPIRANDO CÓDIGO MUERTO",
      "VIGILANCIA PERMANENTE",
      "ECOS EN LA MATRIZ",
      "EL VACÍO OBSERVA",
      "CONEXIÓN INESTABLE CON LA REALIDAD",
      "FANTASMAS EN LA MÁQUINA",
      "LA QUIETUD ES RUIDO BLANCO",
      "NO HAY NADIE AL OTRO LADO",
      "SISTEMA OPERATIVO EMOCIONAL"
  ];

  const MESH_COLS = 42; 
  const MESH_ROWS = 32; 
  const MESH_TENSION = 0.03;
  const MESH_DAMPENING = 0.94;
  const HEAT_W = 40;
  const HEAT_H = 30;
  const HEAT_SIZE = HEAT_W * HEAT_H;

  const getAverageVolume = (array: Uint8Array) => {
      let values = 0;
      for (let i = 0; i < array.length; i++) { values += array[i]; }
      return values / array.length;
  }

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      if (!text) return;
      const words = text.split(' ');
      let line = '';
      let lines = [];
      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) { lines.push(line); line = words[n] + ' '; }
        else { line = testLine; }
      }
      lines.push(line);
      
      const safeX = Math.max(50, Math.min(x, ctx.canvas.width - 50));
      const safeY = Math.max(80, Math.min(y, ctx.canvas.height - 80));

      const totalHeight = lines.length * lineHeight;
      let startY = safeY - (totalHeight / 2) + (lineHeight / 2);
      
      lines.forEach((l, i) => { 
          ctx.lineWidth = 4;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.strokeText(l, safeX, startY + (i * lineHeight)); 
          
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#10b981';
          ctx.fillStyle = '#ffffff'; 
          ctx.fillText(l, safeX, startY + (i * lineHeight)); 
          ctx.shadowBlur = 0; 
      });
  };

  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    hue: number;
    isTrace: boolean;
    sizeBase: number;

    constructor(x: number, y: number, hue: number, isTrace: boolean, initialEnergy = 1.0) {
      this.x = x;
      this.y = y;
      const speed = 2 + (initialEnergy * 5);
      this.vx = (Math.random() - 0.5) * speed; 
      this.vy = (Math.random() - 0.5) * speed;
      this.life = 1.0;
      this.decay = Math.random() * 0.01 + 0.005;
      this.hue = hue;
      this.isTrace = isTrace;
      this.sizeBase = isTrace ? 1 : Math.random() * 2 + 1; 
    }
    update(target?: any) {
      this.x += this.vx;
      this.y += this.vy;
      if (!this.isTrace) this.vy += 0.08; 
      this.vx *= 0.94; 
      this.vy *= 0.94;
      this.life -= this.decay;
      return this.life > 0;
    }
    draw(ctx: CanvasRenderingContext2D) {
      const lightness = 50 + (this.life * 50);
      const alpha = this.life;
      ctx.fillStyle = `hsla(${this.hue}, 100%, ${lightness}%, ${alpha})`;
      
      ctx.beginPath();
      const size = this.sizeBase * (this.isTrace ? 1 : this.life * 1.5); 
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const [activeMode, setActiveMode] = useState(MODES.POETIC.id); 
  const [activeFilter, setActiveFilter] = useState(CAMERA_FILTERS.CCTV.id); 
  const [autoMode, setAutoMode] = useState(false);
  const [autoPoetic, setAutoPoetic] = useState(true);

  const [isSystemActive, setIsSystemActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [galleryMode, setGalleryMode] = useState(false);
  
  const [uiMotionScore, setUiMotionScore] = useState(0);
  const [uiAudioScore, setUiAudioScore] = useState(0); 
  const [uiCentroid, setUiCentroid] = useState({ x: 0.5, y: 0.5 });
  const [poeticTrigger, setPoeticTrigger] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  
  const [logs, setLogs] = useState<{time: string, text: string}[]>([]);
  const [sessionLogs, setSessionLogs] = useState<{time: string, text: string}[]>([]); 
  const [micEnabled, setMicEnabled] = useState(false);   
  
  const [bandSensitivities, setBandSensitivities] = useState({ bass: 1.2, mid: 1.0, treble: 1.5 });

  const [sensitivity, setSensitivity] = useState(25);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeZone, setActiveZone] = useState<number | null>(null); 
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const activeModeRef = useRef(MODES.POETIC.id);
  const activeFilterRef = useRef(CAMERA_FILTERS.CCTV.id);
  const bandSensitivitiesRef = useRef(bandSensitivities);
  const sensitivityRef = useRef(sensitivity);
  const activeZoneRef = useRef(activeZone);
  const micEnabledRef = useRef(micEnabled);
  const currentPoeticPhraseRef = useRef("SISTEMA DE LENGUAJE ACTIVO");
  
  const motionScoreRef = useRef(0);
  const audioScoreRef = useRef(0);
  const centroidRef = useRef({ x: 0.5, y: 0.5 });
  const cameraPanRef = useRef({ x: 0, y: 0, scale: 1.0 }); 
  const frameCounterRef = useRef(0);
  const lastAutoPoetCall = useRef(0);
  const silenceTimer = useRef(0);
  const glitchActiveRef = useRef(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null); 

  const bandsRef = useRef({ bass: 0, mid: 0, treble: 0 });
  const meshRef = useRef<any[]>([]);

  useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);
  useEffect(() => { activeFilterRef.current = activeFilter; }, [activeFilter]);
  useEffect(() => { bandSensitivitiesRef.current = bandSensitivities; }, [bandSensitivities]);
  useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);
  useEffect(() => { activeZoneRef.current = activeZone; }, [activeZone]);
  useEffect(() => { micEnabledRef.current = micEnabled; }, [micEnabled]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const oscCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameData = useRef<ImageData | null>(null);
  const requestRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]); 
  const activePointsRef = useRef<{x: number, y: number}[]>([]);
  const heatmapGrid = useRef(new Float32Array(40 * 30).fill(0));
  const scanLineY = useRef(0); 

  useEffect(() => {
      const points = [];
      for(let i=0; i < MESH_COLS * MESH_ROWS; i++) {
          points.push({ z: 0, vz: 0, baseZ: 0 });
      }
      meshRef.current = points;
  }, []);

  const addLog = useCallback((text: string, record = true) => {
    const timestamp = new Date().toLocaleTimeString();
    const safeText = String(text);
    setLogs(prev => [{ time: timestamp, text: safeText }, ...prev.slice(0, 9)]);
    if (record && isRecording) setSessionLogs(prev => [...prev, { time: timestamp, text: safeText }]);
  }, [isRecording]);

  const callGeminiPoet = async () => {
    if (isLoadingAI) return;
    const now = Date.now();
    if (now - lastAutoPoetCall.current < 4000) return; 
    
    setIsLoadingAI(true);
    lastAutoPoetCall.current = now;

    if (Math.random() > 0.6) { 
        const backup = BACKUP_PHRASES[Math.floor(Math.random() * BACKUP_PHRASES.length)];
        currentPoeticPhraseRef.current = backup;
        setPoeticTrigger(true);
        setTimeout(() => setPoeticTrigger(false), 8000);
        addLog(`[POÉTICA] ${backup}`, true);
        setIsLoadingAI(false);
        return;
    }

    try {
      const recentLogs = sessionLogs.slice(-5).map(l => l.text).join('; ');
      const response = await fetch(`/api/poetic`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recentLogs })
      });
      const data = await response.json();
      const text = data.text;
      
      if (text) {
        currentPoeticPhraseRef.current = text; 
        setPoeticTrigger(true); 
        setTimeout(() => setPoeticTrigger(false), 8000); 
        addLog(`[POÉTICA] ${text.substring(0, 30)}...`, true);
      } else {
        throw new Error("No text");
      }
    } catch (e) { 
        const backup = BACKUP_PHRASES[Math.floor(Math.random() * BACKUP_PHRASES.length)];
        currentPoeticPhraseRef.current = backup;
        setPoeticTrigger(true);
        setTimeout(() => setPoeticTrigger(false), 8000);
    } finally { setIsLoadingAI(false); }
  };

  const togglePoetic = () => {
      const newState = !autoPoetic;
      setAutoPoetic(newState);
      if (newState) {
          callGeminiPoet();
      }
  };

  const generateManifesto = async () => {
    setIsLoadingAI(true);
    const recentLogs = sessionLogs.slice(-15).map(l => String(l.text || "")).join("; ");
    try {
      const response = await fetch(`/api/manifesto`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: recentLogs })
      });
      const data = await response.json();
      addLog(`=== MANIFIESTO ===`, true);
      addLog(String(data.text), true);
    } catch (e) { addLog("ERROR MANIFIESTO", false); } finally { setIsLoadingAI(false); }
  };

  const initAudioSystem = async () => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }
  };

  const toggleMic = async () => {
      await initAudioSystem();
      if (micEnabled) {
          setMicEnabled(false);
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              if (audioContextRef.current) {
                  const source = audioContextRef.current.createMediaStreamSource(stream);
                  const micAnalyser = audioContextRef.current.createAnalyser();
                  micAnalyser.fftSize = 512; 
                  micAnalyser.smoothingTimeConstant = 0.8;
                  source.connect(micAnalyser);
                  micAnalyserRef.current = micAnalyser;
                  analyserRef.current = micAnalyser; 
                  setMicEnabled(true);
                  addLog("MIC: ESCUCHANDO", false);
              }
          } catch(e) {
              addLog("ERROR MIC", false);
          }
      }
  };

  const handleBandSensitivityChange = (band: string, val: string) => {
      setBandSensitivities(prev => ({...prev, [band]: parseFloat(val)}));
  };

  const takeSnapshot = () => {
    if (!displayCanvasRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 1280;
    tempCanvas.height = video.videoHeight || 720;
    const ctx = tempCanvas.getContext('2d');
    
    if (ctx) {
        const currentFilter = CAMERA_FILTERS[activeFilter].filter;
        ctx.filter = currentFilter !== 'none' ? currentFilter : 'none';
        
        ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        
        ctx.filter = 'none';
        ctx.drawImage(displayCanvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
        
        ctx.fillStyle = '#0f0';
        ctx.font = `bold ${tempCanvas.width * 0.02}px "Montserrat", sans-serif`;
        ctx.fillText(`VIGILIA [${activeFilter}] // ${new Date().toISOString()}`, 20, tempCanvas.height - 20);

        const link = document.createElement('a');
        link.download = `VIGILIA_${activeFilter}_${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png', 1.0);
        link.click();
        addLog("FOTO GUARDADA.", false);
    }
  };

  const clearCanvas = () => {
    const canvas = displayCanvasRef.current;
    if(canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0,0, canvas.width, canvas.height);
        addLog("LIENZO LIMPIADO.", false);
    }
  }

  useEffect(() => {
    let interval: number;
    if (isRecording) interval = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    else setRecordingTime(0);
    return () => clearInterval(interval);
  }, [isRecording]);

  const drawOscilloscope = () => {
      const canvas = oscCanvasRef.current;
      if (!canvas || !analyserRef.current || !micEnabledRef.current) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#050505'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#4ade80'; 
      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * canvas.height / 2;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#4ade80';
      ctx.stroke();
      ctx.shadowBlur = 0;
  };

  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    
    if (!video || !canvas || !displayCanvas || video.paused || video.ended) {
        requestRef.current = requestAnimationFrame(processFrame);
        return;
    }

    const currentMode = activeModeRef.current;
    const currentFilter = activeFilterRef.current;
    const currentSensitivity = sensitivityRef.current;
    const sensitivities = bandSensitivitiesRef.current;

    let rawMic = 0;
    let bass = 0;
    let mid = 0;
    let treble = 0;

    if (micAnalyserRef.current && micEnabledRef.current) {
        const bufferLen = micAnalyserRef.current.frequencyBinCount; 
        const dataArray = new Uint8Array(bufferLen);
        micAnalyserRef.current.getByteFrequencyData(dataArray);
        
        const sum = dataArray.reduce((a, b) => a + b, 0);
        rawMic = sum / bufferLen;

        const bassEnd = Math.floor(bufferLen * 0.1); 
        bass = getAverageVolume(dataArray.slice(0, bassEnd));
        const midEnd = Math.floor(bufferLen * 0.5);
        mid = getAverageVolume(dataArray.slice(bassEnd, midEnd));
        treble = getAverageVolume(dataArray.slice(midEnd));
        
        bass = bass * sensitivities.bass;
        mid = mid * sensitivities.mid;
        treble = treble * sensitivities.treble;
        
        bandsRef.current.bass = bandsRef.current.bass * 0.8 + bass * 0.2;
        bandsRef.current.mid = bandsRef.current.mid * 0.8 + mid * 0.2;
        bandsRef.current.treble = bandsRef.current.treble * 0.8 + treble * 0.2;
    }
    
    const prevAudio = audioScoreRef.current;
    const newAudioScore = (prevAudio * 0.9) + (rawMic * 0.1);
    audioScoreRef.current = newAudioScore;
    const effectiveAudio = (newAudioScore * 0.8) + (rawMic * 0.2); 

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const displayCtx = displayCanvas.getContext('2d');
    
    if (!ctx || !displayCtx) return;

    if (canvas.width !== 320) {
      canvas.width = 320;
      canvas.height = 240;
      displayCanvas.width = video.videoWidth || 640;
      displayCanvas.height = video.videoHeight || 480;
    }

    const chaosLevel = (bandsRef.current.treble * 2);
    const isStutter = effectiveAudio > 80 && Math.random() > 0.6;
    
    if (!isStutter) {
        const pixelationFactor = chaosLevel > 180 ? 4 : 1; 
        ctx.drawImage(video, 0, 0, canvas.width / pixelationFactor, canvas.height / pixelationFactor);
        if (pixelationFactor > 1) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(canvas, 0, 0, canvas.width / pixelationFactor, canvas.height / pixelationFactor, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.imageSmoothingEnabled = true;
        }
    }

    const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frameData.data;
    
    let changedPixels = 0;
    let sumX = 0;
    let sumY = 0;
    let zoneTriggered = false;
    activePointsRef.current = []; 

    const audioGlitch = effectiveAudio > 60; 
    
    let fadeAlpha = 0.15;
    if (currentMode === MODES.TRACE.id) fadeAlpha = 0.1; 
    else if (currentMode === MODES.SCANNER.id) fadeAlpha = 0.05; 
    else if (currentMode === MODES.BREATH.id) fadeAlpha = 0.3;
    else if (currentMode === MODES.POETIC.id) fadeAlpha = 0.6; 
    
    displayCtx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

    if (lastFrameData.current) {
      const prevData = lastFrameData.current.data;
      const threshold = currentSensitivity * 3;

      for (let i = 0; i < data.length; i += 4 * 4) { 
        const rDiff = Math.abs(data[i] - prevData[i]);
        const gDiff = Math.abs(data[i+1] - prevData[i+1]);
        const bDiff = Math.abs(data[i+2] - prevData[i+2]);
        
        if (rDiff + gDiff + bDiff > threshold) {
          changedPixels++;
          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);
          sumX += x;
          sumY += y;

          const displayX = x * (displayCanvas.width / canvas.width);
          const displayY = y * (displayCanvas.height / canvas.height);

          if (currentMode === MODES.TRACE.id) {
             if(Math.random() > 0.8) {
                const hue = (x / canvas.width) * 60 + 100; 
                particlesRef.current.push(new Particle(displayX, displayY, hue, true, 0.2));
             }
          }
          if (currentMode === MODES.PARTICLES.id) {
             if (Math.random() > 0.7) { 
                 const hue = (x / canvas.width) * 60 + 180; 
                 particlesRef.current.push(new Particle(displayX, displayY, hue, false, effectiveAudio / 40));
             }
          }
          if (currentMode === MODES.BREATH.id) {
              const meshX = Math.floor((x / canvas.width) * MESH_COLS);
              const meshY = Math.floor((y / canvas.height) * MESH_ROWS);
              const idx = meshY * MESH_COLS + meshX;
              if (meshRef.current[idx]) {
                  meshRef.current[idx].targetZ = (data[i] / 255) * 100; 
              }
          }
          if (currentMode === MODES.NETWORK.id) {
              if (Math.random() > 0.95 && activePointsRef.current.length < (50 + effectiveAudio)) {
                  activePointsRef.current.push({x: displayX, y: displayY});
              }
          }
          if (currentMode === MODES.SCANNER.id) {
              const distToScan = Math.abs(displayY - scanLineY.current);
              if (distToScan < (30 + effectiveAudio)) {
                  displayCtx.fillStyle = `rgb(${255-data[i]}, ${255-data[i+1]}, ${255-data[i+2]})`;
                  displayCtx.fillRect(displayX, displayY, 4, 4);
              }
          }
          if (currentMode === MODES.HEATMAP.id) {
            const gridX = Math.floor((x / canvas.width) * HEAT_W);
            const gridY = Math.floor((y / canvas.height) * HEAT_H);
            const gridIndex = gridY * HEAT_W + gridX;
            if (heatmapGrid.current[gridIndex] < 100) heatmapGrid.current[gridIndex] += 3;
          }
        }
      }
    }

    let centerX = displayCanvas.width / 2;
    let centerY = displayCanvas.height / 2;
    let targetPanX = 0;
    let targetPanY = 0;

    const isSpeaking = (bandsRef.current.mid / 255) > 0.3; 
    
    if (changedPixels > 50) { 
        const moveCentroidX = (sumX / changedPixels) / canvas.width;
        const moveCentroidY = (sumY / changedPixels) / canvas.height;
        centerX = moveCentroidX * displayCanvas.width;
        centerY = moveCentroidY * displayCanvas.height;
        targetPanX = (0.5 - moveCentroidX) * 100; 
        targetPanY = (0.5 - moveCentroidY) * 100;
        
        if (isSpeaking) {
             targetPanY -= 15; 
        }
    }

    cameraPanRef.current.x = cameraPanRef.current.x * 0.9 + targetPanX * 0.1;
    cameraPanRef.current.y = cameraPanRef.current.y * 0.9 + targetPanY * 0.1;

    if (videoRef.current) {
        const bassImpulse = (bandsRef.current.bass / 255) * 0.2; 
        const zoomBase = 1.1; 
        let targetScale = zoomBase + bassImpulse;
        if (isSpeaking) {
            const voiceIntensity = (bandsRef.current.mid / 255);
            targetScale += voiceIntensity * 2.5; 
        }
        const jitterX = (Math.random() - 0.5) * (bandsRef.current.treble / 20);
        const jitterY = (Math.random() - 0.5) * (bandsRef.current.treble / 20);
        const finalX = cameraPanRef.current.x + jitterX;
        const finalY = cameraPanRef.current.y + jitterY;

        videoRef.current.style.transform = `translate(${finalX}%, ${finalY}%) scale(${targetScale})`;
        
        const baseFilterStr = CAMERA_FILTERS[currentFilter].filter === 'none' ? '' : CAMERA_FILTERS[currentFilter].filter;
        const dynamicSat = 100 + (bandsRef.current.treble / 3); 
        const dynamicCon = 100 + (bandsRef.current.mid / 4);
        videoRef.current.style.filter = `${baseFilterStr} saturate(${dynamicSat}%) contrast(${dynamicCon}%)`;
    }

    lastFrameData.current = frameData;
    const totalPixels = (canvas.width * canvas.height) / 16;
    const score = Math.min((changedPixels / totalPixels) * 1000, 100);

    const prevMotion = motionScoreRef.current;
    const newMotionScore = prevMotion * 0.9 + score * 0.1;
    motionScoreRef.current = newMotionScore;
    
    const prevCentroid = centroidRef.current;
    const smoothX = prevCentroid.x * 0.9 + (centerX / displayCanvas.width) * 0.1;
    const smoothY = prevCentroid.y * 0.9 + (centerY / displayCanvas.height) * 0.1;
    centroidRef.current = { x: smoothX, y: smoothY };

    if (autoPoetic) {
        if (effectiveAudio < 25 && newMotionScore < 20) {
            silenceTimer.current++;
            if (silenceTimer.current > 150) { 
                callGeminiPoet();
                silenceTimer.current = 0; 
            }
        } else {
            silenceTimer.current += 0.2; 
            if (silenceTimer.current > 500) {
                callGeminiPoet();
                silenceTimer.current = 0;
            }
        }
    }

    if (currentMode === MODES.POETIC.id || poeticTrigger) {
        displayCtx.save();
        displayCtx.globalCompositeOperation = 'source-over';
        const text = currentPoeticPhraseRef.current;
        const opacity = poeticTrigger ? 1.0 : (currentMode === MODES.POETIC.id ? 1.0 : 0);
        
        if (opacity > 0) {
            const fontSize = 25; 
            displayCtx.font = `900 ${fontSize}px "Montserrat", sans-serif`; 
            displayCtx.textAlign = 'center';
            displayCtx.textBaseline = 'middle';
            let textX, textY;
            if (newMotionScore < 20) {
                textX = displayCanvas.width / 2;
                textY = (displayCanvas.height / 2) + (displayCanvas.height * 0.2); 
            } else {
                textX = centroidRef.current.x * displayCanvas.width;
                textY = (centroidRef.current.y * displayCanvas.height) + (displayCanvas.height * 0.2);
            }
            wrapText(displayCtx, text, textX, textY, displayCanvas.width * 0.8, fontSize * 1.2);
        }
        displayCtx.restore();
    }

    if (currentMode === MODES.PARTICLES.id || currentMode === MODES.TRACE.id) {
        const targetCentroid = { 
            x: centroidRef.current.x * displayCanvas.width, 
            y: centroidRef.current.y * displayCanvas.height 
        };
        particlesRef.current = particlesRef.current.filter(p => p.update(targetCentroid));
        particlesRef.current.forEach(p => p.draw(displayCtx));
    }
    
    if (currentMode === MODES.NETWORK.id) {
        displayCtx.strokeStyle = `rgba(0, 255, 255, ${0.3 + (effectiveAudio/300)})`;
        displayCtx.lineWidth = 1;
        displayCtx.beginPath();
        const connectDist = 80 + effectiveAudio; 
        activePointsRef.current.forEach((p1, i) => {
            activePointsRef.current.forEach((p2, j) => {
                if (i !== j && Math.hypot(p1.x - p2.x, p1.y - p2.y) < connectDist) {
                    displayCtx.moveTo(p1.x, p1.y);
                    displayCtx.lineTo(p2.x, p2.y);
                }
            });
            displayCtx.fillStyle = '#fff';
            displayCtx.fillRect(p1.x - 1, p1.y - 1, 2, 2);
        });
        displayCtx.stroke();
    }
    
    if (currentMode === MODES.SCANNER.id) {
        scanLineY.current += 5; 
        if (scanLineY.current > displayCanvas.height) scanLineY.current = 0;
        
        displayCtx.shadowBlur = 10;
        displayCtx.shadowColor = '#00ff00';
        displayCtx.strokeStyle = '#00ff00';
        displayCtx.lineWidth = 2; 
        displayCtx.beginPath();
        displayCtx.moveTo(0, scanLineY.current);
        displayCtx.lineTo(displayCanvas.width, scanLineY.current);
        displayCtx.stroke();
        displayCtx.shadowBlur = 0;
    }
    
    if (currentMode === MODES.HEATMAP.id) {
        displayCtx.save();
        const cellW = displayCanvas.width / HEAT_W;
        const cellH = displayCanvas.height / HEAT_H;
        let maxHeat = 0;
        let maxHeatIndex = -1;

        for (let j = 0; j < HEAT_SIZE; j++) {
            heatmapGrid.current[j] *= 0.95; 
            const heat = heatmapGrid.current[j];
            if (heat > maxHeat) { maxHeat = heat; maxHeatIndex = j; }
            if (heat > 2) { 
                const gx = (j % HEAT_W) * cellW;
                const gy = Math.floor(j / HEAT_W) * cellH;
                const hue = Math.max(0, 240 - (heat * 2.4));
                const alpha = Math.min(heat / 100, 0.7);
                displayCtx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
                displayCtx.fillRect(gx, gy, cellW + 1, cellH + 1);
            }
        }
        displayCtx.restore();
        if (maxHeat > 40 && maxHeatIndex !== -1) {
            const hx = (maxHeatIndex % HEAT_W) * cellW + (cellW/2);
            const hy = Math.floor(maxHeatIndex / HEAT_W) * cellH + (cellH/2);
            displayCtx.strokeStyle = 'white';
            displayCtx.lineWidth = 1;
            displayCtx.strokeRect(hx - 10, hy - 10, 20, 20);
            displayCtx.fillStyle = 'white';
            displayCtx.font = 'bold 10px "Montserrat"';
            displayCtx.fillText(`${(maxHeat).toFixed(0)}°`, hx + 15, hy);
        }
    }
    
    if (currentMode === MODES.BREATH.id) {
        const cellW = displayCanvas.width / MESH_COLS;
        const cellH = displayCanvas.height / MESH_ROWS;
        displayCtx.lineWidth = 1;
        const time = Date.now() * 0.002;
        const baseBreath = Math.sin(time) * 15;

        for(let i=0; i < MESH_COLS * MESH_ROWS; i++) {
            const p = meshRef.current[i];
            let audioForce = (bandsRef.current.bass / 15);
            const cx = Math.floor(MESH_COLS / 2);
            const cy = Math.floor(MESH_ROWS / 2);
            const mx = i % MESH_COLS;
            const my = Math.floor(i / MESH_COLS);
            const dist = Math.hypot(mx - cx, my - cy);
            const ripple = Math.sin(dist * 0.5 - time * 5) * (bandsRef.current.bass / 5);
            const target = (p.targetZ || 0) + audioForce + baseBreath + ripple; 
            const displacement = p.z - p.baseZ - target;
            const force = -MESH_TENSION * displacement;
            p.vz += force;
            p.vz *= MESH_DAMPENING;
            p.z += p.vz;
            if (p.targetZ) p.targetZ *= 0.9;
        }

        for (let y = 0; y < MESH_ROWS; y++) {
            for (let x = 0; x < MESH_COLS; x++) {
                const i = y * MESH_COLS + x;
                const p = meshRef.current[i];
                const px = x * cellW;
                const py = y * cellH - (p.z * 0.5); 
                const intensity = Math.min(1, Math.abs(p.z) / 100);
                const r = 0; 
                const g = 255; 
                const b = 150 + (intensity * 105);
                const a = 0.1 + (intensity * 0.6); 
                
                if (intensity > 0.15) {
                    displayCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                    displayCtx.beginPath();
                    displayCtx.arc(px, py, 1 + (intensity * 3), 0, Math.PI * 2);
                    displayCtx.fill();
                }

                displayCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.4})`;
                displayCtx.beginPath();

                if (x < MESH_COLS - 1) {
                    const nextP = meshRef.current[i + 1];
                    const npx = (x + 1) * cellW;
                    const npy = y * cellH - (nextP.z * 0.5);
                    displayCtx.moveTo(px, py);
                    displayCtx.lineTo(npx, npy);
                }
                if (y < MESH_ROWS - 1) {
                    const downP = meshRef.current[i + MESH_COLS];
                    const dpx = x * cellW;
                    const dpy = (y + 1) * cellH - (downP.z * 0.5);
                    displayCtx.moveTo(px, py);
                    displayCtx.lineTo(dpx, dpy);
                }
                displayCtx.stroke();
            }
        }
    }
    
    frameCounterRef.current += 1;
    if (frameCounterRef.current % 10 === 0) {
        setUiMotionScore(newMotionScore);
        setUiAudioScore(newAudioScore);
        setUiCentroid(centroidRef.current);
        
        if ((zoneTriggered || audioGlitch) && !glitchActiveRef.current) {
            glitchActiveRef.current = true;
            setGlitchActive(true);
        }
        else if (!zoneTriggered && !audioGlitch && score < 70) {
            glitchActiveRef.current = false;
            setGlitchActive(false);
        }
    }

    drawOscilloscope();
    requestRef.current = requestAnimationFrame(processFrame);
  };

  const startCamera = async () => {
    setIsScanning(true);
    addLog("INICIANDO VIDEO...", false);
    setTimeout(() => {
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.log("Video play aborted", e));
            }
            setIsScanning(false);
            setIsSystemActive(true);
            requestRef.current = requestAnimationFrame(processFrame);
            addLog("SISTEMA ONLINE.", false);
        }).catch(() => {
            setIsScanning(false);
            addLog("ERROR CÁMARA.", false);
        });
    }, 1500);
  };

  const stopSystem = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (isRecording && sessionLogs.length > 5) generateManifesto();
    setIsSystemActive(false);
    setMicEnabled(false);
    setUiMotionScore(0); 
    motionScoreRef.current = 0; 
    setIsRecording(false);
    addLog("SISTEMA APAGADO.", false);
  };

  useEffect(() => {
      if (!isSystemActive && !isScanning) {
          addLog(`ACCESO CONCEDIDO: ${userName || 'AGENTE'}`);
          startCamera();
      }
  }, []);

  useEffect(() => {
    let interval: number;
    if (autoMode && isSystemActive) {
        addLog("PILOTO AUTOMÁTICO: INICIADO", false);
        interval = window.setInterval(() => {
            const modes = Object.keys(MODES);
            const filters = Object.keys(CAMERA_FILTERS);
            const randomMode = modes[Math.floor(Math.random() * modes.length)];
            const randomFilter = filters[Math.floor(Math.random() * filters.length)];
            setActiveMode(randomMode);
            if(Math.random() > 0.4) setActiveFilter(randomFilter);
            addLog(`AUTO: ${randomMode} / ${randomFilter}`, false);
        }, 18000); 
    }
    return () => clearInterval(interval);
  }, [autoMode, isSystemActive]);

  return (
    <div className={`w-full h-full min-h-screen bg-black text-green-500 font-montserrat p-2 flex flex-col md:flex-row gap-2 overflow-hidden selection:bg-green-900 selection:text-white`}>
      <div className={`flex-1 flex flex-col gap-2 relative border border-green-900/50 bg-neutral-900/20 p-2 ${galleryMode ? 'fixed inset-0 z-50 bg-black p-0 border-0' : ''}`}>
        
        {!galleryMode && (
          <div className="flex justify-between items-center pb-2 border-b border-green-900/50">
            <div>
              <h1 className="text-xl font-extrabold tracking-[0.2em] text-green-400">VIGILIA<span className="text-green-800">EXP</span></h1>
              <p className="text-[10px] text-green-600 font-medium">v2026.33 // {activeMode}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className={isRecording ? "text-red-500 animate-pulse" : "text-gray-600"}>
                  {isRecording ? `REC ${recordingTime}s` : "ESPERA"}
              </span>
              <div className={`px-2 py-0.5 rounded text-[10px] ${isSystemActive ? 'bg-green-900 text-green-100' : 'bg-red-900/30 text-red-500'}`}>
                  {isSystemActive ? 'EN VIVO' : 'OFF'}
              </div>
            </div>
          </div>
        )}

        <div className={`relative bg-black rounded-sm flex-1 overflow-hidden flex items-center justify-center group ${!galleryMode ? 'min-h-[400px] border border-green-900/30' : 'w-full h-full'}`}>
          {!isSystemActive && !isScanning && (
            <div className="text-center text-green-900/50">
              <Aperture className="w-24 h-24 mx-auto mb-4 opacity-20" />
              <p className="text-xs tracking-widest font-semibold">SISTEMA INACTIVO</p>
            </div>
          )}
          
          {isScanning && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
                <Target className="w-16 h-16 text-green-500 animate-spin opacity-50 mb-4" />
                <p className="text-xs text-green-400 animate-pulse font-semibold">INICIANDO SENSORES...</p>
             </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          
          <video 
            ref={videoRef} 
            className={`absolute inset-0 w-full h-full object-cover grayscale transition-all duration-300 ${glitchActive ? 'translate-x-1' : ''}`} 
            muted 
            playsInline 
          />
          
          <canvas ref={displayCanvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen" />

          {isSystemActive && (
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                  {!galleryMode && (
                    <div className="flex justify-between text-[10px] text-green-500/50 font-medium">
                        <span>CAM-FEED-01</span>
                        <span className={uiAudioScore > 10 ? 'text-green-300 font-bold' : ''}>AUDIO: {uiAudioScore.toFixed(0)}</span>
                    </div>
                  )}
                  
                  {!galleryMode && (
                    <div className="absolute bottom-4 right-4 text-right">
                        <div className="flex flex-col items-end">
                             <div className="flex items-center gap-1 mb-1">
                                <Cpu size={10} className="text-green-500" />
                                <span className="text-[9px] text-green-400 font-mono">CPU: {Math.floor(10 + Math.random()*5)}%</span>
                             </div>
                             <p className="text-xs font-bold text-green-400">{activeZone !== null ? `ZONA ${ZONES[activeZone].label}` : ''}</p>
                        </div>
                    </div>
                  )}

                  {galleryMode && (
                      <div className="absolute bottom-4 left-4 opacity-30 text-green-500 text-xs tracking-[0.5em] font-extrabold">VIGILIA</div>
                  )}
              </div>
          )}

          <button 
            onClick={() => setGalleryMode(!galleryMode)}
            className={`absolute top-4 right-4 z-50 p-2 rounded-full transition-all ${galleryMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-transparent text-green-800 hover:text-green-400'}`}
          >
              {galleryMode ? <EyeOff size={16}/> : <Monitor size={16}/>}
          </button>
        </div>
      </div>

      {!galleryMode && (
      <div className="w-full md:w-80 flex flex-col gap-2 bg-neutral-900/20 border-l border-green-900/50 p-2">
        <div className="grid grid-cols-2 gap-2 mb-2">
            {!isSystemActive ? (
                <button onClick={startCamera} disabled={isScanning} className="col-span-2 py-4 bg-green-900 hover:bg-green-800 text-white font-extrabold text-xs tracking-widest transition-all rounded-sm">
                    {isScanning ? 'INICIANDO...' : 'ENCENDER'}
                </button>
            ) : (
                <button onClick={stopSystem} className="col-span-2 py-4 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 font-extrabold text-xs tracking-widest transition-all rounded-sm">
                    {isRecording ? 'FINALIZAR' : 'APAGAR'}
                </button>
            )}
            
            <button onClick={() => setIsRecording(!isRecording)} disabled={!isSystemActive} className={`py-2 text-[10px] border rounded-sm font-semibold ${isRecording ? 'bg-red-600 text-white border-red-600' : 'border-neutral-700 text-neutral-400 hover:border-white'}`}>
                {isRecording ? 'STOP REC' : 'GRABAR'}
            </button>
            <button onClick={takeSnapshot} disabled={!isSystemActive} className="py-2 text-[10px] border border-neutral-700 text-neutral-400 hover:text-white hover:border-white transition-colors flex items-center justify-center gap-1 rounded-sm font-semibold">
                <Save size={10} /> FOTO HD
            </button>
            
            <button 
                onClick={togglePoetic} 
                disabled={!isSystemActive} 
                className={`col-span-2 py-2 text-[10px] border rounded-sm transition-colors flex items-center justify-center gap-2 font-bold ${autoPoetic ? 'bg-purple-900/50 border-purple-500 text-white animate-pulse' : 'bg-purple-900/10 border-purple-500/50 text-purple-300 hover:bg-purple-900/20'}`}
            >
                <PenTool size={12} /> {autoPoetic ? 'POÉTICA KINÉTICA: ACTIVA' : 'ACTIVAR POÉTICA KINÉTICA'}
            </button>
        </div>

        <div className="border-t border-green-900/50 pt-2 mb-2">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Óptica del Sensor</h3>
                <button 
                    onClick={() => setAutoMode(!autoMode)}
                    className={`text-[9px] flex items-center gap-1 px-2 py-0.5 rounded-sm transition-colors font-semibold ${autoMode ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-600' : 'text-green-700 hover:text-green-400 border border-transparent'}`}
                >
                    <Shuffle size={10}/> AUTO PILOT
                </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
                {Object.values(CAMERA_FILTERS).map(filter => (
                    <button 
                        key={filter.id} 
                        onClick={() => setActiveFilter(filter.id)}
                        className={`flex flex-col items-center justify-center p-1 rounded-sm transition-all ${
                            activeFilter === filter.id 
                            ? 'bg-green-900/50 text-green-300 border border-green-600' 
                            : 'bg-transparent text-green-900 hover:text-green-500 border border-transparent'
                        }`}
                        title={filter.label}
                    >
                        {filter.icon}
                        <span className="text-[7px] mt-1 font-medium">{filter.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-black border border-green-900/50 relative mb-2 rounded-sm overflow-hidden flex flex-col">
             <div className="h-16 relative">
                 <canvas ref={oscCanvasRef} width={300} height={64} className="w-full h-full opacity-80" />
                 <div className="absolute top-1 left-1 text-[8px] text-green-500 flex gap-2 items-center font-semibold">
                    <Activity size={8} /> <span>ANÁLISIS DE SEÑAL</span>
                 </div>
                 <div className="absolute bottom-1 right-1 flex gap-2">
                     <button 
                        onClick={toggleMic}
                        className={`px-2 py-0.5 text-[8px] border rounded-sm font-semibold transition-all ${micEnabled ? 'border-green-500 bg-green-900/30 text-green-400' : 'border-neutral-700 text-neutral-600'}`}
                     >
                         MICRÓFONO {micEnabled ? 'ON' : 'OFF'}
                     </button>
                 </div>
             </div>

             {micEnabled && (
                 <>
                 <div className="p-2 bg-black border-t border-green-900/50">
                    <div className="flex items-center gap-2 text-[8px] text-green-600 mb-1 font-bold">
                        <BarChart3 size={8} /> ECUALIZADOR DE SENSORES
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center">
                            <input type="range" min="0" max="5" step="0.1" value={bandSensitivities.bass} onChange={(e) => handleBandSensitivityChange('bass', e.target.value)} className="h-20 w-1 bg-green-900 rounded-lg appearance-none cursor-pointer slider-vertical" style={{writingMode: 'vertical-lr', WebkitAppearance: 'slider-vertical'}} />
                            <span className="text-[7px] mt-1 text-green-500">BASS</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <input type="range" min="0" max="5" step="0.1" value={bandSensitivities.mid} onChange={(e) => handleBandSensitivityChange('mid', e.target.value)} className="h-20 w-1 bg-green-900 rounded-lg appearance-none cursor-pointer slider-vertical" style={{writingMode: 'vertical-lr', WebkitAppearance: 'slider-vertical'}} />
                            <span className="text-[7px] mt-1 text-green-500">MID</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <input type="range" min="0" max="5" step="0.1" value={bandSensitivities.treble} onChange={(e) => handleBandSensitivityChange('treble', e.target.value)} className="h-20 w-1 bg-green-900 rounded-lg appearance-none cursor-pointer slider-vertical" style={{writingMode: 'vertical-lr', WebkitAppearance: 'slider-vertical'}} />
                            <span className="text-[7px] mt-1 text-green-500">HI</span>
                        </div>
                    </div>
                 </div>
                 </>
             )}
        </div>

        <div className="border-t border-green-900/50 pt-2">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Protocolo Visual</h3>
                <button onClick={clearCanvas} className="text-[9px] flex items-center gap-1 text-green-700 hover:text-green-400 font-semibold"><Trash2 size={10}/> LIMPIAR</button>
            </div>
            <div className="grid grid-cols-2 gap-1 mb-4">
                {Object.values(MODES).map(mode => (
                    <button key={mode.id} onClick={() => setActiveMode(mode.id)} 
                        className={`text-[9px] py-2 px-2 text-left truncate transition-all border rounded-sm flex items-center gap-2 font-medium ${activeMode === mode.id ? 'bg-green-900/40 border-green-500 text-white' : 'border-neutral-800 text-neutral-500 hover:text-green-500 hover:border-green-900'}`}>
                        {mode.icon} {mode.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 bg-black border border-green-900/50 p-2 font-jetbrains text-[9px] overflow-hidden flex flex-col min-h-[100px] rounded-sm">
          <div className="flex items-center gap-2 text-green-700 border-b border-green-900/30 pb-1 mb-1 font-semibold">
            <Terminal size={10} /> SYSTEM LOG
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className="mb-0.5 opacity-80 hover:opacity-100 break-words">
                <span className="text-green-800 mr-2">[{log.time}]</span>
                <span className={log.text.startsWith('[IA]') ? 'text-purple-400 font-bold' : log.text.startsWith('===') ? 'text-yellow-400' : 'text-green-500'}>
                    {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Montserrat:wght@400;500;600;800;900&display=swap');
        
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        .font-jetbrains { font-family: 'JetBrains Mono', monospace; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #14532d; }
        .glitch-container { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } }
        
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 8px;
            width: 8px;
            border-radius: 50%;
            background: #4ade80;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
};
