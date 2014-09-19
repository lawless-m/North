var cpu = new Cpu()

// PRIMARY

cpu.primary(
	'colon'
	, cpu.colon
)


cpu.primary(
	'forget'
	, function(c) { /* ( -- ) forget the last defined word */
		c.dict.forget();
		return c.next(c);
	}
)

cpu.primary(
	'bp' 
	, function(c) { /* breakpoint */
		return c.next(c) 
	}
)

cpu.primary(
	't'
	, function(c) { /* ( -- true ) */
		c.push(true);
		return c.next(c);
	}
)

cpu.primary(
	'f'
	, function(c) { /* ( -- false ) */
		c.push(false);
		return c.next(c);
	}
)

cpu.primary(
	'allot'
	, function(c) { /* ( n -- ) reserve n cells in ram */
		var n = c.pop();
		c.push(c.allot(n));
		return c.next(c);
	}
)


cpu.primary(
	'reset'
	, function(c) { /* ( x y z -- ) reset the stacks and get ready for input */
		c.d = new Stack();
		c.j = new Stack();
		c.mode = false; /* execute mode */
		c.state = false; /* executing */
		c.vocabulary = "context"
		return c.next(c);
	}
)


cpu.primary(
	'-'
	, function(c) { /* ( b a -- (b - a) ) subtract */
		var a = c.pop();
		var b = c.pop();
		c.push(b - a);
		return c.next(c);
	}
)

cpu.primary(
	'+'
	, function(c) { /* ( b a -- (b + a) ) add */
		var a = c.pop();
		var b = c.pop();
		c.push(b + a);
		return c.next(c);
	}
)

cpu.primary(
	'/'
	, function(c) { /* ( b a -- (b / a) ) divide */
		var a = c.pop();
		var b = c.pop();
		c.push(b / a);
		return c.next(c);
	}
)

cpu.primary(
	'*'
	, function(c) { /* ( b a -- (b * a) ) multiply */
		var a = c.pop();
		var b = c.pop();
		c.push(b * a);
		return c.next(c);
	}
)

cpu.primary(
	'&'
	, function(c) { /* ( b a -- (b & a) ) bit wise AND */
		var a = c.pop();
		var b = c.pop();
		c.push(b & a);
		return c.next(c);
	}
)

cpu.primary(
	'|'
	, function(c) { /* ( b a -- (b | a) ) bitwise or */
		var a = c.pop();
		var b = c.pop();
		c.push(b | a);
		return c.next(c);
	}
)

cpu.primary(
	'^'
	, function(c) { /* ( b a -- (b ^ a) ) bitwise xor */
		var a = c.pop();
		var b = c.pop();
		c.push(b ^ a);
		return c.next(c);
	}
)

cpu.primary(
	'~'
	, function(c) { /* ( a -- ~a ) bitwise not */
		var a = c.pop();
		c.push(~a);
		return c.next(c);
	}
)

cpu.primary(
	'<<'
	, function(c) { /* ( b a -- (b << a) ) bitwise shift */
		var a = c.pop();
		var b = c.pop();
		c.push(b << a);
		return c.next(c);
	}
)

cpu.primary(
	'>>'
	, function(c) { /* ( b a - (b >> a) ) bitwise shift */
		var a = c.pop();
		var b = c.pop();
		c.push(b >> a);
		return c.next(c);
	}
)

cpu.primary(
	'>>>'
	, function(c) { /* ( b a - (b >>> a) ) bitwise shift */
		var a = c.pop();
		var b = c.pop();
		c.push(b >>> a);
		return c.next(c);
	}
)

cpu.primary(
	'='
	, function(c) { /* ( b a - (b == a) ) equality */
		var a = c.pop();
		var b = c.pop();
		c.push(b == a);
		return c.next(c);
	}
)

cpu.primary(
	'>'
	, function(c) { /* ( b a - (b > a) ) gt */
		var a = c.pop();
		var b = c.pop();
		c.push(b > a);
		return c.next(c);
	}
)

cpu.primary(
	'>='
	, function(c) { /* ( b a - (b >= a) ) gte */
		var a = c.pop();
		var b = c.pop();
		c.push(b >= a);
		return c.next(c);
	}
)

cpu.primary(
	'<'
	, function(c) { /* ( b a - (b < a) ) lt */
		var a = c.pop();
		var b = c.pop();
		c.push(b < a);
		return c.next(c);
	}
)

