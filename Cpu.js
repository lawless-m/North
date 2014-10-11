
var trace = false;

var States = [];

newStack = function() { 
	return {
	 	  cells: new Array()
	
		, push: function(e) { 
			this.cells.push(e);
		}
		
		, pop: function() {
			if(this.cells.length == 0) {
				throw "Underflow";
			}
			return this.cells.pop()
		}

		, tos: function() {
			return this.cells.length - 1;
		}
	
		, top: function() {
			if(this.cells.length == 0) {
				throw "Underflow";
			}
			return this.cells[this.tos()];
		}

		, toString: function() {
			if(this.cells.length == 0) return "";

			var s = '( ';
			for(var i = this.cells.length-1; i > 0; i--) {
				s = s.concat(this.cells[i]);
				s = s.concat(', ');
			}
			s = s.concat(this.cells[0]);
			s = s.concat(' )');
			return s;
		}
	}
}

/*

DICT LAYOUT

[WA+0] = $WORD						Name Field Address
[WA+1] = $VOCABULARY
[WA+2] = %PREVIOUS_ADDRESS			Link Field Address
IF PRIMARY
[WA+3] = CODE ADDRESS (WA+4)			Code Field Address
[WA+4] = JS_FUNCTION					Parameter Field Address
IF SECONDARY
[WA+3] = CODE ADDRESS OF "colon"		Code Field Address
[WA+4] = WORD_ADDRESS				Parameter Field Address
[WA+...] = WORD_ADDRESS
[WA+N] = WORD_ADDRESS OF "semi"


seeing this, I could refactor out CA of COLON and CA altogether which will save a dereference

*/


var previous_entry_offset = 2 /* offset into the header */
var header_size = 3 /* offset to the first cell after the header */

exports.previous_entry_offset = previous_entry_offset;
exports.header_size = header_size;

exports.nfa_to_lfa = function(n) { return n + 2; };
exports.nfa_to_cfa = function(n) { return n + 3; };
exports.nfa_to_pfa = function(n) { return n + 4; };

exports.lfa_to_nfa = function(n) { return n - 2; };
exports.lfa_to_cfa = function(n) { return n + 1; };
exports.lfa_to_pfa = function(n) { return n + 2; };

exports.cfa_to_nfa = function(n) { return n - 3; };
exports.cfa_to_lfa = function(n) { return n - 1; };
exports.cfa_to_pfa = function(n) { return n + 1; };

exports.pfa_to_cfa = function(n) { return n - 1; };
exports.pfa_to_lfa = function(n) { return n - 2; };
exports.pfa_to_nfa = function(n) { return n - 4; };

