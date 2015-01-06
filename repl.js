// node repl.js


var net = require('net');

var Cpu = require('./Cpu.js');

var repl = net.createServer();

var vtable = { 
	  'dump_dict' : Cpu.dump_dict
	, 'dump_state' : Cpu.dump_state
	, 'traceON' : function() { Cpu.trace(true); }
	, 'traceOFF' : function() { Cpu.trace(false); } 
};


repl.on('connection', function(client) {
		client.write('OK >');
		var n = Cpu.spawn(client.write);
		var input = "";
		client.on('data', function(data) {
			var txt = "" + data + "";
			txt = txt.replace("\r", "");
			var bits = txt.split("\n", 2);
			if(bits.length > 1) {
				input += bits[0];
				if(input in vtable) {
					vtable[input](Cpu.States[n]);
				} else {
					Cpu.parse(Cpu.States[n], input);
					client.write(Cpu.States[n].output);
					Cpu.States[n].output = "";
				}
				client.write('OK >');
				input = "";
			} else {
				input += txt;
			}
		});
	});

repl.listen('4000')
