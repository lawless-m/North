
function Cpu() {
	this.cfa = 0
	this.i = 0
	this.dict = new Dict()
	this.cells = this.dict.cells
	this.r = new Stack()
	this.d = new Stack()
	this.j = new Stack()
	this.mode = false // execute mode
	this.state = false // executing
	this.vocabulary = 'context'
	this.pad = ""
	this.token = ""
}


Cpu.prototype.inner = function(pointer, input) {
	var dp = this.dict.pointer;
	this.pad = input;
	this.i = pointer;
	var f = this.next(this)
	while(isFunction(f)) {
		f = f(this);
	}
	if(this.pad != "")
		this.dict.pointer = dp;
	return this.pad;
}

Cpu.prototype.colon = function(c) {
	c.r.push(c.i);
	c.i = c.cfa;
	return c.next(c)
}

Cpu.prototype.run = function(c) {
	var code_pointer = c.cells[c.cfa];
	c.cfa += 1;
	return c.cells[code_pointer];
}

Cpu.prototype.next = function(c) {
	c.cfa = c.cells[c.i]   // c.i is a pointer to a word
	c.i += 1
	// run
	var code_pointer = c.cells[c.cfa] // this should be the index into the cells of the javascript of that function 
	c.cfa += 1
	return c.cells[code_pointer] // return the javascript function 
}

Cpu.prototype.semi = function(c) {
	c.i = c.r.pop()
	// next
	c.cfa = c.cells[c.i]
	c.i += 1
	// run
	var code_pointer = c.cells[c.cfa]
	c.cfa += 1
	return c.cells[code_pointer]
}

Cpu.prototype.wa = function(k) {
	return this.dict.wa(this.vocabulary, k)
}

Cpu.prototype.ca = function(k) {
	return this.dict.ca(this.vocabulary, k)
}

Cpu.prototype.parse = function(input) {
	var a
	var i
	a = i = this.dict.pointer + 10000
	this.cells[a++] = this.wa('outer')
	this.cells[a++] = undefined
	this.inner(i, input)
	a = i
	delete this.cells[a++]
	delete this.cells[a++]
}

Cpu.prototype.code_address = function(k) { 
/*
	returns the contents of the word's first cell after the header
	if k is a $WORD in the current vocabulary
	it should be an integer
*/
	var word_addr = this.wa(k)
	if(word_addr != undefined)
		return this.cells[word_addr]
}

Cpu.prototype.push = function(v) {
	this.d.push(v)
}

Cpu.prototype.pop = function() {
	var v = this.d.pop()
	return v
}

Cpu.prototype.define = function(o) {
	if(o.word == undefined) return
	v = o.vocabulary || this.vocabulary
	if(o.code == undefined) {
		o.ca = this.ca('colon')
		o.words.push(this.wa('(semi)'))
	} else {
		o.ca = 0
		o.words = [o.code]
	}
	var word_addr = this.dict.define(v, o.word, o.ca, o.words)
	return word_addr
}

Cpu.prototype.primary = function(word, body, vocabulary) { 
	// add body as word into vocabulary or this.vocabulary
	var word_addr = this.dict.define(vocabulary || this.vocabulary, word, 0, [body])
	return word_addr
}

Cpu.prototype.secondary = function(word, body, vocabulary) {
	body.push(this.wa('(semi)'))
	var word_addr = this.dict.define(vocabulary || this.vocabulary, word, this.ca('colon'), body)
	return word_addr
}

Cpu.prototype.execute = function(word_addr) {
	var c_a = this.cells[word_addr]
	var f = this.cells[c_a]
	f && f(this)	
}
Cpu.prototype.tos = function() { return this.d.cells.length -1 }
Cpu.prototype.top = function() { return this.d.top() }

Cpu.prototype.allot = function(n) {
	var a = this.dict.pointer;
	this.dict.pointer += n;
	return a
}
