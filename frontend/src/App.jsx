import React, { useState, useRef, useEffect, useMemo } from 'react';

const SAMPLE_CODE = `; Simple test: load two values and add them
        ldc 10      ; A = 10
        stl 0       ; local[0] = 10
        ldc 20      ; A = 20
        ldl 0       ; B = 20, A = 10
        add         ; A = 30
        halt
`;

const RegCard = ({ name, color, reg }) => (
  <div className="bg-[#000000] border border-[#222222] rounded-md p-2 flex flex-col justify-between h-[60px]">
    <div className="flex items-center justify-between">
      <span className="font-bold text-sm font-sans" style={{ color }}>{name}</span>
      <span className="text-[#9ca3af] text-[10px] font-sans">dec: {reg.dec}</span>
    </div>
    <div className="text-[#f9fafb] font-sans text-sm tracking-wider">{reg.hex}</div>
  </div>
);

const ISA_REFERENCE = [
  { m: 'ldc', op: '00', args: 'value', desc: 'Load constant into A' },
  { m: 'adc', op: '01', args: 'value', desc: 'Add constant to A' },
  { m: 'ldl', op: '02', args: 'offset', desc: 'Load local from SP+offset into A' },
  { m: 'stl', op: '03', args: 'offset', desc: 'Store A to local at SP+offset' },
  { m: 'ldnl', op: '04', args: 'offset', desc: 'Load non-local from A+offset into A' },
  { m: 'stnl', op: '05', args: 'offset', desc: 'Store B to non-local at A+offset' },
  { m: 'add', op: '06', args: '', desc: 'A = B + A' },
  { m: 'sub', op: '07', args: '', desc: 'A = B - A' },
  { m: 'shl', op: '08', args: '', desc: 'A = B << A' },
  { m: 'shr', op: '09', args: '', desc: 'A = B >> A' },
  { m: 'adj', op: '0A', args: 'value', desc: 'Adjust SP by value' },
  { m: 'a2sp', op: '0B', args: '', desc: 'SP = A, A = B' },
  { m: 'sp2a', op: '0C', args: '', desc: 'B = A, A = SP' },
  { m: 'call', op: '0D', args: 'offset', desc: 'Call subroutine at offset' },
  { m: 'return', op: '0E', args: '', desc: 'Return from subroutine' },
  { m: 'brz', op: '0F', args: 'offset', desc: 'Branch if A is zero' },
  { m: 'brlz', op: '10', args: 'offset', desc: 'Branch if A is less than zero' },
  { m: 'br', op: '11', args: 'offset', desc: 'Unconditional branch' },
  { m: 'halt', op: '12', args: '', desc: 'Halt execution' },
  { m: 'data', op: '', args: 'value', desc: 'Define constant / reserve space' },
  { m: 'set', op: '', args: 'value', desc: 'Set label to a value' }
];

