
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

exports.new = function() {
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

