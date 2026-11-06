<?php
class GradingWarning extends RuntimeException {
    public function __construct(public string $kind,public array $messages,public ?int $existingId=null,int $status=409){parent::__construct($messages[0]??'Cần kiểm tra phiếu',$status);}
}
function preview_grading_submission(array $data,int $userId,int $examId,array $body): array {
    $owned=false;foreach($data['exams'] as $exam)if($exam['id']===$examId&&$exam['user_id']===$userId)$owned=true;
    if(!$owned)throw new RuntimeException('Không tìm thấy bài thi',404);
    $id=next_id($data['submissions']??[]);
    $data['submissions'][]=['id'=>$id,'exam_id'=>$examId,'student_no'=>'','student_name'=>'','code'=>'','answers'=>'','part2'=>[],'part3'=>[]];
    $row=edit_submission($data,$userId,$examId,$id,$body);
    return array_intersect_key($row,array_flip(['score','parts','flags','student_no','student_name','code']));
}
function save_grading_submission(array &$data,int $userId,int $examId,array $body): array {
    $exam=null;$owner=null;foreach($data['exams'] as $item)if($item['id']===$examId&&$item['user_id']===$userId)$exam=$item;
    foreach($data['users'] as $user)if($user['id']===$userId)$owner=$user;
    if(!$exam||!$owner)throw new RuntimeException('Không tìm thấy bài thi',404);
    $settings=grading_preferences($owner);$code=trim((string)($body['code']??''));$studentNo=trim((string)($body['student_no']??''));$request=(string)($body['request_id']??'');
    if($request!==''&&!preg_match('/^[a-zA-Z0-9-]{16,80}$/',$request))throw new RuntimeException('Mã yêu cầu không hợp lệ',422);
    $requestHash=hash('sha256',json_encode(array_map(fn($key)=>$body[$key]??null,['student_no','student_name','code','answers','part2','part3','image_data','name_image']),JSON_UNESCAPED_UNICODE));
    foreach($data['submissions'] as $row)if($request!==''&&$row['exam_id']===$examId&&empty($row['deleted_at'])&&($row['request_id']??'')===$request){if(isset($row['request_hash'])&&!hash_equals($row['request_hash'],$requestHash))throw new RuntimeException('Nội dung phiếu đã thay đổi. Hãy gửi yêu cầu lưu mới.',409);return $row;}
    $key=null;foreach($data['keys'] as $item)if($item['exam_id']===$examId&&$item['code']===$code)$key=$item;
    if(!$key)throw new GradingWarning('code',['Không tìm thấy đáp án cho mã đề này. Hãy kiểm tra và sửa mã đề trước khi chấm.'],null,422);
    $existing=null;foreach($data['submissions'] as $row)if($studentNo!==''&&$row['exam_id']===$examId&&$row['student_no']===$studentNo&&empty($row['deleted_at']))$existing=$row;
    if($existing&&$settings['warn_duplicate']&&empty($body['confirm_duplicate']))throw new GradingWarning('duplicate',['Số báo danh '.$studentNo.' đã có phiếu trong bài thi này. '.($settings['overwrite_duplicate']?'Lần chấm này sẽ ghi đè phiếu cũ.':'Lần chấm này sẽ được lưu thành phiếu mới.')],$existing['id']);
    $replace=$existing&&$settings['overwrite_duplicate'];$id=$replace?$existing['id']:next_id($data['submissions']);$copy=$data;
    if(!$replace)$copy['submissions'][]=['id'=>$id,'exam_id'=>$examId,'student_no'=>'','student_name'=>'','code'=>$code,'answers'=>'','part2'=>[],'part3'=>[],'created_at'=>date('c')];
    $row=edit_submission($copy,$userId,$examId,$id,$body);
    if($settings['warn_answers']&&$row['flags']&&empty($body['confirm_answers']))throw new GradingWarning('answers',$row['flags']);
    $row['image_data']=$body['image_data']??null;$row['name_image']=$row['student_name']===''?($body['name_image']??null):null;$row['request_id']=$request;$row['request_hash']=$requestHash;
    foreach($copy['submissions'] as &$item)if($item['id']===$id&&$item['exam_id']===$examId)$item=$row;unset($item);
    $data=$copy;return $row;
}
function export_grading_rows(array $rows,string $mode): array {
    $rows=array_values(array_filter($rows,fn($row)=>empty($row['deleted_at'])));if($mode!=='class')return $rows;
    usort($rows,fn($a,$b)=>strnatcasecmp((string)($a['class_name']??''),(string)($b['class_name']??''))?:strnatcasecmp((string)($a['student_no']??''),(string)($b['student_no']??''))?:(($a['id']??0)<=>($b['id']??0)));
    return $rows;
}