function App() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [listing, setListing] = useState('');
  const [emulatorOutput, setEmulatorOutput] = useState('');
  const [assemblerOutput, setAssemblerOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Step Mode State ---
  const [mode, setMode] = useState('normal'); // 'normal' | 'step'
  const [stepPhase, setStepPhase] = useState('pass1'); // 'pass1' | 'pass2' | 'done'
  const [pass1Steps, setPass1Steps] = useState([]);
  const [pass2Steps, setPass2Steps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [labelTable, setLabelTable] = useState([]);
  const [listingRowsStep, setListingRowsStep] = useState([]);
  const [stepLog, setStepLog] = useState([]);
  const [activeLineNumber, setActiveLineNumber] = useState(null);
  const stopAutoRun = useRef(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  const [colWidths, setColWidths] = useState([30, 40, 30]);
  const containerRef = useRef(null);
  const dragInfo = useRef(null);

  const gutterRef = useRef(null);
  const textareaRef = useRef(null);
  const consoleRef = useRef(null);

  const [showComments, setShowComments] = useState(true);

  // --- External Logic ---
  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setAssemblerOutput('');
    setEmulatorOutput('');
    setListing('');

    try {
      const response = await fetch('http://localhost:3001/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.assemblerOutput || data.error || 'Execution failed');
        if (data.assemblerOutput) setAssemblerOutput(data.assemblerOutput);
      } else {
        setListing(data.listing);
        setEmulatorOutput(data.emulatorOutput);
        setAssemblerOutput(data.assemblerOutput);
      }
    } catch (err) {
      setError(`Could not connect to backend. Is the server running on port 3001? (Error: ${err.message})`);
    } finally {
      setLoading(false);
    }
  };

  const initStepMode = async () => {
    setLoading(true);
    setError(null);
    setAssemblerOutput('');
    setEmulatorOutput('');
    setListing('');

    // Reset step state
    setLabelTable([]);
    setListingRowsStep([]);
    setStepLog([]);
    setActiveLineNumber(null);
    setStepPhase('pass1');
    setCurrentStepIdx(0);
    stopAutoRun.current = false;
    setIsAutoRunning(false);

    try {
      const response = await fetch('http://localhost:3001/api/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to initialize Step Mode');
        setMode('normal'); // fallback
      } else {
        setPass1Steps(data.pass1Steps || []);
        setPass2Steps(data.pass2Steps || []);
        setMode('step');
        setStepLog([{ text: "Step Mode initialized. Ready for Pass 1.", color: "#60a5fa" }]);
      }
    } catch (err) {
      setError(`Could not connect to backend for steps. (Error: ${err.message})`);
      setMode('normal');
    } finally {
      setLoading(false);
    }
  };

  const exitStepMode = () => {
    setMode('normal');
    stopAutoRun.current = true;
    setIsAutoRunning(false);
    setActiveLineNumber(null);
  };

  const advanceStep = (forceIdx) => {
    if (stepPhase === 'done') return;

    const actualIdx = forceIdx !== undefined ? forceIdx : currentStepIdx;

    if (stepPhase === 'pass1') {
      if (actualIdx >= pass1Steps.length) {
        setStepPhase('pass2');
        setCurrentStepIdx(0);
        setStepLog(prev => [...prev, { text: "Pass 1 complete. Ready for Pass 2.", color: "#4ade80" }]);
        return;
      }

      const step = pass1Steps[actualIdx];
      setActiveLineNumber(step.lineNumber);

      // Update label table
      if (step.action === 'LABEL_FOUND' || step.action === 'SET_LABEL') {
        setLabelTable(Object.entries(step.labelTableSnapshot).map(([label, addr]) => ({
          label,
          address: addr,
          line: step.lineNumber
        })));
      }

      // Update Log
      let color = '#9ca3af'; // gray
      if (step.action === 'LABEL_FOUND') color = '#4ade80'; // green
      else if (step.action === 'SET_LABEL') color = '#facc15'; // yellow
      else if (step.action === 'INCREMENT_PC' || step.action === 'DATA_PC') color = '#60a5fa'; // blue

      setStepLog(prev => [...prev, { text: `Step ${actualIdx + 1}: ${step.comment}`, color }]);
      setCurrentStepIdx(actualIdx + 1);
    } else if (stepPhase === 'pass2') {
      if (actualIdx >= pass2Steps.length) {
        setStepPhase('done');
        setStepLog(prev => [...prev, { text: "Pass 2 complete. Assembly fully generated. Click 'Run Full Emulation' to populate Memory/Registers.", color: "#4ade80" }]);
        return;
      }

      const step = pass2Steps[actualIdx];
      setActiveLineNumber(step.lineNumber);

      // Add to actual listing
      setListingRowsStep(prev => [
        ...prev,
        {
          pc: step.pc.toString(16).padStart(8, '0').toUpperCase(),
          machineCode: step.machineCode,
          mnemonic: step.mnemonic ? step.mnemonic.toUpperCase() : '',
          operand: step.operand || '',
          comment: step.comment,
          isNew: true // trigger brief highlight
        }
      ]);

      setStepLog(prev => [...prev, { text: `Step ${actualIdx + 1}: ${step.comment}`, color: '#d1d5db' }]);
      setCurrentStepIdx(actualIdx + 1);
    }
  };

  const autoRunPhase = async () => {
    setIsAutoRunning(true);
    stopAutoRun.current = false;
    const stepsArray = stepPhase === 'pass1' ? pass1Steps : pass2Steps;
    const startIdx = currentStepIdx;

    for (let i = startIdx; i <= stepsArray.length; i++) {
      if (stopAutoRun.current) break;
      advanceStep(i);
      await new Promise(resolve => setTimeout(resolve, i === stepsArray.length ? 0 : 80));
    }
    setIsAutoRunning(false);
  };

  const handleClear = () => {
    setCode('');
    setListing('');
    setEmulatorOutput('');
    setAssemblerOutput('');
    setError(null);
  };

  // --- Editor Handlers ---
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '        ' + code.substring(end);
      setCode(newCode);
      // Wait for React to sync value
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 8;
      }, 0);
    }
  };

  const handleTextareaScroll = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // --- Resize Handlers ---
  const startDrag = (index, e) => {
    e.preventDefault();
    if (!containerRef.current) return;
    dragInfo.current = {
      index,
      startX: e.clientX,
      startLeft: colWidths[index],
      startRight: colWidths[index + 1],
      containerWidth: containerRef.current.clientWidth
    };
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const doDrag = (e) => {
    if (!dragInfo.current) return;
    const { index, startX, startLeft, startRight, containerWidth } = dragInfo.current;

    const dx = e.clientX - startX;
    const dpct = (dx / containerWidth) * 100;

    let newLeft = startLeft + dpct;
    let newRight = startRight - dpct;

    const minPct = (200 / containerWidth) * 100;

    if (newLeft < minPct) {
      newRight -= (minPct - newLeft);
      newLeft = minPct;
    }
    if (newRight < minPct) {
      newLeft -= (minPct - newRight);
      newRight = minPct;
    }

    setColWidths(prev => {
      const next = [...prev];
      next[index] = newLeft;
      next[index + 1] = newRight;
      return next;
    });
  };

  const stopDrag = () => {
    dragInfo.current = null;
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // --- Parsing and Formatting ---
  const listingRows = useMemo(() => {
    if (!listing) return [];
    const lines = listing.split('\n').filter(l => l.trim());
    return lines.map((line) => {
      const parts = line.split(/\s+/).filter(Boolean);
      let pc = '', machineCode = '', mnemonic = '', operand = '';
      if (parts.length >= 1) pc = parts[0];
      if (parts.length >= 2) machineCode = parts[1];
      if (parts.length >= 3) mnemonic = parts[2].toUpperCase();
      if (parts.length >= 4) operand = parts.slice(3).join(' ');
      return { line, pc, machineCode, mnemonic, operand };
    });
  }, [listing]);

  const registers = useMemo(() => {
    let A = '-', B = '-', PC = '-', SP = '-';
    if (emulatorOutput) {
      const lines = emulatorOutput.split('\n');
      const regLine = lines.find(l => l.includes('A:') && l.includes('B:') && l.includes('PC:') && l.includes('SP:'));
      if (regLine) {
        const parts = regLine.split(/\s+/);
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === 'A:') A = parts[i + 1];
          if (parts[i] === 'B:') B = parts[i + 1];
          if (parts[i] === 'PC:') PC = parts[i + 1];
          if (parts[i] === 'SP:') SP = parts[i + 1];
        }
      }
    }

    const formatReg = (valStr) => {
      if (valStr === '-' || !valStr) return '--';
      const num = parseInt(valStr, 10);
      if (isNaN(num)) return valStr;
      return '0x' + (num >>> 0).toString(16).toUpperCase().padStart(8, '0');
    };

    return {
      A: { dec: A, hex: formatReg(A) },
      B: { dec: B, hex: formatReg(B) },
      PC: { dec: PC, hex: formatReg(PC) },
      SP: { dec: SP, hex: formatReg(SP) }
    };
  }, [emulatorOutput]);

  const activePCHex = registers.PC.hex !== '--' ? registers.PC.hex.replace('0x', '').toLowerCase() : null;


  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [assemblerOutput, emulatorOutput]);

  const renderConsoleLine = (line, idx) => {
    let color = '#d1d5db';
    if (line.toLowerCase().includes('error')) color = '#f87171';
    else if (line.includes('HALT')) color = '#34d399';
    return <div key={idx} style={{ color }}>{line}</div>;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#000000] text-[#f9fafb] font-sans overflow-hidden">

      {/* Top Header */}
      <div className="flex-none h-[48px] flex items-center justify-between px-4 border-b border-[#222222]">
        <h1 className="text-xl font-bold flex items-center gap-2">
          SIMPLEX Assembler IDE
        </h1>
        <div>
          {mode === 'normal' ? (
            <button
              onClick={initStepMode}
              disabled={loading}
              className="px-3 py-1 text-[13px] font-semibold text-[#f9fafb] bg-emerald-600 shadow-mdlue-600 shadow-md hover:bg-emerald-600 shadow-mdlue-700 rounded-md disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              Step Mode
            </button>
          ) : (
            <button
              onClick={exitStepMode}
              className="px-3 py-1 text-[13px] font-semibold text-[#f9fafb] bg-red-600 shadow-md hover:bg-red-700 rounded-md transition-colors flex items-center gap-2"
            >
              ✕ Exit Step Mode
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex-none m-2 p-2 bg-red-900/40 border border-[#f87171] rounded-md text-[#f87171] font-sans text-sm shrink-0">
          <span className="font-bold">⚠ Error: </span> {error}
        </div>
      )}

      {/* Top Section - 3 Resizable Columns */}
      <div className="flex-1 flex min-h-0 relative w-full" ref={containerRef}>

        {/* COL 1: Editor */}
        <div style={{ flex: `${colWidths[0]} 1 0%`, minWidth: '200px' }} className="flex flex-col bg-[#000000] h-full overflow-hidden">
          {mode === 'normal' ? (
            <div className="flex items-center justify-between h-[32px] bg-[#0a0a0a] px-4 shrink-0 border-b border-[#222222]">
              <span className="text-xs text-[#9ca3af] uppercase tracking-wider font-semibold">ASM CODE EDITOR</span>
              <div className="flex gap-2">
                <button onClick={handleClear} disabled={loading} className="px-2 py-0.5 text-[11px] font-semibold text-[#f9fafb] bg-gray-600 hover:bg-gray-500 rounded-md disabled:opacity-50">Clear</button>
                <button onClick={handleRun} disabled={loading} className="px-2 py-0.5 text-[11px] font-semibold text-[#f9fafb] bg-[#10b981] hover:bg-[#059669] rounded-md flex items-center gap-1 disabled:opacity-50">
                  {loading ? 'Running...' : '▶ Run'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between h-[32px] bg-[#0a0a0a] px-4 shrink-0 border-b border-[#222222]">
              <span className={`text-xs font-bold uppercase tracking-wider ${stepPhase === 'pass1' ? 'text-blue-400' : 'text-green-400'}`}>
                {stepPhase === 'pass1' ? 'PASS 1' : stepPhase === 'pass2' ? 'PASS 2' : 'DONE'}
              </span>
              <div className="flex gap-2 items-center">
                {isAutoRunning ? (
                  <button onClick={() => { stopAutoRun.current = true; setIsAutoRunning(false); }} className="px-2 py-0.5 text-[11px] font-semibold text-[#111827] bg-[#fbbf24] hover:bg-yellow-500 rounded-md flex items-center gap-1">
                    ⏸ Pause
                  </button>
                ) : (
                  <>
                    {stepPhase === 'pass1' && (
                      <>
                        <button onClick={autoRunPhase} className="px-2 py-0.5 text-[11px] font-semibold text-[#f9fafb] bg-emerald-600 shadow-mdlue-600 shadow-md hover:bg-emerald-600 shadow-mdlue-700 rounded-md flex items-center gap-1">⏭ Run Pass 1</button>
                      </>
                    )}
                    {stepPhase === 'pass2' && (
                      <>
                        <button onClick={autoRunPhase} className="px-2 py-0.5 text-[11px] font-semibold text-[#f9fafb] bg-green-600 hover:bg-green-500 rounded-md flex items-center gap-1">⏭ Run Pass 2</button>
                      </>
                    )}
                    {stepPhase === 'done' && (
                      <button onClick={handleRun} className="px-2 py-0.5 text-[11px] font-semibold text-[#f9fafb] bg-[#10b981] hover:bg-[#059669] rounded-md flex items-center gap-1">▶ Run Full Emulation</button>
                    )}
                  </>
                )}
                <span className="text-[11px] text-[#9ca3af] ml-2 font-sans">
                  Step {currentStepIdx} / {stepPhase === 'pass1' ? pass1Steps.length : stepPhase === 'pass2' ? pass2Steps.length : 0}
                </span>
              </div>
            </div>
          )}
          <div className="flex-1 flex overflow-hidden relative">
            <div ref={gutterRef} className="w-[40px] shrink-0 text-right pr-[8px] text-[#6b7280] font-sans select-none overflow-hidden bg-[#000000]" style={{ fontSize: '14px', lineHeight: '1.6', paddingTop: '8px', paddingBottom: '8px' }}>
              {code.split('\n').map((_, i) => (
                <div key={i} className={activeLineNumber === i + 1 ? 'bg-[#78350f] text-[#fbbf24] border-l-4 border-[#fbbf24] pl-1' : ''}>
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea ref={textareaRef} value={code} onChange={e => setCode(e.target.value)} onKeyDown={handleKeyDown} onScroll={handleTextareaScroll} spellCheck="false"
              className="flex-1 bg-[#000000] text-[#f9fafb] font-sans resize-none outline-none border-none p-[8px]"
              style={{ fontSize: '14px', lineHeight: '1.6' }} />
          </div>
        </div>

        {/* Divider 1 */}
        <div className="w-[8px] bg-[#374151] cursor-col-resize hover:bg-[#60a5fa] transition-colors shrink-0 z-10" onMouseDown={(e) => startDrag(0, e)} />

        {/* COL 2: Listing / Label Table */}
        <div style={{ flex: `${colWidths[1]} 1 0%`, minWidth: '200px' }} className="flex flex-col bg-[#000000] h-full overflow-hidden">
          {mode === 'normal' || stepPhase === 'done' || (stepPhase === 'pass2' && currentStepIdx > 0) ? (
            <>
              <div className="flex items-center justify-between h-[32px] bg-[#0a0a0a] px-4 shrink-0 border-b border-[#222222]">
                <span className="text-xs text-[#9ca3af] uppercase tracking-wider font-semibold">LISTING VIEW</span>
                <button onClick={() => setShowComments(!showComments)}
                  className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${showComments ? 'bg-[#78350f] text-[#fbbf24]' : 'bg-[#374151] text-[#f9fafb] hover:bg-gray-600'}`}>
                  {showComments ? 'Hide Comments' : 'Show Comments'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide bg-[#000000]">
                {(mode === 'normal' ? listingRows : listingRowsStep).length === 0 ? (
                  <div className="text-center p-4 text-[#9ca3af] text-sm font-sans mt-10">Run your code to see the listing</div>
                ) : (
                  <table className="w-full text-left table-fixed border-collapse">
                    <thead className="sticky top-0 bg-[#0a0a0a] z-10 border-b border-[#222222]">
                      <tr>
                        <th className={`px-3 py-1.5 text-[11px] text-[#9ca3af] font-sans font-normal ${showComments ? 'w-[18%]' : 'w-[22%]'}`}>PC</th>
                        <th className={`px-3 py-1.5 text-[11px] text-[#9ca3af] font-sans font-normal ${showComments ? 'w-[22%]' : 'w-[24%]'}`}>Machine Code</th>
                        <th className={`px-3 py-1.5 text-[11px] text-[#9ca3af] font-sans font-normal ${showComments ? 'w-[18%]' : 'w-[20%]'}`}>Mnemonic</th>
                        <th className={`px-3 py-1.5 text-[11px] text-[#9ca3af] font-sans font-normal ${showComments ? 'w-[17%]' : 'w-[34%]'}`}>Operand</th>
                        {showComments && <th className="px-3 py-1.5 text-[11px] text-[#9ca3af] font-sans font-normal w-[25%]">Comment</th>}
                      </tr>
                    </thead>
                    <tbody className="text-sm font-sans leading-relaxed">
                      {(mode === 'normal' ? listingRows : listingRowsStep).map((row, idx) => {
                        const isActive = activePCHex && row.pc.toLowerCase() === activePCHex;
                        return (
                          <tr key={idx} className={isActive ? 'bg-[#78350f] text-[#fbbf24]' : 'hover:bg-[#0a0a0a] border-b border-[#222222]/30 animate-[slideIn_0.3s_ease-out]'}>
                            <td className={`px-3 py-1 truncate ${isActive ? '' : 'text-[#60a5fa]'}`} title={row.pc}>{row.pc}</td>
                            <td className={`px-3 py-1 truncate ${isActive ? '' : 'text-[#34d399]'}`} title={row.machineCode}>{row.machineCode}</td>
                            <td className={`px-3 py-1 truncate ${isActive ? '' : 'text-[#f9fafb]'}`} title={row.mnemonic}>{row.mnemonic}</td>
                            <td className={`px-3 py-1 truncate ${isActive ? '' : 'text-[#9ca3af]'}`} title={row.operand}>{row.operand}</td>
                            {showComments && <td className={`px-3 py-1 truncate ${isActive ? '' : 'text-[#9ca3af] italic'}`} title={row.comment || ''}>{row.comment || ''}</td>}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between h-[32px] bg-[#0a0a0a] px-4 shrink-0 border-b border-[#222222]">
                <span className="text-xs text-[#9ca3af] uppercase tracking-wider font-semibold">PASS 1 — SYMBOL TABLE BUILDER</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide bg-[#000000] flex flex-col">
                <table className="w-full text-left table-fixed border-collapse shrink-0">
                  <thead className="sticky top-0 bg-[#000000] z-10 border-b border-[#222222]">
                    <tr>
                      <th className="px-5 py-2 text-[11px] text-[#9ca3af] font-sans font-normal w-[33%]">Label</th>
                      <th className="px-5 py-2 text-[11px] text-[#9ca3af] font-sans font-normal w-[33%]">Address</th>
                      <th className="px-5 py-2 text-[11px] text-[#9ca3af] font-sans font-normal w-[34%]">Set At Line</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-sans leading-relaxed">
                    {labelTable.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#0a0a0a] border-b border-[#222222]/30 animate-[slideIn_0.3s_ease-out]">
                        <td className="px-5 py-1.5 text-[#4ade80]">{item.label}</td>
                        <td className="px-5 py-1.5 text-[#60a5fa]">0x{item.address.toString(16).toUpperCase().padStart(4, '0')}</td>
                        <td className="px-5 py-1.5 text-[#9ca3af]">line {item.line}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {currentStepIdx > 0 && pass1Steps[currentStepIdx - 1] && (
                  <div className="p-4 mt-auto border-t border-[#222222] bg-[#0a0a0a]/50 font-sans text-sm text-[#f9fafb]">
                    Current PC: <span className="text-[#fbbf24]">0x{pass1Steps[currentStepIdx - 1].pcAfter.toString(16).toUpperCase().padStart(4, '0')}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Divider 2 */}
        <div className="w-[8px] bg-[#374151] cursor-col-resize hover:bg-[#60a5fa] transition-colors shrink-0 z-10" onMouseDown={(e) => startDrag(1, e)} />

        {/* COL 3: Registers & Memory / Step Log */}
        <div style={{ flex: `${colWidths[2]} 1 0%`, minWidth: '200px' }} className="flex flex-col bg-[#000000] h-full overflow-hidden">
          {mode === 'normal' || (stepPhase === 'done' && emulatorOutput !== '') ? (
            <>
              <div className="flex items-center h-[32px] bg-[#0a0a0a] px-4 shrink-0 border-b border-[#222222]">
                <span className="text-xs text-[#9ca3af] uppercase tracking-wider font-semibold">REGISTERS & MEMORY</span>
              </div>

              {/* Registers */}
              <div className="shrink-0 p-4 grid grid-cols-2 gap-3 border-b border-[#222222]">
                <RegCard name="A" color="#60a5fa" reg={registers.A} />
                <RegCard name="B" color="#a78bfa" reg={registers.B} />
                <RegCard name="PC" color="#fbbf24" reg={registers.PC} />
                <RegCard name="SP" color="#34d399" reg={registers.SP} />
              </div>

              {/* ISA Quick Reference */}
              <div className="flex items-center h-[32px] bg-[#0a0a0a] px-4 shrink-0 border-b border-[#222222]">
                <span className="text-[11px] text-[#9ca3af] font-semibold uppercase tracking-wider">ISA QUICK REFERENCE</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide bg-[#000000]">
                <table className="w-full text-left table-fixed border-collapse">
                  <thead className="sticky top-0 bg-[#000000] z-10 border-b border-[#222222]">
                    <tr>
                      <th className="px-4 py-1.5 text-[10px] text-[#9ca3af] font-sans font-normal w-[20%]">Mnm</th>
                      <th className="px-1 py-1.5 text-[10px] text-[#9ca3af] font-sans font-normal w-[15%]">Op</th>
                      <th className="px-1 py-1.5 text-[10px] text-[#9ca3af] font-sans font-normal w-[25%]">Operand</th>
                      <th className="px-1 py-1.5 text-[10px] text-[#9ca3af] font-sans font-normal w-[40%]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-sans leading-relaxed">
                    {ISA_REFERENCE.map((inst, idx) => (
                      <tr key={idx} className="hover:bg-[#0a0a0a] border-b border-[#1f2937]/50">
                        <td className="px-4 py-2 text-[#fbbf24]">{inst.m}</td>
                        <td className="px-1 py-2 text-[#60a5fa]">{inst.op ? `0x${inst.op}` : '--'}</td>
                        <td className="px-1 py-2 text-[#34d399]">{inst.args || '--'}</td>
                        <td className="px-1 py-2 text-[#d1d5db] truncate" title={inst.desc}>{inst.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center h-[32px] bg-[#0a0a0a] px-4 shrink-0 border-b border-[#222222] shadow-sm z-10">
                <span className="text-xs text-[#9ca3af] uppercase tracking-wider font-semibold">STEP LOG</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide bg-[#000000] p-4 flex flex-col gap-1.5 font-sans text-[13px]">
                {stepLog.map((log, i) => (
                  <div key={i} style={{ color: log.color }} className="animate-[slideIn_0.3s_ease-out]">
                    {log.text}
                  </div>
                ))}
                {/* dummy div to auto scroll */}
                <div ref={el => el && el.scrollIntoView()} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Section - Console (Fixed 232px) */}
      <div className="shrink-0 h-[232px] w-full flex flex-col border-t-[4px] border-[#374151] bg-[#0a0a0a]">
        <div className="h-[32px] flex items-center px-4 shrink-0 shadow-sm z-10 bg-[#0a0a0a]">
          <span className="text-xs uppercase text-[#9ca3af] font-semibold tracking-wider">CONSOLE</span>
        </div>
        <div ref={consoleRef} className="flex-1 overflow-y-auto scrollbar-hide bg-[#000000] text-[#d1d5db] font-sans text-[13px] p-3 leading-relaxed whitespace-pre-wrap break-words">
          {assemblerOutput && (
            <div className="mb-4">
              <div className="text-[#9ca3af] mb-1 font-semibold text-xs border-b border-[#222222] pb-1">Assembler Output:</div>
              {assemblerOutput.split('\n').map(renderConsoleLine)}
            </div>
          )}
          {emulatorOutput && (
            <div>
              <div className="text-[#9ca3af] mb-1 font-semibold text-xs border-b border-[#222222] pb-1">Emulator Output:</div>
              {emulatorOutput.split('\n').map(renderConsoleLine)}
            </div>
          )}
          {!assemblerOutput && !emulatorOutput && (
            <div className="text-[#6b7280] italic px-1 pt-1">Ready.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
