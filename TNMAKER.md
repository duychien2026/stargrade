# TNMaker 40 câu ngang, mã đề 4 số

The visible horizontal template and its download card now use the supplied PNG/PDF, named “Phiếu ngang – 40 câu A/B/C/D - TNMaker”. `public/tnmaker-sheet.js` defines the new `tnmaker40` geometry independently. It has 40 multiple-choice answers, four code columns (top to bottom 0–9), no student-number grid, and a fallback identity crop inside the số phách box `(1028, 446, 561, 126)` on the 2479 × 1746 source.

Existing exams with `tn40n` retain their old geometry, code length and saved keys/reviews. New exams use `tnmaker40`; the old template is only offered when editing a legacy exam. Other template definitions are unchanged.

Recognition uses the existing shared perspective reader and all available square markers. Camera guide, rectification, review circles and crop share the new image bounds. New exam codes default to 0101–0104.

To prepare the Windows raster test, convert `public/assets/tnmaker-40.png` to `tmp/tnmaker-test.bmp` with System.Drawing (as described in PHU-THO.md), then run `node tests/tnmaker.cjs`. This checks the blank image, independently painted centers for all 40 answers, code 0104, no SBD, and perspective/uneven-light distortion. These synthetic checks do not guarantee every real camera photo will be readable.