cpu.primary(
	'<='
	, function(c) { /* ( b a - (b <= a) ) lte */
		var a = c.pop();
		var b = c.pop();
		c.push(b <= a);
		return c.next(c);
	}
)

cpu.primary(
	'**'
	, function(c) {  /* ( b a - (b ^ a) ) raise to the power */
		var a = c.pop();
		var b = c.pop();
		c.push(Math.pow(b, a));
		return c.next(c);
	}
)

cpu.primary(
	'abs'
	, function(c) {  /* ( a - abs(a) )  abs */
		var v = c.pop();
		v = Math.abs(v);
		c.push(v);
		return c.next(c);
	}
)

cpu.primary(
	'+1'
	, function(c) { /* ( a - (a+1) ) inc */
		var v = c.pop();
		c.push(v + 1);
		return c.next(c);
	}
)

cpu.primary(
	'-1'
	, function(c) { /* ( a - (a-1) ) dec */
		var v = c.pop();
		c.push(v - 1);
		return c.next(c);
	}
)


cpu.primary(
	'here'
	, function(c) { /* ( - DP )  push dictionary pointer */
		c.push(c.dict.pointer);
		return c.next(c);
	}
)

cpu.primary(
	'<R'
	, function(c) { /* ( - (top of R) ) // pop from R stack to data stack */
		var a = c.r.pop();
		c.push(a);
		return c.next(c);
	}
)

cpu.primary(
	'>R'
	, function(c) { /* ( a - )  push to R stack */
		c.r.push(c.pop());
		return c.next(c);
	}
)

cpu.primary(
	'<J'
	, function(c) { /* ( - (top of J) ) pop from J stack and push to data stack */
		c.push(c.j.pop());
		return c.next(c);
	}
)

cpu.primary(
	'>J'
	, function(c) { /* ( a -- ) push top of data stack to J stack */
		c.j.push(c.pop());
		return c.next(c);
	}
)

// cpu.parse(': J++ <J ++ >J ;')

cpu.primary(
	'J++'
	, function(c) { /* ( -- ) increment J tos */
		var j = c.j.pop();
		c.j.push(j+1);
		return c.next(c);
	}
)

cpu.primary(
	'i'
	, function(c) { /* ( -- jtos ) push top of j stack without popping it */
		if(c.j.cells.length > 0) {
			c.push(c.j.top());
		} else {
			c.push(undefined);
		}
		return c.next(c);
	}
)

cpu.primary(
	'j'
	, function(c) { /* ( -- jtos ) push top of j stack without popping it */
		if(c.j.cells.length > 2) {
			c.push(c.j.cells[c.j.cells.length - 3]);
		} else {
			c.push(undefined);
		}
		return c.next(c);
	}
)

cpu.primary(
	'!CA'
	, function(c) { /* ( a -- ) store tos at the code address cell of the word */
		c.cells[c.dict.entry + c.dict.previous_entry_offset + 1 ] = c.pop();
		return c.next(c);
	}
)

cpu.primary(
	'swap'
	, function(c) { /* ( b a -- a b ) swap the two top stack entries  */
		var a = c.pop();
		var b = c.pop();
		c.push(a);
		c.push(b);
		return c.next(c);
	}
)

cpu.primary(
	'dup'
	, function(c) { /* ( a -- a a ) duplicate the tos */
		c.push(c.top());
		return c.next(c);
	}
)

cpu.primary(
	'tuck'
	, function(c) { /* ( b a -- a b a ) copy tos to 3rd place, could just be : tuck swap over ; */
		var a = c.pop();
		var b = c.pop();
		c.push(a);
		c.push(b);
		c.push(a);
		return c.next(c);
	}
)

cpu.primary(
	'over'
	, function(c) { /* ( b a -- b a b ) copy the second entry to tos */
		var a = c.pop();
		var b = c.pop();
		c.push(b);
		c.push(a);
		c.push(b);
		return c.next(c);
	}
)

cpu.primary(
	'rswap'
	, function(c) { /* ( -- ) swap the top elements of the R stack */
		var a = c.r.pop();
		var b = c.r.pop();
		c.r.push(a);
		c.r.push(b);
		return c.next(c);
	}
)

