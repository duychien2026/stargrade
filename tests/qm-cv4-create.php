<?php
function respond($payload,$status=200){throw new RuntimeException(json_encode([$status,$payload]));}
function save_store($data){$GLOBALS['saved']=$data;}
function next_id($rows){return $rows?max(array_column($rows,'id'))+1:1;}
$source=file_get_contents(__DIR__.'/../public/index.php');$start=strpos($source,"if(\$path==='/api/exams'&&\$method==='POST')");$end=strpos($source,"if(preg_match",$start);$route=substr($source,$start,$end-$start);
$data=['exams'=>[],'keys'=>[]];$u=['id'=>7];$path='/api/exams';$method='POST';$body=['sheet_template'=>'qmcv4','name'=>'QM2025-CV4 Ngang','codes'=>['0101']];
try{eval($route);}catch(RuntimeException $r){[$status,$payload]=json_decode($r->getMessage(),true);if($status!==201)throw new RuntimeException('Create failed');}
$e=$GLOBALS['saved']['exams'][0];$key=$GLOBALS['saved']['keys'][0];
if($e['sheet_template']!=='qmcv4'||$e['question_count']!==12||$e['part2_count']!==4||$e['part3_count']!==6||strlen($key['answers'])!==12||count($key['part2'])!==4||count($key['part3'])!==6)throw new RuntimeException('QM CV4 defaults/key lengths incorrect');
require __DIR__.'/../src/scoring.php';$key['answers']=str_repeat('A',12);$key['part2']=array_fill(0,4,'ĐSĐS');$key['part3']=array_fill(0,6,'-1,2');$row=grade_submission(['answers'=>$key['answers'],'part2'=>$key['part2'],'part3'=>$key['part3']],$key,$e);
if($row['score']!==10.0)throw new RuntimeException('Full-length scoring incorrect');
echo "PASS QM CV4 create defaults, complete key lengths, all 3 parts scoring\n";
