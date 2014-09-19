
newStack = function() { return new Array(); }

newStacks = function(names) {
	var s = {};
	for(var i = 0; i < names.length; i++) {
		s[names[i]] = newStack();
	}
	return s;
}

push = function(cells, e) {
	cells.push(e);
}

pop = function(cells) {
	if(cells.length == 0) {
		throw "Underflow";
	}
	var v = cells.pop();
	return v;
}

top = function(cells) {
	if(cells.length == 0) {
		throw "Underflow";
	}
	return cells[cells.length - 1];
}

tos = function(cells) {
	return cells.length - 1;
}

toString = function(cells) {
	if(cells.length == 0) return "";

	var s = '( ';
	for(var i = cells.length-1; i > 0; i--) {
		s = s.concat(cells[i]);
		s = s.concat(', ');
	}
	s = s.concat(cells[0]);
	s = s.concat(' )');
	return s;
}

exports.newStack = newStack;
exports.newStacks = newStacks;
exports.push = push;
exports.pop = pop;
exports.top = top;
exports.tos = tos;
exports.toString = toString;