cpu.primary(
	'context'
	, function(c) { /* ( -- "context" ) push "context" */
		c.push('context');
		return c.next(c);
	}
)

cpu.primary(
	'compile'
	, function(c) { /* ( -- "compile" ) push "compile" */
		c.push('compile');
		return c.next(c);
	}
)

cpu.primary(
	'immediate'
	, function(c) { /* ( -- ) set the vocabulary of the last defined word to "compile" */
		c.cells[c.dict.entry + 1] = "compile";
		return c.next(c);
	}
)

cpu.primary(
	  ';'
	, function(c) {  /* ( -- ) finish the definition of a word */
		c.cells[c.dict.pointer++] = c.wa('(semi)');
		c.mode = false; // execute;
		c.cells[c.dict.pointer] = ";undefined";
		c.cells[c.dict.pointer + c.dict.previous_entry_offset] = c.dict.entry;
		return c.next(c);
	}
	, 'compile'
)


cpu.primary(
	'execute'
	, function(c) { /* ( -- wa ) run the word with its address on the tos */
		c.cfa = c.pop(); // cfa 
		return c.run(c);
	}
)


cpu.primary(
	'?sp'
	, function(c) { /* ( -- addr ) push the address of the data stack  */
		c.push(c.d.pointer);
		return c.next(c);
	}
)

cpu.primary(
	'?rs'
	, function(c) { /* ( -- addr ) push the address of the return stack  */
		c.push(c.r.pointer);
		return c.next(c);
	}
)


cpu.primary(
	'token'
	, function(c) { /* ( token -- ) extract everything in c.pad until the terminator, and put it in the dictionary */
		var tok_text = tokenize(c.pop(), c.pad);
		c.token = tok_text[0];
		c.pad = tok_text[1];
		return c.next(c);
	}
)

cpu.primary(
	'token?'
	, function(c) { /* ( token -- ( true | false ) ) extract everything in c.pad until the terminator, put it in the dictionary and report if you found anything */
		var terminator = c.pop();
		if(c.pad == "") {
			c.push(false);
			return c.next(c);
		}
		var tok_text = tokenize(terminator, c.pad);
		c.token = tok_text[0];
		c.pad = tok_text[1];
		c.push(true);
		return c.next(c);
	}
)

cpu.primary(
	'<token'
	, function(c) {
		c.push(c.token);
		return c.next(c);
	}
)

cpu.primary(
	'(value)'
	, function(c) { /* ( -- n ) push the contents of the next cell */
		c.push(c.cells[c.i]);
		c.i++;
		return c.next(c);
	}
)

cpu.primary(
	'chr'
	, function(c) { /* ( n -- chr(n) ) push the character from the code on the tos */
		var v = String.fromCharCode(c.pop());
		c.push(v);
		return c.next(c);
	}
)

cpu.primary(
	'!'
	, function(c) { /* ( adr val -- ) write val to cell at adr */
		var v = c.pop();
		var a = c.pop();
		c.cells[a] = v;
		return c.next(c);
	}
)

cpu.primary(
	'@'
	, function(c) { /* ( adr -- val ) push the contents of cell at adr */
		c.push(c.cells[c.pop()]);
		return c.next(c);
	}
)

cpu.primary(
	','
	, function(c) { /* ( val -- ) store tos in the next cell */
		c.cells[c.dict.pointer++] = c.pop();
		return c.next(c);
	}
)

cpu.primary(
	'@dp'
	, function(c) { /* ( -- val ) push the contents of the current dictionary cell */
		c.push(c.cells[c.dict.pointer]);
		return c.next(c);
	}
)


cpu.primary(
	'dp+='
	, function(c) { /* ( val -- ) add val to the dictionary pointer */
		c.dict.pointer += c.pop();
		return c.next(c);
	}
)

cpu.primary(
	'dp++'
	, function(c) { /* ( -- ) increment the dictionary pointer */
		c.dict.pointer++;
		return c.next(c);
	}
)

cpu.primary(
	'drop'
	, function(c) { /* ( a -- ) drop the tos */
		c.pop();
		return c.next(c);
	}
)

cpu.primary(
	'undefined'
	, function(c) {  /* ( -- undefined ) push undefined */
		c.push(undefined);
		return c.next(c);
	}
)

cpu.primary(
	  'wa'
	, function(c) { /* ( "word" -- wa|undefined ) push word address or undefined on tos */
		c.push(c.wa(c.pop()));
		return c.next(c);
	  }
)

