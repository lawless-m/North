var trace = false;

var States = [];

var tick = 0;

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
NFA:   Name Field Address
VOCAB: Vocabulary the word is in
LFA:   Link Field Address (the previous entry's NFA)
CFA:   Contains address of the Javascript code to run
PFA:   Parameter Field Address - the data for this word

NFA:   [NFA + 0]   = $WORD					Name Field Address
VOCAB: [NFA + 1]   = $VOCABULARY
LFA:   [NFA + 2]   = %PREVIOUS_ADDRESS		Link Field Address

IF PRIMARY
CFA:   [NFA + 3]   = CODE ADDRESS			Code Field Address
PFA:   [NFA + 4]   = JS_FUNCTION			Parameter Field Address

IF SECONDARY
CFA:   [NFA + 3]   = CODE ADDRESS OF "colon" Code Field Address
PFA:   [NFA + 4]   = WORD_ADDRESS			 Parameter Field Address
	   [NFA + ...] = WORD_ADDRESS
	   [NFA + N]   = WORD_ADDRESS OF "semi"
*/


var lfa_offset = 2;
var header_size = 3 /* offset to the first cell after the header */

nfa_to_lfa = function(n) { return n + lfa_offset; };
nfa_to_vocab = function(n) { return n + 1; };
nfa_to_cfa = function(n) { return n + header_size; };
nfa_to_pfa = function(n) { return n + header_size + 1; };

lfa_to_nfa = function(n) { return n - lfa_offset; };
lfa_to_cfa = function(n) { return n + 1; };
lfa_to_pfa = function(n) { return n + 2; };

cfa_to_nfa = function(n) { return n - header_size; };
cfa_to_lfa = function(n) { return n - 1; };
cfa_to_pfa = function(n) { return n + 1; };

pfa_to_cfa = function(n) { return n - 1; };
pfa_to_lfa = function(n) { return n - 2; };
pfa_to_vocab = function(n) { return n - header_size; };
pfa_to_nfa = function(n) { return n - (header_size + 1); };

newDict = function() {
	var d = {
		  cells: {0:0, 1:0, 2:0, 3:0, 4:0}
		, pointer: 1
		, entry: 0
		, define: function(vocab, word, code_field, body) {
			var nfa = this.pointer;
			this.cells[nfa] = word;
			this.cells[nfa+1] = vocab;
			this.cells[nfa_to_lfa(nfa)] = this.entry;
			var cfa = nfa_to_cfa(nfa);
			var pfa = nfa_to_pfa(nfa);
			
			/*  First entry is the Code address */
			if(code_field) { /* Word is a secondary, CA=ca, the address of the code to execute */
				this.cells[cfa] = code_field;
				this.pointer = pfa;
				for(var i = 0; i < body.length; i++) {
					this.cells[this.pointer++] = body[i];
				}
			} else { /*  Word is a primary, CA is next cell */
				this.cells[cfa] = pfa;
				this.cells[pfa] = body;
				this.pointer = pfa + 1;
			}
			this.entry = nfa;
			return nfa;
		}
		, cfa: function(vocab, k) { /* return the first address of the word *after* the header, if found in the vocabulary */
			for(var nfa = this.entry; nfa; nfa = this.cells[nfa_to_lfa(nfa)]) {
				if(this.cells[nfa] == k && this.cells[nfa + 1] == vocab) {
					return nfa_to_cfa(nfa);
				}
			}
		}
		, ca:  function(vocab, k) { /* contents of the wa address */
			var cfa = this.cfa(vocab, k);
			if(cfa) {
				return this.cells[cfa];
			}
		}
		
		, forget: function() { /* also clears the cells for now, so I can see what's happening */
			var p = this.pointer;
			this.pointer = this.entry;
			this.entry = this.cells[nfa_to_lfa(this.entry)];
			for(var i = p; i > this.pointer; i--) {
				this.cells[i] = 'DEADBEEF';
			}
		}
		
		, getString: function(i) {
			var s = this.cells[i];
			if(isString(s)) {
				return s;
			}
		}
		
		, vocabulary: function(pfa) {
			return this.getString(pfa_to_nfa(pfa) + 1);
		}
		
		, word: function(pfa) {
			return this.getString(pfa_to_nfa(pfa));
		}
		
		, vocab_word: function(pfa) {
			var vocab = this.vocabulary(pfa);
			if(vocab == undefined) {
				return;
			}
			var word = this.word(pfa);
			if(word == undefined) {
				return;
			}
			return Array(vocab, word);
		}
		
		, dump: function(stream) { /* for dump_dict */
			var entries = Array();
			entries.unshift(this.pointer);
			var pfx = strstr(" ", 1 + this.pointer.toString().length);
			
			for(var i = this.entry; i > 0; i = this.cells[nfa_to_lfa(i)]) {
				entries.unshift(i);
			}
			/* don't decode NFA for immediate values */
			var values = [this.cfa('context', '(value)'), this.cfa('context', '(if!rjmp)'), this.cfa('context', '(rjmp)')];
			
			stream.write("Entry: " + this.entry + "\n")
			stream.write("Pointer: " + this.pointer + "\n")
			for(var i = 0; i < (entries.length-1); i++) {
				var nfa = entries[i];
				var lfa = nfa_to_lfa(nfa);
				var cfa = nfa_to_cfa(nfa);
				var pfa = nfa_to_pfa(nfa);
				
				stream.write(fmt(pfx, nfa) + " NFA  " + this.cells[nfa] + "\n");
				stream.write(fmt(pfx, nfa + 1) + " VOCB " + this.cells[nfa + 1] + "\n");
				stream.write(fmt(pfx, lfa) + " LFA< " + this.cells[this.cells[lfa]] + "\n");
				if(this.cells[cfa] == pfa) {
					/* primary */
					stream.write(fmt(pfx, cfa) + " CFA  " + fmt(pfx, pfa) + "\n");
					try {
						stream.write(fmt(pfx, pfa) + " PFA  " + this.cells[pfa].toString() + "\n");
					} catch(e) {
						if(e == "TypeError: Cannot call method 'toString' of undefined") {
							stream.write(fmt(pfx, pfa) + " PFA  undefined\n");
						} else {
							throw e;
						}
					}
				} else {
					/* secondary */
					stream.write(fmt(pfx, cfa) + " CFA  " + fmt(pfx, this.cells[cfa]) + "\n");
					stream.write(fmt(pfx, pfa) + " PFA  ");
					stream.write(fmt(pfx, this.cells[pfa]) + " - " + this.cells[cfa_to_nfa(this.cells[pfa])] + "\n");
					var prev_a_val = 0;
					for(var a = pfa + 1; a < entries[i+1]; a++) {
						stream.write(fmt(pfx, a) + "      " + fmt(pfx, this.cells[a]));
						if(values.indexOf(this.cells[a-1]) < 0 || prev_a_val) {
							nfa = cfa_to_nfa(this.cells[a]);
							if(entries.indexOf(nfa) > 0) {
								stream.write(" - " + this.cells[nfa]);
							}
							prev_a_val = 0;
						} else {
							prev_a_val = 1;
						}
						stream.write("\n");
					}
				}
			}
		}
	}
	
	return d;
}

spawn = function() {
	States.push({
		  output : ""
		, run: run
		, next: next
		, semi: semi
		, cfa: 0
		, i: 0
		, mode: false
		, state: false
		, vocabulary: 'context'
		, pad: ''
		, token: ''
		, d : newStack()
		, r : newStack()
		, j : newStack()
		, dict: newDict()
		, ram: []
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
		try {
			f = f(cpu);
		} catch(e) {
			console.log(e);
			dump_dict(cpu);
			f = undefined;
		}
	}
	if(cpu.pad != "") {
		cpu.dict.pointer = dp;
	}
	return cpu.pad;
}

parse = function(cpu, input) {
	var a;
	var i;
	a = i = -100; // 
	cpu.dict.cells[a++] = cpu.dict.cfa(cpu.vocabulary, 'outer');
	cpu.dict.cells[a++] = undefined;
	inner(cpu, i, input);
	a = i;
	delete cpu.dict.cells[a++];
	delete cpu.dict.cells[a++];
}

colon = function(cpu) {
	cpu.r.push(cpu.i);
	cpu.i = cpu.cfa;
	return next;
}

function trace_log(cpu, code_pointer) {
	var nfa = pfa_to_nfa(code_pointer);
	if(nfa) {
		if(cpu.dict.cells[nfa] == 'colon') {
			nfa = pfa_to_nfa(cpu.cfa);
		}
		console.log(strstr("  ", cpu.r.cells.length) + cpu.dict.cells[nfa]);
	}
}

run = function(cpu) {
	var code_pointer = cpu.dict.cells[cpu.cfa];
	cpu.cfa += 1;
	if(trace) {
		trace_log(cpu, code_pointer);
	}
	return cpu.dict.cells[code_pointer];
}

next = function(cpu) {
	cpu.cfa = cpu.dict.cells[cpu.i];  /* state.cpu.i is a pointer to a word */
	cpu.i += 1;
	return run;
}

semi = function(cpu) {
	cpu.i = cpu.r.pop();
	return next;
}

define = function(vocabulary, dict, o) {
	if(o.word == undefined) return;
	v = o.vocabulary || state.cpu.vocabulary;
	if(o.code == undefined) {
		o.ca = state.dict.ca(vocabulary, 'colon');
		o.words.push(state.dict.cfa(vocabulary, '(semi)'));
	} else {
		o.ca = 0;
		o.words = [o.code];
	}
	return state.dict.define(v, o.word, o.ca, o.words);
}

secondary = function(Dict, state, word, body, vocabulary) { 
	body.push(Dict.cfa(state.dict, state.cpu.vocabulary, '(semi)'))
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
	var colon_ca = nfa_to_pfa(States[n].dict.define(States[n].vocabulary, 'colon', 0, colon));
	var add_to_dict = function(vocab, word_list) {
		for(var word in word_list) {
			if(word_list.hasOwnProperty(word)) {
				if(isFunction(word_list[word])) {
					States[n].dict.define(vocab, word, 0, word_list[word]);
				} else {
					word_list[word].push(cfa('(semi)'));
					States[n].dict.define(vocab, word, colon_ca, word_list[word]);
				}
			}
		}
	}
	
	var cfa = function(word) { 
		return States[n].dict.cfa(States[n].vocabulary, word); 
	};
	
	add_to_dict('compile',
	{
//BOOTSTRAP
		';' : function(cpu) {  /* ( -- ) finish the definition of a word */
	
			cpu.dict.cells[cpu.dict.pointer++] = cpu.dict.cfa(cpu.vocabulary, '(semi)');
			cpu.mode = false; // execute;
			return cpu.next;
		}

//BOOTSTRAP
		, '`value' : function(cpu) { /* ( -- wa("(value)") )  lookup the word address of (value) for postpone */
			var v = cpu.dict.cfa("context", '(value)');
			cpu.dict.cells[cpu.dict.pointer++] = v;
			cpu.dict.cells[cpu.dict.pointer++] = v;
			return cpu.next;
		}
	});

	add_to_dict('context', 
	{
		'forget': function(cpu) { /* ( -- ) forget the last defined word */
				cpu.dict.forget();
				return cpu.next;
		}

//BOOTSTRAP
		, '//' : function(cpu) { /* ( -- ) store the pad in the dictionary */
			cpu.dict.cells[cpu.dict.pointer++] = "// " + cpu.pad;
			cpu.pad = "";
			return cpu.next;
		}
		
//BOOTSTRAP
		, 't': function(cpu) { /* ( -- true ) */
			cpu.d.push(true);
			return cpu.next;
		}

//BOOTSTRAP
		, 'f': function(cpu) { /* ( -- false ) */
			cpu.d.push(false);
			return cpu.next;
		}
		
		, 'allot': function(cpu) { /* ( n -- ) reserve n cells in ram */
			cpu.d.push(cpu.dict.allot(cpu.d.pop()));
			return cpu.next;
		}
		
		, 'reset': function(cpu) { /* ( x y z -- ) reset the stacks and get ready for input */
			cpu.d = Stack.new();
			cpu.j = Stack.new();
			cpu.mode = false; /* execute mode */
			cpu.state = false; /* executing */
			cpu.vocabulary = "context"
			return cpu.next;
		}
		
		, '-': function(cpu) { /* ( b a -- (b - a) ) subtract */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b - a);
			return cpu.next;
		}
		
		, '+': function(cpu) { /* ( b a -- (b + a) ) add */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b + a);
			return cpu.next;
		}
	
		, '/': function(cpu) { /* ( b a -- (b / a) ) divide */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b / a);
			return cpu.next;
		}
	
		, '*': function(cpu) { /* ( b a -- (b * a) ) multiply */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b * a);
			return cpu.next;
		}
	
		, '&': function(cpu) { /* ( b a -- (b & a) ) bit wise AND */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b & a);
			return cpu.next;
		}
	
		, '|': function(cpu) { /* ( b a -- (b | a) ) bitwise or */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b | a);
			return cpu.next;
		}
	
		, '^': function(cpu) { /* ( b a -- (b ^ a) ) bitwise xor */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b ^ a);
			return cpu.next;
		}
	
		, '~': function(cpu) { /* ( a -- ~a ) bitwise not */
			var a = cpu.d.pop();
			cpu.d.push(~a);
			return cpu.next;
		}
	
		, '<<': function(cpu) { /* ( b a -- (b << a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b << a);
			return cpu.next;
		}
	
		, '>>': function(cpu) { /* ( b a - (b >> a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >> a);
			return cpu.next;
		}
	
		, '>>>': function(cpu) { /* ( b a - (b >>> a) ) bitwise shift */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >>> a);
			return cpu.next;
		}
		
