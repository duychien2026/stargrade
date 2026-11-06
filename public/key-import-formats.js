(function(root){
  const text=v=>String(v??'').trim(),fold=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
  const tf=v=>text(v).toUpperCase().replace(/D/g,'Đ').replace(/\s/g,'');
  function code(v){const s=text(v);if(!/^\d{1,4}$/.test(s))throw Error('Mã đề không hợp lệ: '+s);return s.padStart(4,'0')}
  function record(raw){
    if(!raw||typeof raw!=='object')throw Error('Dữ liệu đáp án không hợp lệ.');
    if(raw.answers==null&&raw.part1==null)throw Error('Nguồn nhập chưa có trường đáp án Phần I.');
    const answers=text(raw.answers??raw.part1).toUpperCase().replace(/[\s;|]/g,'');if(!/^[ABCD?*-]*$/.test(answers))throw Error('Phần I chỉ nhận A/B/C/D, dấu - hoặc ?.');
    const split=v=>Array.isArray(v)?v:text(v).split('|');
    const p2=raw.part2==null?null:split(raw.part2).map(v=>{const s=tf(v);if(!/^[ĐS?*-]{0,4}$/u.test(s))throw Error('Phần II chỉ nhận tối đa 4 ý Đ/S mỗi câu.');return s.padEnd(4,'-')});
    const p3=raw.part3==null?null:split(raw.part3).map(v=>{const s=text(v).replace('.',',');if(!/^[\d,?*-]{0,4}$/.test(s))throw Error('Phần III có giá trị không hợp lệ: '+s);return s});
    if(!answers.replace(/[-?*]/g,'')&&!p2?.some(s=>/[ĐS]/u.test(s))&&!p3?.some(Boolean))throw Error('Không có đáp án trong dữ liệu.');
    return {code:code(raw.code),answers,part2:p2,part3:p3};
  }
  function unique(keys){const seen=new Set();for(const key of keys){if(seen.has(key.code))throw Error('Mã đề '+key.code+' bị trùng trong nguồn nhập.');seen.add(key.code)}if(!keys.length)throw Error('Không tìm thấy đáp án trong nguồn nhập.');return keys}
  function parseQR(payload){
    let data;try{data=JSON.parse(text(payload))}catch(e){throw Error('QR chưa đúng định dạng đáp án JSON. Không mở liên kết từ QR.')}
    let rows;if(Array.isArray(data))rows=data;else if(data&&Array.isArray(data.keys))rows=data.keys;else if(data&&data.code!=null)rows=[data];else if(data&&typeof data==='object')rows=Object.entries(data).filter(([key])=>/^\d{1,4}$/.test(key)).map(([key,value])=>{if(typeof value!=='string')return {...value,code:key};const parts=value.split('#');if(parts.length>3)throw Error('QR có nhiều hơn ba phần đáp án.');return {code:key,answers:parts[0],part2:parts.length>1?(parts[1]?parts[1].split('_'):[]):null,part3:parts.length>2?(parts[2]?parts[2].split('_'):[]):null}});else throw Error('QR không chứa đáp án.');
    return unique(rows.map(record));
  }
  function parseWorkbook(book,XLSX){
    const keys=[];
    for(const name of book.SheetNames){const sheet=book.Sheets[name];if(!sheet['!ref'])continue;const range=XLSX.utils.decode_range(sheet['!ref']);if(range.e.r>2000||range.e.c>500)throw Error('Bảng Excel quá lớn. Chỉ dùng bảng đáp án tối đa 2000 dòng, 500 cột.');
      const rows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:''});let start=rows.findIndex(row=>/cau/.test(fold(row[0]))&&(/de/.test(fold(row[0]))||/ma/.test(fold(row[0]))));if(start<0)continue;
      const header=rows[start],vertical=/^cau/.test(fold(header[0]));let entries=[];
      if(vertical){for(let col=1;col<header.length;col++){if(!text(header[col]))continue;entries.push({code:header[col],cells:rows.slice(start+1).filter(row=>text(row[0])).map(row=>[text(row[0]),row[col]])})}}
      else for(const row of rows.slice(start+1)){if(!text(row[0]))continue;entries.push({code:row[0],cells:header.slice(1).map((label,i)=>[text(label),row[i+1]])})}
      for(const entry of entries){let phase=1,lastN=0,seenTF=false,plainTF=0,plainShort=0;const p1=[],p2=[],p3=[],used=new Set();
        for(const [label,value] of entry.cells){const s=text(value),f=fold(label),sub=f.match(/^(?:cau\s*)?(\d+)\s*([abcd])$/),num=Number(f.replace(/^cau\s*/,''));if(!sub&&!Number.isInteger(num))continue;if(!sub&&num<1)continue;
          if(sub){phase=2;seenTF=true;const q=Number(sub[1])-1,r='abcd'.indexOf(sub[2]);if(q>99)throw Error('Số câu Phần II không hợp lệ.');const k='2:'+q+':'+r;if(used.has(k))throw Error('Cột/ý bị trùng: '+label);used.add(k);p2[q]||=['-','-','-','-'];const v=tf(s);if(v&&!/^[ĐS?*-]$/u.test(v))throw Error('Ý Đ/S không hợp lệ ở '+label);p2[q][r]=v||'-';continue}
          if(phase===2&&seenTF){phase=3;lastN=0}
          if(vertical&&!seenTF&&s){if(/^[ĐDS?*-]{4}$/u.test(s.toUpperCase()))phase=2;else if(/^[\d,.-]+$/.test(s))phase=3;else if(phase>1&&/^[ABCD]$/i.test(s))throw Error('Thứ tự các phần trong Excel chưa rõ.');}
          if(phase===1){if(num>200)throw Error('Số câu Phần I quá lớn.');if(used.has('1:'+num))throw Error('Câu Phần I bị trùng: '+num);used.add('1:'+num);p1[num-1]=s.toUpperCase()||'-'}
          else if(phase===2){p2[plainTF++]=tf(s).padEnd(4,'-')}
          else{if(num<lastN&&!vertical)throw Error('Số câu Phần III bị đảo thứ tự.');lastN=num;p3[vertical?plainShort++:num-1]=s}
        }
        keys.push(record({code:entry.code,answers:Array.from({length:p1.length},(_,i)=>p1[i]||'-').join(''),part2:p2.length?Array.from({length:p2.length},(_,i)=>Array.isArray(p2[i])?p2[i].join(''):p2[i]||'----'):null,part3:p3.length?Array.from({length:p3.length},(_,i)=>p3[i]||''):null}));
      }
    }return unique(keys);
  }
  function fit(source,counts,targetCode,existing={}){
    const n=[counts.part1,counts.part2,counts.part3];if(source.answers.slice(n[0]).replace(/-/g,''))throw Error('Phần I có đáp án vượt '+n[0]+' câu. Hãy sửa số câu của bài thi.');
    if(source.part2?.slice(n[1]).some(s=>/[ĐS?*]/u.test(s)))throw Error('Phần II vượt '+n[1]+' câu.');if(source.part3?.slice(n[2]).some(Boolean))throw Error('Phần III vượt '+n[2]+' câu.');
    return {code:targetCode,answers:source.answers.slice(0,n[0]).padEnd(n[0],'-'),part2:Array.from({length:n[1]},(_,i)=>source.part2==null?(existing.part2?.[i]||'----'):(source.part2[i]||'----')),part3:Array.from({length:n[2]},(_,i)=>source.part3==null?(existing.part3?.[i]||''):(source.part3[i]||'')),image_data:source.image_data||existing.image_data||null};
  }
  const api={parseQR,parseWorkbook,fit,record};root.AnswerKeyImport=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
