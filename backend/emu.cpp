#include <bits/stdc++.h>
using namespace std;

// SIMPLEX Registers: All 32-bit size 
int A = 0;   // Accumulator (Internal stack top)
int B = 0;   // Register B (Internal stack bottom)
int PC = 0;  // Program Counter 
int SP = 0;  // Stack Pointer 

vector<int> memory(1<<24,0);

// loading the binary file produced by the assembler
void loadBinary(string filename){
    ifstream file(filename,ios::binary);
    if(!file){
        cerr<<"Unable to open Binary file: '"<<filename<<"'"<<endl;
        return;
    }
    file.read(reinterpret_cast<char*>(memory.data()),memory.size()*sizeof(int));
    file.close();
}

// performing the memory dump for the final state
// void dumpmemory(){
//     cout<<"Memory dump"<<endl;
//     for(int i=0;i<20;i++){
//         // for demo purpose print only the first 20 memory idx and mem values int hex
//         // in last used dec to cancel the affect of hex (as it might affect all the upcoming nos as well)
//         //    mem idx       ---       mem value
//         cout<<hex<<setfill('0')<<setw(8)<<i<<" "<<setw(8)<<memory[i]<<dec<<endl;
//     }
// }
void dumpmemory(int programEnd) {
    cout << "\nData Section (non-zero values):" << endl;
    cout << left << setw(14) << "Address"
         << setw(14) << "Hex"
         << "Decimal" << endl;
    cout << string(40, '-') << endl;

    bool found = false;
    for(int i = programEnd; i < 200; i++) {
        if(memory[i] != 0) {
            unsigned int uval = (unsigned int)memory[i];
            cout << "mem[" << dec << setfill(' ') << setw(6) << i << "] = "
                 << "0x" << hex << setfill('0') << setw(8) << uval
                 << "  (" << dec << setfill(' ') << memory[i] << ")"
                 << endl;
            found = true;
        }
    }
    if(!found) cout << "  (no non-zero values found)" << endl;
}
int main(int argc,char* argv[]){
    if(argc<2){
        cout<<"Usage: ./emu <filename.bin>"<<endl;
        return 1;
    }
    loadBinary(argv[1]);

    bool running=true;
    while(running){
        // fetching the instruction from the memory
        int instr=memory[PC];

        // decode => bottom 8 bits = opcode , upper 24 bits = operand
        int opcode = instr & (0xFF);
        int operand = (instr>>8); // signed 2's complement shift to handle negative operands

        PC++;

        switch(opcode) {
            case 0:  // ldc: B:=A; A:=value
                B = A; A = operand; 
                break;
            case 1:  // adc: A:=A+value
                A = A + operand; 
                break;
            case 2:  // ldl: B:=A; A:=memory[SP+offset]
                B = A; A = memory[SP + operand]; 
                break;
            case 3:  // stl: memory[SP+offset]:=A; A:=B
                memory[SP + operand] = A; A = B; 
                break;
            case 4:  // ldnl: A:=memory[A+offset]
                A = memory[A + operand]; 
                break;
            case 5:  // stnl: memory[A+offset]:=B
                memory[A + operand] = B; 
                break;
            case 6:  // add: A:=B+A
                A = B + A; 
                break;
            case 7:  // sub: A:=B-A
                A = B - A; 
                break;
            case 8:  // shl: A:=B<<A
                A = B << A; 
                break;
            case 9:  // shr: A:=B>>A
                A = B >> A; 
                break;
            case 10: // adj: SP:=SP+value
                SP = SP + operand; 
                break;
            case 11: // a2sp: SP:=A; A:=B
                SP = A; A = B; 
                break;
            case 12: // sp2a: B:=A; A:=SP
                B = A; A = SP; 
                break;
            case 13: // call: B:=A; A:=PC; PC:=PC+offset
                B = A; A = PC; PC = PC + operand; 
                break;
            case 14: // return: PC:=A; A:=B
                PC = A; A = B; 
                break;
            case 15: // brz: if A==0 then PC:=PC+offset
                if (A == 0) {
                    PC = PC + operand;
                }
                break;
            case 16: // brlz: if A<0 then PC:=PC+offset
                if (A < 0) {
                    PC = PC + operand;
                }
                break;
            case 17: // br: PC:=PC+offset
                PC = PC + operand; 
                break;
            case 18: // HALT: Stop emulator 
                running = false; 
                break;
            default:
                cerr << "Error: Unknown opcode " << opcode << " at address " << (PC - 1) << endl;
                running = false;
        }
    }
    dumpmemory(PC);
    cout << "HALT encountered. Final Register Status:" << endl;
    cout << "A: " << A << " B: " << B << " PC: " << PC << " SP: " << SP << endl;
    return 0;
}