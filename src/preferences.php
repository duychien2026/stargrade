<?php
function grading_defaults(): array {return ['default_exam_name'=>'StarGrade','warn_duplicate'=>false,'show_grading_result'=>true,'auto_save_grading'=>false,'warn_code'=>true,'warn_answers'=>true,'overwrite_duplicate'=>false,'export_mode'=>'exam','scan_resolution'=>'medium','erasure_mode'=>false];}
function grading_preferences(array $user): array {$settings=array_replace(grading_defaults(),array_intersect_key((array)($user['settings']??[]),grading_defaults()));if($settings['export_mode']==='student')$settings['export_mode']='class';return $settings;}
function public_account(array $user): array {return ['id'=>$user['id'],'name'=>$user['name'],'username'=>$user['username'],'settings'=>grading_preferences($user)];}
function update_preferences(array &$data,int $userId,array $body): array {
    foreach($data['users'] as &$user)if($user['id']===$userId){
        $settings=grading_preferences($user);
        foreach(['auto_save_grading','show_grading_result','warn_duplicate','warn_code','warn_answers','overwrite_duplicate','erasure_mode'] as $key)if(array_key_exists($key,$body)){if(!is_bool($body[$key]))throw new RuntimeException('Giá trị cài đặt không hợp lệ',422);$settings[$key]=$body[$key];}
        if(isset($body['default_exam_name'])){$name=trim((string)$body['default_exam_name']);if(!preg_match('/^.{1,160}$/us',$name))throw new RuntimeException('Tên bài mặc định cần từ 1 đến 160 ký tự',422);$settings['default_exam_name']=$name;}
        foreach(['export_mode'=>['exam','class'],'scan_resolution'=>['low','medium','high']] as $key=>$allowed)if(isset($body[$key])){if(!in_array($body[$key],$allowed,true))throw new RuntimeException('Lựa chọn cài đặt không hợp lệ',422);$settings[$key]=$body[$key];}
        $user['settings']=$settings;return $settings;
    }
    throw new RuntimeException('Không tìm thấy tài khoản',404);
}
function update_account(array &$data,int $userId,array $body): array {
    foreach($data['users'] as $index=>$user)if($user['id']===$userId){
        if(isset($body['username'])&&$body['username']!==$user['username'])throw new RuntimeException('Không được đổi tên người dùng',422);
        $changed=false;
        if(array_key_exists('name',$body)){$name=trim((string)$body['name']);if(!preg_match('/^.{1,160}$/us',$name))throw new RuntimeException('Tên hiển thị cần từ 1 đến 160 ký tự',422);$user['name']=$name;}
        if(array_key_exists('new_password',$body)){
            if(!password_verify((string)($body['current_password']??''),$user['password_hash']))throw new RuntimeException('Mật khẩu hiện tại không đúng',422);
            $password=(string)$body['new_password'];if(!preg_match('/^.{8,}$/us',$password)||strlen($password)>72)throw new RuntimeException('Mật khẩu mới cần ít nhất 8 ký tự và không quá 72 byte',422);
            if($password!==($body['confirm_password']??null))throw new RuntimeException('Xác nhận mật khẩu chưa khớp',422);
            $user['password_hash']=password_hash($password,PASSWORD_DEFAULT);$user['auth_version']=(int)($user['auth_version']??0)+1;$changed=true;
        }
        $data['users'][$index]=$user;return ['user'=>public_account($user),'password_changed'=>$changed,'auth_version'=>(int)($user['auth_version']??0)];
    }
    throw new RuntimeException('Không tìm thấy tài khoản',404);
}
