function renderExamManager(v){
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  v.innerHTML=`<section class="card"><div class="actions"><h2 style="margin-right:auto">Danh sách bài thi</h2><button class="btn primary" id="newExam">Tạo bài thi</button></div>${state.exams.map(exam=>`<div class="row exam-list-row" data-exam-row="${exam.id}"><button type="button" class="exam-row-open" data-exam-open="${exam.id}" aria-label="Quản lý bài thi ${esc(exam.name)}"><b>${esc(exam.name)}</b><span class="muted">${esc(MAU[exam.sheet_template||'bgd2']?.ten||'')} · Lớp: ${esc(exam.class_name||'Trống')}<br>Phần I: ${exam.question_count} câu · Phần II: ${exam.part2_count??8} câu · Phần III: ${exam.part3_count??6} câu</span></button><div class="actions"><button class="btn" data-exam-open="${exam.id}">Mở</button><button class="btn" data-exam-edit="${exam.id}">Sửa bài thi</button><button class="btn danger-btn" data-exam-delete="${exam.id}">Xóa</button></div></div>`).join('')||'<p class="muted">Chưa có bài thi. Bấm Tạo bài thi để bắt đầu.</p>'}</section>`;
  v.querySelector('#newExam').onclick=()=>renderExamCreation(v);
  let opening=false;
  const open=async id=>{if(opening)return;opening=true;try{const exam=await api('/exams/'+id);if(!v.isConnected||state.tab!=='exams')return;state.exam=exam;state.examContext=true;state.image=null;state.nameImage=null;state.tab='exam-menu';render()}catch(e){toast(e.message)}finally{opening=false}};
  v.querySelectorAll('[data-exam-open]').forEach(button=>button.onclick=()=>open(button.dataset.examOpen));
  v.querySelectorAll('[data-exam-row]').forEach(row=>row.onclick=event=>{if(!event.target.closest('button,a,input,select,textarea'))open(row.dataset.examRow)});
  v.querySelectorAll('[data-exam-edit]').forEach(button=>button.onclick=async()=>{try{await selectExam(button.dataset.examEdit);if(v.isConnected)renderExamCreation(v,state.exam)}catch(e){toast(e.message)}});
  v.querySelectorAll('[data-exam-delete]').forEach(button=>button.onclick=async()=>{const exam=state.exams.find(e=>e.id===Number(button.dataset.examDelete));if(!confirm(`Xóa bài thi “${exam?.name||''}” cùng toàn bộ đáp án và kết quả?`))return;try{await api('/exams/'+exam.id,{method:'DELETE'});if(state.exam?.id===exam.id)state.exam=null;await loadExams();renderExamManager(v);toast('Đã xóa bài thi')}catch(e){toast(e.message)}});
}
function renderExamCreation(v,exam=null,onCancel=()=>renderExamManager(v)){
  // Reuse the existing template limits and editable scoring fields.
  renderExamForm(v);const card=v.querySelector('.card');for(const other of [...v.children])if(other!==card)other.remove();
  const get=id=>v.querySelector('#'+id),form=document.createElement('form');form.className='exam-creation';
  const heading=card.querySelector('h2');heading.textContent=exam?'Sửa bài thi':'Tạo bài mới';
  const name=get('examName');name.required=!!exam;name.placeholder=gradingSettings().default_exam_name;name.maxLength=160;name.id='examName';name.previousElementSibling.textContent='1. Tên bài thi';name.previousElementSibling.htmlFor=name.id;
  const type=get('sheetTemplate'),typeLabel=type.previousElementSibling;typeLabel.textContent='2. Loại phiếu';typeLabel.htmlFor=type.id;
  const typeGroup=document.createElement('div'),typeRow=document.createElement('div');typeRow.className='sheet-type-row';
  const preview=document.createElement('button');preview.type='button';preview.className='btn sheet-preview-button';preview.setAttribute('aria-label','Xem hình các mẫu phiếu');preview.title='Xem hình các mẫu phiếu';preview.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="16" cy="8" r="2"/><path d="m3 17 5-6 5 6 3-3 5 6"/></svg>';
  typeRow.append(type,preview);typeGroup.append(typeLabel,typeRow,get('templateHint'));
  preview.onclick=()=>openSheetPicker(type,preview);
  const classGroup=document.createElement('div');classGroup.innerHTML='<label for="examClass">3. Lớp</label><input id="examClass" placeholder="Trống" maxlength="120" autocomplete="off">';
  const scoreHeading=card.querySelector('h3');scoreHeading.textContent='4. Cách tính điểm';
  const codes=get('codes'),codesGroup=codes.parentElement;codes.previousElementSibling.textContent='Mã đề (cách nhau bằng dấu phẩy)';codes.previousElementSibling.htmlFor=codes.id;codes.value='1001, 1002, 1003, 1004';codes.required=true;codes.placeholder='1001, 1002, 1003, 1004';
  // Changing the sheet must retain the exam codes the user has entered.
  const changeTemplate=type.onchange;type.onchange=()=>{const entered=codes.value;changeTemplate();codes.value=entered};
  const hidden=document.createElement('div');hidden.hidden=true;hidden.append(get('subject').parentElement);
  form.append(name.parentElement,codesGroup,typeGroup,classGroup,scoreHeading,card.querySelector('.score-settings'),hidden);
  const actions=document.createElement('div');actions.className='actions';actions.innerHTML='<button class="btn" type="button" id="cancelNewExam">Hủy</button><button class="btn primary" type="submit" id="saveExamForm">'+(exam?'Lưu':'Tạo')+'</button>';
  form.append(actions);card.replaceChildren(heading,form);
  if(exam){
    if(exam.sheet_template==='tn40n')type.insertAdjacentHTML('beforeend','<option value="tn40n">Phiếu ngang cũ · mã đề 3 số</option>');
    type.value=exam.sheet_template||'bgd2';type.onchange();type.disabled=true;get('templateHint').textContent+=' · Không thể đổi loại phiếu khi sửa.';
    for(const [id,value]of Object.entries({examName:exam.name,examClass:exam.class_name||'',subject:exam.subject,codes:exam.codes.join(','),count1:exam.question_count,count2:exam.part2_count??8,count3:exam.part3_count??6,part1Point:exam.part1_point??.25,part3Point:exam.part3_point??.5,...Object.fromEntries((exam.part2_points||[.1,.25,.5,1]).map((p,i)=>['part2Point'+(i+1),p]))}))get(id).value=value;
  }
  get('cancelNewExam').onclick=onCancel;
  form.onsubmit=async event=>{event.preventDefault();if(!form.reportValidity())return;const button=get('saveExamForm');button.disabled=true;
    try{const payload={name:name.value.trim(),sheet_template:type.value,class_name:get('examClass').value.trim(),subject:get('subject').value,codes:get('codes').value.split(','),question_count:get('count1').value,part2_count:get('count2').value,part3_count:get('count3').value,part1_point:get('part1Point').value,part3_point:get('part3Point').value,...Object.fromEntries([1,2,3,4].map(i=>['part2_point_'+i,get('part2Point'+i).value]))};if(exam&&!payload.name){name.focus();throw Error('Vui lòng nhập tên bài thi')}const result=await api('/exams'+(exam?'/'+exam.id:''),{method:exam?'PUT':'POST',body:JSON.stringify(payload)});await loadExams();await selectExam(result.id);state.tab='keys';render();toast(exam?'Đã lưu bài thi. Bạn có thể cập nhật đáp án.':'Đã tạo bài thi. Nhập đáp án để bắt đầu chấm.')}catch(e){toast(e.message);button.disabled=false}
  };
  name.focus();
}
function openSheetPicker(select,trigger){
  const dialog=document.createElement('dialog');dialog.className='sheet-picker';dialog.setAttribute('aria-label','Chọn mẫu phiếu');
  const header=document.createElement('header');header.className='sheet-picker-header';
  const back=document.createElement('button');back.type='button';back.className='btn';back.textContent='← Quay lại';
  const title=document.createElement('h2');title.textContent=select.disabled?'Xem mẫu phiếu':'Chọn mẫu phiếu';header.append(back,title);
  const list=document.createElement('div');list.className='sheet-picker-grid';
  for(const sheet of sheetCatalog){
    const active=sheet.id===select.value,card=document.createElement('article');card.className='sheet-picker-card'+(active?' selected':'');
    const image=document.createElement('img');image.src=sheet.image;image.alt='Mẫu phiếu '+sheet.name;image.loading='lazy';
    const footer=document.createElement('div');footer.className='sheet-picker-footer';
    const name=document.createElement('h3');name.textContent=sheet.name;
    const button=document.createElement('button');button.type='button';button.className='btn'+(active?' primary':'');button.textContent=active?'Đang chọn':'Chọn phiếu';button.disabled=select.disabled;button.setAttribute('aria-label',(active?'Đang chọn: ':'Chọn phiếu: ')+sheet.name);
    if(active)button.setAttribute('aria-current','true');
    button.onclick=()=>{if(select.value!==sheet.id){select.value=sheet.id;select.dispatchEvent(new Event('change',{bubbles:true}))}dialog.close()};
    footer.append(name,button);card.append(image,footer);list.append(card);
  }
  back.onclick=()=>dialog.close();dialog.append(header,list);dialog.addEventListener('close',()=>{dialog.remove();trigger.focus()},{once:true});document.body.append(dialog);dialog.showModal();back.focus();
}
function installClassicCamera(v){
  const sheetCard=v.querySelector('.sheet-card'),identity=v.querySelector('.card>.grid');if(sheetCard&&identity)identity.before(sheetCard);
  for(const [id,title,details,count]of [['answers','Đáp án Phần I','A/B/C/D, dùng ? cho ô cần kiểm tra',part1Count()],['p2answers','Đáp án Phần II','Mỗi câu 4 ký tự Đ/S, ngăn cách bằng dấu |',part2Count()],['p3answers','Đáp án Phần III','Mỗi câu ngăn cách bằng dấu |',part3Count()]]){
    const field=v.querySelector('#'+id),label=field.previousElementSibling;label.htmlFor=id;label.textContent=title+' (có thể sửa thủ công)';label.classList.remove('hidden');field.classList.remove('hidden');field.disabled=count===0;field.placeholder=count===0?'Bài thi này không sử dụng '+title.toLowerCase():details;
  }
  const old=v.querySelector('#sheetCamera'),dialog=document.createElement('dialog');dialog.id='sheetCamera';dialog.className=old.className;dialog.setAttribute('aria-label','Chụp phiếu trả lời');dialog.append(...old.childNodes);old.replaceWith(dialog);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeSheetCamera()});installGradingPreferences(v);
  if(state.tab==='scan-images'){
    v.querySelector('h2').textContent='Quét ảnh';v.querySelector('.card>p').textContent='Chọn ảnh phiếu đã chụp hoặc quét, kiểm tra kết quả nhận dạng rồi bấm Chấm và lưu.';
    v.querySelector('#openCamera').hidden=true;v.querySelector('#openCamera').style.display='none';
    v.querySelector('#image').parentElement.firstChild.textContent='▧ Chọn ảnh phiếu';
  }
}
