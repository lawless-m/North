
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

function Dict() {
	this.cells = {0:0,1:0,2:0,3:0,4:0}
	this.pointer = 1
	this.entry = 0
	for(var i = this.pointer; i < this.pointer+this.previous_entry_offset; i++)
		this.cells[i] = ""
	this.cells[i] = 0

	this.previous_entry_offset = 2 // offset into the header
	this.header_size = 3 // offset to the first cell after the header
}

Dict.prototype.wa = function(vocab, k) { // the first address of the word *after* the header
	var p = this.entry
	var n
	do { 
		if(this.cells[p] == k) {
			if(this.cells[p + 1] == vocab) {
				return p + this.header_size
			}
		}
		n = p + this.previous_entry_offset
		p = this.cells[n]
	} while(p)
}


Dict.prototype.nfa_to_pfa = function(n) { return n + 5 }
Dict.prototype.pfa_to_cfa = function(n) { return n - 1 }
Dict.prototype.pfa_to_lfa = function(n) { return n - 2 }
Dict.prototype.pfa_to_nfa = function(n) { return n - 4 }

Dict.prototype.ca = function(vocab, k) { // contents of the wa address
	var w = this.wa(vocab, k);
	if(w)
		return this.cells[w];
}

Dict.prototype.define = function(vocab, word, ca, body) {
	var p = this.entry = this.pointer

	// Dict header
	// Word
	// m := p now
	this.cells[p++] = word
	this.cells[p++] = vocab
	// previous_entry_offset : p - m

	// Previous Entry
	// this.cells[p + 1] already contains prev address

	p++	// now points to the Word Address of the entry
		// headersize is the increment of p thus far

	
	// First entry is the Code address
	if(ca) // Word is a secondary, CA=ca, the address of the code to execute
		this.cells[p++] = ca
	else // Word is a primary, CA is next cell
		this.cells[p] = ++p

	for(var i = 0; i < body.length; i++)
		this.cells[p++] = body[i]

	// fill in the link back to this Dict Header for the next entry
	this.cells[p + this.previous_entry_offset] = this.pointer

	// Set the pointer to point to the start of the next Dict Header
	this.pointer = p
}

Dict.prototype.forget = function() { /* also clears the cells for now, so I can see what's happening */
	var p = this.pointer;
	this.pointer = this.entry;
	this.entry = this.cells[this.entry+2];
	for(var i = p; i > this.pointer; i--) {
		this.cells[i] = 'DEADBEEF';
	}
	this.cells[this.pointer+2] = this.entry;
}

Dict.prototype.getString = function(i) {
	var s = this.cells[i]
	if(isString(s))
		return s
}

Dict.prototype.vocabulary = function(w_a) {
	return this.getString(w_a - 2)
}

Dict.prototype.word = function(w_a) {
	return this.getString(w_a - 3)
}

Dict.prototype.previous_entry = function(w_a) {
	return this.cells[w_a - 1]
}

Dict.prototype.vocab_word = function(w_a) {
	var v = this.vocabulary(w_a)
	if(v == undefined)
		return
	var w = this.word(w_a)
	if(w == undefined)
		return
	return Array(v, w)
}
