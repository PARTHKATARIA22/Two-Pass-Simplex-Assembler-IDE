# ─────────────────────────────────────────────────────────────────────────────
# SIMPLEX Assembler IDE — Makefile
# Repository: https://github.com/PARTHKATARIA22/Two-Pass-Simplex-Assembler-IDE
# ─────────────────────────────────────────────────────────────────────────────

# Step 1: Clone the repo
# git clone https://github.com/PARTHKATARIA22/Two-Pass-Simplex-Assembler-IDE.git
# cd Two-Pass-Simplex-Assembler-IDE

# Step 2: Install & start the backend (runs on http://localhost:3001)
backend:
	cd backend && npm install && npm run dev

# Step 3: Install & start the frontend (runs on http://localhost:5173)
# Open http://localhost:5173 in your browser, write code in the editor and hit Run.
frontend:
	cd frontend && npm install && npm run dev

# ─────────────────────────────────────────────────────────────────────────────
# Test files are located in: backend/testfiles/
# Assembler + emulator output is written to: backend/testfiles/outputfiles/
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: backend frontend
