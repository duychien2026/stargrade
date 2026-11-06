const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),OMR=require('../public/reference-omr.js');
const c={OMR,window:{}};vm.createContext(c);
for(const f of ['reference-templates.js','qm-sheet.js','qm-cv4-sheet.js'])vm.runInContext(fs.readFileSync('public/'+f,'utf8'),c);
const tpl=c.MAU.qmcv4,b=fs.readFileSync('tmp/qm-cv4-test.bmp'),w=b.readInt32LE(18),h=b.readInt32LE(22),bits=b.readUInt16LE(28),stride=Math.ceil(w*bits/32)*4,offset=b.readUInt32LE(10),d=new Uint8Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=offset+(h-1-y)*stride+x*bits/8;d[y*w+x]=Math.round((b[i]+b[i+1]+b[i+2])/3)}
const read=(g={w,h,d})=>c.window.readQMSheet(g,tpl);
let r=read();assert(r,'Blank alignment');assert.equal(r.p1,'-'.repeat(12));assert.equal(r.p2,'-'.repeat(16));assert.deepEqual(Array.from(r.p3),Array(6).fill(''));assert.match(r.sbd,/^[_-]*$/);assert.match(r.made,/^[_-]*$/);
// Independent image coordinates; exercise signs, commas and trailing empty columns.
function fill(x,y){for(let yy=Math.round(y)-8;yy<=y+8;yy++)for(let xx=Math.round(x)-8;xx<=x+8;xx++)if(Math.hypot(xx-x,yy-y)<=8)d[yy*w+xx]=20}
for(let i=0;i<12;i++)fill([449,475,502,529][i%4],377+i*26.85);
for(let i=0;i<16;i++)fill([890,916][i%2]+Math.floor(i/4)*140.5,[152,181,207,234][i%4]);
const short=['1012','-212','1,23','-0,0','342',''];
short.forEach((v,q)=>Array.from(v).forEach((ch,col)=>fill(610+q*140.5+col*26.3,ch==='-'?377:ch===','?403.5:431+Number(ch)*26.85)));
'012345'.split('').forEach((v,i)=>fill(223+i*26.5,403.5+Number(v)*27.15));'1002'.split('').forEach((v,i)=>fill(91+i*26.3,403.5+Number(v)*27.15));
function check(r){assert(r,'Filled alignment');assert.equal(r.p1,'ABCD'.repeat(3));assert.equal(r.p2,'DS'.repeat(8));assert.equal(r.sbd,'012345');assert.equal(r.made,'1002');assert.deepEqual(Array.from(r.p3),short)}check(read());
const W=1400,H=850,dst=[[65,20],[1370,80],[1320,825],[20,755]],inv=OMR.phepChieu(dst,[[0,0],[w,0],[w,h],[0,h]]),warped=new Uint8Array(W*H).fill(235);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const [sx,sy]=OMR.ap(inv,x,y),xx=Math.round(sx),yy=Math.round(sy);if(xx>=0&&xx<w&&yy>=0&&yy<h)warped[y*W+x]=Math.round(d[yy*w+xx]*(.72+.2*x/W))}check(read({w:W,h:H,d:warped}));
// Export a synthetic filled sheet for the browser integration test.
const out=Buffer.from(b);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=offset+(h-1-y)*stride+x*bits/8;out[i]=out[i+1]=out[i+2]=d[y*w+x]}fs.writeFileSync('tmp/qm-cv4-filled.bmp',out);
console.log('PASS QM CV4: blank, 12 ABCD, 16 D/S, signs/commas/blank columns, 6-digit SBD, 4-digit code, perspective and lighting');
