: ,, , , ; 

// take the next token, look up its word address and insert it into the dictionary as a (value)
: postpone <word wa `value , , ; immediate

: `c <word ca postpone (value) ,, ; immediate

// push " 
: quote 34 chr ;

// push the buffer up to "
: " quote token <token ;

// store the buffer up to "
: ." " postpone (value) ,, ; immediate

// store the jmp, push the address of the jmp target, move the dp past it
: if postpone (if!jmp) , here dp++ ; immediate

// ( whereToStoreTarget -- )  this is the ultimate jump target, store it
: then here ! ; immediate

// ( whereToStoreTarget -- newWhereToStoreTarget)
: else postpone (jmp) , here tuck +1 ! dp++  ; immediate

: begin here ; immediate
: until postpone (if!jmp) ,, ; immediate

: while postpone (if!jmp) , here dp++ ; immediate
: repeat swap postpone (jmp) ,, here !  ; immediate

: do  postpone (do) , here 0 >J ; immediate
: loop  postpone (loop) ,, <J dup 0 > if begin <J here ! -1 dup 0 = until then drop ; immediate
: +loop postpone (+loop) ,, ; immediate

: (leave) <J drop <J drop ;
: leave postpone (leave)  , postpone (jmp) , <J +1 here  >J >J dp++ ; immediate

: sentry @entry here 2 + swap ! ;

// needs does> @ ;
: constant create , ;
: variable create 0 ,  ;

: ;code  ." $$" token <token (js) drop postpone (;code) ,, ; immediate

: ;js ." $$" token <token  ." ; return cpu.next;" + (js) if here swap , dup -1 swap ! f >mode then ; immediate

: . ;js  var k = cpu.d.pop(); cpu.d.push(cpu.d.pop()[k]) $$
: last ;js var k = cpu.d.pop(); cpu.d.push(cpu.d.pop().lastIndexOf(k)) $$
: slice ;js var t = cpu.d.pop(); var e = cpu.d.pop(); var s = cpu.d.pop(); cpu.d.push(t.slice(s, e)); $$
: {} ;js cpu.d.push({}) $$
: [] ;js cpu.d.push([]) $$
: <= ;js cpu.d.pop()[cpu.d.pop()] = cpu.d.pop(); $$
//  ( value key object -- )
: << ;js var v = cpu.d.pop(); cpu.d.pop().push(v); $$
: >> ;js cpu.d.push(cpu.d.pop().pop());  $$
: length ;js cpu.d.push(cpu.d.pop().length); $$
: >0 ;js cpu.d.push(cpu.d.pop() > 0) $$

: last @ dup length -1 . ;

: :: context >vocabulary create t >mode ;
