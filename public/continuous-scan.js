const cameraSessions=new Map();
function cameraPreferences(){
  const defaults={mode:'single',auto:false,save:true,sound:false,vibrate:false};
  try{const saved=JSON.parse(localStorage.getItem('starmind-camera-preferences')||'{}');return {...defaults,...Object.fromEntries(Object.keys(defaults).filter(k=>k==='mode'?['single','continuous'].includes(saved[k]):typeof saved[k]==='boolean').map(k=>[k,saved[k]]))}}catch{return defaults}
}
function installContinuousScanner(v){
  const exam=state.exam,examId=exam.id;
  if(!cameraSessions.has(examId))cameraSessions.set(examId,{saved:new Map(),pending:[]});
  const session=cameraSessions.get(examId),bar=document.createElement('div');bar.className='scan-session';v.querySelector('.camera-actions').after(bar);
  if(!v.querySelector('#saveSheetImage')){const download=document.createElement('button');download.className='btn';download.id='saveSheetImage';download.textContent='⇩ Lưu ảnh bài thi';download.onclick=()=>{if(!state.image)return toast('Chưa có ảnh phiếu');const link=document.createElement('a');link.href=state.image;link.download='phieu-bai-thi.jpg';link.click()};v.querySelector('#preview').after(download)}
  const refresh=()=>{if(!bar.isConnected)return;bar.replaceChildren();const label=document.createElement('b');label.textContent=`Phiên quét: ${session.saved.size} đã lưu · ${session.pending.length} cần kiểm tra`;bar.append(label);const pending=document.createElement('button');pending.className='btn';pending.textContent='Xem phiếu cần kiểm tra';pending.disabled=!session.pending.length;pending.onclick=showPending;bar.append(pending);const note=document.createElement('small');note.textContent='Phiếu cần kiểm tra chỉ giữ trong phiên trang này; hãy lưu trước khi tải lại hoặc đóng trang.';bar.append(note)};
  function review(id){state.reviewSubmissionId=id;state.tab='results';render()}
  async function putDraft(draft){
    state.image=draft.payload.image_data;state.nameImage=draft.payload.name_image;state.cameraDraft=draft;
    for(const [id,value] of Object.entries({studentNo:draft.payload.student_no,studentName:draft.payload.student_name,code:draft.payload.code,answers:draft.payload.answers,p2answers:draft.payload.part2.join(' | '),p3answers:draft.payload.part3.join(' | ')}))v.querySelector('#'+id).value=value||'';
    const image=v.querySelector('#preview');image.src=state.image;image.classList.remove('hidden');v.querySelector('#omrReadout').textContent='Phiếu cần kiểm tra: '+draft.reason;v.querySelector('#studentNo').scrollIntoView({block:'center',behavior:'smooth'});
  }
  function showPending(){
    const dialog=document.createElement('dialog');dialog.className='scan-pending-list';const title=document.createElement('h3');title.textContent='Phiếu cần kiểm tra (chưa lưu)';dialog.append(title);
    session.pending.forEach((draft,i)=>{const row=document.createElement('div'),button=document.createElement('button');button.className='btn';button.textContent=`Phiếu ${i+1} · ${draft.payload.student_no||'chưa rõ SBD'} · ${draft.reason}`;button.onclick=()=>{dialog.close();putDraft(draft)};row.append(button);dialog.append(row)});
    const close=document.createElement('button');close.className='btn';close.textContent='Đóng';close.onclick=()=>dialog.close();dialog.append(close);dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
  }
  async function save(payload){
    try{return await api(`/exams/${examId}/submissions`,{method:'POST',body:JSON.stringify(payload)})}
    catch(error){if(error.status!==409||!error.existing_id)throw error;
      const choice=await new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='scan-duplicate';const text=document.createElement('p');text.textContent='Có phiếu cùng SBD/mã đề hoặc cùng nội dung đã lưu. Bạn muốn xử lý thế nào?';dialog.append(text);for(const [label,value]of [['Giữ bài đã lưu','cancel'],['Xem bài đã lưu','view'],['Chấm lại và thay thế','replace'],['Lưu thành phiếu khác','another']]){const button=document.createElement('button');button.className='btn';button.textContent=label;button.onclick=()=>{dialog.close();resolve(value)};dialog.append(button)}dialog.oncancel=()=>resolve('cancel');dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal()});
      if(choice==='view'){document.querySelector('.continuous-camera')?.close();review(error.existing_id);return null}
      if(choice==='cancel')return null;
      return api(`/exams/${examId}/submissions`,{method:'POST',body:JSON.stringify({...payload,...(choice==='replace'?{replace_submission_id:error.existing_id}:{allow_duplicate:true})})});
    }
  }
  const originalSubmit=v.querySelector('#submit').onclick;
  v.querySelector('#submit').onclick=async()=>{
    const draft=state.cameraDraft;if(!draft||draft.examId!==examId)return originalSubmit();
    const button=v.querySelector('#submit');button.disabled=true;
    try{const payload={...draft.payload,auto_save:false,student_no:v.querySelector('#studentNo').value.trim(),student_name:v.querySelector('#studentName').value.trim(),code:v.querySelector('#code').value.trim(),answers:v.querySelector('#answers').value.toUpperCase().replace(/\s/g,''),part2:v.querySelector('#p2answers').value.split('|').map(s=>s.trim()),part3:v.querySelector('#p3answers').value.split('|').map(s=>s.trim())};if(!exam.part2_count)payload.part2=[];if(!exam.part3_count)payload.part3=[];const content=JSON.stringify({...payload,client_request_id:null});if(draft.manualContent!==content){draft.manualContent=content;draft.manualId=crypto.randomUUID?.()||('manual-'+Date.now()+'-'+Math.random().toString(36).slice(2))}payload.client_request_id=draft.manualId;const row=await save(payload);if(row){row._sessionPrevious=session.saved.get(row.id)||null;session.saved.set(row.id,row);session.pending=session.pending.filter(x=>x!==draft);state.cameraDraft=null;toast(`Đã lưu: ${row.score} điểm`);refresh();v.querySelector('#clear')?.onclick?.()||v.querySelector('#studentNo')?.focus?.();}}catch(error){toast(error.message)}finally{button.disabled=false}
  };
  const oldFile=v.querySelector('#image').onchange;v.querySelector('#image').onchange=event=>{state.cameraDraft=null;return oldFile(event)};
  const oldClear=v.querySelector('#clear').onclick;v.querySelector('#clear').onclick=()=>{state.cameraDraft=null;oldClear()};
  if(state.cameraDraft?.examId===examId)putDraft(state.cameraDraft);refresh();
  v.querySelector('#openCamera').textContent='▣ Chấm bằng camera';v.querySelector('#openCamera').onclick=open;
  async function open(){
    closeSheetCamera();
    const dialog=document.createElement('dialog');dialog.className='continuous-camera';dialog.setAttribute('aria-label','Chấm phiếu bằng camera');
    dialog.innerHTML=`<header><button data-close>Đóng</button><strong>Chấm camera</strong><button data-settings aria-label="Cấu hình khi chấm">⚙</button></header><div class="scan-stage"><video autoplay muted playsinline></video><div class="scan-frame">${'<i></i>'.repeat(4)}</div></div><dialog class="scan-settings" aria-labelledby="scanSettingsTitle"><h3 id="scanSettingsTitle">Cấu hình khi chấm</h3><label>Chế độ chấm<select data-mode aria-label="Chế độ chấm"><option value="single">Chấm từng phiếu</option><option value="continuous">Chấm liên tục</option></select></label><label><input type="checkbox" data-auto> Tự chụp khi phiếu ổn định</label><label data-save-wrap><input type="checkbox" data-save> Tự lưu phiếu rõ khi chấm liên tục</label><label><input type="checkbox" data-sound> Âm báo sau khi lưu</label><label><input type="checkbox" data-vibrate> Rung sau khi lưu</label><button data-torch hidden>Đèn: TẮT</button><p data-count></p><button data-pending>Cần kiểm tra</button><button data-finish>Kết thúc phiên chấm</button><p>Từng phiếu: chụp xong sẽ mở ảnh và đáp án để kiểm tra trước khi lưu.</p><button data-settings-close>Xong</button></dialog><section class="scan-result" hidden aria-live="polite"><p></p><button data-review>Xem lại</button><button data-undo>Hoàn tác</button><button data-dismiss>Ẩn</button></section><footer><div class="scan-status" role="status">Đang mở camera…</div><div class="scan-controls"><button data-switch>Đổi camera</button><button class="scan-capture" data-capture disabled>Chụp phiếu</button></div></footer>`;
    document.body.append(dialog);dialog.showModal();
    const q=s=>dialog.querySelector(s),video=q('video'),frame=q('.scan-frame'),gate=new ScanGate(),preferences=cameraPreferences(),settings=q('.scan-settings');let stream=null,timer=null,resultTimer=null,live=true,working=false,auto=preferences.auto,torch=false,last=null,lastDraft=null,previousPoints=null,generation=0,audioContext=null;
    const status=text=>{q('.scan-status').textContent=text},counts=()=>{q('[data-count]').textContent=`Đã lưu ${session.saved.size} · Chờ ${session.pending.length}`;refresh()};counts();
    function stop(){generation++;stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null}
    function close(){live=false;clearTimeout(timer);clearTimeout(resultTimer);if(settings.open)settings.close();stop();window.removeEventListener('resize',layout);audioContext?.close();refresh()}
    dialog.addEventListener('close',event=>{if(event.target!==dialog)return;close();dialog.remove()});q('[data-close]').onclick=q('[data-finish]').onclick=()=>dialog.close();
    q('[data-pending]').onclick=()=>{dialog.close();showPending()};q('[data-settings]').onclick=()=>settings.showModal();q('[data-settings-close]').onclick=()=>settings.close();
    function storePreferences(){preferences.mode=q('[data-mode]').value;for(const name of ['auto','save','sound','vibrate'])preferences[name]=q(`[data-${name}]`).checked;auto=preferences.auto;q('[data-save-wrap]').hidden=preferences.mode==='single';try{localStorage.setItem('starmind-camera-preferences',JSON.stringify(preferences))}catch{}gate.pause()}
    q('[data-mode]').value=preferences.mode;for(const name of ['auto','save','sound','vibrate'])q(`[data-${name}]`).checked=preferences[name];q('[data-save-wrap]').hidden=preferences.mode==='single';settings.addEventListener('change',storePreferences);
    q('[data-sound]').onchange=()=>{if(q('[data-sound]').checked){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){audioContext ||= new Audio();audioContext.resume()}}};
    q('[data-dismiss]').onclick=()=>q('.scan-result').hidden=true;
    q('[data-review]').onclick=()=>{if(lastDraft){const draft=lastDraft;dialog.close();putDraft(draft)}else if(last){dialog.close();review(last.id)}};
    q('[data-undo]').onclick=async()=>{if(!last)return;const row=last;q('[data-undo]').disabled=true;try{await api(`/exams/${examId}/submissions/${row.id}/undo`,{method:'POST',body:JSON.stringify({token:row._capture_token})});if(row._sessionPrevious)session.saved.set(row.id,row._sessionPrevious);else session.saved.delete(row.id);last=null;q('.scan-result').hidden=true;counts();status('Đã hoàn tác. Đưa phiếu ra khỏi khung trước khi quét lại.')}catch(error){status(error.message)}finally{q('[data-undo]').disabled=false}};
    function layout(){
      if(!video.videoWidth)return;const area=q('.scan-stage').getBoundingClientRect(),scale=Math.min(area.width/video.videoWidth,area.height/video.videoHeight),vw=video.videoWidth*scale,vh=video.videoHeight*scale,aspect=sheetAspect(),w=Math.min(vw*.96,vh*.9*aspect),h=w/aspect;frame.style.cssText=`width:${w}px;height:${h}px;left:${(area.width-w)/2}px;top:${(area.height-h)/2}px`;
      const tpl=activeSheetTemplate(),k=tpl.khung;tpl.moc.slice(0,4).forEach((m,i)=>{const marker=frame.children[i];marker.style.left=((m.x-k[0])/(k[2]-k[0])*100)+'%';marker.style.top=((m.y-k[1])/(k[3]-k[1])*100)+'%'})
    }
    window.addEventListener('resize',layout);
    function crop(maxWidth=0){
      layout();const vr=video.getBoundingClientRect(),fr=frame.getBoundingClientRect(),scale=Math.min(vr.width/video.videoWidth,vr.height/video.videoHeight),ox=(vr.width-video.videoWidth*scale)/2,oy=(vr.height-video.videoHeight*scale)/2;
      const sx=Math.max(0,(fr.left-vr.left-ox)/scale),sy=Math.max(0,(fr.top-vr.top-oy)/scale),sw=Math.min(video.videoWidth-sx,fr.width/scale),sh=Math.min(video.videoHeight-sy,fr.height/scale);const ratio=maxWidth?Math.min(1,maxWidth/sw):1,c=document.createElement('canvas');c.width=Math.round(sw*ratio);c.height=Math.round(sh*ratio);c.getContext('2d',{willReadFrequently:true}).drawImage(video,sx,sy,sw,sh,0,0,c.width,c.height);return c;
    }
    async function start(){
      stop();const current=generation;q('[data-capture]').disabled=true;q('[data-torch]').hidden=true;
      try{const next=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:sheetCameraFacing},width:{ideal:1920},height:{ideal:1080},aspectRatio:{ideal:4/3},resizeMode:{ideal:'none'}}});if(!live||current!==generation){next.getTracks().forEach(t=>t.stop());return}stream=next;video.srcObject=stream;await video.play();if(!live||current!==generation)return;layout();q('[data-capture]').disabled=false;status('Canh bốn mốc đen vào khung. Giữ máy yên.');const track=stream.getVideoTracks()[0],caps=track.getCapabilities?.()||{};
        q('[data-torch]').hidden=!caps.torch;q('[data-torch]').onclick=async()=>{try{await track.applyConstraints({advanced:[{torch:!torch}]});torch=!torch;q('[data-torch]').textContent='Đèn: '+(torch?'BẬT':'TẮT')}catch{status('Camera không bật được đèn')}};
      }catch(error){if(live)status('Không mở được camera: '+error.message)}
    }
    q('[data-switch]').onclick=async()=>{if(working)return;sheetCameraFacing=sheetCameraFacing==='environment'?'user':'environment';gate.reset();torch=false;await start()};
    function signature(r){return JSON.stringify([r.sbd,r.made,r.p1.slice(0,exam.question_count),r.p2.slice(0,(exam.part2_count||0)*4),r.p3.slice(0,exam.part3_count||0)])}
    function read(canvas){const ctx=canvas.getContext('2d'),rgb=ctx.getImageData(0,0,canvas.width,canvas.height),gray=OMR.xam(rgb),tpl=activeSheetTemplate(),result=['qm40','bgd2025original','bgd2025pink','phutho','tnmaker40','qmcv1239','qmcv4'].includes(exam.sheet_template)?readQMSheet(gray,tpl):OMR.docAnh(gray,tpl,OMR.thuNho(gray,700));return {gray,rgb,tpl,result}}
    function quality({gray,rgb,tpl,result}){
      if(!result||result.soMoc<Math.max(4,tpl.moc.length-2))return 'Chưa thấy đủ mốc đen';
      const points=tpl.moc.slice(0,4).map(m=>OMR.ap(result.H,m.x,m.y));if(points.some(([x,y])=>x<2||y<2||x>=gray.w-2||y>=gray.h-2))return 'Đưa trọn bốn góc phiếu vào khung';
      const light=OMR.kiemChe(gray,result.H,tpl,rgb);if(light.giay<100)return 'Ảnh tối, hãy thêm ánh sáng';if(light.che)return 'Phiếu bị che hoặc có bóng đậm';
      if(OMR.doNet(gray,result.H,tpl)>.15)return 'Ảnh mờ, giữ máy yên và lấy nét';
      const moving=previousPoints&&points.some((p,i)=>Math.hypot(p[0]-previousPoints[i][0],p[1]-previousPoints[i][1])>gray.w*.012);previousPoints=points;return moving?'Giữ máy yên…':'';
    }
    function validate(payload){
      const key=exam.keys.find(k=>k.code===payload.code);if(!key)return 'Mã đề chưa khớp đáp án';
      if(!['qm40','tnmaker40'].includes(exam.sheet_template)&&!new RegExp('^\\d{'+(['tn40n','qmcv4'].includes(exam.sheet_template)?6:8)+'}$').test(payload.student_no))return 'Số báo danh chưa rõ';
      for(const source of [payload,key]){if(!new RegExp('^[ABCD]{'+exam.question_count+'}$').test(source.answers||''))return 'Phần I có câu trống/chưa rõ hoặc đáp án chưa đủ';for(let i=0;i<(exam.part2_count||0);i++)if(!/^[ĐS]{4}$/.test(source.part2?.[i]||''))return 'Phần II cần kiểm tra';for(let i=0;i<(exam.part3_count||0);i++)if(!/^-?\d+(,\d+)?$/.test(source.part3?.[i]||''))return 'Phần III cần kiểm tra'}return '';
    }
    function showResult(){clearTimeout(resultTimer);q('.scan-result').hidden=false;resultTimer=setTimeout(()=>{q('.scan-result').hidden=true},5000)}
    function pending(draft,reason){draft.reason=reason;session.pending.push(draft);lastDraft=draft;counts();status('Đã nhận dạng, chưa lưu: '+reason);showResult();q('.scan-result p').textContent='Cần kiểm tra: '+reason;q('[data-review]').hidden=false;q('[data-review]').textContent='Kiểm tra';q('[data-undo]').hidden=true;q('[data-dismiss]').textContent='Ẩn';}
    async function capture(expected=null){
      if(working||!stream||!video.videoWidth)return;working=true;gate.latch();q('[data-capture]').disabled=true;const current=generation;status('Đang căn ảnh và nhận dạng…');
      try{
        const captureQuality=quality(read(crop(900)));const canvas=crop(),blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.98));if(!blob)throw Error('Không chụp được ảnh');const result=await recognizeReferenceSheet(new File([blob],'phieu-camera.jpg',{type:'image/jpeg'}));if(!live||current!==generation)return;
        const payload={capture_source:'camera',client_request_id:crypto.randomUUID?.()||('capture-'+Date.now()+'-'+Math.random().toString(36).slice(2)),student_no:result.student_no||'',student_name:'',code:result.code||'',answers:result.part1.slice(0,exam.question_count),part2:result.part2.slice(0,exam.part2_count||0),part3:result.part3Text.slice(0,exam.part3_count||0),image_data:result.rectifiedImage,name_image:await cropCandidateName(result.rectifiedImage),auto_save:true};
        if(!live||current!==generation)return;
        const draft={examId,payload};const actual=JSON.stringify([payload.student_no,payload.code,payload.answers,payload.part2.join('').replace(/Đ/g,'D'),payload.part3]);let reason=captureQuality||validate(payload);if(expected&&actual!==expected)reason='Kết quả ảnh đầy đủ khác ảnh xem trước';
        if(preferences.mode==='single'){draft.reason=reason||'Kiểm tra phiếu trước khi lưu';session.pending.push(draft);dialog.close();putDraft(draft);return}
        if(!q('[data-save]').checked)reason='Tự lưu đang tắt';if(reason){pending(draft,reason);return}
        let row;try{row=await save(payload)}catch(error){pending(draft,'Chưa lưu: '+error.message);return}if(!row){status('Đã giữ bài cũ. Đưa phiếu ra khỏi khung.');return}
        row._sessionPrevious=session.saved.get(row.id)||null;session.saved.set(row.id,row);counts();if(!live)return;last=row;lastDraft=null;showResult();q('.scan-result p').textContent=`Đã lưu · ${row.score} điểm · SBD ${row.student_no||'—'} · Mã đề ${row.code}`;q('[data-review]').textContent='Xem lại';q('[data-review]').hidden=false;q('[data-undo]').hidden=false;q('[data-dismiss]').textContent='Ẩn';status('Đã lưu. Đưa phiếu cũ ra khỏi khung rồi đưa phiếu tiếp theo.');
        if(q('[data-vibrate]').checked)navigator.vibrate?.(100);if(q('[data-sound]').checked&&audioContext){const o=audioContext.createOscillator(),gain=audioContext.createGain();o.connect(gain);gain.connect(audioContext.destination);gain.gain.value=.08;o.frequency.value=880;o.start();o.stop(audioContext.currentTime+.14)}
      }catch(error){if(live)status('Chưa nhận dạng được: '+error.message+' · Đưa phiếu ra rồi thử lại.')}
      finally{working=false;if(live)q('[data-capture]').disabled=false}
    }
    q('[data-capture]').onclick=()=>capture();
    async function tick(){
      if(!live)return;
      if(!working&&!settings.open&&stream&&video.readyState>=2&&!document.hidden){try{const reading=read(crop(900)),reason=quality(reading);frame.classList.toggle('ready',!reason);if(reason){if(reading.result&&reading.result.soMoc>=4)gate.pause();else gate.accept(null,performance.now());if(!gate.latched)status(reason);previousPoints=reason.includes('mốc')?null:previousPoints}else{const stable=gate.accept(signature(reading.result),performance.now());if(gate.latched)status('Đưa phiếu cũ ra khỏi khung để quét phiếu tiếp theo.');else status(stable?'Phiếu ổn định, sẵn sàng chấm':'Đã thấy phiếu · giữ máy yên…');if(auto&&stable)await capture(signature(reading.result))}}catch{gate.accept(null,performance.now());status('Canh phiếu vào bốn góc khung')}}
      if(live)timer=setTimeout(tick,650);
    }
    await start();tick();
  }
}