newDict = function() {
	var d = {
		  cells: {0:0, 1:0, 2:0, 3:0, 4:0}
		, pointer: 1
		, entry: 0
		, define: function(vocab, word, ca, body) {
			var p = this.entry = this.pointer;
		
			this.cells[p++] = word;
			this.cells[p++] = vocab;
			
			/* previous_entry_offset : p - m */
			
			/* Previous Entry  this.cells[p + 1] already contains prev address */
		
			p++;
			
			/* now points to the Word Address of the entry */
			/* headersize is the increment of p thus far */
		
			
			/*  First entry is the Code address */
			if(ca) { /* Word is a secondary, CA=ca, the address of the code to execute */
				this.cells[p++] = ca;
				for(var i = 0; i < body.length; i++) {
					this.cells[p++] = body[i];
				}
			} else { /*  Word is a primary, CA is next cell */
				this.cells[p] = ++p;
				this.cells[p++] = body;
			}
		
			/*  fill in the link back to this Dict Header for the next entry */
			this.cells[p + previous_entry_offset] = this.pointer
		
			/* Set the pointer to point to the start of the next Dict Header */
			this.pointer = p;
			return this.entry;
		}
		, wa: function(vocab, k) { /* the first address of the word *after* the header */
			var p = this.entry;
			var n;
			do { 
				if(this.cells[p] == k) {
					if(this.cells[p + 1] == vocab) {
						return p + header_size;
					}
				}
				n = p + previous_entry_offset;
				p = this.cells[n];
			} while(p);
		}
		, ca:  function(vocab, k) { /* contents of the wa address */
			var w = this.wa(vocab, k);
			if(w) {
				return this.cells[w];
			}
		}
		
		, forget: function() { /* also clears the cells for now, so I can see what's happening */
			var p = this.pointer;
			this.pointer = this.entry;
			this.entry = this.cells[this.entry + 2];
			for(var i = p; i > this.pointer; i--) {
				this.cells[i] = 'DEADBEEF';
			}
			this.cells[this.pointer + 2] = this.entry;
		}
		
		, getString: function(i) {
			var s = this.cells[i];
			if(isString(s)) {
				return s;
			}
		}
		
		, vocabulary: function(w_a) {
			return this.getString(w_a - 2);
		}
		
		, word: function(w_a) {
			return this.getString(w_a - 3);
		}
		
		, previous_entry: function(w_a) {
			return this.cells[w_a - 1];
		}
		
		, vocab_word: function(w_a) {
			var v = this.vocabulary(w_a);
			if(v == undefined) {
				return;
			}
			var w = this.word(w_a);
			if(w == undefined) {
				return;
			}
			return Array(v, w);
		}
		
		, dump: function(stream) { /* for dump_dict */
			var entries = Array();
			entries.unshift(this.pointer);
			var pfx = strstr(" ", 1 + this.pointer.toString().length);
			
			for(var i = this.entry; i > 0; i = this.cells[i + previous_entry_offset]) {
				entries.unshift(i);
			}
			/* don't decode NFA for immediate values */
			var values = [this.wa('context', '(value)'), this.wa('context', '(if!rjmp)'), this.wa('context', '(rjmp)')];
			
			stream.write("Entry: " + this.entry + "\n")
			stream.write("Pointer: " + this.pointer + "\n")
			for(var i = 0; i < (entries.length-1); i++) {
				var nfa = entries[i];
				var lfa = exports.nfa_to_lfa(nfa);
				var cfa = exports.nfa_to_cfa(nfa);
				var pfa = exports.nfa_to_pfa(nfa);
				
				stream.write(fmt(pfx, nfa) + " NFA  " + this.cells[nfa] + "\n");
				stream.write(fmt(pfx, nfa + 1) + " VOCB " + this.cells[nfa + 1] + "\n");
				stream.write(fmt(pfx, lfa) + " LFA< " + this.cells[this.cells[lfa]] + "\n");
				if(this.cells[cfa] == pfa) {
					/* primary */
					stream.write(fmt(pfx, cfa) + " CFA  " + fmt(pfx, pfa) + "\n");
					stream.write(fmt(pfx, pfa) + " PFA  " + this.cells[pfa].toString() + "\n");
				} else {
					/* secondary */
					stream.write(fmt(pfx, cfa) + " CFA  " + fmt(pfx, this.cells[cfa]) + "\n");
					stream.write(fmt(pfx, pfa) + " PFA  ");
					stream.write(fmt(pfx, this.cells[pfa]) + " - " + this.cells[exports.cfa_to_nfa(this.cells[pfa])] + "\n");
					for(var a = pfa + 1; a < entries[i+1]; a++) {
						stream.write(fmt(pfx, a) + "      " + fmt(pfx, this.cells[a]));
						if(values.indexOf(this.cells[a-1]) < 0) {
							nfa = exports.cfa_to_nfa(this.cells[a]);
							if(entries.indexOf(nfa) > 0) {
								stream.write(" - " + this.cells[nfa]);
							}
						}
						stream.write("\n");
					}
				}
			}
		}
	}	
	for(var i = 1; i <= previous_entry_offset; i++) {
		d.cells[i] = "";
	}
	d.cells[i] = 0;
	
	return d;
}

spawn = function() {
	States.push({
		run: run,
		next: next,
		semi: semi,
		cfa: 0,
		i: 0,
		mode: false,
		state: false,
		vocabulary: 'context',
		pad: '',
		token: '',
		d : newStack(),
		r : newStack(),
		j : newStack(),
		dict: newDict(),
		ram: []
	});
	var n = States.length - 1
	initFcpu(n)
	return n;
}

inner = function(cpu, pointer, input) {
	var dp = cpu.dict.pointer;
	cpu.pad = input;
	cpu.i = pointer;
	var f = next;
	while(isFunction(f)) {
		f = f(cpu);
	}
	if(cpu.pad != "") {
		cpu.dict.pointer = dp;
	}
	return cpu.pad;
}

colon = function(cpu) {
	cpu.r.push(cpu.i);
	cpu.i = cpu.cfa;
	return next;
}

run = function(cpu) {
	var code_pointer = cpu.dict.cells[cpu.cfa]; /* this should be the index into the cells of the javascript of that function */
	cpu.cfa += 1;
	if(trace) {
		var nfa = exports.pfa_to_nfa(code_pointer);
		if(nfa) {
			console.log(cpu.dict.cells[nfa] + " - ( " + cpu.d.cells + " )");
		}
	}
	return cpu.dict.cells[code_pointer]; /* return the javascript function */
}

next = function(cpu) {
	cpu.cfa = cpu.dict.cells[cpu.i];  /* state.cpu.i is a pointer to a word */
	cpu.i += 1;
	return run; /* unroll to save native stackspace ? */
}

semi = function(cpu) {
	cpu.i = cpu.r.pop();
	return next; /* unroll to save native stackspace ? */
}