cpu.primary(
	  'ca'
	, function(c) {/* ( "word" -- ca|undefined ) push code address or undefined on tos */
		c.push(c.ca(c.pop()));
		return c.next(c);
	  }
)

cpu.primary(
	  'pfa'
	, function(c) { /* ( NFA -- PFA) push Parameter Field Address for the given Name Field Address , just arithmetic */
		var nfa = c.pop();
		if(isAddress(nfa)){
			c.push(c.dict.nfa_to_pfa(nfa));
		} else {
			c.push(undefined);
		}
		return c.next(c);
	  }
)

cpu.primary(
	  'cfa'
	, function(c) { /* ( PFA -- CFA) push Code Field Address for the given parameter Field Address , just arithmetic */
		var pfa = c.pop();
		if(isAddress(pfa)){
			c.push(c.dict.pfa_to_cfa(pfa));
		} else {
			c.push(undefined);
		}
		return c.next(c);
	  }
)

cpu.primary(
	  'lfa'
	, function(c) { /* ( PFA -- LFA) push Link Field Address for the given parameter Field Address , just arithmetic */
		var pfa = c.pop();
		if(isAddress(pfa)){
			c.push(c.dict.pfa_to_cfa(pfa));
		} else {
			c.push(undefined);
		}
		return c.next(c);
	  }
)

cpu.primary(
	  'nfa'
	, function(c) { /* ( PFA -- NFA) push Name Field Address for the given PFA, just arithmetic */
		var pfa = c.pop();
		if(isAddress(pfa)){
			c.push(c.pfa_to_nfa(pfa));
		} else {
			c.push(undefined);
		}
		return c.next(c);
	  }
)	  
	  
cpu.primary(
	  'search'
	, function(c) { /* ( -- (false wa) | true ) search the dictionary for "word" push the wa and a flag for (not found) */
		var word_addr = c.wa(c.token);

		if(word_addr) {
			c.push(word_addr);
			c.push(false); 
		} else {
			c.push(true);
		}
		return c.next(c);
	  }
)

cpu.primary(
	'<mode'
	, function(c) { /* ( -- mode ) push the current mode */
		c.push(c.mode);
		return c.next(c);
	}
)

cpu.primary(
	'>mode'
	, function(c) {  /* ( mode -- ) set the current mode */
		c.mode = (c.pop() == true);
		return c.next(c);
	}
)

cpu.primary(
	'<state'
	, function(c) { /* ( -- state ) push the current state */
		c.push(c.state);
		return c.next(c);
	}
)

cpu.primary(
	'>state'
	, function(c) { /* ( state -- ) set the current state */
		var v = c.pop();
		c.state = (v == true);
		return c.next(c);
	}
)

cpu.primary(
	'<vocabulary'
	, function(c) { /* ( -- vocabulary ) push the current vocabulary */
		c.push(c.vocabulary);
		return c.next(c);
	}
)

cpu.primary(
	'>vocabulary'
	, function(c) { /* ( vocabulary -- ) set the current vocabulary */
		c.vocabulary = c.pop();
		return c.next(c);
	}
)

cpu.primary(
	'not'
	, function(c) { /* ( v -- !v ) boolean not */
		var v = c.pop();
		if(v == true) { /* might be excessive */
			c.push(false);
		} else {
			c.push(true);
		}		
		return c.next(c);
	}
)

cpu.primary(
	'*ca'
	, function(c) { /* ( -- ca ) push the code address address of the current entry */
		c.push(c.dict.entry + c.dict.header_size);
		return c.next(c);
	}
)

cpu.primary(
	'>entry'
	, function(c) { /* ( -- ) set the last entry to the current dictionary pointer */
		c.dict.entry = c.dict.pointer;
		return c.next(c);
	}
)

cpu.primary(
	'<entry'
	, function(c) { /* ( -- daddr ) push entry address */
		c.push(c.dict.entry);
		return c.next(c);
	}
)


