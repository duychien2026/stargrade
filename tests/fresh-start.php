<?php
require __DIR__.'/../src/fresh-start.php';
$folder=__DIR__.'/../tmp/reset-test-'.bin2hex(random_bytes(5));mkdir($folder,0700,true);$file=$folder.'/data.json';
$seed=['users'=>[['id'=>1,'username'=>'test','password_hash'=>'unchanged']], 'exams'=>[['id'=>1,'sheet_template'=>'tn40n'],['id'=>2,'sheet_template'=>'phutho']], 'keys'=>[['exam_id'=>1]], 'students'=>[['exam_id'=>1]], 'submissions'=>[['exam_id'=>2,'image_data'=>'sheet']]];
file_put_contents($file,json_encode($seed));apply_fresh_start($file);$data=json_decode(file_get_contents($file),true);
if($data['users']!==$seed['users'])throw new RuntimeException('Accounts changed');
foreach(['exams','keys','students','submissions'] as $key)if($data[$key]!==[])throw new RuntimeException('Not cleared: '.$key);
$backups=glob($file.'.*.bak');if(count($backups)!==1||json_decode(file_get_contents($backups[0]),true)!==$seed)throw new RuntimeException('Full backup missing');
$data['exams'][]=['id'=>1,'name'=>'New exam'];file_put_contents($file,json_encode($data));apply_fresh_start($file);
if(json_decode(file_get_contents($file),true)['exams']!==$data['exams']||count(glob($file.'.*.bak'))!==1)throw new RuntimeException('Reset ran twice');
echo "PASS fresh start: full backup, preserves accounts, clears all exam data, new exams survive subsequent requests\n";
