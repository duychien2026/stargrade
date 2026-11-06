# Green menu interface — 2026-11-03

The user-supplied screenshot guides the green header, vertical menu with large icon buttons, translucent teal panel and answer-sheet background. StarMind Exam branding remains. The menu links to the app's actual workflows: exams, scanning, results, students/classes, downloads, answer settings and a new built-in help page. No donation/payment placeholder is added.

`public/grade-theme.css` overrides presentation after the existing CSS; recognition, template geometry, scoring, storage and the camera overlay logic are unchanged. The background reuses the blank TNMaker asset already shipped with the app. Help is available even before an exam is created; exam-dependent menu entries guide the user to create/open an exam.

Validation: JavaScript syntax check; existing key save/reload regression test; browser checks at normal desktop and 390 × 844 mobile dimensions, including no horizontal overflow, Phú Thọ 50/10/12 counts, 160 Part I buttons, 64 Part II buttons and 6 short-answer inputs for the QM test exam. Verified home/help/exam/scan/keys navigation and dark mode; no browser console errors. Browser QA used a temporary read-only fixture server with synthetic data; it did not register an account or write real exam data.
