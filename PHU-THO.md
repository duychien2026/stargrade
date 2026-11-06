# Phiếu TLTN_HSG_Phú Thọ

Template ID: `phutho`. Geometry lives only in `public/phu-tho-sheet.js`; the four existing template definitions and OMR engine are unchanged.

The supplied 1654 × 2339 image contains 50 multiple-choice questions, 10 true/false questions (40 statements), 12 short answers in two rows, an eight-digit student number and a four-digit exam code. Coordinates use source pixels divided by 100. The four outside squares and eight intermediate squares refine the perspective transform through the existing shared reader. Output uses the complete source-image bounds, so recognition, review rings and the name crop share the same coordinate system.

The fallback name crop is `(676, 391, 420, 65)` in source pixels, matching the user's red rectangle. Existing result-saving behavior discards the crop when a student name is available from the class list or manual entry. Downloads include the unmarked image and the original supplied PDF.

Select this template when creating an exam. Its default/max counts are 50/10/12; all previous templates keep their own limits. Existing exams retain their template when edited.

## Verification

From the repository root, on Windows, prepare the raster fixture from the committed image:

```powershell
New-Item -ItemType Directory -Force tmp | Out-Null
Add-Type -AssemblyName System.Drawing
$image = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) 'public/assets/phu-tho.jpg'))
$image.Save((Join-Path (Get-Location) 'tmp/phu-tho-test.bmp'), [System.Drawing.Imaging.ImageFormat]::Bmp)
$image.Dispose()
node tests/phu-tho.cjs
php tests/phu-tho-create.php
php tests/exam-edit.php
php tests/regrade.php
node tests/key-editor.cjs
```

The raster test checks the blank sheet, independently painted bubble centers, all question groups, signs, decimals, a trailing empty digit column, a wholly blank question, leading zeros, and a perspective-warped copy with uneven light. These are synthetic checks on the supplied template, not a guarantee of perfect results on every camera photo.
