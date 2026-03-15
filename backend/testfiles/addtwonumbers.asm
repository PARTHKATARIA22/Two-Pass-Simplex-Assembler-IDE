; Adds two numbers and stores result

        ldc 0x1000
        a2sp

        ldc numa
        ldnl 0          ; A = first number
        ldc numb
        ldnl 0          ; B = A, A = second number  
        add             ; A = numa + numb
        ldc result
        stnl 0          ; result = sum
        halt

numa:   data 25
numb:   data 17
result: data 0          ; expected: 42