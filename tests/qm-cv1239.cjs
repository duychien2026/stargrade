const fs=require('fs'),vm=require('vm'),assert=require('assert'),OMR=require('../public/reference-omr.js');
const ctx={OMR,window:{}};vm.createContext(ctx);
for(const file of ['reference-templates.js','qm-sheet.js','qm-cv1239-sheet.js'])vm.runInContext(fs.readFileSync('public/'+file,'utf8'),ctx);
const tpl=ctx.MAU.qmcv1239,b=fs.readFileSync('tmp/qm-cv1239-test.bmp'),w=b.readInt32LE(18),h=b.readInt32LE(22),bits=b.readUInt16LE(28),stride=Math.ceil(w*bits/32)*4,offset=b.readUInt32LE(10),d=new Uint8Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=offset+(h-1-y)*stride+x*bits/8;d[y*w+x]=Math.round((b[i]+b[i+1]+b[i+2])/3)}
const read=(g={w,h,d})=>ctx.window.readQMSheet(g,tpl);
let r=read();assert(r,'Blank alignment');assert.equal(r.p1,'-'.repeat(40));assert.equal(r.p2,'-'.repeat(32));assert.deepEqual(Array.from(r.p3),Array(6).fill(''));
// Independently measured centers on the actual source, not template projections.
function fill(x,y){for(let yy=Math.round(y)-10;yy<=y+10;yy++)for(let xx=Math.round(x)-10;xx<=x+10;xx++)if(Math.hypot(xx-x,yy-y)<=10)d[yy*w+xx]=20}
for(let i=0;i<40;i++)fill([180,257,333,409][i%4]+Math.floor(i/10)*365.5,883+i%10*35.6);
for(let i=0;i<32;i++){const q=Math.floor(i/4);fill((q%2?[333,409]:[180,257])[i%2]+Math.floor(q/2)*365.5,1415+i%4*35.8)}
const short=['1012','-212','1,23','-0,0','342',''];
short.forEach((value,q)=>Array.from(value).forEach((ch,col)=>fill(180+q*243.6+col*35.7,ch==='-'?1738:ch===','?1774:1809+Number(ch)*35.7)));
'01234567'.split('').forEach((v,i)=>fill(1141+i*29.2,322+v*41.4));'0103'.split('').forEach((v,i)=>fill([1445,1474,1503,1532][i],322+v*41.4));
function check(r){assert(r,'Filled alignment');assert.equal(r.p1,'ABCD'.repeat(10));assert.equal(r.p2,'DS'.repeat(16));assert.equal(r.sbd,'01234567');assert.equal(r.made,'0103');assert.deepEqual(Array.from(r.p3),short)}check(read());
const W=1450,H=2050,inv=OMR.phepChieu([[85,30],[1400,105],[1350,2010],[25,1910]],[[0,0],[w,0],[w,h],[0,h]]),warped=new Uint8Array(W*H).fill(235);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const [sx,sy]=OMR.ap(inv,x,y),xx=Math.round(sx),yy=Math.round(sy);if(xx>=0&&yy>=0&&xx<w&&yy<h)warped[y*W+x]=Math.round(d[yy*w+xx]*(.72+.20*x/W))}check(read({w:W,h:H,d:warped}));
console.log('PASS QM CV1239: blank, 40 ABCD, 32 D/S, 6 short answers, signs/commas/blanks, leading-zero SBD/code, perspective + uneven light');
