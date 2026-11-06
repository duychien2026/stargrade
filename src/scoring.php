<?php
function grade_submission(array $row,array $key,array $exam): array {
    $p1=0;$p2=0;$p3=0;$flags=[];$points=$exam['part2_points']??[.1,.25,.5,1];
    for($i=0;$i<(int)($exam['question_count']??strlen($key['answers']??''));$i++){
        $a=$row['answers'][$i]??'-';$b=$key['answers'][$i]??'-';
        if($a==='-'||$a==='')$flags[]='Phần I câu '.($i+1).' bỏ trống';
        elseif(!in_array($a,['A','B','C','D'],true))$flags[]='Phần I câu '.($i+1).' cần kiểm tra';
        elseif(in_array($b,['A','B','C','D'],true)&&$a===$b)$p1+=(float)($exam['part1_point']??.25);
    }
    for($i=0;$i<(int)($exam['part2_count']??count($key['part2']??[]));$i++){
        $a=preg_split('//u',(string)($row['part2'][$i]??''),-1,PREG_SPLIT_NO_EMPTY);$b=preg_split('//u',(string)($key['part2'][$i]??''),-1,PREG_SPLIT_NO_EMPTY);$right=0;
        if(!array_filter($a,fn($v)=>$v!=='-'))$flags[]='Phần II câu '.($i+1).' bỏ trống';
        elseif(array_filter($a,fn($v)=>!in_array($v,['Đ','S','-'],true)))$flags[]='Phần II câu '.($i+1).' cần kiểm tra';
        for($j=0;$j<4;$j++)if(in_array($b[$j]??'', ['Đ','S'],true)&&($a[$j]??'')===$b[$j])$right++;
        if($right>0)$p2+=(float)($points[$right-1]??0);
    }
    for($i=0;$i<(int)($exam['part3_count']??count($key['part3']??[]));$i++){
        $a=trim((string)($row['part3'][$i]??''));$b=trim((string)($key['part3'][$i]??''));
        if($a==='')$flags[]='Phần III câu '.($i+1).' bỏ trống';
        elseif(strpbrk($a,'?*')!==false)$flags[]='Phần III câu '.($i+1).' cần kiểm tra';
        elseif($b!==''&&$a===$b)$p3+=(float)($exam['part3_point']??.5);
    }
    $row['parts']=['part1'=>round($p1,2),'part2'=>round($p2,2),'part3'=>round($p3,2)];$row['score']=round($p1+$p2+$p3,2);$row['flags']=$flags;return $row;
}
function regrade_exam(array &$data,int $id): int {
    $exam=null;foreach($data['exams'] as $e)if($e['id']===$id){$exam=$e;break;}if(!$exam)return 0;
    $keys=[];foreach($data['keys'] as $k)if($k['exam_id']===$id)$keys[(string)$k['code']]=$k;
    $count=0;foreach($data['submissions']??[] as $i=>$row){if($row['exam_id']!==$id||!empty($row['deleted_at']))continue;$key=$keys[(string)$row['code']]??null;if(!$key)continue;$data['submissions'][$i]=grade_submission($row,$key,$exam);$count++;}return $count;
}
