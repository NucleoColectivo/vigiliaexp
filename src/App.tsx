/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VigiliaCore } from './components/VigiliaCore';
import { VigiliaFace } from './components/VigiliaFace';
import { Eye, Terminal } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState<'CORE' | 'FACE'>('FACE');

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-black overflow-hidden font-mono">
      {/* Top Module Switcher Navigation */}
      <nav className="h-10 bg-[#040805] border-b border-green-950 flex items-center justify-between px-3 z-50 flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-green-700 font-bold tracking-widest uppercase hidden sm:inline">
            NÚCLEO COLECTIVO //
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveModule('CORE')}
              className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-all ${
                activeModule === 'CORE'
                  ? 'bg-green-950 border border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                  : 'text-neutral-500 hover:text-green-400 border border-transparent'
              }`}
            >
              <Terminal size={11} /> 01 // KERNEL VIGILIA
            </button>
            <button
              onClick={() => setActiveModule('FACE')}
              className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-all ${
                activeModule === 'FACE'
                  ? 'bg-green-950 border border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                  : 'text-neutral-500 hover:text-green-400 border border-transparent'
              }`}
            >
              <Eye size={11} /> 02 // ROSTRO & MIRADA
            </button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[9px] text-green-800">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>ESTADO: VIGILIA EXPERIMENTAL ACTIVE</span>
        </div>
      </nav>

      {/* Active Module View */}
      <div className="flex-1 w-full h-[calc(100dvh-2.5rem)] overflow-hidden relative">
        {activeModule === 'CORE' ? (
          <VigiliaCore userName="OPERADOR" />
        ) : (
          <VigiliaFace />
        )}
      </div>
    </div>
  );
}


