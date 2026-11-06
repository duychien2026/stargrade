// The supplied pink form uses the same printed grid as BGD 2025 original,
// at 150% source resolution. Keep a separate template ID and independent data
// so saved exams, recognition and review never change the black form.
(function(){
  const template=JSON.parse(JSON.stringify(MAU.bgd2025original));
  template.ten='BGD-2025-CV1239-Hồng';
  MAU.bgd2025pink=template;
})();