//BOOTSTRAP	
		, '=': function(cpu) { /* ( b a - (b == a) ) equality */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b == a);
			return cpu.next;
		}
	
		, '>': function(cpu) { /* ( b a - (b > a) ) gt */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b > a);
			return cpu.next;
		}
		
		, '>=': function(cpu) { /* ( b a - (b >= a) ) gte */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b >= a);
			return cpu.next;
		}
	
		, '<': function(cpu) { /* ( b a - (b < a) ) lt */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b < a);
			return cpu.next;
		}
	
		, '<=': function(cpu) { /* ( b a - (b <= a) ) lte */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b <= a);
			return cpu.next;
		}
	
		, '**': function(cpu) {  /* ( b a - (b ^ a) ) raise to the power */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(Math.pow(b, a));
			return cpu.next;
		}
	
		, 'abs': function(cpu) {  /* ( a - abs(a) )  abs */
			var v = cpu.d.pop();
			v = Math.abs(v);
			cpu.d.push(v);
			return cpu.next;
		}
	
		, '+1': function(cpu) { /* ( a - (a+1) ) inc */
			var v = cpu.d.pop();
			cpu.d.push(v + 1);
			return cpu.next;
		}
	
		, '-1': function(cpu) { /* ( a - (a-1) ) dec */
			var v = cpu.d.pop();
			cpu.d.push(v - 1);
			return cpu.next;
		}
		