parse = function(cpu, input) {
	var a;
	var i;
	a = i = cpu.dict.pointer + 10000;
	cpu.dict.cells[a++] = cpu.dict.wa(cpu.vocabulary, 'outer');
	cpu.dict.cells[a++] = undefined;
	inner(cpu, i, input);
	a = i;
	delete cpu.dict.cells[a++];
	delete cpu.dict.cells[a++];
}

code_address = function(cpu, vocabulary, k) { 
/*
	returns the contents of the word's first cell after the header
	if k is a $WORD in the current vocabulary
	it should be an integer
*/
	var word_addr = cpu.dict.wa(vocabulary, k);
	if(word_addr != undefined) {
		return cpu.dict.cells[word_addr];
	}
}

define = function(vocabulary, dict, o) {
	if(o.word == undefined) return;
	v = o.vocabulary || state.cpu.vocabulary;
	if(o.code == undefined) {
		o.ca = state.dict.ca(vocabulary, 'colon');
		o.words.push(state.dict.wa(vocabulary, '(semi)'));
	} else {
		o.ca = 0;
		o.words = [o.code];
	}
	return state.dict.define(v, o.word, o.ca, o.words);
}

secondary = function(Dict, state, word, body, vocabulary) { 
	body.push(Dict.wa(state.dict, state.cpu.vocabulary, '(semi)'))
	var word_addr = Dict.define(state.dict, vocabulary || state.cpu.vocabulary, word, Dict.ca(state.dict, state.cpu.vocabulary, 'colon'), body)
	return word_addr
}

execute = function(cpu, word_addr) {
	var c_a = cpu.dict.cells[word_addr]
	var f = cpu.dict.cells[c_a]
	f && f(cpu)	
}

allot = function(cpu, n) {
	var a = cpu.dict.pointer;
	cpu.dict.pointer += n;
	return a;
}

