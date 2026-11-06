<?php
function omr_dark_score($im, $cx, $cy, $radius = 7) {
    $dark = 0; $total = 0;
    for ($y = $cy - $radius; $y <= $cy + $radius; $y++) {
        for ($x = $cx - $radius; $x <= $cx + $radius; $x++) {
            $rgb = imagecolorat($im, $x, $y);
            $r = ($rgb >> 16) & 255; $g = ($rgb >> 8) & 255; $b = $rgb & 255;
            if (($r + $g + $b) / 3 < 125) $dark++;
            $total++;
        }
    }
    return $total ? $dark / $total : 0;
}

function omr_pick($im, $xs, $y, $labels) {
    $scores = [];
    foreach ($xs as $x) $scores[] = omr_dark_score($im, $x, $y);
    $max = max($scores); $idx = array_search($max, $scores, true);
    return $max < 0.22 ? '-' : $labels[$idx];
}

function omr_read_sheet($bytes) {
    $im = @imagecreatefromstring($bytes);
    if (!$im) throw new RuntimeException('Không đọc được ảnh phiếu');
    $w = imagesx($im); $h = imagesy($im);
    $sx = $w / 1552; $sy = $h / 2254;
    $scaleX = function($x) use ($sx) { return (int)round($x * $sx); };
    $scaleY = function($y) use ($sy) { return (int)round($y * $sy); };
    $at = function($x, $y) use ($scaleX, $scaleY) { return [$scaleX($x), $scaleY($y)]; };
    $pick = function($xs, $y, $labels) use ($im, $scaleX, $scaleY) {
        return omr_pick($im, array_map($scaleX, $xs), $scaleY($y), $labels);
    };

    $digitY = [0=>219,1=>265,2=>311,3=>357,4=>406,5=>451,6=>497,7=>543,8=>588,9=>634];
    $idX = [1064,1094,1124,1157,1187,1223,1250,1283]; $codeX = [1355,1392,1428,1465];
    $readDigits = function($xs) use ($digitY, $im, $scaleX, $scaleY) {
        $out = '';
        foreach ($xs as $x) { $best = '-'; $max = 0; foreach ($digitY as $d=>$y) { $v = omr_dark_score($im, $scaleX($x), $scaleY($y)); if ($v > $max) {$max=$v; $best=(string)$d;} } $out .= $max < 0.22 ? '?' : $best; }
        return $out;
    };
    $studentNo = $readDigits($idX); $code = $readDigits($codeX);

    $cols = [179,247,315,383]; $offsets = [0,341,682,1023]; $part1 = '';
    for ($q=0; $q<40; $q++) $part1 .= $pick(array_map(function($x) use ($offsets, $q) { return $x + $offsets[(int)floor($q/10)]; }, $cols), 853 + ($q%10)*36, ['A','B','C','D']);

    $part2X = [[178,247],[316,384],[519,587],[657,725],[859,927],[997,1065],[1199,1267],[1337,1405]];
    $part2=[]; for($q=0;$q<8;$q++){ $s=''; for($r=0;$r<4;$r++) $s .= $pick($part2X[$q],1367+$r*35,['Đ','S']); $part2[]=$s; }

    $part3=[]; $boxX=[169,386,603,820,1037,1254];
    foreach($boxX as $base){$cells=[]; for($r=0;$r<10;$r++){$row=[]; foreach([0,45,91,137] as $dx)$row[]=omr_dark_score($im,$scaleX($base+$dx),$scaleY(1760+$r*36)); $cells[]=$row; } $part3[]=$cells;}
    imagedestroy($im);
    return ['student_no'=>$studentNo,'code'=>$code,'part1'=>$part1,'part2'=>$part2,'part3'=>$part3,'warnings'=>[]];
}
