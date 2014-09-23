
var Cpu = require('./Cpu.js');

n = Cpu.spawn();

var t = Cpu.States[n].dict.wa(Cpu.States[n].vocabulary, 't');
console.log(t)
Cpu.States[n].dict.cells[Cpu.States[n].dict.cells[t]](Cpu.States[n], Cpu.States[n].dict);
