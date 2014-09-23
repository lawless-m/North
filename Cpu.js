
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

exports.previous_entry_offset = previous_entry_offset
exports.header_size = header_size
exports.nfa_to_pfa = function(n) { return n + 5; };
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
			return this.getString(dict, w_a - 3);
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
	}	
	for(var i = 1; i <= previous_entry_offset; i++) {
		d.cells[i] = "";
	}
	d.cells[i] = 0;
	
	return d;
}

spawn = function(dict) {
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

inner = function(cpu, dict, pointer, input) {
	var dp = dict.pointer;
	cpu.pad = input;
	cpu.i = pointer;
	var f = next(cpu, dict);
	while(isFunction(f)) {
		f = f(cpu, dict);
	}
	if(cpu.pad != "") {
		dict.pointer = dp;
	}
	return cpu.pad;
}

colon = function(cpu, dict) {
	cpu.r.push(cpu.i);
	cpu.i = cpu.cfa;
	return next;
}

run = function(cpu, dict) {
	var code_pointer = dict.cells[cpu.cfa]; /* this should be the index into the cells of the javascript of that function */
	cpu.cfa += 1;
	return dict.cells[code_pointer]; /* return the javascript function */
}

next = function(cpu, dict) {
	cpu.cfa = dict.cells[cpu.i];  /* state.cpu.i is a pointer to a word */
	cpu.i += 1;
	return run; /* unroll to save native stackspace ? */
}

semi = function(state) {
	state.cpu.i = state.stacks.r.pop();
	return next; /* unroll to save native stackspace ? */
}

parse = function(cpu, dict, input) {
	var a;
	var i;
	a = i = dict.pointer + 10000;
	dict.cells[a++] = dict.Dict.wa(dict, vocabulary, 'outer');
	dict.cells[a++] = undefined;
	inner(cpu, dict, i, input);
	a = i;
	delete dict.cells[a++];
	delete dict.cells[a++];
}

code_address = function(state, vocabulary, k) { 
/*
	returns the contents of the word's first cell after the header
	if k is a $WORD in the current vocabulary
	it should be an integer
*/
	var word_addr = state.dict.wa(vocabulary, k);
	if(word_addr != undefined) {
		return state.dict.cells[word_addr];
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

execute = function(state, word_addr) {
	var c_a = state.dict.cells[word_addr]
	var f = state.dict.cells[c_a]
	f && f(state)	
}

allot = function(state, n) {
	var a = state.dict.pointer;
	state.dict.pointer += n;
	return a;
}

initFcpu = function(n) {
	States[n].dict.define(States[n].vocabulary, 'colon', 0, colon);
	var add_to_dict = function(vocab, word_list) {
		for(var word in word_list) {
			if(word_list.hasOwnProperty(word)) {
				States[n].dict.define(States[n].vocabulary, word, 0, word_list[word]);
			}
		}
	}
	
	add_to_dict('compile', {
		';': function(cpu, dict) {  /* ( -- ) finish the definition of a word */
			dict.cells[dict.pointer++] = dict.wa(cpu.vocabulary, '(semi)');
			cpu.mode = false; // execute;
			dict.cells[dict.pointer] = ";undefined";
			dict.cells[dict.pointer + Dict.previous_entry_offset] = dict.entry;
			return cpu.next;
		}
	});
	
	add_to_dict('context', {
		'forget': function(cpu, dict) { /* ( -- ) forget the last defined word */
				dict.forget();
				return cpu.next;
		},
			
		'bp' : function(cpu, dict) { /* breakpoint */
				return cpu.next;
		},
		
		't': function(cpu, dict) { /* ( -- true ) */
			cpu.d.push(true);
			return cpu.next;
		},
	
		'f': function(cpu, dict) { /* ( -- false ) */
			cpu.d.push(state.d, false);
			return cpu.next;
		},
		
		'allot': function(cpu, dict) { /* ( n -- ) reserve n cells in ram */
			cpu.d.push(dict.allot(cpu.d.pop()));
			return cpu.next;
		},
		
		'reset': function(cpu, dict) { /* ( x y z -- ) reset the stacks and get ready for input */
			cpu.d = Stack.new();
			cpu.j = Stack.new();
			cpu.mode = false; /* execute mode */
			cpu.state = false; /* executing */
			cpu.vocabulary = "context"
			return cpu.next;
		},
		
		'-': function(cpu, dict) { /* ( b a -- (b - a) ) subtract */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b - a);
			return cpu.next;
		},
		
		'+': function(cpu, dict) { /* ( b a -- (b + a) ) add */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b + a);
			return cpu.next;
		},
	
		'/': function(cpu, dict) { /* ( b a -- (b / a) ) divide */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b / a);
			return cpu.next;
		},
	
		'*': function(cpu, dict) { /* ( b a -- (b * a) ) multiply */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b * a);
			return cpu.next;
		},
	
		'&': function(cpu, dict) { /* ( b a -- (b & a) ) bit wise AND */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b & a);
			return cpu.next;
		},
	
		'|': function(cpu, dict) { /* ( b a -- (b | a) ) bitwise or */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b | a);
			return cpu.next;
		},
	
		'^': function(cpu, dict) { /* ( b a -- (b ^ a) ) bitwise xor */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b ^ a);
			return cpu.next;
		},
	
		'~': function(cpu, dict) { /* ( a -- ~a ) bitwise not */
			var a = cpu.d.pop();
			cpu.d.push(~a);
			return cpu.next;
		},
	
		'<<': function(cpu, dict) { /* ( b a -- (b << a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b << a);
			return cpu.next;
		},
	
		'>>': function(cpu, dict) { /* ( b a - (b >> a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >> a);
			return cpu.next;
		},
	
		'>>>': function(cpu, dict) { /* ( b a - (b >>> a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >>> a);
			return cpu.next;
		},
	
		'=': function(cpu, dict) { /* ( b a - (b == a) ) equality */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b == a);
			return cpu.next;
		},
	
		'>': function(cpu, dict) { /* ( b a - (b > a) ) gt */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b > a);
			return cpu.next;
		},
		
		'>=': function(cpu, dict) { /* ( b a - (b >= a) ) gte */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >= a);
			return cpu.next;
		},
	
		'<': function(cpu, dict) { /* ( b a - (b < a) ) lt */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b < a);
			return cpu.next;
		},
	
		'<=': function(cpu, dict) { /* ( b a - (b <= a) ) lte */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b <= a);
			return cpu.next;
		},
	
		'**': function(cpu, dict) {  /* ( b a - (b ^ a) ) raise to the power */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(Math.pow(b, a));
			return cpu.next;
		},
	
		'abs': function(cpu, dict) {  /* ( a - abs(a) )  abs */
			var v = cpu.d.pop();
			v = Math.abs(v);
			cpu.d.push(v);
			return cpu.next;
		},
	
		'+1': function(cpu, dict) { /* ( a - (a+1) ) inc */
			var v = cpu.d.pop();
			cpu.d.push(v + 1);
			return cpu.next;
		},
	
		'-1': function(cpu, dict) { /* ( a - (a-1) ) dec */
			var v = cpu.d.pop();
			cpu.d.push(v - 1);
			return cpu.next;
		},
	
		'here': function(cpu, dict) { /* ( - DP )  push dictionary pointer */
			cpu.d.push(c.dict.pointer);
			return cpu.next;
		},
	
		'<R': function(cpu, dict) { /* ( - (top of R) ) // pop from R stack to data stack */
			var a = cpu.r.pop();
			cpu.d.push(a);
			return cpu.next;
		},
	
		'>R': function(cpu, dict) { /* ( a - )  push to R stack */
			cpu.r.push(cpu.d.pop());
			return cpu.next;
		},
	
		'<J': function(cpu, dict) { /* ( - (top of J) ) pop from J stack and push to data stack */
			cpu.d.push(cpu.j.pop());
			return cpu.next;
		},
	
		'>J': function(cpu, dict) { /* ( a -- ) push top of data stack to J stack */
			cpu.j.push(cpu.d.pop());
			return cpu.next;
		},
	
	
		'J++': function(cpu, dict) { /* ( -- ) increment J tos */
			cpu.j.push(cpu.j.pop() + 1);
			return cpu.next;
		},
		
		'i': function(cpu, dict) { /* ( -- jtos ) push top of j stack without popping it */
			if(cpu.j.cells.length > 0) {
				cpu.d.push(cpu.j.top());
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		},
	
		'j': function(cpu, dict) { /* ( -- jtos ) push top of j stack without popping it */
			if(cpu.j.cells.length > 2) {
				cpu.d.push(cpu.j.cells[cpu.j.cells.length - 3]);
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		},
	
		'!CA': function(cpu, dict) { /* ( a -- ) store tos at the code address cell of the word */
			dict.cells[dict.entry + Dict.previous_entry_offset + 1] = cpu.d.pop();
			return cpu.next;
		},
	
		'swap': function(cpu, dict) { /* ( b a -- a b ) swap the two top stack entries  */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(a);
			cpu.d.push(b);
			return cpu.next;
		},
	
		'dup': function(cpu, dict) { /* ( a -- a a ) duplicate the tos */
			cpu.d.push(c.top());
			return cpu.next;
		},
	
		'tuck': function(cpu, dict) { /* ( b a -- a b a ) copy tos to 3rd place, could just be : tuck swap over ; */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(a);
			cpu.d.push(b);
			cpu.d.push(a);
			return cpu.next;
		},
		
		'over': function(cpu, dict) { /* ( b a -- b a b ) copy the second entry to tos */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b);
			cpu.d.push(a);
			cpu.d.push(b);
			return cpu.next;
		},
	
		'rswap': function(cpu, dict) { /* ( -- ) swap the top elements of the R stack */
			var a = cpu.r.pop();
			var b = cpu.r.pop();
			cpu.r.push(a);
			cpu.r.push(b);
			return cpu.next;
		},
	
		'context': function(cpu, dict) { /* ( -- "context" ) push "context" */
			cpu.d.push('context');
			return cpu.next;
		},
	
	
		'compile': function(cpu, dict) { /* ( -- "compile" ) push "compile" */
			cpu.d.push('compile');
			return cpu.next;
		},
	
		'immediate': function(cpu, dict) { /* ( -- ) set the vocabulary of the last defined word to "compile" */
			dict.cells[dict.entry + 1] = "compile";
			return cpu.next;
		},
	
		'execute': function(cpu, dict) { /* ( -- wa ) run the word with its address on the tos */
			cpu.cfa = cpu.d.pop(); // cfa 
			return cpu.run;
		},
		
		'?sp': function(cpu, dict) { /* ( -- addr ) push the address of the data stack  */
			cpu.d.push(c.d.pointer);
			return cpu.next;
		},
	
		'?rs': function(cpu, dict) { /* ( -- addr ) push the address of the return stack  */
			cpu.d.push(cpu.r.pointer);
			return cpu.next;
		},
	
		'token': function(cpu, dict) { /* ( token -- ) extract everything in c.pad until the terminator, and put it in the dictionary */
			var tok_text = tokenize(cpu.d.pop(), cpu.pad);
			cpu.token = tok_text[0];
			cpu.pad = tok_text[1];
			return cpu.next;
		},
	
		'token?': function(cpu, dict) { /* ( token -- ( true | false ) ) extract everything in c.pad until the terminator, put it in the dictionary and report if you found anything */
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
	
		'<token': function(cpu, dict) {
			cpu.d.push(cpu.token);
			return cpu.next;
		},
	
		'(value)': function(cpu, dict) { /* ( -- n ) push the contents of the next cell */
			cpu.d.push(dict.cells[cpu.i]);
			cpu.i++;
			return cpu.next;
		},
	
		'chr': function(cpu, dict) { /* ( n -- chr(n) ) push the character from the code on the tos */
			var v = String.fromCharCode(cpu.d.pop());
			cpu.d.push(v);
			return cpu.next;
		},
	
		'!': function(cpu, dict) { /* ( adr val -- ) write val to cell at adr */
			var v = cpu.d.pop();
			var a = cpu.d.pop();
			dict.cells[a] = v;
			return cpu.next;
		},
	
		'@': function(cpu, dict) { /* ( adr -- val ) push the contents of cell at adr */
			cpu.d.push(dict.cells[c.pop()]);
			return cpu.next;
		},
		
		',': function(cpu, dict) { /* ( val -- ) store tos in the next cell */
			dict.cells[dict.pointer++] = cpu.d.pop();
			return cpu.next;
		},
	
		'@dp': function(cpu, dict) { /* ( -- val ) push the contents of the current dictionary cell */
			cpu.d.push(dict.cells[dict.pointer]);
			return cpu.next;
		},
	
		'dp+=': function(cpu, dict) { /* ( val -- ) add val to the dictionary pointer */
			dict.pointer += cpu.d.pop();
			return cpu.next;
		},
	
		'dp++': function(cpu, dict) { /* ( -- ) increment the dictionary pointer */
			dict.pointer++;
			return cpu.next;
		},
	
		'drop': function(cpu, dict) { /* ( a -- ) drop the tos */
			cpu.d.pop();
			return cpu.next;
		},
	
		'undefined': function(cpu, dict) {  /* ( -- undefined ) push undefined */
			cpu.d.push(undefined);
			return cpu.next;
		},
	
		'wa': function(cpu, dict) { /* ( "word" -- wa|undefined ) push word address or undefined on tos */
			cpu.d.push(dict.wa(cpu.vocabulary, cpu.d.pop()));
			return cpu.next;
		 },
	
		'ca': function(cpu, dict) {/* ( "word" -- ca|undefined ) push code address or undefined on tos */
			cpu.d.push(dict.ca(cpu.vocabulary, cpu.d.pop()));
			return cpu.next;
		},
	
	
		'pfa': function(cpu, dict) { /* ( NFA -- PFA) push Parameter Field Address for the given Name Field Address , just arithmetic */
			var nfa = cpu.d.pop();
			if(isAddress(nfa)){
				cpu.d.push(Dict.nfa_to_pfa(nfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		},
	
		'cfa': function(cpu, dict) { /* ( PFA -- CFA) push Code Field Address for the given parameter Field Address , just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(dict.pfa_to_cfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		},
	
		'lfa': function(cpu, dict) { /* ( PFA -- LFA) push Link Field Address for the given parameter Field Address , just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(dict.pfa_to_cfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		},
	
	
		'nfa': function(cpu, dict) { /* ( PFA -- NFA) push Name Field Address for the given PFA, just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(dict.pfa_to_nfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		}, 
		  
		'search': function(cpu, dict) { /* ( -- (false wa) | true ) search the dictionary for "word" push the wa and a flag for (not found) */
			var word_addr = dict.wa(cpu.token);
	
			if(word_addr) {
				cpu.d.push(word_addr);
				cpu.d.push(false); 
			} else {
				cpu.d.push(true);
			}
			return cpu.next;
		},
	
		'<mode': function(cpu, dict) { /* ( -- mode ) push the current mode */
			cpu.d.push(cpu.mode);
			return cpu.next;
		},
		
		'>mode': function(cpu, dict) {  /* ( mode -- ) set the current mode */
			cpu.mode = (cpu.d.pop() == true);
			return cpu.next;
		},
	
		'<state': function(cpu, dict) { /* ( -- state ) push the current state */
			cpu.d.push(c.state);
			return cpu.next;
		},
		
		'>state': function(cpu, dict) { /* ( state -- ) set the current state */
			var v = cpu.d.pop();
			cpu.state = (v == true);
			return cpu.next;
		},
	
		'<vocabulary': function(cpu, dict) { /* ( -- vocabulary ) push the current vocabulary */
			cpu.d.push(cpu.vocabulary);
			return cpu.next;
		},
		
		'>vocabulary': function(cpu, dict) { /* ( vocabulary -- ) set the current vocabulary */
			cpu.vocabulary = cpu.d.pop();
			return cpu.next;
		},
	
		'not': function(cpu, dict) { /* ( v -- !v ) boolean not */
			var v = cpu.d.pop();
			if(v == true) { /* might be excessive */
				cpu.d.push(false);
			} else {
				cpu.d.push(true);
			}		
			return cpu.next;
		},
		
		'*ca': function(cpu, dict) { /* ( -- ca ) push the code address address of the current entry */
			cpu.d.push(dict.entry + Dict.header_size);
			return cpu.next;
		},
		
		'>entry': function(cpu, dict) { /* ( -- ) set the last entry to the current dictionary pointer */
			dict.entry = dict.pointer;
			return cpu.next;
		},
		
		'<entry': function(cpu, dict) { /* ( -- daddr ) push entry address */
			cpu.d.push(c.dict.entry);
			return cpu.next;
		},
		
		'<>entry': function(cpu, dict) { /* ( -- linkaddr ) push the current link-address and then set it to the current dictionary pointer */
			cpu.d.push(dict.entry);
			dict.entry = dict.pointer;
			return cpu.next;
		},
		
		'?number': function(cpu, dict) { /* ( -- flag (maybe value) ) depending on the mode, push a flag and the value or store it in the dictionary */
	
			if(!isNumber(cpu.token)) {
				cpu.d.push(true);
				return cpu.next;
			}
	
			v = eval(cpu.token);
	
			if(cpu.mode == true) {
				dict.cells[dict.dict.pointer++] = dict.wa(cpu.vocabulary, '(value)');
				dict.cells[dict.pointer++] = v;
			} else {
				cpu.d.push(v);
			}
	
			cpu.d.push(false);
			return cpu.next;
		},
	
		'tokenerror': function(cpu, dict) { /* ( -- ) report an unrecohnised word error to the console */
			console.log(">>" + cpu.token + "<< error unrecognised word");
			return cpu.next;
		},
		
		'log': function(cpu, dict) { /* ( v -- ) concat the tos to the console */
			var v = cpu.d.pop();
			if(v != undefined)
				console.log(v);
			return cpu.next;
		},
		
		'cr': function(cpu, dict) { /* ( -- ) print t"\r" to the console */
			console.log("\n")
			return cpu.next;
		},
		
		'spc': function(cpu, dict) { /* ( -- " " ) push a space character */
			cpu.d.push(' ');
			return cpu.next;
		},
		
		'current!': function(cpu, dict) { /* ( -- ) store the current vocabulary in the dictionary */
			dict.cells[dict.pointer++] = cpu.vocabulary;
			return cpu.next;
		},
		
		'(semi)': function(cpu, dict) { /* ( -- ) execute semi */
			return cpu.semi;
		},
		
		'(if!jmp)': function(cpu, dict) { /* ( flag -- ) if flag is false, jump to address in next cell, or just skip over */
			var flag = cpu.d.pop();
			if(flag == true) {
				cpu.i++;
			} else {
				cpu.i = dict.cells[cpu.i];
			}
			return cpu.next;
		},
		
		'(jmp)': function(cpu, dict) { /* ( -- ) unconditional jump to the address in the next cell */
			cpu.i = dict.cells[cpu.i];
			return cpu.next;
		},
		
		'(if!rjmp)': function(cpu, dict) { /* ( flag -- ) if flag is false, jump by the delta in next cell, or just skip over */
			var flag = cpu.d.pop();
			if(flag == true) {
				cpu.i++;
			} else {
				cpu.i += dict.cells[cpu.i];
			}
			return cpu.next;
		},
		
		'(rjmp)': function(cpu, dict) { /* ( -- ) unconditional jump by the delta in the next cell */
			cpu.i += dict.cells[cpu.i];
			return cpu.next;
		},
		
		'(colon)': function(cpu, dict) { /* ( -- caColon ) push code address of colon for use in : */
			cpu.d.push(dict.ca(cpu.vocabulary, 'colon'));
			return cpu.next;
		},
		
		'(next_cell)': function(cpu, dict) { /* ( t i -- ) setup do .. loop */
			cpu.d.push.push(cpu.cfa + 1)
			return cpu.next;
		},
	
		'(do)': function(cpu, dict) { /* ( t i -- ) setup do .. loop */
			var index = cpu.d.pop();
			var terminator = cpu.d.pop();
			cpu.j.push(terminator);
			cpu.j.push(index);
			return cpu.next;cpu.next;
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
			return cpu.next;
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
			return cpu.next;
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
			return cpu.next;
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
			return cpu.next;
		},
		
		'(;code)': function(cpu, dict) {
			cpu.d.cells[cpu.i](cpu, dict);
			cpu.i++; 
			return cpu.next;
		},
	});
}

exports.initFcpu = initFcpu;
exports.States = States;
exports.spawn = spawn;
