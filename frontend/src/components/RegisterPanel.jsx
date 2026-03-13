import React, { useMemo } from 'react';

const RegisterPanel = ({ emulatorOutput }) => {
  const registers = useMemo(() => {
    // Default values
    let A = '--------', B = '--------', PC = '--------', SP = '--------';
    
    if (!emulatorOutput) {
       return { A, B, PC, SP };
    }

    // Try to find the registers line: "A: <val> B: <val> PC: <val> SP: <val>"
    const lines = emulatorOutput.split('\n');
    const regLine = lines.find(l => l.includes('A:') && l.includes('B:') && l.includes('PC:') && l.includes('SP:'));
    
    if (regLine) {
        // e.g. "A: 00000000 B: 00000000 PC: 00000032 SP: 00000ff9"
        // Find by regex or simple split
        const parts = regLine.split(/\s+/);
        
        for (let i = 0; i < parts.length; i++) {
           if (parts[i] === 'A:') A = parts[i+1];
           if (parts[i] === 'B:') B = parts[i+1];
           if (parts[i] === 'PC:') PC = parts[i+1];
           if (parts[i] === 'SP:') SP = parts[i+1];
        }
    }

    return { A, B, PC, SP };
  }, [emulatorOutput]);

  const hexToDec = (hexStr) => {
    if (hexStr === '--------' || !hexStr) return '-';
    // SIMPLEX emulator output is 8-char hex (32-bit signed maybe or unsigned)
    // Assuming unsigned for simple display, or signed
    const val = parseInt(hexStr, 16);
    return isNaN(val) ? '-' : val.toString();
  };

  const formatHex = (hexStr) => {
     if (hexStr === '--------' || !hexStr) return hexStr;
     return '0x' + hexStr.toUpperCase();
  };

  return (
    <div className="flex flex-col bg-gray-900 border border-gray-700 rounded-md overflow-hidden mb-4">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">REGISTERS</span>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4 bg-gray-950">
        
        {/* Register A */}
        <div className="bg-gray-900 border border-blue-900/40 rounded p-3 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-blue-400 font-bold text-lg font-mono">A</span>
            <span className="text-gray-500 text-xs font-mono">dec: {hexToDec(registers.A)}</span>
          </div>
          <span className="text-gray-200 font-mono text-sm tracking-wider">{formatHex(registers.A)}</span>
        </div>

        {/* Register B */}
        <div className="bg-gray-900 border border-purple-900/40 rounded p-3 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-purple-400 font-bold text-lg font-mono">B</span>
            <span className="text-gray-500 text-xs font-mono">dec: {hexToDec(registers.B)}</span>
          </div>
          <span className="text-gray-200 font-mono text-sm tracking-wider">{formatHex(registers.B)}</span>
        </div>

        {/* Register PC */}
        <div className="bg-gray-900 border border-yellow-900/40 rounded p-3 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-yellow-400 font-bold text-lg font-mono">PC</span>
            <span className="text-gray-500 text-xs font-mono">dec: {hexToDec(registers.PC)}</span>
          </div>
          <span className="text-gray-200 font-mono text-sm tracking-wider">{formatHex(registers.PC)}</span>
        </div>

        {/* Register SP */}
        <div className="bg-gray-900 border border-green-900/40 rounded p-3 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-green-400 font-bold text-lg font-mono">SP</span>
            <span className="text-gray-500 text-xs font-mono">dec: {hexToDec(registers.SP)}</span>
          </div>
          <span className="text-gray-200 font-mono text-sm tracking-wider">{formatHex(registers.SP)}</span>
        </div>

      </div>
    </div>
  );
};

export default RegisterPanel;
