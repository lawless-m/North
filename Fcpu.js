
	
initFcpu = function(Cpu, Dict, state) {
	Cpu.primary(Dict, state, 'colon', Cpu.colon);
	
	var compile_primary = {
		';': function(state) {  /* ( -- ) finish the definition of a word */
			state.dict.cells[state.dict.pointer++] = state.dict.wa(state.cpu.vocabulary, '(semi)');
			state.cpu.mode = false; // execute;
			state.dict.cells[state.dict.pointer] = ";undefined";
			state.dict.cells[state.dict.pointer + Dict.previous_entry_offset] = state.dict.entry;
			return Cpu.next(state);
		}
	};
	
	var context_primary = {
		'colon' : Cpu.colon,
		
		'forget': function(state) { /* ( -- ) forget the last defined word */
				state.dict.forget();
				return Cpu.next(state);
		},
			
		'bp' : function(state) { /* breakpoint */
				return Cpu.next(state);
		},
		
		't': function(state) { /* ( -- true ) */
			state.stacks.d.push(true);
			return Cpu.next(state);
		},
	
		'f': function(state) { /* ( -- false ) */
			state.stacks.d.push(false);
			return Cpu.next(state);
		},
		
		'allot': function(state) { /* ( n -- ) reserve n cells in ram */
			var n = state.stacks.d.pop();
			state.stacks.d.push(c.allot(n));
			return Cpu.next(state);
		},
		
		'reset': function(state) { /* ( x y z -- ) reset the stacks and get ready for input */
			c.d = new Stack();
			c.j = new Stack();
			c.mode = false; /* execute mode */
			c.state = false; /* executing */
			c.vocabulary = "context"
			return Cpu.next(state);
		},
		
		'-': function(state) { /* ( b a -- (b - a) ) subtract */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b - a);
			return Cpu.next(state);
		},
		
		'+': function(state) { /* ( b a -- (b + a) ) add */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b + a);
			return Cpu.next(state);
		},
	
		'/': function(state) { /* ( b a -- (b / a) ) divide */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b / a);
			return Cpu.next(state);
		},
	
		'*': function(state) { /* ( b a -- (b * a) ) multiply */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b * a);
			return Cpu.next(state);
		},
	
		'&': function(state) { /* ( b a -- (b & a) ) bit wise AND */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b & a);
			return Cpu.next(state);
		},
	
		'|': function(state) { /* ( b a -- (b | a) ) bitwise or */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b | a);
			return Cpu.next(state);
		},
	
		'^': function(state) { /* ( b a -- (b ^ a) ) bitwise xor */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b ^ a);
			return Cpu.next(state);
		},
	
		'~': function(state) { /* ( a -- ~a ) bitwise not */
			var a = state.stacks.d.pop();
			state.stacks.d.push(~a);
			return Cpu.next(state);
		},
	
		'<<': function(state) { /* ( b a -- (b << a) ) bitwise shift */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b << a);
			return Cpu.next(state);
		},
	
		'>>': function(state) { /* ( b a - (b >> a) ) bitwise shift */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b >> a);
			return Cpu.next(state);
		},
	
		'>>>': function(state) { /* ( b a - (b >>> a) ) bitwise shift */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b >>> a);
			return Cpu.next(state);
		},
	
		'=': function(state) { /* ( b a - (b == a) ) equality */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b == a);
			return Cpu.next(state);
		},
	
		'>': function(state) { /* ( b a - (b > a) ) gt */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b > a);
			return Cpu.next(state);
		},
		
		'>=': function(state) { /* ( b a - (b >= a) ) gte */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b >= a);
			return Cpu.next(state);
		},
	
		'<': function(state) { /* ( b a - (b < a) ) lt */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b < a);
			return Cpu.next(state);
		},
	
		'<=': function(state) { /* ( b a - (b <= a) ) lte */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b <= a);
			return Cpu.next(state);
		},
	
		'**': function(state) {  /* ( b a - (b ^ a) ) raise to the power */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(Math.pow(b, a));
			return Cpu.next(state);
		},
	
		'abs': function(state) {  /* ( a - abs(a) )  abs */
			var v = state.stacks.d.pop();
			v = Math.abs(v);
			state.stacks.d.push(v);
			return Cpu.next(state);
		},
	
		'+1': function(state) { /* ( a - (a+1) ) inc */
			var v = state.stacks.d.pop();
			state.stacks.d.push(v + 1);
			return Cpu.next(state);
		},
	
		'-1': function(state) { /* ( a - (a-1) ) dec */
			var v = state.stacks.d.pop();
			state.stacks.d.push(v - 1);
			return Cpu.next(state);
		},
	
		'here': function(state) { /* ( - DP )  push dictionary pointer */
			state.stacks.d.push(c.dict.pointer);
			return Cpu.next(state);
		},
	
		'<R': function(state) { /* ( - (top of R) ) // pop from R stack to data stack */
			var a = state.stacks.r.pop();
			state.stacks.d.push(a);
			return Cpu.next(state);
		},
	
		'>R': function(state) { /* ( a - )  push to R stack */
			state.stacks.r.push(state.stacks.d.pop());
			return Cpu.next(state);
		},
	
		'<J': function(state) { /* ( - (top of J) ) pop from J stack and push to data stack */
			state.stacks.d.push(state.stacks.j.pop());
			return Cpu.next(state);
		},
	
		'>J': function(state) { /* ( a -- ) push top of data stack to J stack */
			state.stacks.j.push(state.stacks.d.pop());
			return Cpu.next(state);
		},
	
	
		'J++': function(state) { /* ( -- ) increment J tos */
			state.stacks.j.push(state.stacks.j.pop() + 1);
			return Cpu.next(state);
		},
		
		'i': function(state) { /* ( -- jtos ) push top of j stack without popping it */
			if(state.stacks.j.cells.length > 0) {
				state.stacks.d.push(state.stacks.j.top());
			} else {
				state.stacks.d.push(undefined);
			}
			return Cpu.next(state);
		},
	
		'j': function(state) { /* ( -- jtos ) push top of j stack without popping it */
			if(state.stacks.j.cells.length > 2) {
				state.stacks.d.push(state.stacks.j.cells[state.stacks.j.cells.length - 3]);
			} else {
				state.stacks.d.push(undefined);
			}
			return Cpu.next(state);
		},
	
		'!CA': function(state) { /* ( a -- ) store tos at the code address cell of the word */
			state.stacks.d.cells[state.dict.entry + Dict.previous_entry_offset + 1 ] = state.stacks.d.pop();
			return Cpu.next(state);
		},
	
		'swap': function(state) { /* ( b a -- a b ) swap the two top stack entries  */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(a);
			state.stacks.d.push(b);
			return Cpu.next(state);
		},
	
		'dup': function(state) { /* ( a -- a a ) duplicate the tos */
			state.stacks.d.push(c.top());
			return Cpu.next(state);
		},
	
		'tuck': function(state) { /* ( b a -- a b a ) copy tos to 3rd place, could just be : tuck swap over ; */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(a);
			state.stacks.d.push(b);
			state.stacks.d.push(a);
			return Cpu.next(state);
		},
		
		'over': function(state) { /* ( b a -- b a b ) copy the second entry to tos */
			var a = state.stacks.d.pop();
			var b = state.stacks.d.pop();
			state.stacks.d.push(b);
			state.stacks.d.push(a);
			state.stacks.d.push(b);
			return Cpu.next(state);
		},
	
		'rswap': function(state) { /* ( -- ) swap the top elements of the R stack */
			var a = state.stacks.r.pop();
			var b = state.stacks.r.pop();
			state.stacks.r.push(a);
			state.stacks.r.push(b);
			return Cpu.next(state);
		},
	
		'context': function(state) { /* ( -- "context" ) push "context" */
			state.stacks.d.push('context');
			return Cpu.next(state);
		},
	
	
		'compile': function(state) { /* ( -- "compile" ) push "compile" */
			state.stacks.d.push('compile');
			return Cpu.next(state);
		},
	
		'immediate': function(state) { /* ( -- ) set the vocabulary of the last defined word to "compile" */
			state.dict.cells[state.dict.entry + 1] = "compile";
			return Cpu.next(state);
		},
	
		'execute': function(state) { /* ( -- wa ) run the word with its address on the tos */
			state.cpu.cfa = state.stacks.d.pop(); // cfa 
			return Cpu.run(state);
		},
		
		'?sp': function(state) { /* ( -- addr ) push the address of the data stack  */
			state.stacks.d.push(c.d.pointer);
			return Cpu.next(state);
		},
	
		'?rs': function(state) { /* ( -- addr ) push the address of the return stack  */
			state.stacks.d.push(state.stacks.r.pointer);
			return Cpu.next(state);
		},
	
	
		'token': function(state) { /* ( token -- ) extract everything in c.pad until the terminator, and put it in the dictionary */
			var tok_text = tokenize(state.stacks.d.pop(), state.cpu.pad);
			state.spu.token = tok_text[0];
			state.cpu.pad = tok_text[1];
			return Cpu.next(state);
		},
	
		'token?': function(state) { /* ( token -- ( true | false ) ) extract everything in c.pad until the terminator, put it in the dictionary and report if you found anything */
			var terminator = state.stacks.d.pop();
			if(state.cpu.pad == "") {
				state.stacks.d.push(false);
				return Cpu.next(state);
			}
			var tok_text = tokenize(terminator, state.cpu.pad);
			state.cpu.token = tok_text[0];
			state.cpu.pad = tok_text[1];
			state.stacks.d.push(true);
			return Cpu.next(state);
		},
	
		'<token': function(state) {
			state.stacks.d.push(state.cpu.token);
			return Cpu.next(state);
		},
	
		'(value)': function(state) { /* ( -- n ) push the contents of the next cell */
			state.stacks.d.push(state.dict.cells[state.cpu.i]);
			state.cpu.i++;
			return Cpu.next(state);
		},
	
		'chr': function(state) { /* ( n -- chr(n) ) push the character from the code on the tos */
			var v = String.fromCharCode(state.stacks.d.pop());
			state.stacks.d.push(v);
			return Cpu.next(state);
		},
	
		'!': function(state) { /* ( adr val -- ) write val to cell at adr */
			var v = state.stacks.d.pop();
			var a = state.stacks.d.pop();
			state.dict.cells[a] = v;
			return Cpu.next(state);
		},
	
		'@': function(state) { /* ( adr -- val ) push the contents of cell at adr */
			state.stacks.d.push(state.dict.cells[c.pop()]);
			return Cpu.next(state);
		},
		
		',': function(state) { /* ( val -- ) store tos in the next cell */
			state.dict.cells[state.dict.pointer++] = state.stacks.d.pop();
			return Cpu.next(state);
		},
	
		'@dp': function(state) { /* ( -- val ) push the contents of the current dictionary cell */
			state.stacks.d.push(state.dict.cells[state.dict.pointer]);
			return Cpu.next(state);
		},
	
		'dp+=': function(state) { /* ( val -- ) add val to the dictionary pointer */
			state.dict.pointer += state.stacks.d.pop();
			return Cpu.next(state);
		},
	
		'dp++': function(state) { /* ( -- ) increment the dictionary pointer */
			state.dict.pointer++;
			return Cpu.next(state);
		},
	
		'drop': function(state) { /* ( a -- ) drop the tos */
			state.stacks.d.pop();
			return Cpu.next(state);
		},
	
		'undefined': function(state) {  /* ( -- undefined ) push undefined */
			state.stacks.d.push(undefined);
			return Cpu.next(state);
		},
	
		'wa': function(state) { /* ( "word" -- wa|undefined ) push word address or undefined on tos */
			state.stacks.d.push(state.dict.wa(state.cpu.vocabulary, state.stacks.d.pop()));
			return Cpu.next(state);
		 },
	
		'ca': function(state) {/* ( "word" -- ca|undefined ) push code address or undefined on tos */
			state.stacks.d.push(state.dict.ca(state.cpu.vocabulary, state.stacks.d.pop()));
			return Cpu.next(state);
		},
	
	
		'pfa': function(state) { /* ( NFA -- PFA) push Parameter Field Address for the given Name Field Address , just arithmetic */
			var nfa = state.stacks.d.pop();
			if(isAddress(nfa)){
				state.stacks.d.push(Dict.nfa_to_pfa(nfa));
			} else {
				state.stacks.d.push(undefined);
			}
			return Cpu.next(state);
		},
	
		'cfa': function(state) { /* ( PFA -- CFA) push Code Field Address for the given parameter Field Address , just arithmetic */
			var pfa = state.stacks.d.pop();
			if(isAddress(pfa)){
				state.stacks.d.push(state.dict.pfa_to_cfa(pfa));
			} else {
				state.stacks.d.push(undefined);
			}
			return Cpu.next(state);
		},
	
		'lfa': function(state) { /* ( PFA -- LFA) push Link Field Address for the given parameter Field Address , just arithmetic */
			var pfa = state.stacks.d.pop();
			if(isAddress(pfa)){
				state.stacks.d.push(state.dict.pfa_to_cfa(pfa));
			} else {
				state.stacks.d.push(undefined);
			}
			return Cpu.next(state);
		},
	
	
		'nfa': function(state) { /* ( PFA -- NFA) push Name Field Address for the given PFA, just arithmetic */
			var pfa = state.stacks.d.pop();
			if(isAddress(pfa)){
				state.stacks.d.push(state.dict.pfa_to_nfa(pfa));
			} else {
				state.stacks.d.push(undefined);
			}
			return Cpu.next(state);
		}, 
		  
		'search': function(state) { /* ( -- (false wa) | true ) search the dictionary for "word" push the wa and a flag for (not found) */
			var word_addr = state.dict.wa(state.cpu.token);
	
			if(word_addr) {
				state.stacks.d.push(word_addr);
				state.stacks.d.push(false); 
			} else {
				state.stacks.d.push(true);
			}
			return Cpu.next(state);
		},
	
		'<mode': function(state) { /* ( -- mode ) push the current mode */
			state.stacks.d.push(state.cpu.mode);
			return Cpu.next(state);
		},
		
		'>mode': function(state) {  /* ( mode -- ) set the current mode */
			state.cpu.mode = (state.stacks.d.pop() == true);
			return Cpu.next(state);
		},
	
		'<state': function(state) { /* ( -- state ) push the current state */
			state.stacks.d.push(c.state);
			return Cpu.next(state);
		},
		
		'>state': function(state) { /* ( state -- ) set the current state */
			var v = state.stacks.d.pop();
			state.cpu.state = (v == true);
			return Cpu.next(state);
		},
	
		'<vocabulary': function(state) { /* ( -- vocabulary ) push the current vocabulary */
			state.stacks.d.push(state.cpu.vocabulary);
			return Cpu.next(state);
		},
		
		'>vocabulary': function(state) { /* ( vocabulary -- ) set the current vocabulary */
			state.cpu.vocabulary = state.stacks.d.pop();
			return Cpu.next(state);
		},
	
		'not': function(state) { /* ( v -- !v ) boolean not */
			var v = state.stacks.d.pop();
			if(v == true) { /* might be excessive */
				state.stacks.d.push(false);
			} else {
				state.stacks.d.push(true);
			}		
			return Cpu.next(state);
		},
		
		'*ca': function(state) { /* ( -- ca ) push the code address address of the current entry */
			state.stacks.d.push(state.dict.entry + Dict.header_size);
			return Cpu.next(state);
		},
		
		'>entry': function(state) { /* ( -- ) set the last entry to the current dictionary pointer */
			state.dict.entry = state.dict.pointer;
			return Cpu.next(state);
		},
		
		'<entry': function(state) { /* ( -- daddr ) push entry address */
			state.stacks.d.push(c.dict.entry);
			return Cpu.next(state);
		},
		
		'<>entry': function(state) { /* ( -- linkaddr ) push the current link-address and then set it to the current dictionary pointer */
			state.stacks.d.push(state.dict.entry);
			state.dict.entry = state.dict.pointer;
			return Cpu.next(state);
		},
		
		'?number': function(state) { /* ( -- flag (maybe value) ) depending on the mode, push a flag and the value or store it in the dictionary */
	
			if(!isNumber(state.cpu.token)) {
				state.stacks.d.push(true);
				return Cpu.next(state);
			}
	
			v = eval(state.cpu.token);
	
			if(state.cpu.mode == true) {
				state.dict.cells[state.dict.dict.pointer++] = state.dict.wa(state.cpu.vocabulary, '(value)');
				state.dict.cells[state.dict.pointer++] = v;
			} else {
				state.stacks.d.push(v);
			}
	
			state.stacks.d.push(false);
			return Cpu.next(state);
		},
	
		'tokenerror': function(state) { /* ( -- ) report an unrecohnised word error to the console */
			console.log(">>" + state.cpu.token + "<< error unrecognised word");
			return Cpu.next(state);
		},
		
		'log': function(state) { /* ( v -- ) concat the tos to the console */
			var v = state.stacks.d.pop();
			if(v != undefined)
				console.log(v);
			return Cpu.next(state);
		},
		
		'cr': function(state) { /* ( -- ) print t"\r" to the console */
			console.log("\n")
			return Cpu.next(state);
		},
		
		'spc': function(state) { /* ( -- " " ) push a space character */
			state.stacks.d.push(' ');
			return Cpu.next(state);
		},
		
		'current!': function(state) { /* ( -- ) store the current vocabulary in the dictionary */
			state.dict.cells[state.dict.pointer++] = state.cpu.vocabulary;
			return Cpu.next(state);
		},
		
		'(semi)': function(state) { /* ( -- ) execute semi */
			return Cpu.semi(state);
		},
		
		'(if!jmp)': function(state) { /* ( flag -- ) if flag is false, jump to address in next cell, or just skip over */
			var flag = state.stacks.d.pop();
			if(flag == true) {
				state.cpu.i++;
			} else {
				state.cpu.i = state.dict.cells[state.cpu.i];
			}
			return Cpu.next(state);
		},
		
		'(jmp)': function(state) { /* ( -- ) unconditional jump to the address in the next cell */
			state.cpu.i = state.dict.cells[state.cpu.i];
			return Cpu.next(state);
		},
		
		'(if!rjmp)': function(state) { /* ( flag -- ) if flag is false, jump by the delta in next cell, or just skip over */
			var flag = state.stacks.d.pop();
			if(flag == true) {
				state.cpu.i++;
			} else {
				state.cpu.i += state.dict.cells[state.cpu.i];
			}
			return Cpu.next(state);
		},
		
		'(rjmp)': function(state) { /* ( -- ) unconditional jump by the delta in the next cell */
			state.cpu.i += state.dict.cells[state.cpu.i];
			return Cpu.next(state);
		},
		
		'(colon)': function(state) { /* ( -- caColon ) push code address of colon for use in : */
			state.stacks.d.push(state.dict.ca(state.cpu.vocabulary, 'colon'));
			return Cpu.next(state);
		}
	}
}

exports.initFcpu = initFcpu;