cpu.primary(
	'<>entry'
	, function(c) { /* ( -- linkaddr ) push the current link-address and then set it to the current dictionary pointer */
		c.push(c.dict.entry);
		c.dict.entry = c.dict.pointer;
		return c.next(c);
	}
)
cpu.primary(
	'?number'
	, function(c) { /* ( -- flag (maybe value) ) depending on the mode, push a flag and the value or store it in the dictionary */

		if(!isNumber(c.token)) {
			c.push(true);
			return c.next(c);
		}

		v = eval(c.token);

		if(c.mode == true) {
			c.cells[c.dict.pointer++] = c.wa('(value)');
			c.cells[c.dict.pointer++] = v;
		} else {
			c.push(v);
		}

		c.push(false);
		return c.next(c);
	}
)

cpu.primary(
	'tokenerror'
	, function(c) { /* ( -- ) report an unrecohnised word error to the console */
		console.error(">>" + c.token + "<< error unrecognised word");
		return c.next(c);
	}
)

cpu.primary(
	'log'
	, function(c) { /* ( v -- ) concat the tos to the console */
		var v = c.pop();
		if(v != undefined)
			console.log(v);
		return c.next(c);
	}
)

cpu.primary(
	'cr'
	, function(c) { /* ( -- ) print t"\r" to the console */
		console.log("\n")
		return c.next(c);
	}
)

cpu.primary(
	'spc'
	, function(c) { /* ( -- " " ) push a space character */
		c.push(' ');
		return c.next(c);
	}
)

cpu.primary(
	'current!'
	, function(c) { /* ( -- ) store the current vocabulary in the dictionary */
		c.cells[c.dict.pointer++] = c.vocabulary;
		return c.next(c);
	}
)

cpu.primary(
	  'cls'
	, function(c) { /* ( -- ) clear the html from the output divs */
		var s = c.pop();
		if(s == "cons")
			kill_all_children(c.cons);
		else if (s == "log")
			kill_all_children(c.log);
		else if (s == "history")
			kill_all_children(c.history);
		return c.next(c);
	}
)

cpu.primary(
	'(semi)' 
	, function(c) { /* ( -- ) execute semi */
		return c.semi(c);
	}
)

cpu.primary(
	'(if!jmp)'
	, function(c) { /* ( flag -- ) if flag is false, jump to address in next cell, or just skip over */
		var flag = c.pop();
		if(flag == true)
			c.i++;
		else
			c.i = c.cells[c.i];
		return c.next(c);
	}
)

cpu.primary(
	'(jmp)'
	, function(c) { /* ( -- ) unconditional jump to the address in the next cell */
		c.i = c.cells[c.i];
		return c.next(c);
	}
)

cpu.primary(
	'(if!rjmp)'
	, function(c) { /* ( flag -- ) if flag is false, jump by the delta in next cell, or just skip over */
		var flag = c.pop();
		if(flag == true)
			c.i++;
		else
			c.i += c.cells[c.i];
		return c.next(c);
	}
)

cpu.primary(
	'(rjmp)'
	, function(c) { /* ( -- ) unconditional jump by the delta in the next cell */
		c.i += c.cells[c.i];
		return c.next(c);
	}
)



cpu.primary(
	'(colon)'
	, function(c) { /* ( -- caColon ) push code address of colon for use in : */
		c.push(c.ca('colon'));
		return c.next(c);
	}
)




cpu.secondary(
	'?search'
	, [ /*  ( -- flag ) search the dictionaries for the word in the pad flag is not found */
	  	  cpu.wa('search')
		, cpu.wa('dup')
		, cpu.wa('(if!rjmp)')
		, 17
			, cpu.wa('<mode')
			, cpu.wa('(if!rjmp)')
			, 14
				, cpu.wa('drop')
				, cpu.wa('compile')
				, cpu.wa('>vocabulary')
				, cpu.wa('search')
				, cpu.wa('context')
				, cpu.wa('>vocabulary')
				, cpu.wa('dup')
				, cpu.wa('not')
				, cpu.wa('(if!rjmp)')
				, 4
					, cpu.wa('(value)')
					, true
					, cpu.wa('>state')
	]
)


cpu.secondary(
	'?execute'
	, [ /* ( -- ) execute the word if it's immediate (i think)  */
		cpu.wa('<state')
		, cpu.wa('<mode')
		, cpu.wa('(value)')
		, false
		, cpu.wa('>state')
		, cpu.wa('=')
		, cpu.wa('(if!rjmp)')
		, 4
			, cpu.wa('execute')
			, cpu.wa('(rjmp)')
			, 2
		, cpu.wa(',')
	]
)

