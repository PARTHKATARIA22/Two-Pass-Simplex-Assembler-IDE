import React, { useState, useMemo } from 'react';

const MemoryDump = ({ emulatorOutput }) => {
  const [showSortedArray, setShowSortedArray] = useState(false);
  const [arrayStartAddress, setArrayStartAddress] = useState('33'); // default hex '33' is 51 decimal

  const memory = useMemo(() => {
    if (!emulatorOutput) return [];

    const lines = emulatorOutput.split('\n');
    const dumpIndex = lines.findIndex(l => l.includes('memory dump'));
    
    if (dumpIndex === -1) return [];

    const memLines = lines.slice(dumpIndex + 1).filter(l => l.trim().match(/^[0-9a-fA-F]+\s+[0-9a-fA-F]+$/));
    
    return memLines.map(line => {
      const [address, value] = line.trim().split(/\s+/);
      return { address, value };
    });
  }, [emulatorOutput]);

  const highlightOffsets = useMemo(() => {
     if (!showSortedArray) return [];
     
     const startDec = parseInt(arrayStartAddress, 16);
     if (isNaN(startDec)) return [];

     // By default bubble sort test array is 5 elements long, offset from count data
     return [startDec, startDec+1, startDec+2, startDec+3, startDec+4].map(num => 
        // Convert to 8-char padded hex to match output format
        num.toString(16).padStart(8, '0').toLowerCase()
     );
  }, [showSortedArray, arrayStartAddress]);

  // Determine what to show. If showSortedArray, maybe we still show first 20 + highlighted ones, 
  // or just show all parsed memory up to a point. Let's show first 100 to be safe
  const visibleMemory = memory.slice(0, 100);

  return (
    <div className="flex flex-col flex-1 bg-gray-900 border border-gray-700 rounded-md overflow-hidden min-h-[300px]">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">MEMORY DUMP</span>
        
        <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 flex items-center gap-1">
                Start Addr (Hex):
                <input 
                   type="text" 
                   value={arrayStartAddress}
                   onChange={(e) => setArrayStartAddress(e.target.value)}
                   className="w-12 bg-gray-950 border border-gray-600 rounded px-1 text-gray-200 outline-none focus:border-blue-500"
                />
            </label>
            <button
               onClick={() => setShowSortedArray(!showSortedArray)}
               className={`text-xs px-2 py-1 rounded transition-colors ${showSortedArray ? 'bg-blue-900 text-blue-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
               {showSortedArray ? "Highlight On" : "Highlight Off"}
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-950 p-2">
         {memory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 font-mono text-sm leading-relaxed p-4 text-center">
              Awaiting execution for memory dump...
            </div>
         ) : (
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-900 border-b border-gray-700 shadow-sm z-10">
                    <tr>
                        <th className="px-3 py-1.5 text-xs font-semibold text-gray-400 font-mono w-1/2">Address</th>
                        <th className="px-3 py-1.5 text-xs font-semibold text-gray-400 font-mono w-1/2">Value</th>
                    </tr>
                </thead>
                <tbody className="font-mono text-sm">
                    {visibleMemory.map((row, idx) => {
                        const isHighlighted = showSortedArray && highlightOffsets.includes(row.address.toLowerCase());

                        return (
                            <tr 
                                key={idx} 
                                className={`border-b border-gray-800/50 hover:bg-gray-800 transition-colors
                                ${isHighlighted ? 'bg-blue-900/40 text-blue-300 font-bold border-blue-700/50' : 'text-gray-300'}`}
                            >
                                <td className={`px-3 py-1.5 ${isHighlighted ? 'text-blue-300' : 'text-gray-500'}`}>0x{row.address}</td>
                                <td className={`px-3 py-1.5 ${isHighlighted ? 'text-blue-100' : 'text-gray-300'}`}>{row.value}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
         )}
      </div>
    </div>
  );
};

export default MemoryDump;
