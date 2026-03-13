import React, { useMemo } from 'react';

const ListingTable = ({ listingText, activePC }) => {
  const rows = useMemo(() => {
    if (!listingText) return [];

    const lines = listingText.split('\n').filter(l => l.trim());
    return lines.map((line) => {
      // Split by 1 or more whitespace
      const parts = line.split(/\s+/).filter(p => p !== '');
      
      let pc = '', machineCode = '', mnemonic = '', operand = '';
      
      if (parts.length >= 1) pc = parts[0];
      if (parts.length >= 2) machineCode = parts[1];
      if (parts.length >= 3) mnemonic = parts[2].toUpperCase();
      if (parts.length >= 4) {
          // Operand might have spaces (e.g. comments attached), reconstruct
          operand = parts.slice(3).join(' ');
      }

      return { line, pc, machineCode, mnemonic, operand };
    });
  }, [listingText]);

  // Convert activePC hex string (like "0x00000032") to match listing format ("00000032")
  const activePCPadded = activePC ? activePC.replace('0x', '').padStart(8, '0').toLowerCase() : null;

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-md overflow-hidden">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">LISTING VIEW</span>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-950 p-2">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 font-mono text-sm">
            Run your code to see the listing
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-700 shadow-sm z-10">
              <tr>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 font-mono">PC</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 font-mono">Machine Code</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 font-mono">Mnemonic</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 font-mono">Operand</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {rows.map((row, idx) => {
                const isActive = activePCPadded && row.pc.toLowerCase() === activePCPadded;
                
                return (
                  <tr 
                    key={idx} 
                    className={`border-b border-gray-800/50 hover:bg-gray-800 transition-colors
                      ${isActive ? 'bg-yellow-900/40 text-yellow-300 font-bold border-yellow-700/50' : ''}`}
                  >
                    <td className={`px-3 py-1.5 ${isActive ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {row.pc}
                    </td>
                    <td className={`px-3 py-1.5 ${isActive ? 'text-yellow-200' : 'text-green-400'}`}>
                      {row.machineCode}
                    </td>
                    <td className={`px-3 py-1.5 ${isActive ? 'text-white' : 'text-gray-200'}`}>
                      {row.mnemonic}
                    </td>
                    <td className={`px-3 py-1.5 ${isActive ? 'text-yellow-100/70' : 'text-gray-500'}`}>
                      {row.operand}
                    </td>
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

export default ListingTable;
