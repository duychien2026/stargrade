const examMenuItems=[['keys','Đáp án'],['scan','Chấm bài'],['scan-images','Quét ảnh'],['results','Xem lại'],['exam-stats','Thống kê'],['exam-info','Thông tin']];
function examEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function examMenuIcon(key){
  const paths={keys:'<circle cx="8" cy="12" r="4"/><path d="M12 12h9m-3 0v4m-3-4v3"/>',scan:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>','scan-images':'<path d="m4 4 16 6M4 12h16v8H4zM7 16h.01M11 16h6"/>',results:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>','exam-stats':'<path d="M5 21V13h3v8M11 21V4h3v17M17 21V9h3v12"/>','exam-info':'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'};
  return '<svg viewBox="0 0 24 24" aria-hidden="true">'+paths[key]+'</svg>';
}
function renderExamDashboard(v){
  v.innerHTML=`<section class="exam-dashboard" aria-label="Quản lý bài thi"><div class="exam-dashboard-heading"><button class="exam-back" aria-label="Quay lại danh sách bài thi">←</button><div><h1>${examEscape(state.exam.name)}</h1><p>Lớp: ${examEscape(state.exam.class_name||'Trống')}</p></div></div><nav class="exam-menu" aria-label="Chức năng bài thi">${examMenuItems.map(([key,label])=>`<button class="exam-menu-card" data-exam-page="${key}"><span class="exam-menu-symbol">${examMenuIcon(key)}</span><span>${label}</span><span class="exam-chevron" aria-hidden="true">›</span></button>`).join('')}</nav></section>`;
  v.querySelector('.exam-back').onclick=()=>{state.examContext=false;state.tab='exams';render()};
  v.querySelectorAll('[data-exam-page]').forEach(button=>button.onclick=()=>{state.tab=button.dataset.examPage;render()});
}
function renderExamInfo(v){
  const e=state.exam,points=e.part2_points||[.1,.25,.5,1];
  const pairs=[['Tên bài thi',e.name],['Loại phiếu',MAU[e.sheet_template||'bgd2']?.ten||e.sheet_template],['Lớp',e.class_name||'Trống'],['Mã đề',e.codes.join(', ')],['Phần I',`${e.question_count} câu · ${e.part1_point??.25} điểm/câu`],['Phần II',`${e.part2_count??8} câu · đúng 1/2/3/4 ý: ${points.join(' / ')} điểm`],['Phần III',`${e.part3_count??6} câu · ${e.part3_point??.5} điểm/câu`],['Học sinh trong danh sách',(e.students||[]).length]];
  v.innerHTML=`<section class="card"><h2>Thông tin bài thi</h2><dl class="exam-info">${pairs.map(([label,value])=>`<div><dt>${label}</dt><dd>${examEscape(value)}</dd></div>`).join('')}</dl><div class="actions"><button class="btn primary" id="editCurrentExam">Sửa thông tin bài thi</button><button class="btn" id="examStudentList">Danh sách lớp</button></div></section>`;
  v.querySelector('#editCurrentExam').onclick=()=>renderExamCreation(v,e,()=>renderExamInfo(v));v.querySelector('#examStudentList').onclick=()=>{state.tab='students';render()};
}
function examStatistics(rows){
  const scores=rows.map(row=>Number(row.score)).filter(Number.isFinite),byCode=new Map();
  for(const row of rows){const score=Number(row.score);if(!Number.isFinite(score))continue;const group=byCode.get(row.code)||[];group.push(score);byCode.set(row.code,group)}
  return {count:scores.length,average:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,highest:scores.length?Math.max(...scores):null,lowest:scores.length?Math.min(...scores):null,warnings:rows.filter(row=>row.flags?.length).length,byCode};
}
async function renderExamStatistics(v){
  const exam=state.exam,id=exam.id;v.innerHTML='<section class="card" role="status">Đang tải thống kê…</section>';
  try{const rows=await api('/exams/'+id+'/results');if(!v.isConnected||state.tab!=='exam-stats'||state.exam?.id!==id)return;
    const stats=examStatistics(rows),format=value=>value==null?'—':Number(value.toFixed(2)).toLocaleString('vi-VN');
    const cards=[['Số phiếu đã chấm',stats.count],['Điểm trung bình',format(stats.average)],['Điểm cao nhất',format(stats.highest)],['Điểm thấp nhất',format(stats.lowest)]];
    v.innerHTML=`<section class="card"><h2>Thống kê · ${examEscape(exam.name)}</h2><div class="exam-stat-cards">${cards.map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div><p>${stats.warnings} phiếu có cảnh báo cần kiểm tra.</p>${rows.length?'':'<p class="muted">Chưa có phiếu đã chấm cho bài thi này.</p>'}<div class="actions"><button class="btn" id="statsResults">Xem lại các phiếu</button><a class="btn" href="/api/exams/${id}/export">Xuất bảng điểm CSV</a></div></section><section class="card table-wrap"><h3>Theo mã đề</h3><table><thead><tr><th>Mã đề</th><th>Số phiếu</th><th>Điểm trung bình</th><th>Cao nhất</th></tr></thead><tbody>${[...stats.byCode].sort(([a],[b])=>a.localeCompare(b)).map(([code,scores])=>`<tr><td>${examEscape(code)}</td><td>${scores.length}</td><td>${format(scores.reduce((a,b)=>a+b,0)/scores.length)}</td><td>${format(Math.max(...scores))}</td></tr>`).join('')||'<tr><td colspan="4">Chưa có dữ liệu</td></tr>'}</tbody></table></section>`;
    v.querySelector('#statsResults').onclick=()=>{state.tab='results';render()};
  }catch(error){if(v.isConnected)v.textContent=error.message}
}