initFcpu = function(n) {
	var colon_ca = exports.nfa_to_pfa(States[n].dict.define(States[n].vocabulary, 'colon', 0, colon));
	var add_to_dict = function(vocab, word_list) {
		for(var word in word_list) {
			if(word_list.hasOwnProperty(word)) {
				if(isFunction(word_list[word])) {
					States[n].dict.define(States[n].vocabulary, word, 0, word_list[word]);
				} else {
					word_list[word].push(_wa('(semi)'));
					States[n].dict.define(States[n].vocabulary, word, colon_ca, word_list[word]);
				}
				
			}
		}
	}
	
	var _wa = function(_word) { return States[n].dict.wa(States[n].vocabulary, _word); };
	
	add_to_dict('compile',
	{
		';': function(cpu) {  /* ( -- ) finish the definition of a word */
			cpu.dict.cells[cpu.dict.pointer++] = cpu.dict.wa(cpu.vocabulary, '(semi)');
			cpu.mode = false; // execute;
			cpu.dict.cells[cpu.dict.pointer] = ";undefined";
			cpu.dict.cells[cpu.dict.pointer + previous_entry_offset] = cpu.entry;
			return cpu.next;
		}
	});
	
	add_to_dict('context', 
	{
		'forget': function(cpu) { /* ( -- ) forget the last defined word */
				cpu.dict.forget();
				return cpu.next;
		},
			
		'bp' : function(cpu) { /* breakpoint */
				return cpu.next;
		},
		
		't': function(cpu) { /* ( -- true ) */
			cpu.d.push(true);
			return cpu.next;
		},
	
		'f': function(cpu) { /* ( -- false ) */
			cpu.d.push(state.d, false);
			return cpu.next;
		},
		
		'allot': function(cpu) { /* ( n -- ) reserve n cells in ram */
			cpu.d.push(cpu.dict.allot(cpu.d.pop()));
			return cpu.next;
		},
		
		'reset': function(cpu) { /* ( x y z -- ) reset the stacks and get ready for input */
			cpu.d = Stack.new();
			cpu.j = Stack.new();
			cpu.mode = false; /* execute mode */
			cpu.state = false; /* executing */
			cpu.vocabulary = "context"
			return cpu.next;
		},
		
		'-': function(cpu) { /* ( b a -- (b - a) ) subtract */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b - a);
			return cpu.next;
		},
		
		'+': function(cpu) { /* ( b a -- (b + a) ) add */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b + a);
			return cpu.next;
		},
	
		'/': function(cpu) { /* ( b a -- (b / a) ) divide */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b / a);
			return cpu.next;
		},
	
		'*': function(cpu) { /* ( b a -- (b * a) ) multiply */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b * a);
			return cpu.next;
		},
	
		'&': function(cpu) { /* ( b a -- (b & a) ) bit wise AND */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b & a);
			return cpu.next;
		},
	
		'|': function(cpu) { /* ( b a -- (b | a) ) bitwise or */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b | a);
			return cpu.next;
		},
	
		'^': function(cpu) { /* ( b a -- (b ^ a) ) bitwise xor */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b ^ a);
			return cpu.next;
		},
	
		'~': function(cpu) { /* ( a -- ~a ) bitwise not */
			var a = cpu.d.pop();
			cpu.d.push(~a);
			return cpu.next;
		},
	
		'<<': function(cpu) { /* ( b a -- (b << a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b << a);
			return cpu.next;
		},
	
		'>>': function(cpu) { /* ( b a - (b >> a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >> a);
			return cpu.next;
		},
	
		'>>>': function(cpu) { /* ( b a - (b >>> a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >>> a);
			return cpu.next;
		},
	
		'=': function(cpu) { /* ( b a - (b == a) ) equality */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b == a);
			return cpu.next;
		},
	
		'>': function(cpu) { /* ( b a - (b > a) ) gt */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b > a);
			return cpu.next;
		},
		
		'>=': function(cpu) { /* ( b a - (b >= a) ) gte */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >= a);
			return cpu.next;
		},
	
		'<': function(cpu) { /* ( b a - (b < a) ) lt */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b < a);
			return cpu.next;
		},
	
		'<=': function(cpu) { /* ( b a - (b <= a) ) lte */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b <= a);
			return cpu.next;
		},
	
		'**': function(cpu) {  /* ( b a - (b ^ a) ) raise to the power */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(Math.pow(b, a));
			return cpu.next;
		},
	
		'abs': function(cpu) {  /* ( a - abs(a) )  abs */
			var v = cpu.d.pop();
			v = Math.abs(v);
			cpu.d.push(v);
			return cpu.next;
		},
	
		'+1': function(cpu) { /* ( a - (a+1) ) inc */
			var v = cpu.d.pop();
			cpu.d.push(v + 1);
			return cpu.next;
		},
	
		'-1': function(cpu) { /* ( a - (a-1) ) dec */
			var v = cpu.d.pop();
			cpu.d.push(v - 1);
			return cpu.next;
		},
	
		'here': function(cpu) { /* ( - DP )  push dictionary pointer */
			cpu.d.push(cpu.dict.pointer);
			return cpu.next;
		},
	
		'<R': function(cpu) { /* ( - (top of R) ) // pop from R stack to data stack */
			var a = cpu.r.pop();
			cpu.d.push(a);
			return cpu.next;
		},
	
		'>R': function(cpu) { /* ( a - )  push to R stack */
			cpu.r.push(cpu.d.pop());
			return cpu.next;
		},
	
		'<J': function(cpu) { /* ( - (top of J) ) pop from J stack and push to data stack */
			cpu.d.push(cpu.j.pop());
			return cpu.next;
		},
	
		'>J': function(cpu) { /* ( a -- ) push top of data stack to J stack */
			cpu.j.push(cpu.d.pop());
			return cpu.next;
		},
	
	
		'J++': function(cpu) { /* ( -- ) increment J tos */
			cpu.j.push(cpu.j.pop() + 1);
			return cpu.next;
		},
		
		'i': function(cpu) { /* ( -- jtos ) push top of j stack without popping it */
			if(cpu.j.cells.length > 0) {
				cpu.d.push(cpu.j.top());
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		},
	
		'j': function(cpu) { /* ( -- jtos ) push top of j stack without popping it */
			if(cpu.j.cells.length > 2) {
				cpu.d.push(cpu.j.cells[cpu.j.cells.length - 3]);
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		},
	
		'!CA': function(cpu) { /* ( a -- ) store tos at the code address cell of the word */
			cpu.dict.cells[cpu.dict.entry + previous_entry_offset + 1] = cpu.d.pop();
			return cpu.next;
		},
	
		'swap': function(cpu) { /* ( b a -- a b ) swap the two top stack entries  */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(a);
			cpu.d.push(b);
			return cpu.next;
		},
	
		'dup': function(cpu) { /* ( a -- a a ) duplicate the tos */
			cpu.d.push(cpu.d.top());
			return cpu.next;
		},
	
		'tuck': function(cpu) { /* ( b a -- a b a ) copy tos to 3rd place, could just be : tuck swap over ; */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(a);
			cpu.d.push(b);
			cpu.d.push(a);
			return cpu.next;
		},
		
		'over': function(cpu) { /* ( b a -- b a b ) copy the second entry to tos */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b);
			cpu.d.push(a);
			cpu.d.push(b);
			return cpu.next;
		},
	
		'rswap': function(cpu) { /* ( -- ) swap the top elements of the R stack */
			var a = cpu.r.pop();
			var b = cpu.r.pop();
			cpu.r.push(a);
			cpu.r.push(b);
			return cpu.next;
		},
	
		'context': function(cpu) { /* ( -- "context" ) push "context" */
			cpu.d.push('context');
			return cpu.next;
		},
	
	
		'compile': function(cpu) { /* ( -- "compile" ) push "compile" */
			cpu.d.push('compile');
			return cpu.next;
		},
	
		'immediate': function(cpu) { /* ( -- ) set the vocabulary of the last defined word to "compile" */
			cpu.dict.cells[cpu.dict.entry + 1] = "compile";
			return cpu.next;
		},
	
		'execute': function(cpu) { /* ( -- wa ) run the word with its address on the tos */
			cpu.cfa = cpu.d.pop(); // cfa 
			return cpu.run;
		},
		
		'?sp': function(cpu) { /* ( -- addr ) push the address of the data stack  */
			cpu.d.push(cpu.d.pointer);
			return cpu.next;
		},
	
		'?rs': function(cpu) { /* ( -- addr ) push the address of the return stack  */
			cpu.d.push(cpu.r.pointer);
			return cpu.next;
		},
	
		'token': function(cpu) { /* ( token -- ) extract everything in cpu.pad until the terminator, and put it in the dictionary */
			var tok_text = tokenize(cpu.d.pop(), cpu.pad);
			cpu.token = tok_text[0];
			cpu.pad = tok_text[1];
			return cpu.next;
		},
	
		'token?': function(cpu) { /* ( token -- ( true | false ) ) extract everything in cpu.pad until the terminator, put it in the dictionary and report if you found anything */
			var terminator = cpu.d.pop();
			if(cpu.pad == "") {
				cpu.d.push(false);
				return cpu.next;
			}
			var tok_text = tokenize(terminator, cpu.pad);
			cpu.token = tok_text[0];
			cpu.pad = tok_text[1];
			cpu.d.push(true);
			return cpu.next;
		},
	
		'<token': function(cpu) {
			cpu.d.push(cpu.token);
			return cpu.next;
		},
	
		'(value)': function(cpu) { /* ( -- n ) push the contents of the next cell */
			cpu.d.push(cpu.dict.cells[cpu.i]);
			cpu.i++;
			return cpu.next;
		},
	
		'chr': function(cpu) { /* ( n -- chr(n) ) push the character from the code on the tos */
			var v = String.fromCharCode(cpu.d.pop());
			cpu.d.push(v);
			return cpu.next;
		},
	
		'!': function(cpu) { /* ( adr val -- ) write val to cell at adr */
			var v = cpu.d.pop();
			var a = cpu.d.pop();
			cpu.dict.cells[a] = v;
			return cpu.next;
		},
	
		'@': function(cpu) { /* ( adr -- val ) push the contents of cell at adr */
			cpu.d.push(cpu.dict.cells[cpu.d.pop()]);
			return cpu.next;
		},
		
		',': function(cpu) { /* ( val -- ) store tos in the next cell */
			cpu.dict.cells[cpu.dict.pointer++] = cpu.d.pop();
			return cpu.next;
		},
	
		'@dp': function(cpu) { /* ( -- val ) push the contents of the current dictionary cell */
			cpu.d.push(cpu.dict.cells[cpu.dict.pointer]);
			return cpu.next;
		},
	
		'dp+=': function(cpu) { /* ( val -- ) add val to the dictionary pointer */
			cpu.dict.pointer += cpu.d.pop();
			return cpu.next;
		},
	
		'dp++': function(cpu) { /* ( -- ) increment the dictionary pointer */
			cpu.dict.pointer++;
			return cpu.next;
		},
	
		'drop': function(cpu) { /* ( a -- ) drop the tos */
			cpu.d.pop();
			return cpu.next;
		},
	
		'undefined': function(cpu) {  /* ( -- undefined ) push undefined */
			cpu.d.push(undefined);
			return cpu.next;
		},
	
		'wa': function(cpu) { /* ( "word" -- wa|undefined ) push word address or undefined on tos */
			cpu.d.push(cpu.dict.wa(cpu.vocabulary, cpu.d.pop()));
			return cpu.next;
		 },
	
		'ca': function(cpu) {/* ( "word" -- ca|undefined ) push code address or undefined on tos */
			cpu.d.push(cpu.dict.ca(cpu.vocabulary, cpu.d.pop()));
			return cpu.next;
		},
	
	
		'pfa': function(cpu) { /* ( NFA -- PFA) push Parameter Field Address for the given Name Field Address , just arithmetic */
			var nfa = cpu.d.pop();
			if(isAddress(nfa)){
				cpu.d.push(exports.nfa_to_pfa(nfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		},
	
		'cfa': function(cpu) { /* ( PFA -- CFA) push Code Field Address for the given parameter Field Address , just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(exports.pfa_to_cfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		},
	
		'lfa': function(cpu) { /* ( PFA -- LFA) push Link Field Address for the given parameter Field Address , just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(exports.pfa_to_cfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		},
	
	
		'nfa': function(cpu) { /* ( PFA -- NFA) push Name Field Address for the given PFA, just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(exports.pfa_to_nfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		}, 
		  
		'search': function(cpu) { /* ( -- (false wa) | true ) search the dictionary for "word" push the wa and a flag for (not found) */
			var word_addr = cpu.dict.wa(cpu.vocabulary, cpu.token);
	
			if(word_addr) {
				cpu.d.push(word_addr);
				cpu.d.push(false); 
			} else {
				cpu.d.push(true);
			}
			return cpu.next;
		},
	
		'<mode': function(cpu) { /* ( -- mode ) push the current mode */
			cpu.d.push(cpu.mode);
			return cpu.next;
		},
		
		'>mode': function(cpu) {  /* ( mode -- ) set the current mode */
			cpu.mode = (cpu.d.pop() == true);
			return cpu.next;
		},
	
		'<state': function(cpu) { /* ( -- state ) push the current state */
			cpu.d.push(cpu.state);
			return cpu.next;
		},
		
		'>state': function(cpu) { /* ( state -- ) set the current state */
			var v = cpu.d.pop();
			cpu.state = (v == true);
			return cpu.next;
		},
	
		'<vocabulary': function(cpu) { /* ( -- vocabulary ) push the current vocabulary */
			cpu.d.push(cpu.vocabulary);
			return cpu.next;
		},
		
		'>vocabulary': function(cpu) { /* ( vocabulary -- ) set the current vocabulary */
			cpu.vocabulary = cpu.d.pop();
			return cpu.next;
		},
	
		'not': function(cpu) { /* ( v -- !v ) boolean not */
			var v = cpu.d.pop();
			if(v == true) { /* might be excessive */
				cpu.d.push(false);
			} else {
				cpu.d.push(true);
			}		
			return cpu.next;
		},
		
		'*ca': function(cpu) { /* ( -- ca ) push the code address address of the current entry */
			cpu.d.push(cpu.dict.entry + Dict.header_size);
			return cpu.next;
		},
		
		'>entry': function(cpu) { /* ( -- ) set the last entry to the current dictionary pointer */
			cpu.dict.entry = cpu.dict.pointer;
			return cpu.next;
		},
		
		'<entry': function(cpu) { /* ( -- daddr ) push entry address */
			cpu.d.push(cpu.dict.entry);
			return cpu.next;
		},
		
		'<>entry': function(cpu) { /* ( -- linkaddr ) push the current link-address and then set it to the current dictionary pointer */
			cpu.d.push(cpu.dict.entry);
			cpu.dict.entry = cpu.dict.pointer;
			return cpu.next;
		},
		
		'?number': function(cpu) { /* ( -- flag (maybe value) ) depending on the mode, push a flag and the value or store it in the dictionary */
	
			if(!isNumber(cpu.token)) {
				cpu.d.push(true);
				return cpu.next;
			}
	
			v = eval(cpu.token);
	
			if(cpu.mode == true) {
				cpu.dict.cells[cpu.dict.dict.pointer++] = cpu.dict.wa(cpu.vocabulary, '(value)');
				cpu.dict.cells[cpu.dict.pointer++] = v;
			} else {
				cpu.d.push(v);
			}
	
			cpu.d.push(false);
			return cpu.next;
		},
	
		'tokenerror': function(cpu) { /* ( -- ) report an unrecognised word error to the console */
			console.log(">>");
			console.log(cpu.token);
			console.log("<< error unrecognised word");
			return cpu.next;
		},
		
		'log': function(cpu) { /* ( v -- ) concat the tos to the console */
			var v = cpu.d.pop();
			if(v != undefined)
				console.log(v);
			return cpu.next;
		},
		
		'cr': function(cpu) { /* ( -- ) print t"\r" to the console */
			console.log("\n")
			return cpu.next;
		},
		
		'spc': function(cpu) { /* ( -- " " ) push a space character */
			cpu.d.push(' ');
			return cpu.next;
		},
		
		'current!': function(cpu) { /* ( -- ) store the current vocabulary in the dictionary */
			cpu.dict.cells[cpu.dict.pointer++] = cpu.vocabulary;
			return cpu.next;
		},
		
		'(semi)': function(cpu) { /* ( -- ) execute semi */
			return cpu.semi;
		},
		
		'(if!jmp)': function(cpu) { /* ( flag -- ) if flag is false, jump to address in next cell, or just skip over */
			var flag = cpu.d.pop();
			if(flag == true) {
				cpu.i++;
			} else {
				cpu.i = cpu.dict.cells[cpu.i];
			}
			return cpu.next;
		},
		
		'(jmp)': function(cpu) { /* ( -- ) unconditional jump to the address in the next cell */
			cpu.i = cpu.dict.cells[cpu.i];
			return cpu.next;
		},
		
		'(if!rjmp)': function(cpu) { /* ( flag -- ) if flag is false, jump by the delta in next cell, or just skip over */
			var flag = cpu.d.pop();
			if(flag == true) {
				cpu.i++;
			} else {
				cpu.i += cpu.dict.cells[cpu.i];
			}
			return cpu.next;
		},
		
		'(rjmp)': function(cpu) { /* ( -- ) unconditional jump by the delta in the next cell */
			cpu.i += cpu.dict.cells[cpu.i];
			return cpu.next;
		},
		
		'(colon)': function(cpu) { /* ( -- caColon ) push code address of colon for use in : */
			cpu.d.push(cpu.dict.ca(cpu.vocabulary, 'colon'));
			return cpu.next;
		},
		
		'(next_cell)': function(cpu) { /* ( t i -- ) setup do .. loop */
			cpu.d.push(cpu.cfa + 1)
			return cpu.next;
		},
	
		'(do)': function(cpu) { /* ( t i -- ) setup do .. loop */
			var index = cpu.d.pop();
			var terminator = cpu.d.pop();
			cpu.j.push(terminator);
			cpu.j.push(index);
			return cpu.next;
		},
	
		'(loop)': function(cpu) { /* ( -- ) increment the loop counter until counter is gt terminator*/
			var tos = cpu.j.cells.length - 1;
			var terminator = cpu.j.cells[tos-1];
			var counter = cpu.j.cells[tos];
			counter++;
			if(counter < terminator) {
				cpu.i = cpu.dict.cells[cpu.i];
				cpu.j.cells[tos] = counter;
			} else {
				cpu.j.pop();
				cpu.j.pop();
				cpu.i++;
			}
			return cpu.next;
		},

		'(+loop)': function(cpu) { /* ( -- ) increment the loop counter by tos until counter is gt terminator*/
			var tos = cpu.j.cells.length - 1;
			var terminator = cpu.j.cells[tos-1];
			var counter = cpu.j.cells[tos];
			counter += cpu.d.pop();
			if(counter < terminator) {
				cpu.i = cpu.dict.cells[cpu.i];
				cpu.j.cells[tos] = counter;
			} else {
				cpu.j.pop();
				cpu.j.pop();
				cpu.i++;
			}
			return cpu.next;
		},
		
		'lambda': function(cpu) {
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
			return cpu.next;
		},
	
		'(js)': function(cpu) {
			var body = cpu.d.pop();
			if(isString(body)) {
				try {
					var f;
					eval('f = function(cpu) { ' + body + ' ; } ;');
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
			return cpu.next;
		},
		
		'(;code)': function(cpu) {
			cpu.d.cells[cpu.i](cpu);
			cpu.i++; 
			return cpu.next;
		}
	});
		
		
		
		/* secondaries */
	add_to_dict('context', {
		'?search' : [ /*  ( -- flag ) search the dictionaries for the word in the pad flag is not found */
		  	  _wa('search')
			, _wa('dup')
			, _wa('(if!rjmp)')
			, 17
				, _wa('<mode')
				, _wa('(if!rjmp)')
				, 14
					, _wa('drop')
					, _wa('compile')
					, _wa('>vocabulary')
					, _wa('search')
					, _wa('context')
					, _wa('>vocabulary')
					, _wa('dup')
					, _wa('not')
					, _wa('(if!rjmp)')
					, 4
						, _wa('(value)')
						, true
						, _wa('>state')
			]
		});
		
	add_to_dict('context', {
		'?execute' : [ /* ( -- ) execute the word if it's immediate (i think)  */
			  _wa('<state')
			, _wa('<mode')
			, _wa('(value)')
			, false
			, _wa('>state')
			, _wa('=')
			, _wa('(if!rjmp)')
			, 4
				, _wa('execute')
				, _wa('(rjmp)')
				, 2
			, _wa(',')
		],
		
		'<word' : [ /* read space delimeted word from the pad */
			_wa('spc')
			, _wa('token')
			, _wa('<token')
		]
		});
		
	add_to_dict('context', {
		'create' : [ /* ( -- ) create a dictionary entry for the next word in the pad */
	 	 	  _wa('>entry')
			, _wa('here')
			, _wa('<word')
			, _wa(',')
			, _wa('current!')
			, _wa('dp++') // jump last previous_entry_offset
			, _wa('here')
			, _wa('dup')
			, _wa('+1')
			, _wa(',') // store the ca in the wa
			, _wa('(value)')
			, previous_entry_offset
			, _wa('+')
			, _wa('+1') // wrong I think
			, _wa('swap')
			, _wa('!') // store our dp in the previous_entry_offset of the next word
		]
		});
		
	add_to_dict('context', {
		'createA' : [ /* ( -- ) create a dictionary entry for the next word in the pad */
			  _wa('spc')
			, _wa('token')
			, _wa('<token')
			, _wa(',')
			, _wa('current!')
	 	 	, _wa('<entry')
			, _wa(',')
			, _wa('(value)')
			, _wa('(next_cell)')
			, _wa('+1')
			, _wa(',')
		]
		});
		
	add_to_dict('context', {
		'outer' : [  /* ( -- ) tokenize the pad and do whatever it says */
			  _wa('spc')
			, _wa('token?')
			, _wa('(if!rjmp)')
			, 13
				, _wa('?search')
				, _wa('(if!rjmp)')
				, 7
					, _wa('?number')
					, _wa('(if!rjmp)')
					, 5
						, _wa('tokenerror')
						, _wa('(rjmp)')
						, 4
				, _wa('?execute')
				, _wa('(rjmp)')
				, -15
		]
		});
		
	add_to_dict('context', {
		':' : [ /* ( -- ) create a word entry */
		  	  _wa('context')
			, _wa('>vocabulary')
			, _wa('create')
			, _wa('(colon)')
			, _wa('!CA')
			, _wa('t')
			, _wa('>mode')
		]
		});
}

dump_dict = function(cpu, fname) {
	var fs = require('fs');
	var stream = fs.createWriteStream("/tmp/dict");
	stream.once('open', function(fd) {
		cpu.dict.dump(stream);
  		stream.end();
	});
	console.log('dumped to /tmp/dict')
}

tracer = function(ONOFF) {
	trace = ONOFF;
}

exports.initFcpu = initFcpu;
exports.States = States;
exports.spawn = spawn;
exports.parse = parse;
exports.dump_dict = dump_dict;
exports.trace = tracer;


/* stdlib */

function ltrim(str) { 
	for(var k = 0; k < str.length && isWhitespace(str.charAt(k)); k++);
	return str.substring(k, str.length);
}

function rtrim(str) {
	for(var j=str.length-1; j>=0 && isWhitespace(str.charAt(j)) ; j--) ;
	return str.substring(0,j+1);
}

function trim(str) {
	return ltrim(rtrim(str));
}

function isDefined(x) {
	return typeof x != 'undefined';
}

function isWhitespace(charToCheck) {
	var whitespaceChars = " \t\n\r\f";
	return (whitespaceChars.indexOf(charToCheck) != -1);
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function isInt(n) {
	return isNumber(n) && n == (n|0);
}

function isAddress(n) {
	return isInt(n) && n >= 0;
}

function isFunction(o) {
	return typeof(o) == 'function' && (!Function.prototype.call || typeof(o.call) == 'function')
}

function isString(s) {
	return Object.prototype.toString.call(s) == '[object String]'
}

function tokenize(terminator, untokenised_text) {
// replaces newlines with the terminator, so watch it

	if(untokenised_text == "" || terminator == "") return "";

	var token = ""; 

	var token_fragment; 
	var bits;
	var trim_length;
	
	// can't tokenise non existent text
	while(untokenised_text != undefined) {
	
		// split at the terminator
		bits = untokenised_text.replace("\n", terminator).split(terminator, 2);
		
		// contains the token we want
		token_fragment = bits[0];
		
		// amount of text we will trim from the front of the untokenized_text
		trim_length = token_fragment.length + terminator.length;

		// trim multiple terminators (e.g. lots of spaces) by extending the trim length
		while(untokenised_text.substr(trim_length, terminator.length) == terminator)
			trim_length += terminator.length;
		
		if(terminator == '"') { // double quote special case looking for escaped \" and \\
			if(token_fragment.substr(-1) == "\\") {
				token = token.concat(token_fragment.substr(0, token_fragment.length-1))
				token = token.concat("\"");
				untokenised_text = untokenised_text.substr(trim_length - 1);
			} else {	
				token = token.concat(token_fragment);
				untokenised_text = untokenised_text.substr(trim_length);
				break;
			}
		} else {
			token = token_fragment;
			untokenised_text = untokenised_text.substr(trim_length);
			break;
		}
	}
	
	// tidy up untokenised text
	if(untokenised_text == undefined) 
		untokenised_text = "";
	else {
		// not sure if this is too specific, maybe we want to preserve spaces in some cases ?
		untokenised_text = ltrim(untokenised_text);
	}
	return Array(token, untokenised_text);
}


function strstr(t, n) {
	var s = ""
	for(var i = 0; i < n; i++) {
		s = s.concat(t);
	}
	return s	
}

function fmt(pfx, v) {
	var txt = v.toString();
	if(txt.length > pfx.length) {
		return txt;
	}
	
	return pfx.substring(0, pfx.length - txt.length) + txt;
}
