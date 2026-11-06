// One display order shared by exam creation and sheet downloads. IDs retain
// the existing recognition geometry and saved exams' template associations.
const sheetCatalog=[
  {id:'bgd2',name:'TNMaker-BGD-2025-CV1239',description:'40 câu A/B/C/D · 8 câu Đúng/Sai · 6 câu trả lời ngắn · SBD 8 số · mã đề 4 số.',image:'/assets/phieu-chinh.png',pdf:'/assets/phieu-chinh.pdf'},
  {id:'tnmaker40',name:'TNMaker-40 Ngang-ABCD',description:'40 câu A/B/C/D · mã đề 4 số · số phách.',image:'/assets/tnmaker-40.png',pdf:'/assets/tnmaker-40.pdf'},
  {id:'bgd2025original',name:'BGD-2025-CV1239-Đen',description:'40 câu A/B/C/D · 8 câu Đúng/Sai · 6 câu trả lời ngắn · SBD 8 số · mã đề 4 số.',image:'/assets/bgd-2025-original-clean.jpg',pdf:'/assets/bgd-2025-original.pdf'},
  {id:'bgd2025pink',name:'BGD-2025-CV1239-Hồng',description:'40 câu A/B/C/D · 8 câu Đúng/Sai · 6 câu trả lời ngắn · SBD 8 số · mã đề 4 số.',image:'/assets/bgd-2025-pink.jpg',pdf:'/assets/bgd-2025-pink.pdf'},
  {id:'qm40',name:'QM-40 Ngang-ABCD',description:'40 câu A/B/C/D · mã đề 4 số · không có vùng tô SBD.',image:'/assets/qm-40-ngang-clean.jpg',pdf:'/assets/qm-40-ngang.pdf'},
  {id:'qmcv1239',name:'QM-BGD-2025-CV1239',description:'40 câu A/B/C/D · 8 câu Đúng/Sai · 6 câu trả lời ngắn · SBD 8 số · mã đề 4 số.',image:'/assets/qm-cv1239.jpg',pdf:'/assets/qm-cv1239.pdf'},
  {id:'qmcv4',name:'QM2025-CV4 Ngang',description:'12 câu A/B/C/D · 4 câu Đúng/Sai · 6 câu trả lời ngắn · SBD 6 số · mã đề 4 số · ảnh số phách.',image:'/assets/qm2025-cv4-ngang.png',pdf:null},
  {id:'phutho',name:'HSG-Phú Thọ-2025',description:'50 câu A/B/C/D · 10 câu Đúng/Sai · 12 câu trả lời ngắn · SBD 8 số · mã đề 4 số.',image:'/assets/phu-tho.jpg',pdf:'/assets/phu-tho.pdf'}
];
for(const sheet of sheetCatalog)if(MAU[sheet.id])MAU[sheet.id].ten=sheet.name;
