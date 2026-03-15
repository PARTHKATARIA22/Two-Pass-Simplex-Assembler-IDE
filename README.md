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
- **Test File Manager**: Easily load pre-written `.asm` test files from the backend directly into the editor for quick testing and demonstration.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, CORS
- **Core Engine**: C++ (`g++` compiled binaries for assembler and emulator)

## Architecture

```
TwoPassAssembler/
├── backend/
│   ├── server.js               # Express API server for orchestration
│   ├── asm.cpp                 # Two-pass assembler logic
│   ├── emu.cpp                 # Emulator execution logic
│   └── testfiles/              # Pre-written assembly test files
│       ├── (e.g., bubble.asm, pascaltriangle.asm)
│       └── outputfiles/        # Output directory for assembler and emulator
│           ├── input.asm       # Temporary assembly file
│           ├── input.bin       # Compiled binary machine code
│           └── input.lst       # Assembler listing file
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main application state and layout components
│   │   ├── components/         # Reusable UI components
│   │   ├── index.css           # Core Tailwind styling overrides
│   │   └── main.jsx            # React DOM entry point
│   ├── index.html              # Document root
│   ├── package.json            # Frontend dependencies and scripts
│   └── tailwind.config.js      # Custom configuration for IDE dark mode
└── README.md                   # Project documentation
```

## Setup and Installation

Be sure you have [Node.js](https://nodejs.org/) and [G++ (GCC)](https://gcc.gnu.org/) installed before running the steps below.

### 1. Starting the Backend Server

```bash
# Navigate to the backend directory
cd backend

# Compile the core Engine binaries (if not already compiled)
g++ asm.cpp -o asm.exe
g++ emu.cpp -o emu.exe

# Install dependencies
npm install

# Start the Node.js API server using nodemon for auto-reloading
npm run dev
```

### 2. Starting the Frontend UI

Open a new terminal session, then run the following:

```bash
# Navigate to the frontend directory
cd frontend

# Install UI dependencies
npm install

# Start the Vite development server
npm run dev
```

Visit the displayed local host link (e.g., `http://localhost:5173`) in your web browser to start using the IDE.

## Usage Guide

1. **Writing Code**: Type your SIMPLEX assembly code directly into the ASM Code Editor.
2. **Loading Test Files**: Click on any of the test files listed under the "TEST FILES" bar at the bottom of the editor. This will automatically load the file's contents from the `backend/testfiles/` directory into the editor. If you modify the loaded code, a Reset button will appear allowing you to revert to the original content.
3. **Execution**: Click the "Run" button to assemble and emulate the code. All generated outputs (source, binary, and listing) will be safely written to `backend/testfiles/outputfiles/`.
4. **Step Mode**: Use the "Step Mode" button to trace through the two-pass assembly process step-by-step.
5. **Viewing Results**:
   - The **Listing View** shows the generated machine code and memory addresses.
   - The **Registers & Memory** panel displays the final state of the CPU and a dump of all non-zero memory locations in the data section.
   - The **Console Log** shows any assembler errors, warnings, or standard output.

## Notes for Windows Users

If you are running the service on Windows, ensure the generated C++ binaries run successfully in `server.js` with `.exe` extensions handled (i.e. `./asm.exe` or `./emu.exe`). The API routes have been built to execute on multiple platforms efficiently.
