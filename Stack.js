
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

exports.new = newStack;

