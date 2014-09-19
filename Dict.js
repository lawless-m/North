
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

Dict.prototype.vocabs = function(e, k) {
	var i = this.entry + this.header_size
	var v_w
	while(i > 0) {
		v_w = this.vocab_word(i)
		if(v_w == undefined)
			return
		if(v_w[1] == k)
			println(e, v_w[1] + ' - ' + v_w[0])
		i = this.previous_entry(i) + this.header_size
	}
}

Dict.prototype.decode = function(e, v, k) {
	var w_a = this.wa(v, k)
	if(w_a == undefined) {
		println(e, "Not Found " + k + " - " + v)
		return
	}

	var v_w = this.vocab_word(w_a)
	if(v_w == undefined)
		return

	var c
	
	println(e, v_w[1]+ " - " + v_w[0])
	c = this.cells[w_a] - 1
	if(this.cells[c] == w_a+1) {
		println(e, this.cells[w_a+1])
	} else {
		v_w = this.vocab_word(c)
		while(v_w != undefined && !(v_w[1] == "(semi)" && v_w[0] == "context")) {
			if(v_w[0] == "sys") {
				switch(v_w[1]) {
				case '(ifrjmp)' :
				case '(value)' :
				case '(rjmp)' :
				case '(jmp)' :
					println(e, "	" + v_w[1] + " - " + v_w[0])
					println(e, "	= " + this.cells[++w_a])
					break;
				default :
					println(e, "	" + v_w[1]+ " - " + v_w[0])
				}
			} else {
				println(e, "	" + v_w[1]+ " - " + v_w[0])
			}
			c = this.cells[++w_a]
			v_w = this.vocab_word(c)
		}
		if(v_w == undefined)
			return
		println(e, "(semi) - context")
	}
}


function kill_all_children(e) {
	e.innerHTML = ''
}

function dump_dict(c) {
	var e = document.getElementById('dict');
	if(!e) return;
	var t = elem('table');
	var ks = {};
	var tt;
	var tr;
	var td;
	var v_w;
	var cs = c.cells;
	var m = c.dict.pointer;
	var p = m + 2;
	for(var j = 0; j < 2; j++) {	
		tr = elem('tr', {'valign': 'top'});
		td = elem('td', {'align': 'right'}, {}, p);
		tr.appendChild(td);
		if(cs[p] != undefined) {	
			td = elem('td');
			if(isNumber(cs[p])) {
				td.appendChild(elem('a', {'href': '#d' + cs[p]}, {}, cs[p].toString()));
				v_w = c.dict.vocab_word(cs[p]);
				if(v_w != undefined) {
					td.appendChild(elem('span', {}, {}, ' - ' + v_w[1] + ' / ' + v_w[0]));
				}
			} else {
				td.appendChild(document.createTextNode(cs[p].toString()));
			}
			tr.appendChild(td);
		}
		t.appendChild(tr);
		p--;
	}
	for(var k = cs[m+2]; k > 0; k = cs[k+2]) {
		ks[k] = k;
		tt = "th";
		for(var i = k ; i < p; i++) {
			tr = elem('tr', {'valign': 'top'});
			td = elem('td', {'align': 'right'});
			td.appendChild(elem('a', {'name': 'd' + i}, {}, i));
			tr.appendChild(td);
			if(cs[i] != undefined) {
				var td = elem(tt);
				tt = "td";
				if(isNumber(cs[i])) {
					td.appendChild(elem('a', {'href': '#d' + cs[i]}, {}, cs[i].toString()))	;
					v_w = c.dict.vocab_word(cs[i]);
					if(v_w != undefined) {
						td.appendChild(elem('span', {}, {}, ' - ' + v_w[1] + ' / ' + v_w[0]));
					}
				} else {
					td.appendChild(document.createTextNode(cs[i].toString()));
				}
				
				tr.appendChild(td);
			}
			t.appendChild(tr);
		}
		p = k;
	}
	kill_all_children(e)
	e.appendChild(t);
}

