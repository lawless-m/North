
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

var previous_entry_offset = 2 // offset into the header
var header_size = 3 // offset to the first cell after the header

var newDict = function(Dict) {
	var d = {
		Dict: Dict,
		cells: {0:0, 1:0, 2:0, 3:0, 4:0},
		pointer: 1,
		entry: 0
	}
	for(var i = 1; i <= previous_entry_offset; i++) {
		d.cells[i] = "";
	}
	d.cells[i] = 0;
	return d;
}
		

var wa = function(cells, entry, vocab, k) { // the first address of the word *after* the header
	var p = entry;
	var n;
	do { 
		if(cells[p] == k) {
			if(cells[p + 1] == vocab) {
				return p + header_size;
			}
		}
		n = p + previous_entry_offset;
		p = cells[n];
	} while(p);
}

var nfa_to_pfa = function(n) { return n + 5; }
var pfa_to_cfa = function(n) { return n - 1; }
var pfa_to_lfa = function(n) { return n - 2; }
var pfa_to_nfa = function(n) { return n - 4; }

var ca = function(dict, vocab, k) { // contents of the wa address
	var w = wa(dict, vocab, k);
	if(w) {
		return dict.cells[w];
	}
}

var define = function(dict, vocab, word, ca, body) {
	var p = dict.entry = dict.pointer

	// Dict header
	// Word
	// m := p now
	dict.cells[p++] = word
	dict.cells[p++] = vocab
	// previous_entry_offset : p - m

	// Previous Entry
	// dict.cells[p + 1] already contains prev address

	p++	// now points to the Word Address of the entry
		// headersize is the increment of p thus far

	
	// First entry is the Code address
	if(ca) // Word is a secondary, CA=ca, the address of the code to execute
		dict.cells[p++] = ca
	else // Word is a primary, CA is next cell
		dict.cells[p] = ++p

	for(var i = 0; i < body.length; i++)
		dict.cells[p++] = body[i]

	// fill in the link back to this Dict Header for the next entry
	dict.cells[p + previous_entry_offset] = dict.pointer

	// Set the pointer to point to the start of the next Dict Header
	dict.pointer = p
}

var forget = function(dict) { /* also clears the cells for now, so I can see what's happening */
	var p = dict.pointer;
	dict.pointer = dict.entry;
	dict.entry = dict.cells[dict.entry + 2];
	for(var i = p; i > dict.pointer; i--) {
		dict.cells[i] = 'DEADBEEF';
	}
	dict.cells[dict.pointer + 2] = dict.entry;
}

var getString = function(dict, i) {
	var s = dict.cells[i]
	if(isString(s))
		return s
}

var vocabulary = function(dict, w_a) {
	return getString(dict, w_a - 2)
}

var word = function(dict, w_a) {
	return getString(dict, w_a - 3)
}

var previous_entry = function(dict, w_a) {
	return dict.cells[w_a - 1]
}

var vocab_word = function(dict, w_a) {
	var v = vocabulary(dict, w_a)
	if(v == undefined)
		return
	var w = word(dict, w_a)
	if(w == undefined)
		return
	return Array(v, w)
}

exports.newDict = newDict;
exports.wa = wa;
exports.nfa_to_pfa = nfa_to_pfa;
exports.pfa_to_cfa = pfa_to_cfa;
exports.pfa_to_lfa = pfa_to_lfa;
exports.pfa_to_nfa = pfa_to_nfa;
exports.ca = ca;
exports.define = define;
exports.forget = forget;
exports.getString = getString;
exports.vocabulary = vocabulary;
exports.word = word;
exports.previous_entry = previous_entry;
exports.vocab_word = vocab_word;
