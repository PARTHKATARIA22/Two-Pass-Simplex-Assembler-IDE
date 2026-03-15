# ─────────────────────────────────────────────────────────────────────────────
# SIMPLEX Assembler IDE — Makefile
# Repository: https://github.com/PARTHKATARIA22/Two-Pass-Simplex-Assembler-IDE
# ─────────────────────────────────────────────────────────────────────────────
#
# PREREQUISITES
#   • Node.js  — https://nodejs.org
#   • G++ (GCC) — https://gcc.gnu.org  (MinGW on Windows)
#
# ─────────────────────────────────────────────────────────────────────────────
# QUICK START
#   make compile   — compile the core C++ engine binaries
#   make backend   — install deps & start the Node.js API server (port 3001)
#   make frontend  — install deps & start the Vite dev server  (port 5173)
#   make all       — compile → backend (then open a second terminal: make frontend)
# ─────────────────────────────────────────────────────────────────────────────

# Step 1: Clone the repo
# git clone https://github.com/PARTHKATARIA22/Two-Pass-Simplex-Assembler-IDE.git
# cd Two-Pass-Simplex-Assembler-IDE

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Compile the core C++ engine binaries
#
# Produces:
#   backend/asm.exe  — two-pass assembler
#   backend/emu.exe  — instruction-set emulator
#
# NOTE FOR WINDOWS USERS:
#   The API server (server.js) is built to invoke the binaries with their
#   .exe extension on Windows (i.e. ./asm.exe and ./emu.exe) and handles
#   cross-platform execution paths automatically.
# ─────────────────────────────────────────────────────────────────────────────
compile:
	g++ backend/asm.cpp -o backend/asm.exe
	g++ backend/emu.cpp -o backend/emu.exe

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Install dependencies & start the backend API server
#         Runs on http://localhost:3001
#         Uses nodemon for auto-reloading on source changes.
# ─────────────────────────────────────────────────────────────────────────────
backend:
	cd backend && npm install && npm run dev

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Install dependencies & start the frontend Vite dev server
#         Runs on http://localhost:5173
#         Open that URL in your browser to start using the IDE.
# ─────────────────────────────────────────────────────────────────────────────
frontend:
	cd frontend && npm install && npm run dev

# ─────────────────────────────────────────────────────────────────────────────
# Convenience target: compile binaries then launch the backend.
# Run `make frontend` in a separate terminal afterwards.
# ─────────────────────────────────────────────────────────────────────────────
all: compile backend

# ─────────────────────────────────────────────────────────────────────────────
# USAGE GUIDE
#
#   Writing Code      : Type your SIMPLEX assembly code in the ASM Code Editor.
#
#   Loading Test Files: Click any file listed under the "TEST FILES" bar at the
#                       bottom of the editor. Its contents are loaded from
#                       backend/testfiles/ into the editor automatically.
#                       If you modify a loaded file, a Reset button appears so
#                       you can revert to the original content.
#
#   Execution         : Click "Run" to assemble and emulate the code.
#                       All generated outputs (source, binary, listing) are
#                       written to backend/testfiles/outputfiles/.
#
#   Step Mode         : Click "Step Mode" to trace through the two-pass assembly
#                       process step-by-step.
#
#   Viewing Results:
#     • Listing View          — generated machine code and memory addresses
#     • Registers & Memory    — final CPU state + non-zero data-section dump
#     • Console Log           — assembler errors, warnings, and stdout
#
# ─────────────────────────────────────────────────────────────────────────────
# FILE LAYOUT
#   backend/testfiles/             — sample .asm source files
#   backend/testfiles/outputfiles/ — assembler / emulator output (auto-created)
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: compile backend frontend all
