// var util = require('util'), EventEmitter = require('events').EventEmitter;



var net = require('net');

var Cpu = require('./Cpu.js');

var repl = net.createServer();

repl.on('connection', function(client) {
		client.write('OK >');
		var n = Cpu.spawn();
		var input = "";
		client.on('data', function(data) {
			var txt = data.toString('utf8');
			var bits = txt.split("\n", 2);
			if(bits.length > 1) {
				input += bits[0];
				Cpu.parse(Cpu.States[n], input);
				input = "";
			} else {
				input += txt;
			}
		});
	});

repl.listen('4000')
