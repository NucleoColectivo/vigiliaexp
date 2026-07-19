import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, UserPlus, Fingerprint } from 'lucide-react';

interface VigiliaAuthProps {
  onAccessGranted: (name: string) => void;
}

export const VigiliaAuth: React.FC<VigiliaAuthProps> = ({ onAccessGranted }) => {
  const [view, setView] = useState<'BOOT' | 'SCANNER' | 'DASHBOARD'>('BOOT');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [user, setUser] = useState<{name: string, id: string, image: string | null} | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [logs, setLogs] = useState<{time: string, msg: string, isAlert: boolean}[]>([]);
  const [stats, setStats] = useState({ temp: "36.5", bpm: "72" });

  const videoRef = useRef<HTMLVideoElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);
  const voiceCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const playSound = (type: string) => {
    try {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        const now = ctx.currentTime;
        
        if (type === 'click') {
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'scan') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(880, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        }
        
        osc.connect(gain);
        gain.connect(ctx.destination);
    } catch (e) { console.warn("Audio error", e); }
  };

  const addLog = (msg: string, isAlert = false) => {
      const time = new Date().toLocaleTimeString().split(' ')[0];
      setLogs(prev => [...prev.slice(-6), { time, msg: String(msg), isAlert }]);
  };

  useEffect(() => {
    let frameId: number;
    
    const statInterval = setInterval(() => {
        setStats({
            temp: (36.4 + Math.random() * 0.4).toFixed(1),
            bpm: String(Math.floor(68 + Math.random() * 15))
        });
    }, 1000);

    const render = () => {
        if (view === 'SCANNER' && hudCanvasRef.current && voiceCanvasRef.current) {
            const ctx = hudCanvasRef.current.getContext('2d');
            const vCtx = voiceCanvasRef.current.getContext('2d');
            if (ctx && vCtx) {
                const w = hudCanvasRef.current.width;
                const h = hudCanvasRef.current.height;
                const time = Date.now() / 1000;

                ctx.clearRect(0, 0, w, h);
                ctx.strokeStyle = isScanning ? '#10b981' : '#059669'; 
                ctx.lineWidth = 1;
                const cx = w/2, cy = h/2;
                
                ctx.beginPath();
                ctx.arc(cx, cy, 150, time, time + Math.PI * 1.5);
                ctx.stroke();
                
                ctx.setLineDash([5, 15]);
                ctx.beginPath();
                ctx.arc(cx, cy, 180, -time, -time + Math.PI);
                ctx.stroke();
                ctx.setLineDash([]);

                vCtx.clearRect(0, 0, voiceCanvasRef.current.width, voiceCanvasRef.current.height);
                vCtx.strokeStyle = '#10b981';
                vCtx.beginPath();
                const slice = voiceCanvasRef.current.width / 40;
                for(let i=0; i<40; i++) {
                    const amp = Math.random() * (isScanning ? 50 : 10);
                    vCtx.moveTo(i * slice, 64 - amp);
                    vCtx.lineTo(i * slice, 64 + amp);
                }
                vCtx.stroke();
            }
        }
        frameId = requestAnimationFrame(render);
    };
    render();

    return () => {
        cancelAnimationFrame(frameId);
        clearInterval(statInterval);
    };
  }, [view, isScanning]);

  useEffect(() => {
      if (view === 'SCANNER' && videoStream && videoRef.current) {
          videoRef.current.srcObject = videoStream;
          videoRef.current.play().catch(e => console.log("Play error", e));
      }
  }, [view, videoStream]);

  const initCamera = async () => {
      playSound('click');
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
          setVideoStream(stream);
          if (videoRef.current) videoRef.current.srcObject = stream;
          setView('SCANNER');
          addLog("SENSOR ÓPTICO ACTIVADO");
      } catch (e) {
          addLog("ERROR CRÍTICO: CÁMARA NO DISPONIBLE", true);
      }
  };

  const handleEnroll = () => {
      if (!videoRef.current) return;
      playSound('click');
      const canvas = document.createElement('canvas');
      canvas.width = 100; canvas.height = 100;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 100, 100);
      setTempImage(canvas.toDataURL());
      setShowNameModal(true);
      setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const saveUser = () => {
      if (!nameInputRef.current) return;
      const name = nameInputRef.current.value.toUpperCase() || "OPERATIVO_X";
      setUser({
          name,
          id: `ID_${Math.floor(Math.random()*9999)}`,
          image: tempImage
      });
      setShowNameModal(false);
      playSound('success');
      addLog(`SUJETO REGISTRADO: ${name}`);
  };

  const handleVerify = async () => {
      if (isScanning || !user) return;
      setIsScanning(true);
      playSound('click');
      addLog("VERIFICANDO PATRÓN BIOMÉTRICO...");

      let scans = 0;
      const scanInterval = setInterval(() => {
          playSound('scan');
          scans++;
          if (scans > 6) {
              clearInterval(scanInterval);
              setIsScanning(false);
              playSound('success');
              addLog("ACCESO CONCEDIDO: NIVEL 5");
              setTimeout(() => setView('DASHBOARD'), 1000);
          }
      }, 300);
  };

  useEffect(() => {
      if (view === 'DASHBOARD') {
          const timer = setTimeout(() => {
              if (videoStream) videoStream.getTracks().forEach(t => t.stop());
              onAccessGranted(user ? user.name : 'ANÓNIMO');
          }, 3500); 
          return () => clearTimeout(timer);
      }
  }, [view, videoStream, onAccessGranted, user]);

  return (
    <div className="fixed inset-0 bg-[#020406] text-green-500 font-mono select-none overflow-hidden z-[9999]">
        <style>{`
            .glass-panel { background: rgba(8, 12, 10, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(34, 197, 94, 0.2); }
            .scan-line { position: absolute; width: 100%; height: 2px; background: #22c55e; box-shadow: 0 0 15px #22c55e; animation: scan 2s infinite ease-in-out; }
            @keyframes scan { 0%, 100% { top: 0%; opacity: 0; } 50% { top: 100%; opacity: 1; } }
            .crt::before { content: " "; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(34, 197, 94, 0.03), rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.02)); background-size: 100% 2px, 3px 100%; pointer-events: none; z-index: 50; }
        `}</style>
        <div className="crt absolute inset-0 pointer-events-none"></div>

        <div className="h-12 glass-panel flex items-center justify-between px-4 border-b border-green-900 z-50 relative">
            <div className="flex items-center gap-4">
                <span className="bg-green-900/40 px-2 py-0.5 text-[10px] border border-green-500/30">SESSION: 0x88F2</span>
                <h1 className="font-black italic tracking-tighter text-white">VIGILIA<span className="text-green-600">EXP OS</span></h1>
            </div>
            <div className="text-[10px] font-bold text-yellow-500 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${view === 'DASHBOARD' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                {view === 'DASHBOARD' ? 'AUTHORIZED' : 'LOCKED'}
            </div>
        </div>

        <div className="absolute inset-0 top-12 p-4 grid grid-cols-12 gap-4">
            
            <div className="col-span-3 glass-panel p-4 flex flex-col gap-4 hidden md:flex">
                <div className="space-y-2">
                    <h3 className="text-[10px] font-bold opacity-50 border-b border-green-800 pb-1">BIOMETRÍA</h3>
                    <div className="flex justify-between text-xs"><span>TEMP</span><span className="text-white">{stats.temp}°C</span></div>
                    <div className="flex justify-between text-xs"><span>PULSO</span><span className="text-white">{stats.bpm} BPM</span></div>
                </div>
                <div className="flex-1 bg-black/50 border border-green-900/30 relative">
                    <canvas ref={voiceCanvasRef} width={200} height={100} className="w-full h-full opacity-70"></canvas>
                    <span className="absolute top-1 left-1 text-[8px] opacity-50">VOICE_PRINT</span>
                </div>
                <div className="h-32 bg-black/80 border border-green-900/30 p-2 overflow-hidden font-mono text-[9px]">
                    {logs.map((l, i) => (
                        <div key={i} className={l.isAlert ? 'text-red-500' : 'text-green-400 opacity-80'}>
                            <span className="opacity-40">[{l.time}]</span> {l.msg}
                        </div>
                    ))}
                </div>
            </div>

            <div className="col-span-12 md:col-span-6 relative flex flex-col items-center justify-center">
                {view === 'BOOT' && (
                     <div className="text-center z-20">
                         <div className="w-20 h-20 border-t-4 border-green-500 rounded-full animate-spin mb-6 mx-auto shadow-[0_0_30px_rgba(34,197,94,0.4)]"></div>
                         <h2 className="text-3xl font-black italic mb-2 tracking-widest text-white">SISTEMA <span className="text-green-500">SEGURO</span></h2>
                         <p className="text-xs mb-8 text-green-700 tracking-[0.3em]">VIGILIA_KERNEL_INIT</p>
                         <button onClick={initCamera} className="px-8 py-3 bg-green-600 text-black font-black tracking-[0.2em] hover:bg-white hover:text-green-900 transition-all border border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                             INICIAR SENSOR
                         </button>
                     </div>
                )}

                {(view === 'SCANNER' || view === 'DASHBOARD') && (
                    <div className="relative w-full max-w-md aspect-[4/5] bg-black border-2 border-green-500/30 rounded-sm overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                        {view === 'SCANNER' && <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale contrast-125"></video>}
                        {view === 'DASHBOARD' && (
                            <div className="w-full h-full bg-green-900/10 flex flex-col items-center justify-center animate-pulse">
                                <ShieldCheck size={64} className="text-green-500 mb-4" />
                                <h2 className="text-4xl font-black text-white">ACCESO CONCEDIDO</h2>
                                <p className="text-green-400 text-xs tracking-[0.5em] mt-2">CARGANDO VIGILIA...</p>
                            </div>
                        )}
                        <canvas ref={hudCanvasRef} width={400} height={500} className="absolute inset-0 w-full h-full pointer-events-none"></canvas>
                        {isScanning && <div className="scan-line"></div>}
                    </div>
                )}

                {view === 'SCANNER' && (
                    <div className="flex gap-4 mt-6">
                        <button onClick={handleEnroll} className="flex flex-col items-center gap-2 group hover:text-white transition-colors">
                            <div className="w-12 h-12 rounded-full border border-green-500 flex items-center justify-center group-hover:bg-green-500 group-hover:text-black transition-all">
                                <UserPlus size={20} />
                            </div>
                            <span className="text-[10px] font-bold opacity-60">REGISTRAR</span>
                        </button>
                        <button 
                            onClick={handleVerify} 
                            disabled={!user}
                            className={`flex flex-col items-center gap-2 group hover:text-white transition-colors ${!user ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            <div className="w-12 h-12 rounded-full border border-green-500 flex items-center justify-center group-hover:bg-green-500 group-hover:text-black transition-all">
                                <Fingerprint size={20} />
                            </div>
                            <span className="text-[10px] font-bold opacity-60">VALIDAR</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="col-span-3 glass-panel p-4 border-l border-green-900/20 hidden md:block">
                <h3 className="text-[10px] font-bold opacity-50 border-b border-green-800 pb-1 mb-4">SUJETO ACTIVO</h3>
                <div className="flex gap-3 items-center bg-green-950/30 p-3 rounded border border-green-500/20">
                    <div className="w-12 h-12 bg-black border border-green-700 flex items-center justify-center overflow-hidden">
                        {user && user.image ? <img src={user.image} className="w-full h-full object-cover grayscale" alt="User" /> : <span className="text-[9px] opacity-50">N/A</span>}
                    </div>
                    <div>
                        <div className="text-xs font-bold text-white">{user ? user.name : 'ESPERANDO...'}</div>
                        <div className="text-[9px] opacity-50 font-mono">{user ? user.id : 'NO_DATA'}</div>
                    </div>
                </div>
                
                {view === 'DASHBOARD' && (
                     <div className="mt-8 space-y-2 font-mono">
                         <div className="text-[10px] text-green-400">{`> Conectando con Núcleo... OK`}</div>
                         <div className="text-[10px] text-green-400">{`> Descifrando Protocolos... OK`}</div>
                         <div className="text-[10px] text-white animate-pulse">{`> Iniciando VIGILIA.EXE`}</div>
                     </div>
                )}
            </div>
        </div>

        {showNameModal && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
                <div className="glass-panel p-8 w-80 border-2 border-green-500">
                    <h3 className="text-xl font-black italic mb-4 text-white">IDENTIFICACIÓN</h3>
                    <input ref={nameInputRef} type="text" placeholder="NOMBRE CLAVE" className="w-full bg-black border border-green-800 p-3 text-green-400 mb-4 focus:border-green-400 outline-none uppercase font-mono" />
                    <button onClick={saveUser} className="w-full py-3 bg-green-600 hover:bg-green-400 text-black font-bold tracking-widest">CONFIRMAR</button>
                </div>
            </div>
        )}
    </div>
  );
};
