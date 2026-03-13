# SIMPLEX Assembler IDE

A browser-based full-stack IDE that allows users to write, assemble, and emulate SIMPLEX assembly code. Built with a React + Tailwind frontend and a Node.js + Express backend powered by a C++ two-pass assembler and emulator.

## Features

- **ASM Code Editor**: Full-featured code editor with syntax support, active line highlighting, and line numbers.
- **Two-Pass Assembly**: Real-time pass 1 and pass 2 breakdown, providing deep insight into symbol table generation and instruction parsing.
- **Interactive Emulation**: Execute code with full visualization of:
  - Registers (A, B, PC, SP) mapped to hex and decimal values.
  - Interactive memory dumps supporting deep-dives into allocated spaces.
- **Step Mode**: Step-through debugging line by line (Pass 1 label discovery & Pass 2 machine code generation).
- **Listing View**: See the generated program counter (PC), associated machine code, mnemonic, and operator for each instruction.
- **Console Log**: Real-time terminal output tracking assembler messages and emulator halts or errors.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, CORS
- **Core Engine**: C++ (`g++` compiled binaries for assembler and emulator)

## Architecture

```
TwoPassAssembler/
├── backend/
│   ├── server.js          # Express API server for orchestration
│   ├── asm.cpp            # Two-pass assembler logic
│   ├── emu.cpp            # Emulator execution logic
│   └── temp/              # Temporary space for .asm, .bin, and .lst artifacts
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main application state and layout components
│   │   ├── components/    # Reusable UI components for Registers, Editor, Memory, etc.
│   │   ├── index.css      # Core Tailwind styling overrides
│   │   └── main.jsx       # React DOM entry point
│   ├── index.html         # Document root
│   ├── package.json       # Frontend dependencies and scripts
│   └── tailwind.config.js # Custom configuration for IDE dark mode
└── README.md              # Project documentation
```

## Setup and Installation

Be sure you have [Node.js](https://nodejs.org/) and [G++ (GCC)](https://gcc.gnu.org/) installed before running the steps below.

### 1. Starting the Backend Server

```bash
# Navigate to the backend directory
cd backend

# Compile the core Engine binaries (if not already compiled)
g++ asm.cpp -o asm
g++ emu.cpp -o emu

# Install dependencies
npm install

# Start the Node.js API server (runs on port 3001)
node server.js
```

### 2. Starting the Frontend UI

Open a new terminal session, then run the following:

```bash
# Navigate to the frontend directory
cd frontend

# Install UI dependencies
npm install

# Start the Vite development server (usually runs on port 5173)
npm run dev
```

Visit the displayed local host link (e.g., `http://localhost:5173`) in your web browser to start using the IDE!

## Sample Program to Try

Below is a simple SIMPLEX program to load two values into local memory and add them. Paste it into your editor to see the IDE in action!

```asm
; Simple test: load two values and add them
        ldc 10      ; A = 10
        stl 0       ; local[0] = 10
        ldc 20      ; A = 20
        ldl 0       ; B = 20, A = 10
        add         ; A = 30
        halt
```

## Notes for Windows Users

If you are running the service on Windows, ensure the generated C++ binaries run successfully in `server.js` with `.exe` extensions handled (i.e. `./asm.exe` or `./emu.exe`). The API routes have been built to execute on multiple platforms efficiently.