cpu.secondary(
	'<word'
	, [ /* read space delimeted word from the pad */
		cpu.wa('spc')
		, cpu.wa('token')
		, cpu.wa('<token')
	]
)

cpu.secondary(
	'create'
	, [ /* ( -- ) create a dictionary entry for the next word in the pad */
 	 	  cpu.wa('>entry')
		, cpu.wa('here')
		, cpu.wa('<word')
		, cpu.wa(',')
		, cpu.wa('current!')
		, cpu.wa('dp++') // jump last previous_entry_offset
		, cpu.wa('here')
		, cpu.wa('dup')
		, cpu.wa('+1')
		, cpu.wa(',') // store the ca in the wa
		, cpu.wa('(value)')
		, cpu.dict.previous_entry_offset
		, cpu.wa('+')
		, cpu.wa('+1') // wrong I think
		, cpu.wa('swap')
		, cpu.wa('!') // store our dp in the previous_entry_offset of the next word
	]
)
cpu.primary(
	'(next_cell)'
	, function(c) { /* ( t i -- ) setup do .. loop */
		c.push(c.cfa+1)
		return c.next(c);
	}
)

cpu.secondary(
	'createA'
	, [ /* ( -- ) create a dictionary entry for the next word in the pad */
		cpu.wa('spc')
		, cpu.wa('token')
		, cpu.wa('<token')
		, cpu.wa(',')
		, cpu.wa('current!')
 	 	, cpu.wa('<entry')
		, cpu.wa(',')
		, cpu.wa('(value)')
		, cpu.wa('(next_cell)')
		, cpu.wa('+1')
		, cpu.wa(',')
	]
)

cpu.secondary(
	'outer'
	, [  /* ( -- ) tokenize the pad and do whatever it says */
		  cpu.wa('spc')
		, cpu.wa('token?')
		, cpu.wa('(if!rjmp)')
		, 13
			, cpu.wa('?search')
			, cpu.wa('(if!rjmp)')
			, 7
				, cpu.wa('?number')
				, cpu.wa('(if!rjmp)')
				, 5
					, cpu.wa('tokenerror')
					, cpu.wa('(rjmp)')
					, 4
			, cpu.wa('?execute')
			, cpu.wa('(rjmp)')
			, -15
	]
)

cpu.secondary(
	':'
	, [ /* ( -- ) create a word entry */
	  	  cpu.wa('context')
		, cpu.wa('>vocabulary')
		, cpu.wa('create')
		, cpu.wa('(colon)')
		, cpu.wa('!CA')
		, cpu.wa('t')
		, cpu.wa('>mode')
	]
)

cpu.parse(': ,, , , ;')


// take the next token, look up its word address and insert it into the dictionary as a (value)


cpu.parse(': postpone <word wa ' + cpu.wa('(value)') + ' ,,  ; immediate')
cpu.parse(': `c <word ca postpone (value) ,, ; immediate')

cpu.parse(': quote 34 chr ;') // push " 
cpu.parse(': " quote token <token ;') // push the buffer up to "
cpu.parse(': ." " postpone (value) ,, ; immediate') // store the buffer up to "

// store the jmp, push the address of the jmp target, move the dp past it
cpu.parse(': if postpone (if!jmp) , here dp++ ; immediate')

// ( whereToStoreTarget -- )  this is the ultimate jump target, store it
cpu.parse(': then here ! ; immediate')

// ( whereToStoreTarget -- newWhereToStoreTarget)
cpu.parse(': else postpone (jmp) , here tuck +1 ! dp++  ; immediate')




cpu.parse(': begin here ; immediate')
cpu.parse(': until postpone (if!jmp) ,, ; immediate')


cpu.parse(': while postpone (if!jmp) , here dp++ ; immediate')
cpu.parse(': repeat swap postpone (jmp) ,, here !  ; immediate')


cpu.primary(
	'(do)'
	, function(c) { /* ( t i -- ) setup do .. loop */
		var index = c.pop();
		var terminator = c.pop();
		c.j.push(terminator);
		c.j.push(index);
		return c.next(c);
	}
)

