; Linear Search: finds index of target in array
; stores index (0-based) in result, or -1 if not found
; local[0] = index
; local[1] = temp for comparison

        ldc 0x1000
        a2sp
        adj -2

        ldc 0
        stl 0           ; index = 0

loop:
        ldc count
        ldnl 0          ; A = count
        ldl 0           ; B = count, A = index
        sub             ; A = count - index
        brz notfound    ; index == count, exhausted array

        ; load array[index] into local[1]
        ldc array
        ldl 0
        add
        ldnl 0          ; A = array[index]
        stl 1           ; local[1] = array[index]

        ; compare array[index] with target
        ldc target
        ldnl 0          ; A = target
        ldl 1           ; B = target, A = array[index]
        sub             ; A = target - array[index]
        brz found       ; if zero, match found

        ldl 0
        adc 1
        stl 0           ; index++
        br loop

found:
        ldl 0           ; A = index
        ldc result
        stnl 0          ; result = index
        halt

notfound:
        ldc -1          ; A = -1
        ldc result
        stnl 0          ; result = -1
        halt

; --- Data ---
count:  data 6
target: data 30
array:  data 10
        data 20
        data 30
        data 40
        data 50
        data 60
result: data 0          ; expected: 2