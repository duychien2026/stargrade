const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('public/exam-dashboard.js','utf8'),context);
const empty=context.examStatistics([]);assert.equal(empty.count,0);assert.equal(empty.average,null);assert.equal(empty.highest,null);assert.equal(empty.lowest,null);
const stats=context.examStatistics([{code:'0101',score:0,flags:[]},{code:'0101',score:9.25,flags:['Cần kiểm tra']},{code:'0102',score:7.5,flags:[]},{code:'0102',score:3.25,flags:[]}]);
assert.equal(stats.count,4);assert.equal(stats.average,5);assert.equal(stats.lowest,0);assert.equal(stats.highest,9.25);assert.equal(stats.warnings,1);assert.deepEqual(Array.from(stats.byCode.get('0101')),[0,9.25]);assert.deepEqual(Array.from(stats.byCode.get('0102')),[7.5,3.25]);
const invalid=context.examStatistics([{code:'x',score:'bad',flags:[]}]);assert.equal(invalid.count,0);assert.equal(invalid.average,null);
console.log('PASS exam statistics: empty results, zero score, decimal average, min/max, warnings, per-code groups');
