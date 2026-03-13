#include <bits/stdc++.h>
using namespace std;


//  All the Structures in One Place
struct Instruction{
    int opcode;
    bool hasOperand;
};

// Tables
map<string,Instruction> mnemonicTable{
    {"ldc",    {0,  true}},  // B := A; A := value; 
    {"adc",    {1,  true}},  // A := A + value; 
    {"ldl",    {2,  true}},  // Load local 
    {"stl",    {3,  true}},  // Store local 
    {"ldnl",   {4,  true}},  // Load non-local 
    {"stnl",   {5,  true}},  // Store non-local 
    {"add",    {6,  false}}, // A := B + A; 
    {"sub",    {7,  false}}, // A := B - A; 
    {"shl",    {8,  false}}, // Shift left 
    {"shr",    {9,  false}}, // Shift right 
    {"adj",    {10, true}},  // Adjust SP 
    {"a2sp",   {11, false}}, // Transfer A to SP 
    {"sp2a",   {12, false}}, // Transfer SP to A 
    {"call",   {13, true}},  // Call procedure 
    {"return", {14, false}}, // Return from procedure 
    {"brz",    {15, true}},  // Branch if A == 0 
    {"brlz",   {16, true}},  // Branch if A < 0 
    {"br",     {17, true}},  // Branch 
    {"halt",   {18, false}}, // Stop emulator 
    {"set",    {-2, true}},   // Special: Set label value 
    {"data",    {-1, true}}   // Special: Reserving memory location 
};

map<string,int> labelAddress;

// basic syntax
// fstream lib -> ifstream => read ; ofstream => write to file ; fstream => read+write
// size_t => unsigned integer used for sizes and indexes 

void generateListfile(ofstream &lstFile,int PC,int machineCode,string mnemonic,string operand){
    // basically 8 digit PC and Machine code and rest simple strings 
    lstFile << setfill('0') << setw(8) << hex << PC << " " << setw(8) << hex << machineCode << " " << mnemonic << " " << operand << endl;
}

void passOne(string filename){
    ifstream file(filename);
    string line;
    int PC=0;

    while(getline(file,line)){
        
        size_t commentPos=line.find(';');
        if(commentPos != string::npos){
            // basically we have a comment in the line
            line=line.substr(0,commentPos);
        }

        line.erase(0,line.find_first_not_of(" \t\r\n"));
        line.erase(line.find_last_not_of(" \t\r\n")+1);
        if(line.empty())continue;

        string label="",mnemonic="",operand="";
        
        size_t colonpos=line.find(":");
        if(colonpos!=string::npos){
            label=line.substr(0,colonpos);
            if(!isalpha(label[0])){
                cerr<<"Label must start with a Letter, Invalid Label: '"<<label<<"'"<<endl;
            }
            line.erase(0,colonpos+1);

            line.erase(0,line.find_first_not_of(" \t\r\n"));

            if(labelAddress.count(label)){
                cerr<<"Error:Duplicate Label found: '"<< label << "'"<<endl;
            }else{
                labelAddress[label]=PC;
            }

        }

        stringstream ss(line);
        ss>>mnemonic>>operand;
        for(auto &c : mnemonic) c = tolower(c);
        if(!mnemonic.empty()){
            if(mnemonic=="SET"){
                if(!label.empty()){
                    
                    try{
                        size_t processedCharCnt=0;
                        labelAddress[label]=stoi(operand,&processedCharCnt,0);// 0 for auto detection of the type out of hexm,octal etc

                        if(processedCharCnt<operand.size()){
                            cerr<<"Invalid Number format: '"<<operand<<"'"<<endl;
                        }
                    }catch(...){
                        // catch any exception
                        cerr<< " Not a valid number '"<<operand<<"'"<<endl;
                    }

                }
            }else{
                // now increment the 
                PC++;
                // only incrementing the pointer when a mnemonic is present 
                // unlike mnemonic labels don't on their own get stored into the memory 
                // also we are handling the unique case of "SET"
            }
        }
    }
}

