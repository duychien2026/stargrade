const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
(async()=>{
const calls=[],fields={'#submit':{disabled:false},'#studentNo':{value:'001'},'#studentName':{value:''},'#code':{value:'1001'},'#answers':{value:'AB'},'#p2answers':{value:''},'#p3answers':{value:''}};
const v={querySelector:key=>fields[key]},row={id:9,score:.5,parts:{part1:.5,part2:0,part3:0}};
const c={state:{exam:{id:1},image:null},crypto:require('crypto'),part2Count:()=>0,part3Count:()=>0,toast:()=>{},gradingMessage:async()=>false,api:async(url,opt)=>{calls.push({url,...opt});return opt.method==='PUT'?{ok:true,submission:{...row,score:.25}}:row}};vm.createContext(c);vm.runInContext(fs.readFileSync('public/user-preferences.js','utf8'),c);
let r=await c.saveRecognizedGrading(v);assert.equal(r.id,9);assert.equal(calls[0].method,'POST');assert.equal(v.savedGradingSubmission.id,9);assert.equal(fields['#submit'].disabled,false);
fields['#answers'].value='AC';r=await c.saveRecognizedGrading(v);assert.equal(calls[1].url,'/exams/1/submissions/9');assert.equal(calls[1].method,'PUT');assert.equal(r.score,.25);assert.equal(v.savedGradingSubmission.id,9);
v.savedGradingSubmission=null;await c.saveRecognizedGrading(v);assert.equal(calls[2].method,'POST');assert.notEqual(JSON.parse(calls[0].body).request_id,JSON.parse(calls[2].body).request_id);
v.savedGradingSubmission=null;c.api=async()=>{throw {kind:'answers',messages:['Blank']}};r=await c.saveRecognizedGrading(v);assert.equal(r,null);assert.equal(v.savedGradingSubmission,null);assert.equal(fields['#submit'].disabled,false);
c.state.user={settings:{show_grading_result:false,auto_save_grading:true}};c.document={querySelector:()=>v};let hiddenSaves=0;c.api=async()=>{hiddenSaves++;return row};await c.showGradingResult();assert.equal(hiddenSaves,1,'Hidden popup must still auto save');c.state.user.settings.auto_save_grading=false;await c.showGradingResult();assert.equal(hiddenSaves,1,'Both options off must not save');
c.state.tab='scan';c.render=()=>{throw Error('Saving navigated away')};c.installGradingPreferences(v);await fields['#submit'].onclick();assert.equal(c.state.tab,'scan','Manual save must stay on grading page');assert.equal(v.savedGradingSubmission.id,9);
console.log('PASS auto save: create once, edit updates same sheet with normalized result, new capture inserts, cancelled warning does not claim saved');
})().catch(e=>{console.error(e);process.exit(1)});
