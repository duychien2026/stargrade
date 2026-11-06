const fs=require('fs'),vm=require('vm'),assert=require('assert'),OMR=require('../public/reference-omr.js');
const c={OMR,window:{}};vm.createContext(c);for(const f of ['reference-templates.js','qm-sheet.js','tnmaker-sheet.js'])vm.runInContext(fs.readFileSync('public/'+f,'utf8'),c);
const tpl=c.MAU.tnmaker40,b=fs.readFileSync('tmp/tnmaker-test.bmp'),w=b.readInt32LE(18),h=b.readInt32LE(22),bits=b.readUInt16LE(28),stride=Math.ceil(w*bits/32)*4,offset=b.readUInt32LE(10),d=new Uint8Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=offset+(h-1-y)*stride+x*bits/8;d[y*w+x]=Math.round((b[i]+b[i+1]+b[i+2])/3)}
const read=(g={w,h,d})=>c.window.readQMSheet(g,tpl);
let r=read();assert(r,'Blank alignment');assert.equal(r.p1,'-'.repeat(40));assert.equal(r.made,'');assert.equal(r.sbd,'');
// Independent source pixel centers, rather than template-projected fills.
function fill(x,y){for(let yy=Math.round(y)-17;yy<=y+17;yy++)for(let xx=Math.round(x)-17;xx<=x+17;xx++)if(Math.hypot(xx-x,yy-y)<=17)d[yy*w+xx]=20}
for(let i=0;i<40;i++)fill([420,503,586,668][i%4]+Math.floor(i/10)*493.5,991+i%10*64.75);
'0104'.split('').forEach((v,i)=>fill([2140,2184,2228,2272][i],250+v*63.8));
function check(r){assert(r,'Filled alignment');assert.equal(r.p1,'ABCD'.repeat(10));assert.equal(r.made,'0104');assert.equal(r.sbd,'');assert.equal(r.p2,'');assert.equal(r.p3.length,0)}check(read());
const W=1800,H=1320,dst=[[60,30],[1740,85],[1690,1280],[20,1210]],inv=OMR.phepChieu(dst,[[0,0],[w,0],[w,h],[0,h]]),warped=new Uint8Array(W*H).fill(240);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const [sx,sy]=OMR.ap(inv,x,y),xx=Math.round(sx),yy=Math.round(sy);if(xx>=0&&xx<w&&yy>=0&&yy<h)warped[y*W+x]=Math.round(d[yy*w+xx]*(.75+.2*x/W))}check(read({w:W,h:H,d:warped}));
assert.equal(c.MAU.tn40n.sbd.length,6);assert.equal(c.MAU.tn40n.made.length,3);
console.log('PASS TNMaker: blank, all 40 answers, 4-digit code 0104, no SBD, perspective/light; legacy geometry preserved');
