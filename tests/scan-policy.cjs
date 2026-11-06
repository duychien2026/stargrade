const assert=require('node:assert/strict'),{ScanGate}=require('../public/scan-policy.js');
const g=new ScanGate();assert.equal(g.accept('A',100),false);assert.equal(g.accept('A',750),false);assert.equal(g.accept('A',1400),true);g.latch();assert.equal(g.accept('A',2100),false);
g.pause();assert.equal(g.accept('B',5000),false);g.accept(null,6000);g.accept('B',6500);assert.equal(g.latched,true,'brief loss cannot rearm');g.accept(null,7000);g.accept(null,8500);assert.equal(g.latched,false);assert.equal(g.accept('B',9000),false);assert.equal(g.accept('B',9700),false);assert.equal(g.accept('B',10400),true);g.pause();assert.equal(g.accept('B',11000),false);
console.log('PASS scan gate: stability, changed answers, latch, brief loss, sustained removal, blurred frames');
