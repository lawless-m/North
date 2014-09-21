
var Dict = require('./Dict.js');
var Stack = require('./Stack.js');
var Cpu = require('./Cpu.js');
var Fcpu = require('./Fcpu.js');

n = Cpu.spawn(Stack.new(), Stack.new(), Stack.new(), Dict.new());
Fcpu.initFcpu(Cpu, Dict, n);

var t = Cpu.States[n].dict.wa(Cpu.States[n].vocabulary, 't');
Cpu.States[n].dict.cells[Cpu.States[n].dict.cells[t]](Cpu.States[n], Cpu.States[n].dict);
