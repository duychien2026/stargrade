// Native dialogs live in the browser's top layer, above headers/stacking contexts.
async function renderReviewResults(v){
  const exam=state.exam,examId=exam.id;
  let rows;try{rows=await api('/exams/'+examId+'/results')}catch(e){v.textContent=e.message;return}
  if(!v.isConnected||state.exam?.id!==examId||state.tab!=='results')return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  for(const old of document.querySelectorAll('.review-dialog,.warnings-dialog')){old.close();old.remove()}
  v.innerHTML=`<div class="card"><div class="actions"><h2 style="margin-right:auto">Kết quả</h2><a class="btn" href="/api/exams/${examId}/export">⬇ Xuất CSV</a></div><div class="table-wrap" id="reviewResultsTable"></div></div>`;
  const dialog=document.createElement('dialog');dialog.className='review-dialog';dialog.setAttribute('aria-labelledby','reviewTitle');
  dialog.innerHTML=`<header class="review-toolbar"><div><h2 id="reviewTitle"></h2><p id="reviewIdentity"></p></div><button type="button" class="btn" id="reviewClose" aria-label="Đóng xem phiếu">Đóng ✕</button></header><div class="review-workspace"><section class="review-image-pane" aria-label="Ảnh và vòng đối chiếu"><p class="review-legend"><span>🟢 Đúng</span><span>🔴 Sai</span><span>🟡 Đáp án đúng</span></p><div id="reviewImage" class="review-sheet"></div></section><section class="review-editor" aria-label="Sửa kết quả nhận dạng"><h3>Sửa kết quả nhận dạng</h3><p class="muted">Chỉnh dữ liệu của phiếu này rồi bấm Lưu và chấm lại.</p><form id="reviewForm"><div class="review-identity-fields"><label>Số báo danh<input id="reviewStudentNo" inputmode="numeric" autocomplete="off"></label><label>Họ tên<input id="reviewStudentName" autocomplete="off"></label><label>Mã đề<select id="reviewCode">${exam.codes.map(code=>`<option value="${esc(code)}">${esc(code)}</option>`).join('')}</select></label></div><div id="reviewAnswerFields"></div></form></section></div><footer class="review-footer"><div class="review-discard hidden" role="alert"><span>Phiếu có thay đổi chưa lưu.</span><button type="button" class="btn danger-btn" id="reviewDiscard">Bỏ thay đổi</button><button type="button" class="btn" id="reviewKeepEditing">Tiếp tục sửa</button></div><div class="review-pagination"><button type="button" class="btn" id="reviewPrevious">← Phiếu trước</button><span id="reviewPosition"></span><button type="button" class="btn" id="reviewNext">Phiếu kế tiếp →</button></div><div class="review-save"><span id="reviewSaveStatus" role="status" aria-live="polite"></span><button type="submit" form="reviewForm" class="btn primary" id="reviewSave">Lưu và chấm lại</button></div></footer>`;
  document.body.appendChild(dialog);
  const warning=document.createElement('dialog');warning.className='warnings-dialog';warning.setAttribute('aria-labelledby','warningsTitle');
  warning.innerHTML='<header class="review-toolbar"><h2 id="warningsTitle">Cảnh báo phiếu chấm</h2><button class="btn" id="warningsClose" aria-label="Đóng cảnh báo">Đóng ✕</button></header><div class="warnings-content"><p id="warningsIdentity"></p><ul id="warningsList"></ul></div>';
  document.body.appendChild(warning);warning.querySelector('#warningsClose').onclick=()=>warning.close();
  const $d=selector=>dialog.querySelector(selector);let current=-1,dirty=false,saving=false,opener=null,pendingLeave=null;
  const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3h.01"/></svg>';
  function drawTable(){
    v.querySelector('#reviewResultsTable').innerHTML=`<table><thead><tr><th>SBD</th><th>Họ tên</th><th>Mã đề</th><th>Điểm</th><th>Chi tiết</th><th>Phiếu làm bài</th><th>Cảnh báo</th></tr></thead><tbody>${rows.map((row,i)=>`<tr><td>${esc(row.student_no)}</td><td>${row.student_name?esc(row.student_name):row.name_image?`<img class="name-crop" src="${esc(row.name_image)}" alt="Họ tên trên phiếu">`:'<span class="muted">Chưa có tên</span>'}</td><td>${esc(row.code)}</td><td class="score">${esc(row.score)}</td><td>I: ${row.parts?.part1??0} · II: ${row.parts?.part2??0} · III: ${row.parts?.part3??0}</td><td><button type="button" class="btn" data-review-index="${i}">${row.image_data?'Xem phiếu làm bài':'Xem kết quả'}</button></td><td>${row.flags?.length?`<button type="button" class="warning-icon" data-warning-index="${i}" aria-label="Xem ${row.flags.length} cảnh báo của phiếu ${esc(row.student_no||row.id)}" title="Xem ${row.flags.length} cảnh báo">${icon}</button>`:'<span class="muted" aria-label="Không có cảnh báo">—</span>'}</td></tr>`).join('')||'<tr><td colspan="7">Chưa có bài đã chấm</td></tr>'}</tbody></table>`;
    v.querySelectorAll('[data-review-index]').forEach(button=>button.onclick=()=>{opener=button;show(Number(button.dataset.reviewIndex));dialog.showModal();$d('#reviewClose').focus()});
    v.querySelectorAll('[data-warning-index]').forEach(button=>button.onclick=()=>{const row=rows[Number(button.dataset.warningIndex)];warning.querySelector('#warningsIdentity').textContent=`SBD: ${row.student_no||'chưa có'} · Mã đề: ${row.code}`;const list=warning.querySelector('#warningsList');list.replaceChildren(...row.flags.map(text=>{const item=document.createElement('li');item.textContent=text;return item}));warning.showModal()});
  }
  const choices=(group,selected,values)=>`<div class="review-choices">${values.map(value=>`<button type="button" class="answer-dot${selected===value?' selected':''}" data-group="${group}" data-value="${value}" aria-pressed="${selected===value}" aria-label="${group.startsWith('p1')?'Câu '+(Number(group.split('-')[1])+1):'Câu '+(Number(group.split('-')[1])+1)+' ý '+('abcd'[Number(group.split('-')[2])])}: ${value==='-'?'bỏ trống':value==='?'?'chưa rõ':value}">${value==='-'?'—':value}</button>`).join('')}</div>`;
  function show(index){
    current=index;dirty=false;pendingLeave=null;$d('.review-discard').classList.add('hidden');const row=rows[index];
    $d('#reviewTitle').textContent='Phiếu làm bài có Số báo danh: '+(row.student_no||'chưa nhận diện');
    $d('#reviewIdentity').textContent=`${row.student_name||'Chưa có tên'} · Mã đề ${row.code} · Điểm ${row.score}`;
    $d('#reviewStudentNo').value=row.student_no||'';$d('#reviewStudentName').value=row.student_name||'';$d('#reviewCode').value=row.code;
    const key=exam.keys.find(item=>item.code===row.code);
    $d('#reviewImage').innerHTML=row.image_data?`<img src="${esc(row.image_data)}" alt="Phiếu làm bài của SBD ${esc(row.student_no||'chưa nhận diện')}"><svg viewBox="0 0 1552 2254" preserveAspectRatio="none" aria-hidden="true">${reviewMarks(row,key)}</svg>`:'<p class="review-no-image">Phiếu này chưa có ảnh lưu. Bạn vẫn có thể sửa dữ liệu nhận dạng.</p>';
    $d('#reviewAnswerFields').innerHTML=`<details open><summary>Phần I · ${exam.question_count} câu</summary><div class="review-part1">${Array.from({length:exam.question_count},(_,q)=>`<div class="review-question"><b>${q+1}</b>${choices('p1-'+q,(row.answers||'')[q]||'-',['A','B','C','D','-','?'])}</div>`).join('')}</div></details>${exam.part2_count?`<details><summary>Phần II · ${exam.part2_count} câu</summary>${Array.from({length:exam.part2_count},(_,q)=>`<fieldset><legend>Câu ${q+1}</legend>${Array.from({length:4},(_,r)=>`<div class="review-question"><b>${'abcd'[r]})</b>${choices('p2-'+q+'-'+r,(row.part2?.[q]||'')[r]||'-',['Đ','S','-','?'])}</div>`).join('')}</fieldset>`).join('')}</details>`:''}${exam.part3_count?`<details open><summary>Phần III · ${exam.part3_count} câu</summary><div class="review-short-grid">${Array.from({length:exam.part3_count},(_,q)=>`<label>Câu ${q+1}<input data-review-short="${q}" value="${esc(row.part3?.[q]||'')}" maxlength="4" placeholder="Ví dụ: -1,2"></label>`).join('')}</div></details>`:''}`;
    $d('#reviewPrevious').disabled=index===0;$d('#reviewNext').disabled=index===rows.length-1;
    $d('#reviewPosition').textContent=`Phiếu ${index+1} / ${rows.length}`;$d('#reviewSaveStatus').textContent='';
    $d('.review-image-pane').scrollTop=0;$d('.review-editor').scrollTop=0;$d('.review-workspace').scrollTop=0;
  }
  function markDirty(){dirty=true;$d('#reviewSaveStatus').textContent='Có thay đổi chưa lưu';$d('#reviewSaveStatus').classList.remove('danger')}
  $d('#reviewForm').addEventListener('input',markDirty);$d('#reviewForm').addEventListener('change',markDirty);
  $d('#reviewAnswerFields').onclick=event=>{const button=event.target.closest('[data-group]');if(!button||saving)return;for(const item of button.parentElement.children){const selected=item===button;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected))}markDirty()};
  function leave(action){if(saving)return;if(dirty){pendingLeave=action;$d('.review-discard').classList.remove('hidden');$d('#reviewKeepEditing').focus()}else action()}
  $d('#reviewPrevious').onclick=()=>{if(current>0)leave(()=>show(current-1))};$d('#reviewNext').onclick=()=>{if(current<rows.length-1)leave(()=>show(current+1))};
  $d('#reviewClose').onclick=()=>leave(()=>dialog.close());dialog.addEventListener('cancel',event=>{event.preventDefault();leave(()=>dialog.close())});
  $d('#reviewDiscard').onclick=()=>{if(saving)return;const action=pendingLeave;pendingLeave=null;dirty=false;$d('.review-discard').classList.add('hidden');action?.()};
  $d('#reviewKeepEditing').onclick=()=>{pendingLeave=null;$d('.review-discard').classList.add('hidden')};
  dialog.addEventListener('close',()=>{const target=opener?.isConnected?opener:v.querySelector('[data-review-index="'+current+'"]');target?.focus()});
  $d('#reviewForm').onsubmit=async event=>{
    event.preventDefault();if(saving)return;
    const selected=group=>$d(`[data-group="${group}"].selected`)?.dataset.value||'-';
    const payload={student_no:$d('#reviewStudentNo').value.trim(),student_name:$d('#reviewStudentName').value.trim(),code:$d('#reviewCode').value,
      answers:Array.from({length:exam.question_count},(_,q)=>selected('p1-'+q)).join(''),
      part2:Array.from({length:exam.part2_count||0},(_,q)=>Array.from({length:4},(_,r)=>selected('p2-'+q+'-'+r)).join('')),
      part3:Array.from($d('#reviewForm').querySelectorAll('[data-review-short]'),input=>input.value.trim())};
    saving=true;$d('#reviewForm').inert=true;for(const id of ['reviewSave','reviewPrevious','reviewNext','reviewClose'])$d('#'+id).disabled=true;
    const status=$d('#reviewSaveStatus');status.textContent='Đang lưu và chấm lại…';status.classList.remove('danger');
    try{const result=await api(`/exams/${examId}/submissions/${rows[current].id}`,{method:'PUT',body:JSON.stringify(payload)});rows[current]=result.submission;show(current);drawTable();$d('#reviewSaveStatus').textContent='Đã lưu và cập nhật điểm, cảnh báo.'}
    catch(error){status.textContent=error.message;status.classList.add('danger')}
    finally{saving=false;$d('#reviewForm').inert=false;$d('#reviewSave').disabled=false;$d('#reviewClose').disabled=false;$d('#reviewPrevious').disabled=current===0;$d('#reviewNext').disabled=current===rows.length-1}
  };
  drawTable();
  if(state.reviewSubmissionId){const index=rows.findIndex(row=>row.id===state.reviewSubmissionId);delete state.reviewSubmissionId;if(index>=0){show(index);dialog.showModal()}}
}
