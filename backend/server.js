const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

const isWindows = process.platform === 'win32';
const asmBin = isWindows ? 'asm.exe' : './asm';
const emuBin = isWindows ? 'emu.exe' : './emu';

app.post('/api/run', (req, res) => {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ success: false, error: 'Code is required' });
    }

    const inputAsmPath = path.join(tempDir, 'input.asm');
    const inputBinPath = path.join(tempDir, 'input.bin');
    const inputLstPath = path.join(tempDir, 'input.lst');

    try {
        // Write the assembly code to temp/input.asm
        fs.writeFileSync(inputAsmPath, code);

        // Run the assembler
        let assemblerOutput = '';
        try {
            assemblerOutput = execSync(`"${path.join(__dirname, asmBin)}" "${inputAsmPath}"`, { encoding: 'utf-8', cwd: __dirname });
        } catch (asmError) {
            // Assembler failed (e.g. syntax error)
            const errorMsg = asmError.stderr || asmError.stdout || asmError.message;
            return res.json({ success: false, assemblerOutput: errorMsg, emulatorOutput: '', listing: '' });
        }

        // Run the emulator
        let emulatorOutput = '';
        try {
            emulatorOutput = execSync(`"${path.join(__dirname, emuBin)}" "${inputBinPath}"`, { encoding: 'utf-8', cwd: __dirname });
        } catch (emuError) {
            // Emulator failed
             emulatorOutput = emuError.stderr || emuError.stdout || emuError.message;
        }

        // Read the listing file
        let listing = '';
        if (fs.existsSync(inputLstPath)) {
            listing = fs.readFileSync(inputLstPath, 'utf-8');
        }

        res.json({
            success: true,
            assemblerOutput: assemblerOutput.trim(),
            emulatorOutput: emulatorOutput.trim(),
            listing: listing.trim()
        });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ success: false, error: 'Internal server error', assemblerOutput: err.message });
    }
});

// --- TWO PASS ASSEMBLER STEPS LOGIC (JS Re-implementation) ---
const mnemonicTable = {
  ldc:{op:0,hasOp:true}, adc:{op:1,hasOp:true}, ldl:{op:2,hasOp:true},
  stl:{op:3,hasOp:true}, ldnl:{op:4,hasOp:true}, stnl:{op:5,hasOp:true},
  add:{op:6,hasOp:false}, sub:{op:7,hasOp:false}, shl:{op:8,hasOp:false},
  shr:{op:9,hasOp:false}, adj:{op:10,hasOp:true}, a2sp:{op:11,hasOp:false},
  sp2a:{op:12,hasOp:false}, call:{op:13,hasOp:true}, return:{op:14,hasOp:false},
  brz:{op:15,hasOp:true}, brlz:{op:16,hasOp:true}, br:{op:17,hasOp:true},
  halt:{op:18,hasOp:false}, set:{op:-2,hasOp:true}, data:{op:-1,hasOp:true}
};

const branchOps = new Set(['br','brz','brlz','call']);

function parseNumber(str) {
    if (!str) return 0;
    if (str.startsWith('0x') || str.startsWith('0X')) return parseInt(str, 16);
    if (str.startsWith('0') && str.length > 1) return parseInt(str, 8);
    return parseInt(str, 10);
}

function tokenize(line) {
    const commentIdx = line.indexOf(';');
    const codePart = commentIdx !== -1 ? line.substring(0, commentIdx) : line;
    const tokens = codePart.trim().split(/\s+/).filter(Boolean);
    return tokens;
}

