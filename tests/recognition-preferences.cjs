const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),OMR=require('../public/reference-omr.js');
const tpl={p1:[[[0,0],[1,0],[2,0],[3,0]]],p2:[],p3:[],sbd:[],made:[],p3hang:[],sbdNhan:[],madeNhan:[]};
const M={nh:[['I.',1,0,4]],fs:[.8,.28,0,0],NGV:{'I.':{nen:0,thap:.2,cao:.45,F:.8}},F:.8};
assert.equal(OMR.quyetDinh(M,tpl,1).p1,'A');const strict=OMR.quyetDinh(M,tpl,1,{erasure:true});assert.equal(strict.p1,'*');assert(strict.nghi.includes('I.1'));
const clean={...M,fs:[.8,0,0,0]};assert.equal(OMR.quyetDinh(clean,tpl,1,{erasure:true}).p1,'A');
const context={state:{user:{settings:{scan_resolution:'low'}}}};vm.createContext(context);vm.runInContext(fs.readFileSync('public/user-preferences.js','utf8'),context);assert.equal(context.scanImageLimit(),1600);assert.equal(context.scanCameraConstraints('environment').width.ideal,1280);context.state.user.settings.scan_resolution='high';assert.equal(context.scanImageLimit(),4000);assert.equal(context.scanCameraConstraints('environment').width.ideal,3840);
console.log('PASS recognition preferences: unchanged standard reading, erased competitor flagged, clean marks preserved, effective resolution settings');
