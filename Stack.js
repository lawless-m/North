

function Stack() {
	this.cells = new Array()
}

Stack.prototype.error = function(e) {
	alert(e)
	throw e
}

Stack.prototype.push = function(e) {
	this.cells.push(e)
}

Stack.prototype.pop = function() {
	if(this.cells.length == 0)
		this.error("Stack Underflow - Pop")
	var v = this.cells.pop()
	return v
}

Stack.prototype.top = function() {
	if(this.cells.length == 0)
		this.error("Stack Underflow - Top")
	return this.cells[this.cells.length - 1]
}

Stack.prototype.toString = function() {
	if(this.cells.length == 0) return ""

	var s = '( '
	for(var i = this.cells.length-1; i > 0; i--) {
		s = s.concat(this.cells[i])
		s = s.concat(', ')
	}
	s = s.concat(this.cells[0])
	s = s.concat(' )')
	return s
}