<?php
require __DIR__ . '/../src/bootstrap.php';
require __DIR__ . '/../src/omr.php';
require __DIR__ . '/../src/scoring.php';
require __DIR__ . '/../src/submission-edit.php';
require __DIR__ . '/../src/camera-submissions.php';
require __DIR__ . '/../src/grading-preferences.php';
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH)?:'/';$method=$_SERVER['REQUEST_METHOD'];
if(!str_starts_with($path,'/api/')){readfile(__DIR__.'/app.html');exit;}
$data=store();$u=user();$body=json_input();
if($path==='/api/auth/register'&&$method==='POST'){if(strlen(trim((string)($body['username']??'')))<3||strlen((string)($body['password']??''))<6)respond(['error'=>'Tài khoản tối thiểu 3 ký tự, mật khẩu tối thiểu 6 ký tự'],422);foreach($data['users'] as $x)if($x['username']===$body['username'])respond(['error'=>'Tên tài khoản đã tồn tại'],409);$id=next_id($data['users']);$data['users'][]=['id'=>$id,'name'=>trim((string)($body['name']??'Người dùng')),'username'=>trim((string)$body['username']),'password_hash'=>password_hash((string)$body['password'],PASSWORD_DEFAULT)];save_store($data);$_SESSION['user_id']=$id;$_SESSION['auth_version']=0;session_regenerate_id(true);respond(['user'=>user()]);}
if($path==='/api/auth/login'&&$method==='POST'){foreach($data['users'] as $x)if($x['username']===$body['username']&&password_verify((string)($body['password']??''),$x['password_hash'])){$_SESSION['user_id']=$x['id'];$_SESSION['auth_version']=(int)($x['auth_version']??0);session_regenerate_id(true);respond(['user'=>user()]);}respond(['error'=>'Sai tài khoản hoặc mật khẩu'],422);}
if($path==='/api/auth/logout'&&$method==='POST'){session_destroy();respond(['ok'=>true]);}if($path==='/api/auth/me')respond(['user'=>$u]);if(!$u)respond(['error'=>'Bạn cần đăng nhập'],401);
if($path==='/api/settings'&&$method==='GET')respond($u['settings']);
if(preg_match('#^/api/exams/(\d+)/preview$#',$path,$m)&&$method==='POST'){try{respond(preview_grading_submission($data,$u['id'],(int)$m[1],$body));}catch(RuntimeException $e){respond(['error'=>$e->getMessage()],$e->getCode()?:422);}}
if($path==='/api/settings'&&$method==='PUT'){try{$settings=update_preferences($data,$u['id'],$body);save_store($data);respond(['settings'=>$settings]);}catch(RuntimeException $e){respond(['error'=>$e->getMessage()],$e->getCode()?:422);}}
if($path==='/api/account'&&$method==='PUT'){try{$result=update_account($data,$u['id'],$body);save_store($data);if($result['password_changed']){$_SESSION['auth_version']=$result['auth_version'];session_regenerate_id(true);}unset($result['auth_version']);respond($result);}catch(RuntimeException $e){respond(['error'=>$e->getMessage()],$e->getCode()?:422);}}
  if($path==='/api/omr'&&$method==='POST'){try{$raw=(string)($body['image_data']??'');$raw=preg_replace('#^data:image/[^;]+;base64,#','',$raw);if($raw==='')respond(['error'=>'Thiếu ảnh phiếu'],422);respond(omr_read_sheet(base64_decode($raw)));}catch(Throwable $e){respond(['error'=>$e->getMessage()],422);}}
