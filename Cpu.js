
function Cpu() {
	this.cfa = 0
	this.i = 0
	this.dict = new Dict()
	this.cells = this.dict.cells
	this.r = new Stack()
	this.d = new Stack()
	this.j = new Stack()
	this.cons = document.getElementById('console')
	this.kbd = document.getElementById('keyboard')
	this.stack = document.getElementById('stack')
	this.history = document.getElementById('history')
	this.words = document.getElementById('words')
	this.mode = false // execute mode
	this.state = false // executing
	this.vocabulary = 'context'
	this.pad = ""
	this.token = ""
}

Cpu.prototype.drawstack = function() {
	if(!do_drawstack) return
	kill_all_children(this.stack)
	for(var i = this.d.cells.length-1; i>=0; i--) {
		if(this.d.cells[i] == undefined) {
			println(this.stack, "undefined")
		} else if(this.d.cells[i].constructor == Array) {
			println(this.stack, "Array[" + this.d.cells[i].length + "]");
		} else if(isFunction(this.d.cells[i])) {
			println(this.stack, this.d.cells[i].toString(), {'color':'green'})
		} else {
			println(this.stack, this.d.cells[i].toString())
		}
	}
}

Cpu.prototype.inner = function(pointer, input) {
	var dp = this.dict.pointer
	this.pad = input
	this.i = pointer
	var f = this.next(this)
	var trace = " "
	var dp_trace = ""
	var sp4 = '\u00A0\u00A0\u00A0\u00A0'
	while(isFunction(f)) {
		if(do_dump) {
			trace = trace.concat(strstr(sp4, this.r.cells.length))
			trace = trace.concat(this.cells[this.cfa-4])
			dp_trace = this.dict.cells[this.dict.pointer]
			if(dp_trace == undefined)
				dp_trace = ""
		}

		f = f(this)

		if(do_dump) {
			trace = trace.concat(this.d.toString())
			trace = trace.concat(" [ " + dp_trace + " ]")
			if(this.words)
				println(this.words, trace)
			trace = " "
			dp_trace = ""
		}
	}
	if(this.history)
		println(this.history, input)
	if(this.pad != "")
		this.dict.pointer = dp
	return this.pad
}

Cpu.prototype.colon = function(c) {
	c.r.push(c.i)
	c.i = c.cfa
	return c.next(c)
}

Cpu.prototype.run = function(c) {
	var code_pointer = c.cells[c.cfa]
	c.cfa += 1
	return c.cells[code_pointer]
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
	this.drawstack()
}

Cpu.prototype.pop = function() {
	var v = this.d.pop()
	this.drawstack()
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

Cpu.prototype.get_and_parse = function(url) {
	var dp = this.dict.pointer;
	var entry = this.dict.entry;
	
	response = http_request(url);
	if(response.responseText != "") {
		this.parse(response.responseText)
	}
} 