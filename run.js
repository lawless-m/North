
var Dict = require('./Dict.js');
var Stack = require('./Stack.js');
var Cpu = require('./Cpu.js');
var Fcpu = require('./Fcpu.js');

var states = [];

spawn = function() {
	states.push( {
		cpu: Cpu.newState(),
		stacks: Stack.newStacks(['d', 'r', 'j']),
		dict: Dict.newDict(Dict),
		ram: []
	} )
	return states.length;
}

spawn();

Fcpu.initFcpu(Cpu, Dict, states[0]);

console.log(states[0]);
