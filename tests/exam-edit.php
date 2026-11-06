<?php
require __DIR__.'/../src/scoring.php';
// Exercise the actual route with an in-memory store, without touching user data.
function respond($payload,$status=200){throw new RuntimeException(json_encode([$status,$payload]));}
function save_store($data){$GLOBALS['saved']=$data;}
function next_id($items){return $items?max(array_column($items,'id'))+1:1;}
$source=file_get_contents(__DIR__.'/../public/index.php');
$start=strpos($source,"if(preg_match('#^/api/exams/(\\d+)$#',\$path,\$m)&&\$method==='PUT')");
$end=strpos($source,"if(\$path==='/api/exams'&&\$method==='POST')",$start);
$route=substr($source,$start,$end-$start);
$seed=['exams'=>[['id'=>1,'user_id'=>7,'sheet_template'=>'bgd2','name'=>'Old','subject'=>'Math','codes'=>['0101'],'question_count'=>4,'part2_count'=>1,'part3_count'=>1]],'keys'=>[['id'=>1,'exam_id'=>1,'code'=>'0101','answers'=>'ABCD','part2'=>['ĐSĐS'],'part3'=>['-1']]]];
function run_edit($body,$user=7){global $seed,$route;$data=$seed;$u=['id'=>$user];$path='/api/exams/1';$method='PUT';unset($GLOBALS['saved']);try{eval($route);}catch(RuntimeException $e){return json_decode($e->getMessage(),true);}throw new RuntimeException('Route did not respond');}
function check($condition,$message){if(!$condition)throw new RuntimeException($message);}
$classResult=run_edit(['class_name'=>'12A1']);check($classResult[0]===200&&$GLOBALS['saved']['exams'][0]['class_name']==='12A1','Class not saved');
$classResult=run_edit(['class_name'=>'']);check($classResult[0]===200&&$GLOBALS['saved']['exams'][0]['class_name']==='','Empty class not accepted');
$r=run_edit(['name'=>'Updated','codes'=>['0101','0102'],'question_count'=>6,'part1_point'=>.4]);check($r[0]===200,'Edit failed');$d=$GLOBALS['saved'];check($d['exams'][0]['sheet_template']==='bgd2','Template changed');check($d['exams'][0]['name']==='Updated','Name not saved');check($d['exams'][0]['part1_point']===.4,'Score not saved');check($d['keys'][0]['answers']==='ABCD--','Existing answers lost');check($d['keys'][0]['part2']===['ĐSĐS'],'Part II lost');check($d['keys'][1]['code']==='0102'&&$d['keys'][1]['answers']==='------','New code not initialized');
check(run_edit(['sheet_template'=>'qm40'])[0]===422,'Template mutation accepted');check(!isset($GLOBALS['saved']),'Invalid edit wrote data');check(run_edit(['name'=>'Unauthorized'],8)[0]===404,'Ownership check failed');
$seed['exams'][0]['sheet_template']='tn40n';$seed['exams'][0]['codes']=['101'];$seed['keys'][0]['code']='101';run_edit(['codes'=>['101','102'],'part2_count'=>8,'part3_count'=>6]);check($GLOBALS['saved']['exams'][0]['part2_count']===0&&$GLOBALS['saved']['exams'][0]['part3_count']===0,'Horizontal counts invalid');
$seed['exams'][0]['sheet_template']='phutho';$seed['exams'][0]['codes']=['0101'];$seed['keys'][0]['code']='0101';run_edit(['question_count'=>50,'part2_count'=>10,'part3_count'=>12]);$e=$GLOBALS['saved']['exams'][0];check($e['question_count']===50&&$e['part2_count']===10&&$e['part3_count']===12,'Phu Tho counts truncated');check(count($GLOBALS['saved']['keys'][0]['part3'])===12,'Phu Tho key truncated');
$seed['exams'][0]['sheet_template']='bgd2';run_edit(['question_count'=>50,'part2_count'=>10,'part3_count'=>12]);$e=$GLOBALS['saved']['exams'][0];check($e['question_count']===40&&$e['part2_count']===8&&$e['part3_count']===6,'Existing limits changed');
$seed['exams'][0]['sheet_template']='tnmaker40';run_edit(['codes'=>['0101','0104'],'part2_count'=>8,'part3_count'=>6]);$e=$GLOBALS['saved']['exams'][0];check($e['codes']===['0101','0104']&&$e['part2_count']===0&&$e['part3_count']===0,'TNMaker code/counts incorrect');
$seed['exams'][0]['sheet_template']='qmcv4';run_edit(['question_count'=>50,'part2_count'=>10,'part3_count'=>12]);$e=$GLOBALS['saved']['exams'][0];check($e['question_count']===12&&$e['part2_count']===4&&$e['part3_count']===6,'QM CV4 limits incorrect');
echo "PASS exam edit: keys, scoring, template lock, ownership, horizontal and Phu Tho limits\n";