app.post('/api/steps', (req, res) => {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ success: false, error: 'Code is required' });
    }

    const lines = code.split('\n');
    const pass1Steps = [];
    const pass2Steps = [];
    const labelTable = {};
    const labelAddress = {}; // the mapping used in Pass 2
    
    let PC = 0;
    let errors = [];

    // --- PASS 1 ---
    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const lineNumber = i + 1;
        const tokens = tokenize(rawLine);
        
        if (tokens.length === 0) {
            pass1Steps.push({
                lineNumber, rawLine, cleanedLine: "",
                action: "SKIP_EMPTY", mnemonic: null, operand: null, label: null,
                pcBefore: PC, pcAfter: PC, labelTableSnapshot: { ...labelAddress },
                comment: "Line skipped (empty or comment only)"
            });
            continue;
        }

        let tokenIndex = 0;
        let label = null;
        
        // Handle label
        if (tokens[tokenIndex].endsWith(':') || (!mnemonicTable[tokens[tokenIndex].toLowerCase()] && tokens.length > 1 && mnemonicTable[tokens[1].toLowerCase()])) {
            label = tokens[tokenIndex].replace(':', '');
            tokenIndex++;
        }

        const mnemonic = tokens[tokenIndex] ? tokens[tokenIndex].toLowerCase() : null;
        const info = mnemonic ? mnemonicTable[mnemonic] : null;
        const operandStr = tokens[tokenIndex + 1] || null;
        
        const cleanedLine = tokens.slice(label ? 1 : 0).join(' ');

        if (label) {
            // Check if it's a SET directive
            if (mnemonic === 'set') {
                const val = parseNumber(operandStr);
                labelAddress[label] = val;
                pass1Steps.push({
                    lineNumber, rawLine, cleanedLine,
                    action: "SET_LABEL", mnemonic, operand: operandStr, label,
                    pcBefore: PC, pcAfter: PC, labelTableSnapshot: { ...labelAddress },
                    comment: `Mnemonic 'SET' found → label '${label}' recorded as value ${val}`
                });
                continue;
            } else {
                labelAddress[label] = PC;
                pass1Steps.push({
                    lineNumber, rawLine, cleanedLine,
                    action: "LABEL_FOUND", mnemonic: null, operand: null, label,
                    pcBefore: PC, pcAfter: PC, labelTableSnapshot: { ...labelAddress },
                    comment: `Label '${label}' → address 0x${PC.toString(16).toUpperCase().padStart(4,'0')} recorded`
                });
            }
        }

        if (mnemonic && mnemonic !== 'set') {
            const tempPC = PC;
            PC++;
            pass1Steps.push({
                lineNumber, rawLine, cleanedLine,
                action: info && info.op === -1 ? "DATA_PC" : "INCREMENT_PC", 
                mnemonic, operand: operandStr, label: null,
                pcBefore: tempPC, pcAfter: PC, labelTableSnapshot: { ...labelAddress },
                comment: `Mnemonic '${mnemonic}' found → PC incremented to ${PC}`
            });
        } else if (!label && !mnemonic) {
             // likely garbage
             errors.push(`Pass 1 Error on line ${lineNumber}: Invalid token`);
        }
    }

    // --- PASS 2 ---
    PC = 0;
    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const lineNumber = i + 1;
        const tokens = tokenize(rawLine);
        
        if (tokens.length === 0) continue;

        let tokenIndex = 0;
        if (tokens[tokenIndex].endsWith(':') || (!mnemonicTable[tokens[tokenIndex].toLowerCase()] && tokens.length > 1 && mnemonicTable[tokens[1].toLowerCase()])) {
            tokenIndex++;
        }

        const mnemonic = tokens[tokenIndex] ? tokens[tokenIndex].toLowerCase() : null;
        if (!mnemonic || mnemonic === 'set') continue;

        const operandStr = tokens[tokenIndex + 1] || null;
        const info = mnemonicTable[mnemonic];
        const cleanedLine = tokens.slice(tokenIndex).join(' ');

        if (!info) {
             errors.push(`Pass 2 Error on line ${lineNumber}: Unknown mnemonic '${mnemonic}'`);
             continue;
        }

        let operandResolved = 0;
        let machineCode = 0;
        let comment = '';
        let branchTarget = null;
        const isBranch = branchOps.has(mnemonic);

        if (info.hasOp && operandStr) {
            // Check if operand is a label
            if (labelAddress.hasOwnProperty(operandStr)) {
                operandResolved = labelAddress[operandStr];
                if (isBranch) {
                    branchTarget = operandResolved;
                    // offset = target - (PC + 1)
                    const offset = operandResolved - (PC + 1);
                    operandResolved = offset;
                    comment = `branch offset = target(0x${branchTarget.toString(16)}) - (PC+1)(0x${(PC+1).toString(16)}) = 0x${(offset >>> 0).toString(16).substring(2)}`;
                } else {
                    comment = `label '${operandStr}' resolved to 0x${operandResolved.toString(16)}`;
                }
            } else {
                operandResolved = parseNumber(operandStr);
                comment = `parsed literal ${operandResolved}`;
            }
        }

        if (info.op === -1) { // DATA
            machineCode = operandResolved;
            comment = `DATA directive → literal value 0x${(machineCode >>> 0).toString(16)}`;
        } else {
            // (operand << 8) | opcode
            machineCode = ((operandResolved & 0xFFFFFF) << 8) | (info.op & 0xFF);
            comment = `opcode=0x${info.op.toString(16).padStart(2,'0')}, operand=0x${(operandResolved & 0xFFFFFF).toString(16)} (${comment}) → machine code 0x${(machineCode >>> 0).toString(16).padStart(8,'0')}`;
        }

        pass2Steps.push({
            lineNumber, rawLine, cleanedLine,
            pc: PC,
            mnemonic, operand: operandStr,
            operandResolved,
            machineCode: (machineCode >>> 0).toString(16).padStart(8, '0'),
            machineCodeHex: "0x" + (machineCode >>> 0).toString(16).padStart(8, '0').toUpperCase(),
            isLabel: false, isBranch, branchTarget,
            comment
        });

        PC++;
    }

    if (errors.length > 0) {
        return res.json({ success: false, error: errors.join('\n') });
    }

    res.json({
        success: true,
        pass1Steps,
        pass2Steps
    });
});

app.listen(PORT, () => {
    console.log(`SIMPLEX IDE backend running on http://localhost:${PORT}`);
});