cpu.primary(
	'(loop)'
	, function(c) { /* ( -- ) increment the loop counter until counter is gt terminator*/
		var tos = c.j.cells.length - 1;
		var terminator = c.j.cells[tos-1];
		var counter = c.j.cells[tos];
		counter++;
		if(counter < terminator) {
			c.i = c.cells[c.i];
			c.j.cells[tos] = counter;
		} else {
			c.j.pop();
			c.j.pop();
			c.i++;
		}
		return c.next(c);
	}
)

cpu.primary(
	'(+loop)'
	, function(c) { /* ( -- ) increment the loop counter by tos until counter is gt terminator*/
		var tos = c.j.cells.length - 1;
		var terminator = c.j.cells[tos-1];
		var counter = c.j.cells[tos];
		counter += c.pop();
		if(counter < terminator) {
			c.i = c.cells[c.i];
			c.j.cells[tos] = counter;
		} else {
			c.j.pop();
			c.j.pop();
			c.i++;
		}
		return c.next(c);
	}
)

cpu.parse(': do  postpone (do) , here 0 >J ; immediate')
cpu.parse(': loop  postpone (loop) ,, <J dup 0 > if begin <J here ! -1 dup 0 = until then drop ; immediate')
cpu.parse(': +loop postpone (+loop) ,, ; immediate')




cpu.parse(': (leave) <J drop <J drop ;')
cpu.parse(': leave postpone (leave)  , postpone (jmp) , <J +1 here  >J >J dp++ ; immediate')


cpu.primary(
	'lambda' 
	, function(c) {
		var body = c.pop();
		if(isString(body)) {
			try {
				var f = undefined;
				eval('f = function(args) { ' + body + ' ; } ;');
				c.push(f);
				c.push(true);
			} catch(e) {
				c.push(e);
				c.push(false);
			}	
		} else {
			c.push('String required for eval');
			c.push(false);
		}
		return c.next(c) ;
	}
)

cpu.primary(
	'(js)' 
	, function(c) {
		var body = c.pop();
		if(isString(body)) {
			try {
				var f;
				eval('f = function(c) { ' + body + ' ; } ;');
				c.push(f);
				c.push(true);
			} catch(e) {
				c.push(function() {});
				c.push(false);
			}	
		} else {
			c.push(function() {});
			c.push(false);
		}
		return c.next(c) ;
	} 
)

cpu.primary(
	'(;code)'
	, function(c) {
		c.cells[c.i](c);
		c.i++; 
		return c.next(c) ;
	} 
)

cpu.parse(': sentry <entry here 2 + swap ! ;')
cpu.parse(': constant create postpone (value) ,, postpone (semi) , (colon) !CA sentry ;')
cpu.parse(': variable 1 allot constant ;')

cpu.parse(': ;code  ." $$" token <token (js) drop postpone (;code) ,, ; immediate')

cpu.parse(': ;js ." $$" token <token  ." ; return c.next(c);" + (js) if here swap , !CA f >mode here 2 + <entry ! then ; immediate')

// using ;js ;js
cpu.parse(': http_dict ;js  c.get_and_parse(c.pop()); $$')
cpu.parse(': document ;js c.push(document) $$')
cpu.parse(': . ;js  var k = c.pop(); c.push(c.pop()[k]) $$')
cpu.parse(': byid ;js c.push(document.getElementById(c.pop())) $$')
cpu.parse(': baseuri document ." baseURI" . ;')
cpu.parse(': last ;js var k = c.pop(); c.push(c.pop().lastIndexOf(k)) $$')
cpu.parse(': slice ;js var t = c.pop(); var e = c.pop(); var s = c.pop(); c.push(t.slice(s, e)); $$')
cpu.parse(': {} ;js c.push({}) $$')
cpu.parse(': [] ;js c.push([]) $$')
cpu.parse(': <= ;js c.pop()[c.pop()] = c.pop();  $$') //  ( value key object -- )
cpu.parse(': << ;js var v = c.pop(); c.pop().push(v);  $$')
cpu.parse(': >> ;js c.push(c.pop().pop());  $$')
cpu.parse(': length ;js c.push(c.pop().length);  $$')
cpu.parse(': >0 ;js c.push(c.pop() > 0) $$')

cpu.parse('0 baseuri dup " /" last +1 swap slice constant http_dir')

cpu.parse(': last @ dup length -1 . ;')


cpu.parse(': creat <>entry <word , current! , (colon) !CA postpone (value) , here , postpone (semi) , ;')
cpu.parse(': :: context >vocabulary creat t >mode ;')
