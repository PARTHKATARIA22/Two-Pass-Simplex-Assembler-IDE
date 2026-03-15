# SIMPLEX Assembler IDE — Build Prompt

## Project Overview

Build a full-stack **SIMPLEX Assembler IDE** — a browser-based tool that lets a user paste assembly code, assemble and emulate it on the server, and view rich output including register state, memory dump, and a parsed listing table. The stack is **React + Tailwind (frontend)** and **Node.js + Express (backend)**.

---

## Architecture

```
project/
├── backend/
│   ├── server.js          # Express API server
│   ├── asm.cpp            # (already exists — two-pass assembler)
│   └── emu.cpp            # (already exists — emulator)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Editor.jsx
│   │   │   ├── ListingTable.jsx
│   │   │   ├── RegisterPanel.jsx
│   │   │   └── MemoryDump.jsx
│   └── index.html
```

---

## Backend Requirements (`server.js`)

Build a Node.js + Express server with a single POST endpoint: `/api/run`

### What the endpoint must do:
1. Accept `{ code: string }` in the request body
2. Write the code to a temp file: `temp/input.asm`
3. Run `./asm temp/input.asm` — this produces `temp/input.bin` and `temp/input.lst`
4. Run `./emu temp/input.bin` — capture its stdout
5. Read `temp/input.lst` file contents
6. Return JSON:

```json
{
  "assemblerOutput": "...",   // stderr/stdout from asm
  "emulatorOutput": "...",    // stdout from emu (registers + memory)
  "listing": "...",           // raw text of .lst file
  "success": true
}
```

### Notes:
- Use `child_process.execSync` or `exec` with promises
- Create a `temp/` directory if it doesn't exist
- If assembly fails (non-zero exit or stderr), return `success: false` with the error message
- Enable CORS so the React frontend can talk to it

---

## Frontend Layout

### Overall Layout — 3-panel dark IDE theme

```
┌─────────────────────────────────────────────────────────────────────┐
│  🔧 SIMPLEX Assembler IDE                          [Run]  [Clear] │
├──────────────────────┬──────────────────────┬───────────────────────┤
│                      │                      │                       │
│   ASM CODE EDITOR    │   LISTING VIEW       │   EMULATOR OUTPUT     │
│                      │                      │                       │
│  (textarea with      │  (parsed table       │  ┌─ Registers ──────┐ │
│   line numbers,      │   from .lst file)    │  │ A:  0x00000000   │ │
│   monospace font,    │                      │  │ B:  0x00000000   │ │
│   dark bg)           │  PC | Machine Code   │  │ PC: 0x00000032   │ │
│                      │  Mnemonic | Operand  │  │ SP: 0x00000FFA   │ │
│                      │                      │  └──────────────────┘ │
│                      │  (each row           │                       │
│                      │   highlighted on     │  ┌─ Memory Dump ────┐ │
│                      │   hover, current PC  │  │ Addr  │  Value   │ │
│                      │   row highlighted    │  │ 0x00  │ 00100000 │ │
│                      │   in yellow)         │  │ 0x01  │ 0000000b │ │
│                      │                      │  │ ...              │ │
│                      │                      │  └──────────────────┘ │
│                      │                      │                       │
│                      │                      │  ┌─ Console ────────┐ │
│                      │                      │  │ raw stdout from  │ │
│                      │                      │  │ assembler + emu  │ │
│                      │                      │  └──────────────────┘ │
└──────────────────────┴──────────────────────┴───────────────────────┘
```

---

## Component Specifications

### `Editor.jsx`
- A `<textarea>` with line numbers rendered alongside it (like VS Code's gutter)
- Monospace font (`font-mono`), dark background (`bg-gray-900`), light text
- Placeholder text: a short sample SIMPLEX program
- Line numbers are computed from the textarea value and rendered in a separate `<div>` to the left, perfectly aligned
- Below the editor: a `[Run]` button (green) and a `[Clear]` button (gray)
- While running, show a loading spinner on the Run button and disable it

### `ListingTable.jsx`
- Parse the `.lst` file text (each line is: `PPPPPPPP MMMMMMMM mnemonic operand`)
- Render as a styled HTML table with 4 columns:
  - **PC** (hex, monospace, blue)
  - **Machine Code** (hex, monospace, green)
  - **Mnemonic** (uppercase, white)
  - **Operand** (gray)
- Highlight the row matching the final `PC` register value in yellow
- Rows are hoverable with a subtle highlight
- If listing is empty, show "Run your code to see the listing"

### `RegisterPanel.jsx`
- Parse the emulator output string for the line: `A: <val> B: <val> PC: <val> SP: <val>`
- Display each register as a styled card: register name + hex value + decimal value
- Color coding:
  - **A** → blue
  - **B** → purple
  - **PC** → yellow
  - **SP** → green
- If no output yet, show placeholder dashes

### `MemoryDump.jsx`
- Parse the memory dump section from emulator output (lines like `00000000 00100000`)
- Render as a 2-column table: **Address** | **Value** (both hex, monospace)
- Show the first 20 entries by default
- Add a toggle: `[Show sorted array]` which highlights the 5 entries after the `count` data label (hardcoded offset: addresses 51–55 for the bubble sort program — but make this configurable via an input field labeled "Array start address (hex)")

### `App.jsx` (root)
- Manages global state: `code`, `listing`, `emulatorOutput`, `loading`, `error`
- On Run:
  1. POST to `http://localhost:3001/api/run` with `{ code }`
  2. On success: update listing + emulatorOutput state
  3. On error: show red error banner with assembler stderr message
- Layout: full-height dark page, 3-column grid as described above

---

## Styling Rules (Tailwind)

- Background: `bg-gray-950` for page, `bg-gray-900` for panels
- Borders: `border border-gray-700`
- Accent colors: blue for PC, green for machine code, yellow for active row
- Font: `font-mono` everywhere in code/data panels
- Panel headers: small uppercase gray labels (`text-xs text-gray-400 uppercase tracking-wider`)
- All panels should be scrollable independently (`overflow-auto`) with a fixed total page height of `100vh`
- No external UI libraries — pure Tailwind only

---

## Error Handling

- If the assembler emits any `cerr` output, capture it and display it in a red banner above the editor:  
  `⚠ Assembly Error: Invalid Mnemonic/Instruction found: 'halt'`
- If the emulator hits an unknown opcode, show it in the console panel in red
- If the backend is unreachable, show: `⚠ Could not connect to backend. Is the server running on port 3001?`

---

## Sample SIMPLEX Program (default in the editor)

```asm
; Simple test: load two values and add them
        ldc 10      ; A = 10
        stl 0       ; local[0] = 10
        ldc 20      ; A = 20
        ldl 0       ; B = 20, A = 10
        add         ; A = 30
        halt
```

---

## Setup Instructions to Include in README

```bash
# Backend
cd backend
g++ asm.cpp -o asm
g++ emu.cpp -o emu
npm install express cors
node server.js

# Frontend
cd frontend
npm install
npm run dev
```

---

## Key Constraints

- The backend runs on **port 3001**
- The frontend runs on **port 5173** (Vite default)
- The assembler and emulator binaries must be pre-compiled and present in the `backend/` folder as `./asm` and `./emu`
- On Windows, the binary names will be `asm.exe` and `emu.exe` — detect platform in `server.js` using `process.platform === 'win32'` and adjust the command accordingly
- Temp files go in `backend/temp/` — create this directory on server start if it doesn't exist
