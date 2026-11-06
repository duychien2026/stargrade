<?php
function edit_submission(array &$data,int $userId,int $examId,int $submissionId,array $body): array {
    $exam=null;$index=null;
    foreach($data['exams'] as $item)if($item['id']===$examId&&$item['user_id']===$userId)$exam=$item;
    if(!$exam)throw new RuntimeException('Không tìm thấy bài thi',404);
    foreach($data['submissions'] as $i=>$item)if($item['id']===$submissionId&&$item['exam_id']===$examId)$index=$i;
    if($index===null||!empty($data['submissions'][$index]['deleted_at']))throw new RuntimeException('Không tìm thấy phiếu',404);
    $row=$data['submissions'][$index];
    $code=trim((string)($body['code']??$row['code']));$key=null;
    foreach($data['keys'] as $item)if($item['exam_id']===$examId&&$item['code']===$code)$key=$item;
    if(!$key)throw new RuntimeException('Mã đề chưa có đáp án trong bài thi',422);
    $n1=(int)$exam['question_count'];$n2=(int)($exam['part2_count']??0);$n3=(int)($exam['part3_count']??0);
    $answers=preg_replace('/\s+/u','',strtoupper((string)($body['answers']??$row['answers'])));
    if(strlen($answers)>$n1||!preg_match('/^[ABCD?*\-]*$/',$answers))throw new RuntimeException('Phần I chỉ nhận A/B/C/D, dấu - hoặc ?; không được vượt số câu',422);
    $p2=array_values((array)($body['part2']??$row['part2']??[]));$p3=array_values((array)($body['part3']??$row['part3']??[]));
    if(count($p2)>$n2||count($p3)>$n3)throw new RuntimeException('Số câu vượt cấu hình của bài thi',422);
    $part2=[];$part3=[];
    for($i=0;$i<$n2;$i++){
        $value=str_replace(['D','d','đ','s','T','t','F','f'],['Đ','Đ','Đ','S','Đ','Đ','S','S'],trim((string)($p2[$i]??'')));
        $chars=preg_split('//u',$value,-1,PREG_SPLIT_NO_EMPTY);
        if(count($chars)>4||array_diff($chars,['Đ','S','-','?','*']))throw new RuntimeException('Phần II mỗi câu tối đa 4 ý Đ/S, dấu - hoặc ?',422);
        $part2[]=implode('',array_pad($chars,4,'-'));
    }
    for($i=0;$i<$n3;$i++){
        $value=trim((string)($p3[$i]??''));
        if(!preg_match('/^[0-9,?*\-]{0,4}$/',$value))throw new RuntimeException('Phần III tối đa 4 ký tự, gồm số, dấu âm, dấu phẩy hoặc ?',422);
        $part3[]=$value;
    }
    $studentNo=trim((string)($body['student_no']??$row['student_no']??''));
    $name=trim((string)($body['student_name']??$row['student_name']??''));
    if($studentNo!==($row['student_no']??'')&&$name===($row['student_name']??''))$name='';
    if($name===''&&$studentNo!=='')foreach($data['students'] as $student)if($student['exam_id']===$examId&&$student['student_no']===$studentNo){$name=$student['name'];break;}
    $row['student_no']=$studentNo;$row['student_name']=$name;$row['code']=$code;
    if($name!=='')$row['name_image']=null;
    $row['answers']=str_pad($answers,$n1,'-');$row['part2']=$part2;$row['part3']=$part3;
    $row=grade_submission($row,$key,$exam);$row['updated_at']=date('c');
    unset($row['_capture_token'],$row['_undo_previous']);
    $data['submissions'][$index]=$row;return $row;
}
