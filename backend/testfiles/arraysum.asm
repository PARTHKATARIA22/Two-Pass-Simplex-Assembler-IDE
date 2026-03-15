; Array Sum: computes sum of N elements
; local[0] = index (i)
; local[1] = running sum

        ldc 0x1000
        a2sp
        adj -2

        ldc 0
        stl 0           ; index = 0
        ldc 0
        stl 1           ; sum = 0

loop:
        ldc count
        ldnl 0          ; A = count
        ldl 0           ; B = count, A = index
        sub             ; A = count - index
        brz done        ; if index == count, done

        ldc array
        ldl 0           ; B = base addr, A = index
        add             ; A = &array[index]
        ldnl 0          ; A = array[index]
        ldl 1           ; B = array[index], A = sum
        add             ; A = sum + array[index]
        stl 1           ; sum = updated sum

        ldl 0
        adc 1
        stl 0           ; index++
        br loop

done:
        ldl 1           ; A = final sum
        ldc result
        stnl 0          ; result = sum
        halt

; --- Data ---
count:  data 5
array:  data 10
        data 20
        data 30
        data 40
        data 50
result: data 0          ; expected: 150