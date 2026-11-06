<?php
require __DIR__.'/../src/scoring.php';require __DIR__.'/../src/submission-edit.php';
function check($ok,$message){if(!$ok)throw new RuntimeException($message);}
$exam=['id'=>1,'user_id'=>7,'question_count'=>2,'part2_count'=>1,'part3_count'=>1,'part1_point'=>.25,'part2_points'=>[.1,.25,.5,1],'part3_point'=>.5];
$key=['exam_id'=>1,'code'=>'0101','answers'=>'AB','part2'=>['ĐSĐS'],'part3'=>['-1,2']];
$row=['id'=>1,'exam_id'=>1,'code'=>'0101','student_no'=>'0001','student_name'=>'Old name','answers'=>'--','part2'=>['----'],'part3'=>[''],'image_data'=>'immutable-sheet','name_image'=>null,'created_at'=>'original-date','flags'=>['old'],'score'=>0];
$seed=['exams'=>[$exam],'keys'=>[$key,array_replace($key,['code'=>'0102','answers'=>'CD'])],'students'=>[['exam_id'=>1,'student_no'=>'0002','name'=>'Matched name']],'submissions'=>[$row,array_replace($row,['id'=>2]),array_replace($row,['id'=>3,'exam_id'=>9])]];
$data=$seed;$saved=edit_submission($data,7,1,1,['student_no'=>'0002','student_name'=>'Old name','code'=>'0102','answers'=>'cd','part2'=>['ĐSĐS'],'part3'=>['-1,2'],'image_data'=>'evil-replacement']);
check($saved['score']===2.0&&$saved['flags']===[],'Score/flags not recalculated');check($saved['student_name']==='Matched name'&&$saved['student_no']==='0002','New SBD not matched');check($saved['image_data']==='immutable-sheet'&&$saved['created_at']==='original-date','Original image/date changed');check($data['submissions'][1]===$seed['submissions'][1]&&$data['submissions'][2]===$seed['submissions'][2],'Other rows changed');
foreach([[8,1,1,[],404],[7,9,3,[],404],[7,1,9,[],404],[7,1,1,['code'=>'9999'],422],[7,1,1,['answers'=>'ABC'],422],[7,1,1,['part2'=>['ĐSĐSS']],422],[7,1,1,['part3'=>['12345']],422]] as [$user,$eid,$sid,$body,$code]){$data=$seed;try{edit_submission($data,$user,$eid,$sid,$body);throw new RuntimeException('Invalid edit accepted');}catch(RuntimeException $e){check($e->getCode()===$code,'Wrong error status');check($data===$seed,'Invalid edit mutated data');}}
$data=$seed;$blank=edit_submission($data,7,1,1,['student_no'=>'0003','answers'=>'','part2'=>[],'part3'=>[]]);check($blank['score']===0.0&&count($blank['flags'])===4,'Blank scoring incorrect');check($blank['student_name']==='','Stale name retained');
// Exercise the real PUT route and its persisted response.
function respond($payload,$status=200){throw new Exception(json_encode([$status,$payload]));}function save_store($data){$GLOBALS['saved']=$data;}
$source=file_get_contents(__DIR__.'/../public/index.php');$start=strpos($source,"if(preg_match('#^/api/exams/(\\d+)/submissions/(\\d+)$#'");$end=strpos($source,"  if(preg_match('#^/api/exams/(\\d+)/submissions$#'",$start);$route=substr($source,$start,$end-$start);
$data=$seed;$u=['id'=>7];$path='/api/exams/1/submissions/1';$method='PUT';$body=['answers'=>'AB','part2'=>['ĐSĐS'],'part3'=>['-1,2']];
try{eval($route);}catch(Exception $e){[$status,$payload]=json_decode($e->getMessage(),true);check($status===200&&$payload['submission']['score']==2.0,'PUT response incorrect');check($GLOBALS['saved']['submissions'][0]['score']===2.0,'PUT did not persist');}
echo "PASS submission edit: authorization, code validation, all parts regrade, name rematch, immutable image, isolated row, persisted PUT\n";