//BOOTSTRAP	
		, 'here': function(cpu) { /* ( - DP )  push dictionary pointer */
			cpu.d.push(cpu.dict.pointer);
			return cpu.next;
		}

//BOOTSTRAP	
		, 'there' : function(cpu) { /* (NEWDP - ) pop to the dictionary pointer */
			cpu.dict.pointer = cpu.d.pop();
			return cpu.next;
		}

		, '<R': function(cpu) { /* ( - (top of R) ) // pop from R stack to data stack */
			var a = cpu.r.pop();
			cpu.d.push(a);
			return cpu.next;
		}
	
		, '>R': function(cpu) { /* ( a - )  push to R stack */
			cpu.r.push(cpu.d.pop());
			return cpu.next;
		}
	
		, '<J': function(cpu) { /* ( - (top of J) ) pop from J stack and push to data stack */
			cpu.d.push(cpu.j.pop());
			return cpu.next;
		}
	
		, '>J': function(cpu) { /* ( a -- ) push top of data stack to J stack */
			cpu.j.push(cpu.d.pop());
			return cpu.next;
		}

		, 'J++': function(cpu) { /* ( -- ) increment J tos */
			cpu.j.push(cpu.j.pop() + 1);
			return cpu.next;
		}

		, 'i': function(cpu) { /* ( -- jtos ) push top of j stack without popping it */
			if(cpu.j.cells.length > 0) {
				cpu.d.push(cpu.j.top());
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		}
	
		, 'j': function(cpu) { /* ( -- jtos ) push top of j stack without popping it */
			if(cpu.j.cells.length > 2) {
				cpu.d.push(cpu.j.cells[cpu.j.cells.length - 3]);
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		}
	
		, 'swap': function(cpu) { /* ( b a -- a b ) swap the two top stack entries  */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(a);
			cpu.d.push(b);
			return cpu.next;
		}
		
//BOOTSTRAP	
		, 'dup': function(cpu) { /* ( a -- a a ) duplicate the tos */
			cpu.d.push(cpu.d.top());
			return cpu.next;
		}
	
//BOOTSTRAP
		, 'tuck': function(cpu) { /* ( b a -- a b a ) copy tos to 3rd place, could just be : tuck swap over ; */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(a);
			cpu.d.push(b);
			cpu.d.push(a);
			return cpu.next;
		}
		
		, 'over': function(cpu) { /* ( b a -- b a b ) copy the second entry to tos */
			var a = cpu.d.pop();
			var b = cpu.d.pop();
			cpu.d.push(b);
			cpu.d.push(a);
			cpu.d.push(b);
			return cpu.next;
		}
	
		, 'rswap': function(cpu) { /* ( -- ) swap the top elements of the R stack */
			var a = cpu.r.pop();
			var b = cpu.r.pop();
			cpu.r.push(a);
			cpu.r.push(b);
			return cpu.next;
		}
//BOOTSTRAP
		, 'context': function(cpu) { /* ( -- "context" ) push "context" */
			cpu.d.push('context');
			return cpu.next;
		}
	
//BOOTSTRAP	
		, 'compile': function(cpu) { /* ( -- "compile" ) push "compile" */
			cpu.d.push('compile');
			return cpu.next;
		}
	
		, 'immediate': function(cpu) { /* ( -- ) set the vocabulary of the last defined word to "compile" */
			cpu.dict.cells[cpu.dict.entry + 1] = "compile";
			return cpu.next;
		}
	
//BOOTSTRAP	
		, 'execute': function(cpu) { /* ( -- wa ) run the word with its address on the tos */
			cpu.cfa = cpu.d.pop(); // cfa 
			return cpu.run;
		}
		
		, '?sp': function(cpu) { /* ( -- addr ) push the address of the data stack  */
			cpu.d.push(cpu.d.pointer);
			return cpu.next;
		}
	
		, '?rs': function(cpu) { /* ( -- addr ) push the address of the return stack  */
			cpu.d.push(cpu.r.pointer);
			return cpu.next;
		}
	
//BOOTSTRAP	
		, 'token': function(cpu) { /* ( token -- ) extract everything in cpu.pad until the terminator, and put it in the dictionary */
			var tok_text = tokenize(cpu.d.pop(), cpu.pad);
			cpu.token = tok_text[0];
			cpu.pad = tok_text[1];
			return cpu.next;
		}
		
//BOOTSTRAP	
		, 'token?': function(cpu) { /* ( token -- ( true | false ) ) extract everything in cpu.pad until the terminator, put it in the dictionary and report if you found anything */
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
		}
		
//BOOTSTRAP	
		, '<token': function(cpu) {
			cpu.d.push(cpu.token);
			return cpu.next;
		}
	
//BOOTSTRAP	
		, '(value)': function(cpu) { /* ( -- n ) push the contents of the next cell */
			cpu.d.push(cpu.dict.cells[cpu.i]);
			cpu.i++;
			return cpu.next;
		}
	
		, 'chr': function(cpu) { /* ( n -- chr(n) ) push the character from the code on the tos */
			var v = String.fromCharCode(cpu.d.pop());
			cpu.d.push(v);
			return cpu.next;
		}
	
		, '!': function(cpu) { /* ( adr val -- ) write val to cell at adr */
			var v = cpu.d.pop();
			var a = cpu.d.pop();
			cpu.dict.cells[a] = v;
			return cpu.next;
		}
	
		, '@': function(cpu) { /* ( adr -- val ) push the contents of cell at adr */
			cpu.d.push(cpu.dict.cells[cpu.d.pop()]);
			return cpu.next;
		}
		
//BOOTSTRAP
		, ',': function(cpu) { /* ( val -- ) store tos in the next cell */
			cpu.dict.cells[cpu.dict.pointer++] = cpu.d.pop();
			return cpu.next;
		}
	
		, '@dp': function(cpu) { /* ( -- val ) push the contents of the current dictionary cell */
			cpu.d.push(cpu.dict.cells[cpu.dict.pointer]);
			return cpu.next;
		}
	
		, 'dp+=': function(cpu) { /* ( val -- ) add val to the dictionary pointer */
			cpu.dict.pointer += cpu.d.pop();
			return cpu.next;
		}
	
		, 'dp++': function(cpu) { /* ( -- ) increment the dictionary pointer */
			cpu.dict.pointer++;
			return cpu.next;
		}
//BOOTSTRAP	
		, 'drop': function(cpu) { /* ( a -- ) drop the tos */
			cpu.d.pop();
			return cpu.next;
		}
	
		, 'undefined': function(cpu) {  /* ( -- undefined ) push undefined */
			cpu.d.push(undefined);
			return cpu.next;
		}
	
		, 'wa': function(cpu) { /* ( "word" -- wa|undefined ) push word address or undefined on tos */
			cpu.d.push(cpu.dict.cfa(cpu.vocabulary, cpu.d.pop()));
			return cpu.next;
		 }
	
		, 'ca': function(cpu) {/* ( "word" -- ca|undefined ) push code address or undefined on tos */
			cpu.d.push(cpu.dict.ca(cpu.vocabulary, cpu.d.pop()));
			return cpu.next;
		}
	
	
		, 'pfa': function(cpu) { /* ( NFA -- PFA) push Parameter Field Address for the given Name Field Address , just arithmetic */
			var nfa = cpu.d.pop();
			if(isAddress(nfa)){
				cpu.d.push(nfa_to_pfa(nfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		}
	
		, 'cfa': function(cpu) { /* ( NFA -- CFA) push Code Field Address for the given Name Field Address , just arithmetic */
			var nfa = cpu.d.pop();
			if(isAddress(nfa)){
				cpu.d.push(nfa_to_cfa(nfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		}
	
		, 'lfa': function(cpu) { /* ( PFA -- LFA) push Link Field Address for the given Parameter Field Address , just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(pfa_to_lfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		}
	
	
		, 'nfa': function(cpu) { /* ( PFA -- NFA) push Name Field Address for the given PFA, just arithmetic */
			var pfa = cpu.d.pop();
			if(isAddress(pfa)){
				cpu.d.push(pfa_to_nfa(pfa));
			} else {
				cpu.d.push(undefined);
			}
			return cpu.next;
		}
		
//BOOTSTRAP		  
		, 'search': function(cpu) { /* ( -- (false wa) | true ) search the dictionary for "word" push the wa and a flag for (not found) */
			var word_addr = cpu.dict.cfa(cpu.vocabulary, cpu.token);
	
			if(word_addr) {
				cpu.d.push(word_addr);
				cpu.d.push(false); 
			} else {
				cpu.d.push(true);
			}
			return cpu.next;
		}
	
//BOOTSTRAP	
		, '<mode': function(cpu) { /* ( -- mode ) push the current mode */
			cpu.d.push(cpu.mode);
			return cpu.next;
		}
		
//BOOTSTRAP
		, '>mode': function(cpu) {  /* ( mode -- ) set the current mode */
			cpu.mode = (cpu.d.pop() == true);
			return cpu.next;
		}
	
//BOOTSTRAP	
		, '<state': function(cpu) { /* ( -- state ) push the current state */
			cpu.d.push(cpu.state);
			return cpu.next;
		}
		
//BOOTSTRAP	
		, '>state': function(cpu) { /* ( state -- ) set the current state */
			var v = cpu.d.pop();
			cpu.state = (v == true);
			return cpu.next;
		}
	
		, '<vocabulary': function(cpu) { /* ( -- vocabulary ) push the current vocabulary */
			cpu.d.push(cpu.vocabulary);
			return cpu.next;
		}
		
//BOOTSTRAP	
		, '>vocabulary': function(cpu) { /* ( vocabulary -- ) set the current vocabulary */
			cpu.vocabulary = cpu.d.pop();
			return cpu.next;
		}
	
//BOOTSTRAP	
		, 'not': function(cpu) { /* ( v -- !v ) boolean not */
			var v = cpu.d.pop();
			if(v == true) { /* might be excessive */
				cpu.d.push(false);
			} else {
				cpu.d.push(true);
			}		
			return cpu.next;
		}
		
		, '*ca': function(cpu) { /* ( -- ca ) push the code address address of the current entry */
			cpu.d.push(nfa_to_cfa(cpu.dict.entry));
			return cpu.next;
		}
		
//BOOTSTRAP	
		, '>entry': function(cpu) { /* ( -- ) write to cpu.dict.entry */
			cpu.dict.entry = cpu.d.pop();
			return cpu.next;
		}
		
//BOOTSTRAP	
		, '<entry': function(cpu) { /* ( -- daddr ) push cpu.dict.entry  */
			cpu.d.push(cpu.dict.entry);
			return cpu.next;
		}
		
//BOOTSTRAP		
		, '?number': function(cpu) { /* ( -- flag (maybe value) ) depending on the mode, push a flag and the value or store it in the dictionary */
	
			if(!isNumber(cpu.token)) {
				cpu.d.push(true);
				return cpu.next;
			}
	
			v = eval(cpu.token);
	
			if(cpu.mode == true) {
				cpu.dict.cells[cpu.dict.pointer++] = cpu.dict.cfa(cpu.vocabulary, '(value)');
				cpu.dict.cells[cpu.dict.pointer++] = v;
			} else {
				cpu.d.push(v);
			}
	
			cpu.d.push(false);
			return cpu.next;
		}
		
//BOOTSTRAP		
		, 'tokenerror': function(cpu) { /* ( -- ) report an unrecognised word error to the console */
			console.log(">>" + cpu.token + "<< error unrecognised word - inside >><<");
			return cpu.next;
		}
		
		, 'log': function(cpu) { /* ( v -- ) concat the tos to the console */
			try {
				console.log(cpu.d.pop());
			} catch(e) {
				if(e == "Underflow") {
					console.log("Stack was empty");
				} else {
					throw e
				}
			}
			return cpu.next;
		}
		
		, 'emit': function(cpu) { /* ( -- ) pop to output */
			try {
				cpu.output += cpu.d.pop();
			} catch(e) {
				if(e == "Underflow") {
					console.log("Stack was empty");
				} else {
					throw e
				}
			}
			return cpu.next;
		}
		
		, 'cr': function(cpu) { /* ( -- ) output "\n"  */
			cpu.output("\n")
			return cpu.next;
		}
		
		, 'emitcr': function(cpu) { /* ( -- ) pop to output */
			try {
				cpu.output += cpu.d.pop() + "\n";
			} catch(e) {
				if(e == "Underflow") {
					console.log("Stack was empty");
				} else {
					throw e
				}
			}
			return cpu.next;
		}
		
//BOOTSTRAP
		, 'spc': function(cpu) { /* ( -- " " ) push a space character */
			cpu.d.push(' ');
			return cpu.next;
		}
		
//BOOTSTRAP
		, ',vocab': function(cpu) { /* ( -- ) store the current vocabulary in the dictionary */
			cpu.dict.cells[cpu.dict.pointer++] = cpu.vocabulary;
			return cpu.next;
		}
		
		, '(semi)': function(cpu) { /* ( -- ) execute semi */
			return cpu.semi;
		}
		
		, '(if!jmp)': function(cpu) { /* ( flag -- ) if flag is false, jump to address in next cell, or just skip over */
			var flag = cpu.d.pop();
			if(flag == true) {
				cpu.i++;
			} else {
				cpu.i = cpu.dict.cells[cpu.i];
			}
			return cpu.next;
		}
		
		, '(jmp)': function(cpu) { /* ( -- ) unconditional jump to the address in the next cell */
			cpu.i = cpu.dict.cells[cpu.i];
			return cpu.next;
		}
		
//BOOTSTRAP		
		, '(if!rjmp)': function(cpu) { /* ( flag -- ) if flag is false, jump by the delta in next cell, or just skip over */
			var flag = cpu.d.pop();
			if(flag == true) {
				cpu.i++;
			} else {
				cpu.i += cpu.dict.cells[cpu.i];
			}
			return cpu.next;
		}
		
//BOOTSTRAP		
		, '(rjmp)': function(cpu) { /* ( -- ) unconditional jump by the delta in the next cell */
			cpu.i += cpu.dict.cells[cpu.i];
			return cpu.next;
		}
		
//BOOTSTRAP		
		, '(colon)': function(cpu) { /* ( -- caColon ) push code address of colon for use in : */
			cpu.d.push(cpu.dict.ca(cpu.vocabulary, 'colon'));
			return cpu.next;
		}
		
		, '(next_cell)': function(cpu) { /* ( t i -- ) setup do .. loop */
			cpu.d.push(cpu.cfa + 1)
			return cpu.next;
		}
	
		, '(do)': function(cpu) { /* ( t i -- ) setup do .. loop */
			var index = cpu.d.pop();
			var terminator = cpu.d.pop();
			cpu.j.push(terminator);
			cpu.j.push(index);
			return cpu.next;
		}
	
		, '(loop)': function(cpu) { /* ( -- ) increment the loop counter until counter is gt terminator*/
			var tos = cpu.j.cells.length - 1;
			var terminator = cpu.j.cells[tos - 1];
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
		}
		
		, '(+loop)': function(cpu) { /* ( -- ) increment the loop counter by tos until counter is gt terminator*/
			var tos = cpu.j.cells.length - 1;
			var terminator = cpu.j.cells[tos - 1];
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
		}
		
		, 'lambda': function(cpu) {
			var body = cpu.d.pop();
			if(isString(body)) {
				try {
					var f = undefined;
					eval('f = function(args){' + body + '};');
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
		}

		, '(js)': function(cpu) {
			var body = cpu.d.pop();
			if(isString(body)) {
				try {
					var f;
					eval('f = function(cpu){ ' + body + ' };');
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
		}
	
		, '(;code)': function(cpu) {
			cpu.d.cells[cpu.i](cpu);
			cpu.i++; 
			return cpu.next;
		}

		, '(create)' : function(cpu) {
			// cpu.cfa currently points to the pfa
			cpu.d.push(cpu.cfa);
			return cpu.semi;
		}
	});
		
		
		
		/* secondaries */
	add_to_dict('context', {
//BOOTSTRAPsecondaries
		'?search' : [ /*  ( -- flag ) search the dictionaries for the word in the pad flag is not found */
		  	  cfa('search')
			, cfa('dup')
			, cfa('(if!rjmp)')
			, 17
				, cfa('<mode')
				, cfa('(if!rjmp)')
				, 14
					, cfa('drop')
					, cfa('compile')
					, cfa('>vocabulary')
					, cfa('search')
					, cfa('context')
					, cfa('>vocabulary')
					, cfa('dup')
					, cfa('not')
					, cfa('(if!rjmp)')
					, 4
						, cfa('(value)')
						, true
						, cfa('>state')
			]
		});
		
	add_to_dict('context', {
//BOOTSTRAPsecondaries
		'?execute' : [ /* ( -- ) execute the word if it's immediate (i think)  */
			  cfa('<state')
			, cfa('<mode')
			, cfa('(value)')
			, false
			, cfa('>state')
			, cfa('=')
			, cfa('(if!rjmp)')
			, 4
				, cfa('execute')
				, cfa('(rjmp)')
				, 2
			, cfa(',')
		]
		
//BOOTSTRAPsecondaries
		, '<word' : [ /* read space delimeted word from the pad */
			cfa('spc')
			, cfa('token')
			, cfa('<token')
		]
		});
		
	add_to_dict('context', {
		'createOLD' : [ /* ( -- ) create a dictionary entry for the next word in the pad */
			  cfa('<entry')
	 	 	, cfa('here')
	 	 	, cfa('>entry')
	 	 	, cfa('<word')
	 	 	, cfa(',')
	 	 	, cfa(',vocab')
	 	 	, cfa(',')
		]
		});
/*
push entry
	push here, write it to entry
	push word, to dict
	write vocab to dict
write it to dict
push ca('create'), write it to dict
move dp past PFA

*/
//BOOTSTRAPsecondaries
	add_to_dict('context', {
		'create' : [ /* ( -- ) create a dictionary entry for the next word in the pad */
			  cfa('<entry')
	 	 	, cfa('here')
	 	 	, cfa('>entry')
	 	 	, cfa('<word')
	 	 	, cfa(',')
	 	 	, cfa(',vocab')
	 	 	, cfa(',')
			, cfa('(value)')
	 		, States[n].dict.ca('context', '(create)') // notice the ca not cfa
	 	 	, cfa(',')
	 	 	, cfa('dp++')
		]
		});
		
//BOOTSTRAPsecondaries
	add_to_dict('context', {
		'outer' : [  /* ( -- ) tokenize the pad and do whatever it says */
			  cfa('spc')
			, cfa('token?')
			, cfa('(if!rjmp)')
			, 13
				, cfa('?search')
				, cfa('(if!rjmp)')
				, 7
					, cfa('?number')
					, cfa('(if!rjmp)')
					, 5
						, cfa('tokenerror')
						, cfa('(rjmp)')
						, 4
				, cfa('?execute')
				, cfa('(rjmp)')
				, -15
		]
		});
	
//BOOTSTRAPsecondaries	
	add_to_dict('context', {
		':' : [ /* ( -- ) create a word entry */
		  	  cfa('context')
			, cfa('>vocabulary')
			, cfa('kreate')
			, cfa('<entry')
			, cfa('cfa')
			, cfa('there')
			, cfa('(colon)')
			, cfa(',')
			, cfa('t')
			, cfa('>mode')
		]
		});
		
	read_dict(States[n], "base.nr");
}


read_dict = function(cpu, fname) {
	var fs = require('fs');
	// sod it, read the whole file
	fs.readFile(fname, "utf8",  function(err, data) {
		if(err) throw err;
		var lines = data.split("\n");
		for(var line in lines) {
			parse(cpu, lines[line]);
		}
	});
}

dump_dict = function(cpu, fname) {
	var fs = require('fs');
	var stream = fs.createWriteStream("/tmp/dict/" + (tick++));
	stream.once('open', function(fd) {
		cpu.dict.dump(stream);
  		stream.end();
	});
	console.log('dumped to /tmp/dict')
}

dump_state = function(cpu) {
	console.log("CFA: " + cpu.cfa);
	console.log("I: " + cpu.i);
	console.log("MODE: " + cpu.mode);
	console.log("STATE: " + cpu.state);
	console.log("VOCAB: " + cpu.vocabulary);
	console.log("TOKEN: " + cpu.token);
	console.log("PAD: " + cpu.pad);
	console.log("DICT.pointer: " + cpu.dict.pointer);
	console.log("DICT.entry: " + cpu.dict.entry);
	console.log("DSTACK: " + cpu.d.cells);
	console.log("RSTACK: " + cpu.r.cells);
}

tracer = function(ONOFF) {
	trace = ONOFF;
}

exports.initFcpu = initFcpu;
exports.States = States;
exports.spawn = spawn;
exports.parse = parse;
exports.dump_dict = dump_dict;
exports.dump_state = dump_state;
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
	if(v == undefined)
		v = "undefined";
		
	var txt = v.toString();
	if(txt.length > pfx.length) {
		return txt;
	}
	
	return pfx.substring(0, pfx.length - txt.length) + txt;
}
