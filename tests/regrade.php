<?php
require __DIR__.'/../src/scoring.php';
function check($condition,$message){if(!$condition)throw new RuntimeException($message);}
$exam=['id'=>1,'user_id'=>7,'question_count'=>2,'part2_count'=>1,'part3_count'=>1,'part1_point'=>.25,'part2_points'=>[.1,.25,.5,1],'part3_point'=>.5];
$key=['exam_id'=>1,'code'=>'0101','answers'=>'AB','part2'=>['ĐSĐS'],'part3'=>['-1,2']];
$row=['id'=>1,'exam_id'=>1,'code'=>'0101','answers'=>'AB','part2'=>['ĐSĐS'],'part3'=>['-1,2'],'image_data'=>'unchanged-image','score'=>0,'flags'=>['outdated']];
$data=['exams'=>[$exam],'keys'=>[$key,array_replace($key,['code'=>'0102','answers'=>'CD'])],'submissions'=>[$row,array_replace($row,['id'=>2,'code'=>'0102','answers'=>'CD']),array_replace($row,['exam_id'=>9,'score'=>88])]];
check(regrade_exam($data,1)===2,'Did not regrade all codes');check($data['submissions'][0]['score']===2.0,'Full score incorrect');check($data['submissions'][2]['score']===88,'Other exam changed');
function respond($d,$status=200){throw new RuntimeException(json_encode([$status,$d]));}function save_store($d){$GLOBALS['persisted']=$d;}
$source=file_get_contents(__DIR__.'/../public/index.php');$start=strpos($source,"if(preg_match('#^/api/exams/(\\d+)/keys$#'");$end=strpos($source,"if(preg_match('#^/api/exams/(\\d+)/students$#'",$start);$route=substr($source,$start,$end-$start);
$path='/api/exams/1/keys';$method='PUT';$u=['id'=>7];$body=['keys'=>[array_replace($key,['answers'=>'CD','part2'=>['SSSS'],'part3'=>['0']])]];
try{eval($route);}catch(RuntimeException $e){$response=json_decode($e->getMessage(),true);check($response[0]===200&&$response[1]['regraded']===2,'Save route did not regrade');}
$saved=$GLOBALS['persisted'];check($saved['submissions'][0]['score']===.25,'Corrected key score not persisted');check($saved['submissions'][0]['parts']===['part1'=>0.0,'part2'=>.25,'part3'=>0.0],'Parts incorrect');check($saved['submissions'][0]['flags']===[],'Stale flags remain');check($saved['submissions'][0]['image_data']==='unchanged-image','Original sheet changed');check($saved['submissions'][1]['score']===2.0,'Other code changed incorrectly');
$blank=grade_submission(array_replace($row,['answers'=>'--','part2'=>['----'],'part3'=>['']]),array_replace($key,['answers'=>'--']),$exam);check($blank['score']===0.0,'Blank answers received points');check(count($blank['flags'])===4,'Blank flags missing');$before=$saved;regrade_exam($saved,1);check($before===$saved,'Regrading not idempotent');
echo "PASS key-save regrades all sheets and persists scores/parts/flags; other exams and images unchanged; blanks score zero\n";