void passTwo(string filename,string outputBin,string listingFile){
    ifstream file(filename);
    // to prevent opening file in default text mode use ios::binary it will make sure that only binary input is written
    ofstream binFile(outputBin,ios::binary);
    ofstream lstFile(listingFile);
    string line;
    int PC=0;

    while(getline(file,line)){

        // cleaning out comment
        size_t commentPos=line.find(";");
        if(commentPos!=string::npos){
            line=line.substr(0,commentPos);
        }

        line.erase(0,line.find_first_not_of(" \t\r\n"));
        line.erase(line.find_last_not_of(" \t\r\n")+1);
        if(line.empty())continue;

        string label="",mnemonic="",operand="";

        size_t colonPos=line.find(":");
        if(colonPos!=string::npos){
            // we have a label
            label=line.substr(0,colonPos);
            if(!isalpha(label[0])){
                cerr<<"Label must start with a Letter, Invalid Label: '"<<label<<"'"<<endl;
            }
            if(labelAddress.count(label)==0){
                cerr<<"No such label found: '"<<label<<"'"<<endl;
            }
            line=line.substr(colonPos+1);
            line.erase(0,line.find_first_not_of(" \t\r\n"));

        }

        stringstream ss(line);
        ss>>mnemonic>>operand;
        for(auto &c : mnemonic) c = tolower(c);
        if(mnemonic.empty() || mnemonic=="SET")continue;// nothing op to perform
        if(mnemonicTable.find(mnemonic)== mnemonicTable.end()){
            cerr<<"Invalid Mnemonic/Instruction found: '"<<mnemonic<<"'"<<endl;
            return;
        }

        // mnemonic is valid
        int opcode=mnemonicTable[mnemonic].opcode;
        int machinecode=(opcode & 0XFF);
        int operandval=0;

        // Handling the case for "DATA"
        if(mnemonic=="data"){

            try{
                size_t processedCharCnt=0;
                operandval=stoi(operand,&processedCharCnt,0);

                if(processedCharCnt<operand.size()){
                    cerr<<"Invalid Number format: '"<<operand<<"'"<<endl;
                }
            }catch(...){
                // catch any exception
                cerr<< " Not a valid number '"<<operand<<"'"<<endl;
            }
            machinecode=operandval;

        }else if(mnemonicTable[mnemonic].hasOperand){
            if(operand.empty()){
                cerr<<"Operand required/Invalid Operand for mnemonic: '"<<mnemonic<<"'"<<endl;
                return;
            }

            // has a operand 
            // check if the operand is a label 
            if(labelAddress.count(operand)){
                int targetAdd=labelAddress[operand];
                // branch logic
                if(mnemonic=="br" || mnemonic=="brz" || mnemonic=="brlz" || mnemonic=="call"){
                    operandval=targetAdd-(PC+1);
                }else{
                    operandval=targetAdd;
                }
                
            }else{
                //not a label => a raw number like hex or dec or oct
                // try catch for handling exceptions
                try{
                    size_t processedCharCnt=0;
                    operandval=stoi(operand,&processedCharCnt,0);

                    if(processedCharCnt<operand.size()){
                        cerr<<"Invalid Number format: '"<<operand<<"'"<<endl;
                    }

                }catch(...){
                    // catch any exception
                    cerr<< " Not a valid number '"<<operand<<"'"<<endl;
                }
            }
            // creating a 32 bit machinecode
            machinecode |=((operandval & 0xFFFFFF)<<8);
        }else{
            // mnemonic doesn't have a operand
            if(!operand.empty()){
                cerr<<"Unexpected operand for mnemonic: '"<<mnemonic<<"'"<<endl;
                return;
            }
        }

        // write() requires char* but machine code req int * => covert pointer type
        binFile.write(reinterpret_cast<const char*>(&machinecode),sizeof(machinecode));
        generateListfile(lstFile,PC,machinecode,mnemonic,operand);
        
        PC++;
    }
    binFile.close();
}

int main(int argc, char* argv[]) {
    // Check for filename 
    if (argc < 2) {
        cout << "Usage: " << argv[0] << " <filename.asm>" << endl;
        return 1;
    }

    string inputFileName = argv[1];
    string baseName = inputFileName.substr(0, inputFileName.find_last_of("."));
    
    // Define output filenames based on input
    string binFileName = baseName + ".bin";
    string lstFileName = baseName + ".lst";

    cout << "Starting Pass 1..." << endl;
    passOne(inputFileName);

    cout << "Starting Pass 2..." << endl;
    passTwo(inputFileName, binFileName, lstFileName);

    cout << "Assembly complete." << endl;
    cout << "Binary: " << binFileName << endl;
    cout << "Listing: " << lstFileName << endl;

    return 0;
}