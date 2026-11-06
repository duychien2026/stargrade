<?php
require __DIR__.'/../src/grading-preferences.php';
function respond($payload,$status=200){throw new RuntimeException($payload['error']??'Rejected',$status);}
function regrade_exam(&$data,$id){}
$data=['exams'=>[['id'=>1,'user_id'=>7,'class_name'=>'12B'],['id'=>2,'user_id'=>8,'class_name'=>'Other']],
    'students'=>[['exam_id'=>1,'student_no'=>'01','class_name'=>'12A'],['exam_id'=>2,'student_no'=>'01','class_name'=>'Private']],
    'submissions'=>[]];
foreach([[1,1,'02'],[2,1,'01'],[3,1,'01'],[4,2,'01'],[5,1,'03']] as [$id,$examId,$no])$data['submissions'][]=['id'=>$id,'exam_id'=>$examId,'student_no'=>$no,'student_name'=>'Test, Name','answers'=>'A','score'=>1,'code'=>'1001','flags'=>[],'created_at'=>'2026-01-01','deleted_at'=>$id===5?'2026-01-02':null];
$u=['id'=>7,'settings'=>['export_mode'=>'class']];$path='/api/exams/1/export';$method='GET';$_GET=[];
$source=file_get_contents(__DIR__.'/../public/index.php');$start=strpos($source,"  if(preg_match('#^/api/exams/(\\d+)/export$#'");$end=strpos($source,"respond(['error'=>'API không tồn tại']",$start);$route=str_replace('exit;','return;',substr($source,$start,$end-$start));
ob_start();eval($route);$csv=ob_get_clean();$rows=array_map('str_getcsv',explode("\n",trim($csv)));if(count($rows)!==4)throw new RuntimeException('Missing sheets or leaked other exam');
if($rows[1][3]!=='12A'||$rows[2][3]!=='12A'||$rows[3][3]!=='12B')throw new RuntimeException('Class order/roster/fallback wrong');if($rows[1][2]!=='Test, Name')throw new RuntimeException('CSV escaping wrong');
$u['id']=8;try{ob_start();eval($route);ob_end_clean();throw new RuntimeException('Unauthorized export accepted');}catch(RuntimeException $e){if(ob_get_level())ob_end_clean();if($e->getCode()!==404)throw $e;}
echo "PASS class CSV export: roster class, exam fallback, class ordering, repeated SBD retained, deleted/foreign rows excluded, ownership and CSV escaping\n";
