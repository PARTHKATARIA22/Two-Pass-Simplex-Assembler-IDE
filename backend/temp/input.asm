; Simple test: load two values and add them
        ldc 10      ; A = 10
        stl 0       ; local[0] = 10
        ldc 20      ; A = 20
        ldl 0       ; B = 20, A = 10
        add         ; A = 30
        halt
