const fs=require('fs'),vm=require('vm'),assert=require('assert'),OMR=require('../public/reference-omr.js');
const ctx={OMR,window:{}};vm.createContext(ctx);
for(const file of ['reference-templates.js','qm-sheet.js','bgd-original-sheet.js','phu-tho-sheet.js'])vm.runInContext(fs.readFileSync('public/'+file,'utf8'),ctx);
const tpl=ctx.MAU.phutho,b=fs.readFileSync('tmp/phu-tho-test.bmp'),w=b.readInt32LE(18),h=b.readInt32LE(22),bits=b.readUInt16LE(28),stride=Math.ceil(w*bits/32)*4,offset=b.readUInt32LE(10),d=new Uint8Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=offset+(h-1-y)*stride+x*bits/8;d[y*w+x]=Math.round((b[i]+b[i+1]+b[i+2])/3)}
const read=(gray={w,h,d})=>ctx.window.readQMSheet(gray,tpl);
let result=read();assert(result,'Blank sheet alignment');assert.equal(result.p1,'-'.repeat(50));assert.equal(result.p2,'-'.repeat(40));assert.deepEqual(Array.from(result.p3),Array(12).fill(''));
// Paint at independently measured source-image bubble centers, not projected template points.
function fill(x,y){for(let yy=Math.round(y)-8;yy<=y+8;yy++)for(let xx=Math.round(x)-8;xx<=x+8;xx++)if(Math.hypot(xx-x,yy-y)<=8)d[yy*w+xx]=15}
for(let i=0;i<50;i++)fill([168,224,280,337][i%4]+Math.floor(i/10)*296.7,756+i%10*32.25);
for(let i=0;i<40;i++){const q=Math.floor(i/4);fill((q%2?[282,332]:[168,218])[i%2]+Math.floor(q/2)*296.7,1202+i%4*34.7)}
const short=['1012','-212','1,23','-0,0','342','','-123','0,12','5678','-1,2','98','0'];
short.forEach((value,q)=>Array.from(value).forEach((ch,col)=>fill(168+q%6*242.7+col*39.8,(q<6?1441:1914)+(ch==='-'?0:ch===','?30:62+Number(ch)*31.45))));
'01234567'.split('').forEach((v,i)=>fill(1162+i*31.8,221+v*41.7));'0102'.split('').forEach((v,i)=>fill([1443,1475,1507,1539][i],221+v*41.7));
function check(r){assert(r,'Filled sheet alignment');assert.equal(r.p1,'ABCD'.repeat(12)+'AB');assert.equal(r.p2,'DS'.repeat(20));assert.equal(r.sbd,'01234567');assert.equal(r.made,'0102');assert.deepEqual(Array.from(r.p3),short)}
check(read());
// Camera-like perspective and lighting gradient: all three sections must still match.
const W=1450,H=2050,src=[[0,0],[w,0],[w,h],[0,h]],dst=[[85,30],[1400,105],[1350,2010],[25,1910]],inverse=OMR.phepChieu(dst,src),warped=new Uint8Array(W*H).fill(235);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const [sx,sy]=OMR.ap(inverse,x,y),xx=Math.round(sx),yy=Math.round(sy);if(xx>=0&&yy>=0&&xx<w&&yy<h)warped[y*W+x]=Math.round(d[yy*w+xx]*(.72+.20*x/W))}
check(read({w:W,h:H,d:warped}));
assert.equal(ctx.MAU.bgd2025original.p1.length,40);assert.equal(ctx.MAU.bgd2025original.p3.length,6);assert.equal(ctx.MAU.qm40.sbd.length,0);
console.log('PASS Phú Thọ: blank, 50 ABCD, 40 D/S, 12 short answers, signs/commas/trailing blanks, SBD, code, perspective + uneven light');
