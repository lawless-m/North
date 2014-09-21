

	
initFcpu = function(Cpu, Stack, n) {
	Cpu.States[n].dict.define(Cpu.States[n].vocabulary, 'colon', 0, Cpu.colon);
	var add_to_dict = function(vocab, word_list) {
		for(var word in word_list) {
			if(word_list.hasOwnProperty(word)) {
				Cpu.States[n].dict.define(Cpu.States[n].vocabulary, word, 0, word_list[word]);
			}
		}
	}
	
	add_to_dict('compile', {
		';': function(cpu, dict) {  /* ( -- ) finish the definition of a word */
			dict.cells[dict.pointer++] = dict.wa(cpu.vocabulary, '(semi)');
			cpu.mode = false; // execute;
			dict.cells[dict.pointer] = ";undefined";
			dict.cells[dict.pointer + Dict.previous_entry_offset] = dict.entry;
			return Cpu.next(cpu);
		}
	});
	
	add_to_dict('context', {
		'forget': function(cpu, dict) { /* ( -- ) forget the last defined word */
				dict.forget();
				return Cpu.next(cpu, dict);
		},
			
		'bp' : function(cpu, dict) { /* breakpoint */
				return Cpu.next(cpu, dict);
		},
		
		't': function(cpu, dict) { /* ( -- true ) */
		console.log(cpu);
		console.log(dict);
			cpu.d.push(true);
			return Cpu.next(cpu, dict);
		},
	
		'f': function(cpu, dict) { /* ( -- false ) */
			cpu.d.push(state.d, false);
			return Cpu.next(cpu, dict);
		},
		
		'allot': function(cpu, dict) { /* ( n -- ) reserve n cells in ram */
			cpu.d.push(dict.allot(cpu.d.pop()));
			return Cpu.next(cpu, dict);
		},
		
		'reset': function(cpu, dict) { /* ( x y z -- ) reset the stacks and get ready for input */
			cpu.d = Stack.new();
			cpu.j = Stack.new();
			cpu.mode = false; /* execute mode */
			cpu.state = false; /* executing */
			cpu.vocabulary = "context"
			return Cpu.next(cpu, dict);
		},
		
		'-': function(cpu, dict) { /* ( b a -- (b - a) ) subtract */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b - a);
			return Cpu.next(cpu, dict);
		},
		
		'+': function(cpu, dict) { /* ( b a -- (b + a) ) add */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b + a);
			return Cpu.next(cpu, dict);
		},
	
		'/': function(cpu, dict) { /* ( b a -- (b / a) ) divide */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b / a);
			return Cpu.next(cpu, dict);
		},
	
		'*': function(cpu, dict) { /* ( b a -- (b * a) ) multiply */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b * a);
			return Cpu.next(cpu, dict);
		},
	
		'&': function(cpu, dict) { /* ( b a -- (b & a) ) bit wise AND */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b & a);
			return Cpu.next(cpu, dict);
		},
	
		'|': function(cpu, dict) { /* ( b a -- (b | a) ) bitwise or */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b | a);
			return Cpu.next(cpu, dict);
		},
	
		'^': function(cpu, dict) { /* ( b a -- (b ^ a) ) bitwise xor */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b ^ a);
			return Cpu.next(cpu, dict);
		},
	
		'~': function(cpu, dict) { /* ( a -- ~a ) bitwise not */
			var a = cpu.d.pop();
			cpu.d.push(~a);
			return Cpu.next(cpu, dict);
		},
	
		'<<': function(cpu, dict) { /* ( b a -- (b << a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b << a);
			return Cpu.next(cpu, dict);
		},
	
		'>>': function(cpu, dict) { /* ( b a - (b >> a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >> a);
			return Cpu.next(cpu, dict);
		},
	
		'>>>': function(cpu, dict) { /* ( b a - (b >>> a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >>> a);
			return Cpu.next(cpu, dict);
		},
	
		'=': function(cpu, dict) { /* ( b a - (b == a) ) equality */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b == a);
			return Cpu.next(cpu, dict);
		},
	
		'>': function(cpu, dict) { /* ( b a - (b > a) ) gt */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b > a);
			return Cpu.next(cpu, dict);
		},
		
		'>=': function(cpu, dict) { /* ( b a - (b >= a) ) gte */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >= a);
			return Cpu.next(cpu, dict);
		},
	
		'<': function(cpu, dict) { /* ( b a - (b < a) ) lt */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b < a);
			return Cpu.next(cpu, dict);
		},
	
		'<=': function(cpu, dict) { /* ( b a - (b <= a) ) lte */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b <= a);
			return Cpu.next(cpu, dict);
		},
	
		'**': function(cpu, dict) {  /* ( b a - (b ^ a) ) raise to the power */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(Math.pow(b, a));
			return Cpu.next(cpu, dict);
		},
	
		'abs': function(cpu, dict) {  /* ( a - abs(a) )  abs */
			var v = cpu.d.pop();
			v = Math.abs(v);
			cpu.d.push(v);
			return Cpu.next(cpu, dict);
		},
	
		'+1': function(cpu, dict) { /* ( a - (a+1) ) inc */
			var v = cpu.d.pop();
			cpu.d.push(v + 1);
			return Cpu.next(cpu, dict);
		},
	
		'-1': function(cpu, dict) { /* ( a - (a-1) ) dec */
			var v = cpu.d.pop();
			cpu.d.push(v - 1);
			return Cpu.next(cpu, dict);
		},
	
		'here': function(cpu, dict) { /* ( - DP )  push dictionary pointer */
			cpu.d.push(c.dict.pointer);
			return Cpu.next(cpu, dict);
		},
	
		'<R': function(cpu, dict) { /* ( - (top of R) ) // pop from R stack to data stack */
			var a = cpu.r.pop();
			cpu.d.push(a);
			return Cpu.next(cpu, dict);
		},
	
		'>R': function(cpu, dict) { /* ( a - )  push to R stack */
			cpu.r.push(cpu.d.pop());
			return Cpu.next(cpu, dict);
		},
	
		'<J': function(cpu, dict) { /* ( - (top of J) ) pop from J stack and push to data stack */
			cpu.d.push(cpu.j.pop());
			return Cpu.next(cpu, dict);
		},
	
		'>J': function(cpu, dict) { /* ( a -- ) push top of data stack to J stack */
			cpu.j.push(cpu.d.pop());
			return Cpu.next(cpu, dict);
		},
	
	
		'J++': function(cpu, dict) { /* ( -- ) increment J tos */
			cpu.j.push(cpu.j.pop() + 1);
			return Cpu.next(cpu, dict);
		},
		
		'i': function(cpu, dict) { /* ( -- jtos ) push top of j stack without popping it */
			if(cpu.j.cells.length > 0) {
				cpu.d.push(cpu.j.top());
			} else {
				cpu.d.push(undefined);
			}
			return Cpu.next(cpu, dict);
		},
	
		'j': function(cpu, dict) { /* ( -- jtos ) push top of j stack without popping it */
			if(cpu.j.cells.length > 2) {
				cpu.d.push(cpu.j.cells[cpu.j.cells.length - 3]);
			} else {
				cpu.d.push(undefined);
			}
			return Cpu.next(cpu, dict);
		},
	
		'!CA': function(cpu, dict) { /* ( a -- ) store tos at the code address cell of the word */
			dict.cells[dict.entry + Dict.previous_entry_offset + 1] = cpu.d.pop();
			return Cpu.next(cpu, dict);
		},
	
		'swap': function(cpu, dict) { /* ( b a -- a b ) swap the two top stack entries  */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(a);
			cpu.d.push(b);
			return Cpu.next(cpu, dict);
		},
	
		'dup': function(cpu, dict) { /* ( a -- a a ) duplicate the tos */
			cpu.d.push(c.top());
			return Cpu.next(cpu, dict);
		},
	
		'tuck': function(cpu, dict) { /* ( b a -- a b a ) copy tos to 3rd place, could just be : tuck swap over ; */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(a);
			cpu.d.push(b);
			cpu.d.push(a);
			return Cpu.next(cpu, dict);
		},
		
		'over': function(cpu, dict) { /* ( b a -- b a b ) copy the second entry to tos */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b);
			cpu.d.push(a);
			cpu.d.push(b);
			return Cpu.next(cpu, dict);
		},
	
		'rswap': function(cpu, dict) { /* ( -- ) swap the top elements of the R stack */
			var a = cpu.r.pop();
			var b = cpu.r.pop();
			cpu.r.push(a);
			cpu.r.push(b);
			return Cpu.next(cpu, dict);
		},
	
		'context': function(cpu, dict) { /* ( -- "context" ) push "context" */
			cpu.d.push('context');
			return Cpu.next(cpu, dict);
		},
	
	
		'compile': function(cpu, dict) { /* ( -- "compile" ) push "compile" */
			cpu.d.push('compile');
			return Cpu.next(cpu, dict);
		},
	
		'immediate': function(cpu, dict) { /* ( -- ) set the vocabulary of the last defined word to "compile" */
			dict.cells[dict.entry + 1] = "compile";
			return Cpu.next(cpu, dict);
		},
	
		'execute': function(cpu, dict) { /* ( -- wa ) run the word with its address on the tos */
			cpu.cfa = cpu.d.pop(); // cfa 
			return Cpu.run(cpu, dict);
		},
		
		'?sp': function(cpu, dict) { /* ( -- addr ) push the address of the data stack  */
			cpu.d.push(c.d.pointer);
			return Cpu.next(cpu, dict);
		},
	
		'?rs': function(cpu, dict) { /* ( -- addr ) push the address of the return stack  */
			cpu.d.push(cpu.r.pointer);
			return Cpu.next(cpu, dict);
		},
	
		'token': function(cpu, dict) { /* ( token -- ) extract everything in c.pad until the terminator, and put it in the dictionary */
			var tok_text = tokenize(cpu.d.pop(), cpu.pad);
			cpu.token = tok_text[0];
			cpu.pad = tok_text[1];
			return Cpu.next(cpu, dict);
		},
	
		'token?': function(cpu, dict) { /* ( token -- ( true | false ) ) extract everything in c.pad until the terminator, put it in the dictionary and report if you found anything */
			var terminator = cpu.d.pop();
			if(cpu.pad == "") {
				cpu.d.push(false);
				return Cpu.next(cpu, dict);
			}
			var tok_text = tokenize(terminator, cpu.pad);
			cpu.token = tok_text[0];
			cpu.pad = tok_text[1];
			cpu.d.push(true);
			return Cpu.next(cpu, dict);
		},
	
		'<token': function(cpu, dict) {
			cpu.d.push(cpu.token);
			return Cpu.next(cpu, dict);
		},
	
		'(value)': function(cpu, dict) { /* ( -- n ) push the contents of the next cell */
			cpu.d.push(dict.cells[cpu.i]);
			cpu.i++;
			return Cpu.next(cpu, dict);
		},
	
		'chr': function(cpu, dict) { /* ( n -- chr(n) ) push the character from the code on the tos */
			var v = String.fromCharCode(cpu.d.pop());
			cpu.d.push(v);
			return Cpu.next(cpu, dict);
		},
	
		'!': function(cpu, dict) { /* ( adr val -- ) write val to cell at adr */
			var v = cpu.d.pop();
			var a = cpu.d.pop();
			dict.cells[a] = v;
			return Cpu.next(cpu, dict);
		},
	
		'@': function(cpu, dict) { /* ( adr -- val ) push the contents of cell at adr */
			cpu.d.push(dict.cells[c.pop()]);
			return Cpu.next(cpu, dict);
		},
		
		',': function(cpu, dict) { /* ( val -- ) store tos in the next cell */
			dict.cells[dict.pointer++] = cpu.d.pop();
			return Cpu.next(cpu, dict);
		},
	
		'@dp': function(cpu, dict) { /* ( -- val ) push the contents of the current dictionary cell */
			cpu.d.push(dict.cells[dict.pointer]);
			return Cpu.next(cpu, dict);
		},
	
		'dp+=': function(cpu, dict) { /* ( val -- ) add val to the dictionary pointer */
			dict.pointer += cpu.d.pop();
			return Cpu.next(cpu, dict);
		},
	
		'dp++': function(cpu, dict) { /* ( -- ) increment the dictionary pointer */
			dict.pointer++;
			return Cpu.next(cpu, dict);
		},
	
		'drop': function(cpu, dict) { /* ( a -- ) drop the tos */
			cpu.d.pop();
			return Cpu.next(cpu, dict);
		},
	
		'undefined': function(cpu, dict) {  /* ( -- undefined ) push undefined */
			cpu.d.push(undefined);
			return Cpu.next(cpu, dict);
		},
	
		'wa': function(cpu, dict) { /* ( "word" -- wa|undefined ) push word address or undefined on tos */
			cpu.d.push(dict.wa(cpu.vocabulary, cpu.d.pop()));
			return Cpu.next(cpu, dict);
		 },
	
		'ca': function(cpu, dict) {/* ( "word" -- ca|undefined ) push code address or undefined on tos */
			cpu.d.push(dict.ca(cpu.vocabulary, cpu.d.pop()));
			return Cpu.next(cpu, dict);
		},
	
	
		'pfa': function(cpu, dict) { /* ( NFA -- PFA) push Parameter Field Address for the given Name Field Address , just arithmetic */
			var nfa = cpu.d.pop();
			if(isAddress(nfa)){
				cpu.d.push(Dict.nfa_to_pfa(nfa));
			} else {
				cpu.d.push(undefined);
			}
			return Cpu.next(cpu, dict);
		},
	
		'cfa': function(cpu, dict) { /* ( PFA -- CFA) push Code Field Address for the given parameter Field Address , just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(dict.pfa_to_cfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return Cpu.next(cpu, dict);
		},
	
		'lfa': function(cpu, dict) { /* ( PFA -- LFA) push Link Field Address for the given parameter Field Address , just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(dict.pfa_to_cfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return Cpu.next(cpu, dict);
		},
	
	
		'nfa': function(cpu, dict) { /* ( PFA -- NFA) push Name Field Address for the given PFA, just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(dict.pfa_to_nfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return Cpu.next(cpu, dict);
		}, 
		  
		'search': function(cpu, dict) { /* ( -- (false wa) | true ) search the dictionary for "word" push the wa and a flag for (not found) */
			var word_addr = dict.wa(cpu.token);
	
			if(word_addr) {
				cpu.d.push(word_addr);
				cpu.d.push(false); 
			} else {
				cpu.d.push(true);
			}
			return Cpu.next(cpu, dict);
		},
	
		'<mode': function(cpu, dict) { /* ( -- mode ) push the current mode */
			cpu.d.push(cpu.mode);
			return Cpu.next(cpu, dict);
		},
		
		'>mode': function(cpu, dict) {  /* ( mode -- ) set the current mode */
			cpu.mode = (cpu.d.pop() == true);
			return Cpu.next(cpu, dict);
		},
	
		'<state': function(cpu, dict) { /* ( -- state ) push the current state */
			cpu.d.push(c.state);
			return Cpu.next(cpu, dict);
		},
		
		'>state': function(cpu, dict) { /* ( state -- ) set the current state */
			var v = cpu.d.pop();
			cpu.state = (v == true);
			return Cpu.next(cpu, dict);
		},
	
		'<vocabulary': function(cpu, dict) { /* ( -- vocabulary ) push the current vocabulary */
			cpu.d.push(cpu.vocabulary);
			return Cpu.next(cpu, dict);
		},
		
		'>vocabulary': function(cpu, dict) { /* ( vocabulary -- ) set the current vocabulary */
			cpu.vocabulary = cpu.d.pop();
			return Cpu.next(cpu, dict);
		},
	
		'not': function(cpu, dict) { /* ( v -- !v ) boolean not */
			var v = cpu.d.pop();
			if(v == true) { /* might be excessive */
				cpu.d.push(false);
			} else {
				cpu.d.push(true);
			}		
			return Cpu.next(cpu, dict);
		},
		
		'*ca': function(cpu, dict) { /* ( -- ca ) push the code address address of the current entry */
			cpu.d.push(dict.entry + Dict.header_size);
			return Cpu.next(cpu, dict);
		},
		
		'>entry': function(cpu, dict) { /* ( -- ) set the last entry to the current dictionary pointer */
			dict.entry = dict.pointer;
			return Cpu.next(cpu, dict);
		},
		
		'<entry': function(cpu, dict) { /* ( -- daddr ) push entry address */
			cpu.d.push(c.dict.entry);
			return Cpu.next(cpu, dict);
		},
		
		'<>entry': function(cpu, dict) { /* ( -- linkaddr ) push the current link-address and then set it to the current dictionary pointer */
			cpu.d.push(dict.entry);
			dict.entry = dict.pointer;
			return Cpu.next(cpu, dict);
		},
		
		'?number': function(cpu, dict) { /* ( -- flag (maybe value) ) depending on the mode, push a flag and the value or store it in the dictionary */
	
			if(!isNumber(cpu.token)) {
				cpu.d.push(true);
				return Cpu.next(cpu, dict);
			}
	
			v = eval(cpu.token);
	
			if(cpu.mode == true) {
				dict.cells[dict.dict.pointer++] = dict.wa(cpu.vocabulary, '(value)');
				dict.cells[dict.pointer++] = v;
			} else {
				cpu.d.push(v);
			}
	
			cpu.d.push(false);
			return Cpu.next(cpu, dict);
		},
	
		'tokenerror': function(cpu, dict) { /* ( -- ) report an unrecohnised word error to the console */
			console.log(">>" + cpu.token + "<< error unrecognised word");
			return Cpu.next(cpu, dict);
		},
		
		'log': function(cpu, dict) { /* ( v -- ) concat the tos to the console */
			var v = cpu.d.pop();
			if(v != undefined)
				console.log(v);
			return Cpu.next(cpu, dict);
		},
		
		'cr': function(cpu, dict) { /* ( -- ) print t"\r" to the console */
			console.log("\n")
			return Cpu.next(cpu, dict);
		},
		
		'spc': function(cpu, dict) { /* ( -- " " ) push a space character */
			cpu.d.push(' ');
			return Cpu.next(cpu, dict);
		},
		
		'current!': function(cpu, dict) { /* ( -- ) store the current vocabulary in the dictionary */
			dict.cells[dict.pointer++] = cpu.vocabulary;
			return Cpu.next(cpu, dict);
		},
		
		'(semi)': function(cpu, dict) { /* ( -- ) execute semi */
			return Cpu.semi(cpu, dict);
		},
		
		'(if!jmp)': function(cpu, dict) { /* ( flag -- ) if flag is false, jump to address in next cell, or just skip over */
			var flag = cpu.d.pop();
			if(flag == true) {
				cpu.i++;
			} else {
				cpu.i = dict.cells[cpu.i];
			}
			return Cpu.next(cpu, dict);
		},
		
		'(jmp)': function(cpu, dict) { /* ( -- ) unconditional jump to the address in the next cell */
			cpu.i = dict.cells[cpu.i];
			return Cpu.next(cpu, dict);
		},
		
		'(if!rjmp)': function(cpu, dict) { /* ( flag -- ) if flag is false, jump by the delta in next cell, or just skip over */
			var flag = cpu.d.pop();
			if(flag == true) {
				cpu.i++;
			} else {
				cpu.i += dict.cells[cpu.i];
			}
			return Cpu.next(cpu, dict);
		},
		
		'(rjmp)': function(cpu, dict) { /* ( -- ) unconditional jump by the delta in the next cell */
			cpu.i += dict.cells[cpu.i];
			return Cpu.next(cpu, dict);
		},
		
		'(colon)': function(cpu, dict) { /* ( -- caColon ) push code address of colon for use in : */
			cpu.d.push(dict.ca(cpu.vocabulary, 'colon'));
			return Cpu.next(cpu, dict);
		},
		
		'(next_cell)': function(cpu, dict) { /* ( t i -- ) setup do .. loop */
			cpu.d.push.push(cpu.cfa + 1)
			return Cpu.next(cpu, dict);
		},
	
		'(do)': function(cpu, dict) { /* ( t i -- ) setup do .. loop */
			var index = cpu.d.pop();
			var terminator = cpu.d.pop();
			cpu.j.push(terminator);
			cpu.j.push(index);
			return Cpu.next(cpu, dict);Cpu.next(cpu, dict);
		},
	
		'(loop)': function(cpu, dict) { /* ( -- ) increment the loop counter until counter is gt terminator*/
			var tos = cpu.j.cells.length - 1;
			var terminator = cpu.j.cells[tos-1];
			var counter = cpu.j.cells[tos];
			counter++;
			if(counter < terminator) {
				cpu.i = dict.cells[cpu.i];
				cpu.j.cells[tos] = counter;
			} else {
				cpu.j.pop();
				cpu.j.pop();
				cpu.i++;
			}
			return Cpu.next(cpu, dict);
		},

		'(+loop)': function(cpu, dict) { /* ( -- ) increment the loop counter by tos until counter is gt terminator*/
			var tos = cpu.j.cells.length - 1;
			var terminator = cpu.j.cells[tos-1];
			var counter = cpu.j.cells[tos];
			counter += cpu.d.pop();
			if(counter < terminator) {
				cpu.i = dict.cells[cpu.i];
				cpu.j.cells[tos] = counter;
			} else {
				cpu.j.pop();
				cpu.j.pop();
				cpu.i++;
			}
			return Cpu.next(cpu, dict);
		},
		
		'lambda': function(cpu, dict) {
			var body = cpu.d.pop();
			if(isString(body)) {
				try {
					var f = undefined;
					eval('f = function(args) { ' + body + ' ; } ;');
					cpu.d.push(f);
					cpu.d.push(true);
				} catch(e) {
					cpu.d.push(e);
					cpu.d.push(false);
				}	
			} else {
				cpu.d.push('String required for eval');
				cpu.d.push(false);
			}
			return Cpu.next(cpu, dict);
		},
	
		'(js)': function(cpu, dict) {
			var body = cpu.d.pop();
			if(isString(body)) {
				try {
					var f;
					eval('f = function(cpu, dict) { ' + body + ' ; } ;');
					cpu.d.push(f);
					cpu.d.push(true);
				} catch(e) {
					cpu.d.push(function() {});
					cpu.d.push(false);
				}	
			} else {
				cpu.d.push(function() {});
				cpu.d.push(false);
			}
			return Cpu.next(cpu, dict);
		},
		
		'(;code)': function(cpu, dict) {
			cpu.d.cells[cpu.i](cpu, dict);
			cpu.i++; 
			return Cpu.next(cpu, dict);
		},
	});
}

exports.initFcpu = initFcpu;
