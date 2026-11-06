// QM 2025 CV4 landscape: source coordinates are measured on the 1485 x 788 sheet.
(function(){
  const p=(x,y)=>[x/100,y/100],m=(ten,x,y,s=19)=>({ten,x:x/100,y:y/100,s:s/100});
  MAU.qmcv4={ten:'QM2025-CV4 Ngang',r:.105,khung:[0,0,14.85,7.88],
    moc:[m('TL',62,63,32),m('TR',1433,63,32),m('BR',1433,726,32),m('BL',62,726,32),
      m('S1',198,377),m('S2',200,673),
      ...[418,578,719,860,1001,1141,1282].flatMap((x,i)=>[m('A'+i,x,351),m('B'+i,x,701)]),
      ...[860,1001,1141,1282].map((x,i)=>m('T'+i,x,93))],
    p1:Array.from({length:12},(_,i)=>[449,475,502,529].map(x=>p(x,377+i*26.85))),
    p2:Array.from({length:16},(_,i)=>[890,916].map(x=>p(x+Math.floor(i/4)*140.5,152+i%4*27.4))),
    p3:Array.from({length:6},(_,q)=>Array.from({length:4},(_,col)=>{
      const x=610+q*140.5+col*26.3;
      return [p(x,377),p(x,403.5),...Array.from({length:10},(_,d)=>p(x,431+d*26.85))];
    })),p3hang:['-',',','0','1','2','3','4','5','6','7','8','9'],
    sbd:Array.from({length:6},(_,col)=>Array.from({length:10},(_,d)=>p(223+col*26.5,403.5+d*27.15))),
    sbdNhan:Array.from({length:10},(_,d)=>String(d)),
    made:Array.from({length:4},(_,col)=>Array.from({length:10},(_,d)=>p(91+col*26.3,403.5+d*27.15))),
    madeNhan:Array.from({length:10},(_,d)=>String(d))};
})();
