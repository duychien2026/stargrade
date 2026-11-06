<?php
declare(strict_types=1);

// One-time, user-requested fresh start. Accounts remain unchanged; the complete
// previous store is retained outside the public directory for recovery.
function apply_fresh_start(string $file): void {
    if (!is_file($file)) return;
    $handle=fopen($file,'r+');
    if (!$handle || !flock($handle,LOCK_EX)) throw new RuntimeException('Không khóa được dữ liệu để sao lưu');
    try {
        $raw=stream_get_contents($handle);
        $data=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
        $version='fresh-start-20261102-qmcv1239';
        if (isset($data['_maintenance'][$version])) return;
        $backup=$file.'.'.$version.'.'.bin2hex(random_bytes(6)).'.bak';
        $copy=fopen($backup,'x');
        if (!$copy) throw new RuntimeException('Không tạo được bản sao lưu');
        chmod($backup,0600);
        try { if (fwrite($copy,$raw)!==strlen($raw) || !fflush($copy)) throw new RuntimeException('Sao lưu chưa hoàn tất'); }
        finally { fclose($copy); }
        $counts=[];
        foreach (['exams','keys','students','submissions'] as $field) {
            $counts[$field]=count($data[$field]??[]);
            $data[$field]=[];
        }
        $data['_maintenance'][$version]=['completed_at'=>date('c'),'backup'=>basename($backup),'removed_counts'=>$counts];
        $json=json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
        rewind($handle);
        if (fwrite($handle,$json)!==strlen($json) || !ftruncate($handle,strlen($json)) || !fflush($handle)) throw new RuntimeException('Không lưu được dữ liệu mới; bản sao lưu được giữ lại');
    } finally { flock($handle,LOCK_UN);fclose($handle); }
}