if($path==='/api/exams'&&$method==='GET')respond(array_values(array_filter($data['exams'],fn($e)=>$e['user_id']===$u['id'])));
if(preg_match('#^/api/exams/(\d+)$#',$path,$m)&&$method==='PUT'){
  $id=(int)$m[1];$index=null;foreach($data['exams'] as $i=>$exam)if($exam['id']===$id&&$exam['user_id']===$u['id']){$index=$i;break;}
  if($index===null)respond(['error'=>'Không tìm thấy bài thi'],404);
  $e=$data['exams'][$index];$template=$e['sheet_template']??'bgd2';
  if(isset($body['sheet_template'])&&$body['sheet_template']!==$template)respond(['error'=>'Không thể đổi mẫu phiếu của bài thi đã tạo'],422);
  $digits=$template==='tn40n'?3:4;$codes=[];foreach((array)($body['codes']??$e['codes']) as $code){$code=trim((string)$code);if(!preg_match('/^\d{1,'.$digits.'}$/',$code))respond(['error'=>'Mã đề không hợp lệ'],422);$codes[]=str_pad($code,$digits,'0',STR_PAD_LEFT);}$codes=array_values(array_unique($codes));if(!$codes)respond(['error'=>'Cần ít nhất một mã đề'],422);
  $e['name']=trim((string)($body['name']??$e['name']));$e['subject']=trim((string)($body['subject']??$e['subject']));if($e['name']==='')respond(['error'=>'Vui lòng nhập tên bài thi'],422);
  $e['class_name']=trim((string)($body['class_name']??$e['class_name']??''));
  $e['codes']=$codes;$e['question_count']=max(1,min($template==='phutho'?50:($template==='qmcv4'?12:40),(int)($body['question_count']??$e['question_count'])));
  $horizontal=in_array($template,['tn40n','qm40','tnmaker40'],true);foreach(['part2_count'=>$template==='phutho'?10:($template==='qmcv4'?4:8),'part3_count'=>$template==='phutho'?12:6] as $field=>$max)$e[$field]=$horizontal?0:max(0,min($max,(int)($body[$field]??$e[$field]??$max)));
  foreach(['part1_point'=>.25,'part3_point'=>.5] as $field=>$default)$e[$field]=max(0,min(100,(float)($body[$field]??$e[$field]??$default)));
  $old=$e['part2_points']??[.1,.25,.5,1];$e['part2_points']=[];for($i=0;$i<4;$i++)$e['part2_points'][]=max(0,min(100,(float)($body['part2_point_'.($i+1)]??$old[$i])));
  $data['exams'][$index]=$e;
  foreach($codes as $code){$found=false;foreach($data['keys'] as $key)if($key['exam_id']===$id&&$key['code']===$code){$found=true;break;}if(!$found)$data['keys'][]=['id'=>next_id($data['keys']),'exam_id'=>$id,'code'=>$code,'answers'=>'','part2'=>[],'part3'=>[]];}
  foreach($data['keys'] as &$key){if($key['exam_id']!==$id)continue;$key['answers']=substr(str_pad($key['answers'],$e['question_count'],'-'),0,$e['question_count']);$key['part2']=array_slice(array_pad($key['part2']??[],$e['part2_count'],'----'),0,$e['part2_count']);$key['part3']=array_slice(array_pad($key['part3']??[],$e['part3_count'],''),0,$e['part3_count']);}unset($key);
  $regraded=regrade_exam($data,$id);save_store($data);respond(['id'=>$id,'ok'=>true,'regraded'=>$regraded]);
}
if($path==='/api/exams'&&$method==='POST'){$body['name']=trim((string)($body['name']??''));if($body['name']==='')$body['name']=$u['settings']['default_exam_name'];$sheetTemplate=in_array($body['sheet_template']??'', ['tn40n','qm40','bgd2025original','bgd2025pink','phutho','tnmaker40','qmcv1239','qmcv4'],true)?$body['sheet_template']:'bgd2';$codeDigits=$sheetTemplate==='tn40n'?3:4;$codes=array_values(array_unique(array_filter(array_map(fn($c)=>preg_match('/^\d{1,'.$codeDigits.'}$/',trim((string)$c))?str_pad(trim((string)$c),$codeDigits,'0',STR_PAD_LEFT):'',(array)($body['codes']??[$sheetTemplate==='tn40n'?'101':'0101'])))));if(!$codes)respond(['error'=>'Mã đề phải gồm từ 1 đến 4 chữ số'],422);$point=fn($name,$default)=>max(0,min(100,(float)($body[$name]??$default)));$id=next_id($data['exams']);$e=['id'=>$id,'user_id'=>$u['id'],'sheet_template'=>$sheetTemplate,'name'=>trim((string)($body['name']??'Bài thi mới')),'subject'=>trim((string)($body['subject']??'Trắc nghiệm')),'class_name'=>trim((string)($body['class_name']??'')),'question_count'=>max(1,min($sheetTemplate==='phutho'?50:($sheetTemplate==='qmcv4'?12:40),(int)($body['question_count']??($sheetTemplate==='phutho'?50:($sheetTemplate==='qmcv4'?12:40))))),'part2_count'=>in_array($sheetTemplate,['tn40n','qm40','tnmaker40'],true)?0:max(0,min($sheetTemplate==='phutho'?10:($sheetTemplate==='qmcv4'?4:8),(int)($body['part2_count']??($sheetTemplate==='phutho'?10:($sheetTemplate==='qmcv4'?4:8))))),'part3_count'=>in_array($sheetTemplate,['tn40n','qm40','tnmaker40'],true)?0:max(0,min($sheetTemplate==='phutho'?12:6,(int)($body['part3_count']??($sheetTemplate==='phutho'?12:6)))),'part1_point'=>$point('part1_point',0.25),'part2_points'=>[$point('part2_point_1',0.1),$point('part2_point_2',0.25),$point('part2_point_3',0.5),$point('part2_point_4',1)],'part3_point'=>$point('part3_point',0.5),'codes'=>$codes];$data['exams'][]=$e;foreach($codes as $code)$data['keys'][]=['id'=>next_id($data['keys']),'exam_id'=>$id,'code'=>$code,'answers'=>str_repeat('-',$e['question_count']),'part2'=>array_fill(0,$e['part2_count'],'----'),'part3'=>array_fill(0,$e['part3_count'],'')];save_store($data);respond(['id'=>$id],201);}
if(preg_match('#^/api/exams/(\d+)$#',$path,$m)&&$method==='DELETE'){$id=(int)$m[1];$found=false;foreach($data['exams'] as $e)if($e['id']===$id&&$e['user_id']===$u['id'])$found=true;if(!$found)respond(['error'=>'Không tìm thấy bài thi'],404);$data['exams']=array_values(array_filter($data['exams'],fn($e)=>$e['id']!==$id));$data['keys']=array_values(array_filter($data['keys'],fn($k)=>$k['exam_id']!==$id));$data['students']=array_values(array_filter($data['students'],fn($s)=>$s['exam_id']!==$id));$data['submissions']=array_values(array_filter($data['submissions'],fn($s)=>$s['exam_id']!==$id));save_store($data);respond(['ok'=>true]);}
if(preg_match('#^/api/exams/(\d+)$#',$path,$m)&&$method==='GET'){$id=(int)$m[1];$e=null;foreach($data['exams'] as $x)if($x['id']===$id&&$x['user_id']===$u['id'])$e=$x;if(!$e)respond(['error'=>'Không tìm thấy bài thi'],404);$e['keys']=array_values(array_filter($data['keys'],fn($k)=>$k['exam_id']===$id));$e['students']=array_values(array_filter($data['students'],fn($s)=>$s['exam_id']===$id));respond($e);}
if(preg_match('#^/api/exams/(\d+)/keys$#',$path,$m)&&$method==='PUT'){$id=(int)$m[1];$owned=false;foreach($data['exams'] as $exam)if($exam['id']===$id&&$exam['user_id']===$u['id'])$owned=true;if(!$owned)respond(['error'=>'Không tìm thấy bài thi'],404);$incoming=(array)($body['keys']??[]);if(!$incoming)respond(['error'=>'Chưa có đáp án để lưu'],422);foreach($incoming as $k){$found=false;foreach($data['keys'] as $existing)if($existing['exam_id']===$id&&$existing['code']===($k['code']??null))$found=true;if(!$found)respond(['error'=>'Mã đề không thuộc bài thi'],422);}foreach($incoming as $k)foreach($data['keys'] as &$x)if($x['exam_id']==(int)$m[1]&&$x['code']===$k['code']){$x['answers']=$k['answers'];if(array_key_exists('part2',$k))$x['part2']=$k['part2'];if(array_key_exists('part3',$k))$x['part3']=$k['part3'];if(array_key_exists('image_data',$k))$x['image_data']=$k['image_data'];}unset($x);$regraded=regrade_exam($data,$id);save_store($data);respond(['ok'=>true,'regraded'=>$regraded]);}
if(preg_match('#^/api/exams/(\d+)/students$#',$path,$m)&&$method==='POST'){$id=(int)$m[1];foreach((array)($body['students']??[]) as $s){$found=false;foreach($data['students'] as &$x)if($x['exam_id']===$id&&$x['student_no']===$s['student_no']){$x['name']=$s['name'];$x['class_name']=$s['class_name']??'';$found=true;}unset($x);if(!$found)$data['students'][]=['id'=>next_id($data['students']),'exam_id'=>$id,'student_no'=>$s['student_no'],'name'=>$s['name'],'class_name'=>$s['class_name']??''];}save_store($data);respond(['ok'=>true]);}
if(preg_match('#^/api/exams/(\d+)/submissions/(\d+)/undo$#',$path,$m)&&$method==='POST'){
    try{camera_undo($data,$u['id'],(int)$m[1],(int)$m[2],(string)($body['token']??''));save_store($data);respond(['ok'=>true]);}catch(RuntimeException $e){respond(['error'=>$e->getMessage()],$e->getCode()?:422);}
}
if(preg_match('#^/api/exams/(\d+)/submissions/(\d+)$#',$path,$m)&&$method==='PUT'){
    try{$row=edit_submission($data,$u['id'],(int)$m[1],(int)$m[2],$body);save_store($data);respond(['ok'=>true,'submission'=>$row]);}
    catch(RuntimeException $e){respond(['error'=>$e->getMessage()],in_array($e->getCode(),[404,422],true)?$e->getCode():422);}
}
  if(preg_match('#^/api/exams/(\d+)/submissions$#',$path,$m)&&$method==='POST'){
    if(($body['capture_source']??'')==='camera'){
        try{$row=camera_create($data,$u['id'],(int)$m[1],$body);save_store($data);respond(array_intersect_key($row,array_flip(['id','student_no','student_name','code','score','parts','flags','_capture_token'])),201);}
        catch(CameraDuplicate $e){respond(['error'=>$e->getMessage(),'existing_id'=>$e->existingId],409);}
        catch(RuntimeException $e){respond(['error'=>$e->getMessage()],$e->getCode()?:422);}
    }
    try{$row=save_grading_submission($data,$u['id'],(int)$m[1],$body);save_store($data);respond(array_intersect_key($row,array_flip(['id','score','parts','flags'])),201);}
    catch(GradingWarning $e){respond(['error'=>$e->getMessage(),'kind'=>$e->kind,'messages'=>$e->messages,'existing_id'=>$e->existingId],$e->getCode());}
    catch(RuntimeException $e){respond(['error'=>$e->getMessage()],$e->getCode()?:422);}
  }
  if(preg_match('#^/api/exams/(\d+)/results$#',$path,$m)&&$method==='GET'){
    $id=(int)$m[1];$owned=false;foreach($data['exams'] as $exam)if($exam['id']===$id&&$exam['user_id']===$u['id'])$owned=true;if(!$owned)respond(['error'=>'Không tìm thấy bài thi'],404);regrade_exam($data,$id);$out=array_values(array_filter($data['submissions'],fn($s)=>$s['exam_id']===$id&&empty($s['deleted_at'])));
    respond($out);
  }
  if(preg_match('#^/api/exams/(\d+)/export$#',$path,$m)&&$method==='GET'){
    $id=(int)$m[1];$ownedExam=null;foreach($data['exams'] as $exam)if($exam['id']===$id&&$exam['user_id']===$u['id'])$ownedExam=$exam;
    if(!$ownedExam)respond(['error'=>'Không tìm thấy bài thi'],404);regrade_exam($data,$id);
    $students=[];foreach($data['students'] as $student)if($student['exam_id']===$id)$students[(string)$student['student_no']]=$student;
    $rows=array_values(array_filter($data['submissions'],fn($row)=>$row['exam_id']===$id));foreach($rows as &$row)$row['class_name']=trim((string)($students[(string)($row['student_no']??'')]['class_name']??''))?:trim((string)($ownedExam['class_name']??''));unset($row);
    $mode=$_GET['mode']??$u['settings']['export_mode'];$rows=export_grading_rows($rows,in_array($mode,['exam','class'],true)?$mode:'exam');
    header('Content-Type:text/csv; charset=utf-8');header('Content-Disposition:attachment; filename="bang-diem.csv"');echo "\xEF\xBB\xBF";$out=fopen('php://output','w');fputcsv($out,['STT','Số báo danh','Họ tên','Lớp','Mã đề','Đáp án','Điểm','Cảnh báo','Thời gian']);$i=1;
    foreach($rows as $row){if(trim((string)($row['student_no']??''))===''&&trim((string)($row['student_name']??''))===''&&trim((string)($row['answers']??''))==='')continue;fputcsv($out,[$i++,$row['student_no'],$row['student_name'],$row['class_name'],$row['code'],$row['answers'],$row['score'],implode('; ',$row['flags']),$row['created_at']]);}fclose($out);exit;
  }
respond(['error'=>'API không tồn tại'],404);
