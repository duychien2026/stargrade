<?php
class CameraDuplicate extends RuntimeException { public function __construct(public int $existingId){parent::__construct('Phiếu này đã được lưu. Hãy kiểm tra trước khi chấm lại.',409);} }
function camera_create(array &$data,int $userId,int $examId,array $body): array {
    $exam=null;foreach($data['exams'] as $item)if($item['id']===$examId&&$item['user_id']===$userId)$exam=$item;
    if(!$exam)throw new RuntimeException('Không tìm thấy bài thi',404);
    $requestId=(string)($body['client_request_id']??'');
    if(!preg_match('/^[a-zA-Z0-9-]{16,80}$/',$requestId))throw new RuntimeException('Thiếu mã yêu cầu lưu phiếu',422);
    foreach($data['submissions'] as $row)if($row['exam_id']===$examId&&($row['client_request_id']??'')===$requestId){
        if(!empty($row['deleted_at']))throw new RuntimeException('Lần lưu này đã được hoàn tác',410);
        return $row;
    }
    $id=next_id($data['submissions']);$code=trim((string)($body['code']??''));$sbd=trim((string)($body['student_no']??''));
    $signature=hash('sha256',json_encode([$code,$body['answers']??'',array_values((array)($body['part2']??[])),array_values((array)($body['part3']??[]))],JSON_UNESCAPED_UNICODE));
    $existing=null;foreach($data['submissions'] as $row)if($row['exam_id']===$examId&&empty($row['deleted_at'])&&$row['code']===$code&&(($sbd!==''&&$row['student_no']===$sbd)||($sbd===''&&($row['capture_signature']??'')===$signature)))$existing=$row;
    $replace=(int)($body['replace_submission_id']??0);
    if($replace&&(!$existing||$existing['id']!==$replace))throw new RuntimeException('Phiếu chấm lại không còn khớp. Hãy kiểm tra danh sách kết quả.',409);
    if($existing&&!$replace&&empty($body['allow_duplicate']))throw new CameraDuplicate($existing['id']);
    if(!empty($body['auto_save'])){
        $key=null;foreach($data['keys'] as $k)if($k['exam_id']===$examId&&$k['code']===$code)$key=$k;
        if(!$key)throw new RuntimeException('Mã đề chưa có đáp án',422);
        foreach([$body,$key] as $source){
            if(strlen((string)($source['answers']??''))!==(int)$exam['question_count']||preg_match('/[^ABCD]/',(string)$source['answers']))throw new RuntimeException('Phần I cần kiểm tra trước khi tự lưu',422);
            for($i=0;$i<(int)($exam['part2_count']??0);$i++)if(!preg_match('/^[ĐS]{4}$/u',(string)($source['part2'][$i]??'')))throw new RuntimeException('Phần II cần kiểm tra trước khi tự lưu',422);
            for($i=0;$i<(int)($exam['part3_count']??0);$i++)if(!preg_match('/^-?\d+(,\d+)?$/',(string)($source['part3'][$i]??'')))throw new RuntimeException('Phần III cần kiểm tra trước khi tự lưu',422);
        }
        if(!in_array($exam['sheet_template']??'bgd2',['qm40','tnmaker40'],true)&&!preg_match('/^\d{'.(in_array($exam['sheet_template']??'',['tn40n','qmcv4'],true)?6:8).'}$/',$sbd))throw new RuntimeException('Số báo danh cần kiểm tra',422);
    }
    // Validate and grade in a copy so rejected requests cannot leave partial rows.
    $copy=$data;$previous=$replace?$existing:null;
    if(!$replace)$copy['submissions'][]=['id'=>$id,'exam_id'=>$examId,'student_no'=>'','student_name'=>'','code'=>$code,'answers'=>'','part2'=>[],'part3'=>[],'created_at'=>date('c')];else $id=$replace;
    $row=edit_submission($copy,$userId,$examId,$id,$body);
    $row['image_data']=$body['image_data']??null;$row['name_image']=$row['student_name']===''?($body['name_image']??null):null;
    $row['client_request_id']=$requestId;$row['capture_signature']=$signature;$row['capture_source']='camera';$row['_capture_token']=bin2hex(random_bytes(16));
    if($previous){unset($previous['_undo_previous']);$row['_undo_previous']=$previous;}
    foreach($copy['submissions'] as &$item)if($item['id']===$id&&$item['exam_id']===$examId)$item=$row;unset($item);
    $data=$copy;return $row;
}
function camera_undo(array &$data,int $userId,int $examId,int $id,string $token): void {
    $owned=false;foreach($data['exams'] as $exam)if($exam['id']===$examId&&$exam['user_id']===$userId)$owned=true;
    if(!$owned)throw new RuntimeException('Không tìm thấy bài thi',404);
    foreach($data['submissions'] as &$row)if($row['exam_id']===$examId&&$row['id']===$id){
        if($token!==''&&($row['_last_undo_token']??'')===$token)return;
        if($token===''||!hash_equals((string)($row['_capture_token']??''),$token))throw new RuntimeException('Phiếu đã được thay đổi. Không thể hoàn tác lần lưu cũ.',409);
        if(isset($row['_undo_previous']))$row=$row['_undo_previous'];else $row['deleted_at']=date('c');
        unset($row['_capture_token'],$row['_undo_previous']);$row['_last_undo_token']=$token;return;
    }
    throw new RuntimeException('Không tìm thấy phiếu',404);
}
