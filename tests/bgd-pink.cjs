const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),OMR=require('../public/reference-omr.js');
const c={OMR,window:{}};vm.createContext(c);for(const f of ['reference-templates.js','qm-sheet.js','bgd-original-sheet.js','bgd-pink-sheet.js'])vm.runInContext(fs.readFileSync('public/'+f,'utf8'),c);
const tpl=c.MAU.bgd2025pink,b=fs.readFileSync('tmp/bgd-pink-test.bmp'),w=b.readInt32LE(18),h=b.readInt32LE(22),bits=b.readUInt16LE(28),stride=Math.ceil(w*bits/32)*4,offset=b.readUInt32LE(10),d=new Uint8Array(w*h);
// Use the exact browser grayscale conversion on the supplied color image.
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=offset+(h-1-y)*stride+x*bits/8;d[y*w+x]=(b[i+2]*77+b[i+1]*150+b[i]*29)>>8}
const read=(g={w,h,d})=>c.window.readQMSheet(g,tpl);let r=read();assert(r,'Blank alignment');assert.equal(r.p1,'-'.repeat(40));assert.equal(r.p2,'-'.repeat(32));assert.deepEqual(Array.from(r.p3),Array(6).fill(''));assert.equal(r.sbd,'________');assert.equal(r.made,'');
function fill(x,y){for(let yy=Math.round(y)-14;yy<=y+14;yy++)for(let xx=Math.round(x)-14;xx<=x+14;xx++)if(Math.hypot(xx-x,yy-y)<=14)d[yy*w+xx]=20}
// Pixel centers measured on the supplied 2457 x 3508 pink form.
for(let i=0;i<40;i++)fill([266,365,464,562][i%4]+Math.floor(i/10)*555,1288+i%10*59.1);
for(let i=0;i<32;i++){const q=Math.floor(i/4);fill((q%2?[464,562]:[266,365])[i%2]+Math.floor(q/2)*555,2120+i%4*59.1)}
const short=['1012','-212','1,23','-0,0','342',''];short.forEach((text,q)=>Array.from(text).forEach((ch,col)=>fill(254+q*354.5+col*59.1,ch==='-'?2565:ch===','?2631:2697+Number(ch)*65.85)));
'01234567'.split('').forEach((n,i)=>fill(1721+i*47.5,400.5+Number(n)*69.075));'1004'.split('').forEach((n,i)=>fill([2150,2198,2244,2292][i],400.5+Number(n)*69.075));
function check(r){assert(r);assert.equal(r.p1,'ABCD'.repeat(10));assert.equal(r.p2,'DS'.repeat(16));assert.equal(r.sbd,'01234567');assert.equal(r.made,'1004');assert.deepEqual(Array.from(r.p3),short)}check(read());
const W=1600,H=2300,inv=OMR.phepChieu([[75,30],[1570,90],[1530,2270],[25,2190]],[[0,0],[w,0],[w,h],[0,h]]),warped=new Uint8Array(W*H).fill(235);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const [sx,sy]=OMR.ap(inv,x,y),xx=Math.round(sx),yy=Math.round(sy);if(xx>=0&&yy>=0&&xx<w&&yy<h)warped[y*W+x]=Math.round(d[yy*w+xx]*(.75+.18*x/W))}check(read({w:W,h:H,d:warped}));
assert.notEqual(tpl,c.MAU.bgd2025original);assert.notEqual(tpl.p1,c.MAU.bgd2025original.p1);
console.log('PASS pink source: blank; 40 ABCD; 32 D/S; 6 short answers; signs/commas/blanks; SBD/code; perspective and uneven light; independent template');
