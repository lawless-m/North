

newState = function() {
	return {
		cfa: 0,
		i: 0,
		mode: false,
		state: false,
		vocabulary: 'context',
		pad: '',
		token: ''
	};
}


inner = function(state, pointer, input) {
	var dp = state.dict.pointer;
	state.cpu.pad = input;
	state.cpu.i = pointer;
	var f = next(state);
	while(isFunction(f)) {
		f = f(state);
	}
	if(state.cpu.pad != "") {
		state.dict.pointer = dp;
	}
	return state.cpu.pad;
}

colon = function(state) {
	state.stacks.r.push(regs.i);
	state.cpu.i = state.cpu.cfa;
	return next(state);
}

run = function(state) {
	var code_pointer = state.dict.cells[state.cpu.cfa]; /* this should be the index into the cells of the javascript of that function */
	state.cpu.cfa += 1;
	return state.dict.cells[code_pointer]; /* return the javascript function */
}

next = function(state) {
	state.cpu.cfa = state.dict.cells[state.cpu.i];  /* state.cpu.i is a pointer to a word */
	state.cpu.i += 1;
	return run(state); /* unroll to save native stackspace ? */
}

semi = function(state) {
	state.cpu.i = state.stacks.r.pop();
	return next(state); /* unroll to save native stackspace ? */
}

parse = function(state) {
	var a;
	var i;
	a = i = dict.pointer + 10000;
	dict.cells[a++] = dict.wa(vocabulary, 'outer');
	dict.cells[a++] = undefined;
	inner(regs, dict, i, input);
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

primary = function(Dict, state, word, body, vocabulary) { 
	// add body as word into vocabulary or cpu.vocabulary
	var word_addr = Dict.define(state.dict, vocabulary || state.cpu.vocabulary, word, 0, [body])
	return word_addr
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
	return a
}

exports.newState = newState;
exports.primary = primary;
exports.secondary = secondary;
exports.colon = colon;

