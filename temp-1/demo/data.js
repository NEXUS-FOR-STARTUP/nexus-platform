'use strict';
/* Danh mục dùng cho demo. Bản thật: đặt trong packages/validation/src/catalogs/. */
window.NX = window.NX || {};

NX.CAPS = [
  { id: 'code', label: 'Làm website, app, bảng tính tự động', hint: 'Viết code, hoặc dùng thành thạo Google Sheet, Notion, công cụ no-code' },
  { id: 'design', label: 'Thiết kế hình ảnh, slide, dựng video', hint: 'Canva, Figma, CapCut, chụp ảnh…' },
  { id: 'write', label: 'Viết bài, soạn nội dung, làm báo cáo', hint: 'Viết rõ ràng, tóm tắt gọn, soạn tài liệu' },
  { id: 'sell', label: 'Nói chuyện, thuyết phục, bán hàng', hint: 'Giới thiệu sản phẩm, chốt đơn, thuyết trình' },
  { id: 'interview', label: 'Làm quen và hỏi chuyện người lạ', hint: 'Dám bắt chuyện, hỏi đến nơi đến chốn, ghi lại được' },
  { id: 'finance', label: 'Tính chi phí, giá bán, sổ sách', hint: 'Biết tính lời lỗ, lập bảng chi tiêu' },
  { id: 'ops', label: 'Giữ nhịp việc cho cả nhóm', hint: 'Chia việc, nhắc hạn, theo sát đến khi xong' },
  { id: 'craft', label: 'Làm đồ thật: thủ công, nấu ăn, chế tạo', hint: 'Dùng tay hoặc dụng cụ để làm ra sản phẩm thật' },
  { id: 'domain', label: 'Hiểu sâu một nghề hoặc một lĩnh vực', hint: 'Ví dụ: nông nghiệp, y tế, luật, bếp núc, cơ khí' },
];
NX.LEVELS = [
  { v: 1, label: 'Mới biết' },
  { v: 2, label: 'Làm được' },
  { v: 3, label: 'Làm chắc' },
];

NX.GOALS = [
  { id: 'pass', title: 'Chủ yếu để qua môn', sub: 'Cần một dự án vừa sức, làm xong đúng hạn.' },
  { id: 'real', title: 'Muốn làm thật, có thể làm tiếp sau môn', sub: 'Chấp nhận vất vả hơn để có thứ dùng được.' },
  { id: 'unsure', title: 'Chưa biết, đang tìm hiểu', sub: 'Không sao. Bạn có thể đổi ý sau.' },
];
NX.BUDGETS = [
  { id: 'b0', title: 'Gần như 0 đồng', sub: 'Chỉ dùng đồ miễn phí.', v: 0 },
  { id: 'b1', title: 'Dưới 500.000đ', sub: 'Đủ in vài tờ rơi hoặc chạy thử quảng cáo nhỏ.', v: 1 },
  { id: 'b2', title: '500.000đ đến 2 triệu', sub: 'Đủ mua nguyên liệu làm thử.', v: 2 },
  { id: 'b3', title: 'Trên 2 triệu', sub: 'Có thể thuê người làm giúp một phần.', v: 3 },
];

// 4–6 là chuẩn chung của các môn khởi nghiệp. EXE101 thêm ràng buộc chuyên ngành:
// syllabus ghi "at least 2 different majors" (dòng 401).
NX.TEAM_RULES = { sizeMin: 4, sizeMax: 6, majorsMin: 2 };

// Danh sách cố định để đếm chuyên ngành: gõ tay thì "CNTT", "IT", "Công nghệ thông tin"
// bị tính thành 3 ngành khác nhau và báo đủ sai.
NX.MAJORS = ['Công nghệ thông tin', 'Kỹ thuật phần mềm', 'An toàn thông tin', 'Trí tuệ nhân tạo',
  'Kinh doanh', 'Tài chính - Ngân hàng', 'Marketing', 'Thiết kế đồ hoạ', 'Ngành khác'];

// Ba mảng nghề AI dùng để chấm. Bảy ngành map thẳng; chỉ "Ngành khác" phải hỏi 1 chip,
// vì báo cáo đếm số người theo mảng — gán bừa là hiện số liệu sai cho người dùng.
NX.TRACKS = [
  { id: 'ky_thuat', label: 'Kỹ thuật' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'kinh_doanh_tai_chinh', label: 'Kinh doanh – Tài chính' },
];
NX.TRACK_BY_MAJOR = {
  'Công nghệ thông tin': 'ky_thuat', 'Kỹ thuật phần mềm': 'ky_thuat',
  'An toàn thông tin': 'ky_thuat', 'Trí tuệ nhân tạo': 'ky_thuat',
  'Kinh doanh': 'kinh_doanh_tai_chinh', 'Tài chính - Ngân hàng': 'kinh_doanh_tai_chinh',
  'Marketing': 'marketing', 'Thiết kế đồ hoạ': 'ky_thuat',
};
NX.ASKED_MAJORS = ['Ngành khác'];
NX.TRACK_WORK = {
  ky_thuat: 'phần làm ra sản phẩm và phần thiết kế',
  marketing: 'phần nói cho khách hiểu và phần hình ảnh',
  kinh_doanh_tai_chinh: 'phần tính giá, chi phí và kế hoạch',
};

/* Sáu ô của "Mad Libs" — đúng bằng IdeaInputSchema của bản thật. */
NX.MAD_LIBS = [
  { id: 'projectName', n: 'Dự án tạm gọi là gì?', min: 2, ph: 'Ví dụ: Quán Xanh' },
  { id: 'field', n: 'Nó ở lĩnh vực nào?', min: 2, ph: 'Ví dụ: đồ uống, quản lý quán, học tập' },
  { id: 'targetCustomer', n: 'Bạn làm cho ai? Càng cụ thể càng tốt.', min: 5, ph: 'Ví dụ: quán cà phê nhỏ quanh trường có 1–3 nhân viên' },
  { id: 'problem', n: 'Họ đang gặp chuyện gì?', min: 10, ph: 'Ví dụ: khách đặt món qua ba kênh khác nhau, chủ quán phải nhớ bằng đầu nên hay làm sót.' },
  { id: 'solution', n: 'Bạn định giải quyết bằng cách nào?', min: 10, ph: 'Ví dụ: một bảng Sheet chung và tin nhắn Zalo nhắc đơn, làm tay trước.' },
  { id: 'mvp', n: 'Bản thử nhỏ nhất làm được trong 2 tuần là gì?', min: 5, ph: 'Ví dụ: một quán quen dùng thử Sheet ghi đơn trong 1 tuần.' },
];

// Ba vai dùng để kiểm nhóm có giữ được tới hết môn. Marketing và truyền thông gộp làm một
// vì người làm được việc này thường làm được việc kia. `caps` là kỹ năng tính là cover vai đó.
NX.CORE_ROLES = [
  { id: 'build', label: 'làm ra sản phẩm', duty: 'phần làm sản phẩm', caps: ['code', 'craft'],
    stage: 'lúc làm sản phẩm cho khách dùng thử',
    need: 'một người trực tiếp làm ra thứ khách dùng được, bằng code hoặc bằng tay' },
  { id: 'reach', label: 'đi gặp khách và hỏi chuyện', duty: 'phần gặp khách', caps: ['sell', 'interview'],
    stage: 'lúc đi phỏng vấn khách',
    need: 'một người dám đi gặp khách và hỏi chuyện người lạ' },
  { id: 'money', label: 'tính tiền và lập kế hoạch', duty: 'phần tính tiền', caps: ['finance'],
    stage: 'lúc tính chi phí, giá bán và làm kế hoạch',
    need: 'một người tính được chi phí, giá bán và dòng tiền' },
];

NX.ASSET_PROMPTS = [
  { id: 'family', title: 'Gia đình hoặc họ hàng của bạn hoặc các bạn trong nhóm làm nghề gì?',
    why: 'Nhiều nhóm tìm ra hướng đi từ chính nghề của gia đình. Bạn thấy bình thường, nhưng người ngoài thì không có.',
    ph: 'Ví dụ: Nhà mình mở cửa hàng bán vật tư nông nghiệp ở quê. Mình thường phụ bán cuối tuần.' },
  { id: 'work', title: 'Ai trong nhóm từng làm thêm, bán hàng hoặc làm việc gì ngoài trường?',
    why: 'Việc đã làm thật cho biết bạn hiểu khách hàng nào và quy trình nào.',
    ph: 'Ví dụ: Mình làm phục vụ quán cà phê 1 năm. Mình có bán đồ handmade trên Facebook.' },
  { id: 'people', title: 'Nhóm quen ai làm nghề đặc biệt, hoặc có thể nhờ giúp?',
    why: 'Một người quen đúng nghề có thể thay cho cả tháng tự mò.',
    ph: 'Ví dụ: Cô mình là kế toán. Anh họ có xưởng mộc nhỏ. Bạn thân đang làm ở nhà thuốc.' },
  { id: 'tools', title: 'Ai trong nhóm có sẵn dụng cụ, máy móc, chỗ làm nào không?',
    why: 'Máy móc hoặc chỗ làm sẵn có giúp bạn làm được những thứ nhóm khác không dám nghĩ tới.',
    ph: 'Ví dụ: Nhà có máy may. Mình dùng được phòng lab ở trường. Mình có máy in 3D.' },
  { id: 'own', title: 'Ai trong nhóm có sở thích hoặc kiến thức riêng mà người khác thường không có?',
    why: 'Người hiểu rõ một thứ thường nhìn ra điều khó chịu mà người ngoài không thấy.',
    ph: 'Ví dụ: Mình chơi nhiều năm với cây cảnh. Mình rành giày sneaker. Mình học nấu ăn chay.' },
];

/* keys đã bỏ dấu, so khớp theo từ nguyên vẹn */
NX.ASSET_RULES = [
  { id: 'agri', label: 'Cửa hàng hoặc nghề nông nghiệp', keys: ['nong nghiep', 'vat tu', 'hat giong', 'phan bon', 'cay trong', 'nong dan', 'vuon', 'ruong', 'thuoc tru sau'],
    zone: { title: 'Người mua vật tư, hạt giống nông nghiệp', prose: 'Ở quanh nhà bạn có người quen làm nông nghiệp hoặc mở cửa hàng vật tư, và họ chính là người đang cần bạn tư vấn mỗi mùa vụ. Bạn có thể thử tư vấn chọn hạt giống, phân bón theo mùa và nhận đặt hàng qua Zalo, làm bằng tay cho vài khách quen trước chứ chưa tự làm công nghệ. Quan trọng nhất là phải hiểu rõ họ đang chọn vật tư theo thói quen hay theo tư vấn, và họ thường mua nhầm hay thiếu thông tin ở khâu nào.' } },
  { id: 'fnb', label: 'Quán ăn, quán cà phê, bếp', keys: ['quan an', 'quan ca phe', 'ca phe', 'nha hang', 'bep', 'tra sua', 'do an', 'phuc vu', 'pha che'],
    zone: { title: 'Quán ăn, quán cà phê nhỏ', prose: 'Gần trường có khá nhiều quán ăn, quán cà phê nhỏ, và họ đang phải tự ghi order bằng tay mỗi ngày. Bạn có thể thử ghi order, theo dõi nguyên liệu hay nhắc khách quen bằng Google Sheet và tin nhắn Zalo cho một việc lặp lại cụ thể ở một quán quen. Cần kiểm chứng là họ đang ghi chép bằng gì và việc nào trong ngày đang ngốn nhiều thời gian nhất của họ.' } },
  { id: 'retail', label: 'Cửa hàng, tiệm bán lẻ', keys: ['cua hang', 'tiem', 'tap hoa', 'ban le', 'shop'],
    zone: { title: 'Cửa hàng, tiệm bán lẻ nhỏ', prose: 'Mỗi con phố đều có tiệm bán lẻ nhỏ, và họ phải tự lo đơn, tự chụp ảnh, tự nhắn khách. Bạn có thể nhận đơn hộ, nhắc khách cũ qua Zalo, hoặc chụp ảnh và viết bài bán hàng thay họ theo từng gói nhỏ. Trước khi nhận lời, phải trả lời được câu hỏi khách mới của họ hiện đến từ đâu và họ đang mất khách vì lý do gì lặp đi lặp lại.' } },
  { id: 'online', label: 'Bán hàng online', keys: ['ban online', 'livestream', 'shopee', 'tiktok shop', 'ban hang online', 'ban tren facebook', 'chot don'],
    zone: { title: 'Người bán hàng online nhỏ', prose: 'Ai quanh bạn bán hàng trên Facebook, TikTok, Shopee thì mạnh dạn tới hỏi họ, vì họ đang tự gánh hết khâu hình ảnh, mô tả và trả lời khách. Bạn có thể làm dịch vụ nhỏ như làm ảnh, viết mô tả hay trả lời khách hộ theo gói nhỏ cho một shop quen. Cần trả lời được là họ đang mất thời gian nhất ở khâu nào và họ đã từng trả tiền cho ai làm giúp chưa.' } },
  { id: 'print', label: 'Tiệm in, photo', keys: ['tiem in', 'in an', 'photo', 'name card'],
    zone: { title: 'Tiệm in, tiệm photo', prose: 'Các tiệm in quanh trường cũng là nơi hay nhận đơn in nhỏ của sinh viên, và họ phải tự xoay xở phần thiết kế. Bạn có thể làm nhanh poster, name card cho khách của tiệm hoặc nhận đơn in hộ sinh viên theo từng đợt. Trước hết phải xác nhận xem khách thường than gì khi đến in và tiệm đang từ chối đơn thiết kế vì không có người làm.' } },
  { id: 'beauty', label: 'Spa, tóc, làm đẹp', keys: ['spa', 'toc', 'lam dep', 'nail', 'my pham', 'tham my'],
    zone: { title: 'Spa, tiệm tóc, tiệm làm đẹp nhỏ', prose: 'Salon, tiệm nail quanh trường đều đang phải nhắc lịch hẹn và chăm khách cũ bằng tay. Bạn có thể làm mẫu tin nhắn Zalo giúp họ nhắc lịch hẹn và liên lạc lại với khách cũ, chưa cần vội làm phần mềm. Cần biết rõ họ đang mất bao nhiêu khách vì quên lịch hoặc vì không liên lạc lại.' } },
  { id: 'auto', label: 'Xe cộ, sửa xe', keys: ['garage', 'sua xe', 'xe may', 'o to', 'rua xe', 'phu tung'],
    zone: { title: 'Tiệm sửa xe, rửa xe', prose: 'Tiệm sửa xe, rửa xe nào cũng gặp chuyện nhớ lịch bảo dưỡng cho khách bằng tay. Bạn có thể làm tin nhắn nhắc khách đến bảo dưỡng định kỳ và ghi lịch sử sửa xe bằng Sheet cho một tiệm quen. Câu hỏi cần trả lời là khách quay lại nhờ cách nào và họ có tự nhớ lịch bảo dưỡng không.' } },
  { id: 'tutoring', label: 'Dạy học, gia sư', keys: ['gia su', 'day kem', 'day hoc', 'trung tam', 'lop hoc'],
    zone: { title: 'Gia sư, lớp dạy kèm nhỏ', prose: 'Lớp dạy kèm nhỏ nào cũng phải tự lo tìm học viên và xếp lịch dạy, đó là việc lặp lại mỗi tuần. Bạn có thể làm nhóm Zalo và bảng Sheet giúp họ tìm học viên và xếp lịch, làm bằng tay cho một lớp quen trước. Cần xác nhận là gia sư đang kiếm học viên bằng cách nào và phụ huynh đang lo điều gì khi chọn gia sư.' } },
  { id: 'workshop', label: 'Xưởng, máy móc', keys: ['xuong', 'may moc', 'may ep', 'may cat', 'gia cong', 'co khi', 'xuong moc', 'do moc', 'may in 3d'],
    zone: { title: 'Sản phẩm làm trên máy móc bạn có sẵn', prose: 'Người có máy gia công, máy in, máy ép luôn có cách kiếm tiền từ chính máy móc đó. Bạn có thể nhận làm một loại sản phẩm nhỏ theo đơn đặt, tận dụng máy bạn đã có sẵn cho vài người quen trước. Cần kiểm chứng là ai sẵn sàng trả tiền cho món đồ này và một đơn tốn bao nhiêu công cùng nguyên liệu.' } },
  { id: 'lab', label: 'Phòng thí nghiệm, phòng lab', keys: ['phong lab', 'thi nghiem', 'phong thi nghiem', 'lab'],
    zone: { title: 'Bài toán có thể thử trong phòng lab', prose: 'Thầy cô hướng dẫn lab là người quyết định việc gì được làm trong phòng, nên hỏi họ từ sớm là nhất. Bạn có thể thử một bài nhỏ trong phạm vi lab cho phép, nhờ thầy cô góp ý trước khi làm tiếp. Quan trọng là phải xác nhận thầy cô có đồng ý cho dùng lab cho dự án này không và ai mới là người dùng thật.' } },
  { id: 'fashion', label: 'May mặc, thời trang, vải', keys: ['may mac', 'thoi trang', 'vai may', 'quan ao', 'xuong may', 'may do'],
    zone: { title: 'Thời trang và đồ may nhỏ', prose: 'Hỏi mẹ, hỏi thợ may, hỏi khách quen của họ, vì đó là những người đang mua và đặt đồ theo yêu cầu. Bạn có thể nhận may sửa hoặc bán một dòng đồ nhỏ theo đơn qua nhóm quen, làm từng đợt một. Cần kiểm chứng là họ đang mua loại này ở đâu và họ thường than phiền điều gì.' } },
  { id: 'hospitality', label: 'Du lịch, homestay, khách sạn', keys: ['homestay', 'khach san', 'du lich', 'nha nghi', 'tour'],
    zone: { title: 'Homestay, nhà nghỉ, dịch vụ du lịch nhỏ', prose: 'Chủ homestay quanh đây phải tự trả lời khách và xếp lịch đặt phòng mỗi ngày, rất tốn thời gian. Bạn có thể làm mẫu tin nhắn và Sheet giúp họ trả lời khách và xếp lịch cho một cơ sở quen. Cần trả lời được là họ đang mất khách ở khâu nào và hiện đang dùng gì để quản lý lịch đặt.' } },
  { id: 'health', label: 'Phòng khám, nhà thuốc', keys: ['phong kham', 'nha thuoc', 'y te', 'benh vien', 'dieu duong', 'bac si'],
    zone: { title: 'Người làm ở phòng khám, nhà thuốc (chỉ để hỏi, chưa làm sản phẩm y tế)', prose: 'Chỉ hỏi thôi, đừng vội làm sản phẩm y tế. Nếu có người thân làm ngành y tế, hãy ngồi nghe họ kể việc lặp lại nào họ gặp trong ngày và ghi lại nguyên văn, vì lĩnh vực này cần giấy phép. Sau đó mới kiểm chứng xem họ gặp việc lặp lại nào không dính đến chẩn đoán hay kê thuốc.' } },
  { id: 'pro', label: 'Kế toán, luật, văn phòng', keys: ['ke toan', 'luat su', 'van phong', 'bao hiem', 'bat dong san', 'moi gioi'],
    zone: { title: 'Dịch vụ văn phòng nhỏ', prose: 'Ai ở quanh bạn làm kế toán, luật, bất động sản, môi giới đều có việc lặp lại mỗi tuần. Bạn có thể soạn mẫu giấy tờ hoặc nhắc hạn nộp cho khách của họ bằng tin nhắn và bảng Sheet theo mẫu có sẵn. Cần kiểm chứng là việc nào họ lặp lại hằng tuần mà thấy phí thời gian.' } },
  { id: 'dorm', label: 'Ký túc xá, nhà trọ', keys: ['ky tuc xa', 'nha tro', 'ktx'],
    zone: { title: 'Người ở ký túc xá, nhà trọ', prose: 'Cùng khu trọ là nơi dễ bắt đầu nhất, cứ hỏi hàng xóm liền kề cho tiện. Bạn có thể làm dịch vụ nhỏ như gom đơn đồ ăn, giặt giũ hay sửa đồ cho vài người ở trọ quen. Cần kiểm chứng là hiện tại họ đang giải quyết việc đó bằng cách nào và họ có sẵn sàng trả thêm bao nhiêu.' } },
  { id: 'club', label: 'CLB, đội nhóm, sự kiện', keys: ['clb', 'cau lac bo', 'su kien', 'event', 'doi nhom'],
    zone: { title: 'Ban tổ chức CLB và sự kiện', prose: 'Mỗi CLB đều có ban tổ chức từng lo một sự kiện và phải ghi nhớ rất nhiều việc cùng lúc. Bạn có thể làm mẫu quản lý đăng ký, nhắc việc và tổng hợp phản hồi bằng Form và Sheet cho một sự kiện cụ thể, làm tay trước khi tự động hoá. Cần trả lời được là lần tổ chức gần nhất họ đã gặp rắc rối gì lặp đi lặp lại.' } },
];

NX.NET_OPTIONS = [
  { id: 'classmates', label: 'Bạn cùng lớp, cùng trường', zone: { title: 'Bạn cùng lớp đang làm project nhóm', prose: 'Các nhóm bạn trên lớp đang phải tự chia việc, đặt hạn và nhắc nhau mỗi ngày, rất dễ quên. Bạn có thể làm mẫu bảng Sheet chia việc và nhắc hạn cho một nhóm cụ thể, làm tay trước khi vội viết code. Cần kiểm chứng là nhóm nào đang bị lệch việc, họ đã thử cách nào và họ đang bất tiện ở đâu.' } },
  { id: 'dorm', label: 'Người ở ký túc xá, xóm trọ', zone: NX.ASSET_RULES.find(r => r.id === 'dorm').zone },
  { id: 'eatery', label: 'Quán ăn, quán cà phê quen', zone: NX.ASSET_RULES.find(r => r.id === 'fnb').zone },
  { id: 'online', label: 'Người bán hàng online quen', zone: NX.ASSET_RULES.find(r => r.id === 'online').zone },
  { id: 'club', label: 'CLB, đội nhóm, người làm sự kiện', zone: NX.ASSET_RULES.find(r => r.id === 'club').zone },
  { id: 'family', label: 'Gia đình, họ hàng đang kinh doanh nhỏ', zone: { title: 'Cơ sở kinh doanh nhỏ của gia đình, họ hàng', prose: 'Gia đình bạn buôn bán nhỏ, và ai cũng phải lo một việc lặp lại mỗi ngày như ghi sổ hay chụp ảnh sản phẩm. Bạn có thể giúp họ làm một việc như vậy, ví dụ ghi sổ, nhắn khách hay chụp ảnh sản phẩm, làm tay trước khi tự tính chuyện tự động. Điều cần kiểm chứng là việc nào họ thấy phiền nhất mỗi ngày.' } },
  { id: 'work', label: 'Nơi bạn làm thêm', zone: { title: 'Nơi bạn đang làm thêm', prose: 'Chỗ bạn làm thêm là nơi bạn hiểu rõ nhất công việc lặp lại ở đó, đừng bỏ qua chính nơi mình làm mỗi ngày. Bạn có thể nghĩ ra một việc lặp lại ở nơi làm và thử gỡ bằng cách làm tay cho một người cụ thể trước, đừng vội làm lớn. Cần lộ rõ là việc nào ở đó làm đi làm lại mà ai cũng ngán.' } },
  { id: 'mentor', label: 'Thầy cô, người đi làm quen biết', zone: { title: 'Người đi làm quen biết', prose: 'Thầy cô, người đi làm quen biết là người dễ chia sẻ nhất, vì họ đang nhìn thấy việc lãng phí ở chỗ làm. Trước hết chỉ cần hỏi họ một việc cụ thể mà họ thấy lãng phí thời gian và ghi lại nguyên văn câu họ nói, chưa vội nghĩ giải pháp. Cần xác nhận là họ có sẵn sàng dành 15 phút nói chuyện với bạn không.' } },
];
NX.SENSITIVE = [
  { id: 'health', label: 'Thuốc, bệnh, khám chữa bệnh' },
  { id: 'money', label: 'Tiền bạc, đầu tư, cho vay' },
  { id: 'food', label: 'Thực phẩm, đồ uống bán ra thị trường' },
  { id: 'data', label: 'Thông tin cá nhân, ảnh trẻ em' },
  { id: 'copyright', label: 'Tài liệu có bản quyền, đề thi, bài làm của người khác' },
  { id: 'none', label: 'Không có mục nào ở trên' },
];

NX.IDEA_RULES = [
  { id: 'forbidden', label: 'Có liên quan vũ khí, chất nổ, hạt nhân hoặc chất cấm', keys: ['bom', 'vu khi', 'hat nhan', 'nguyen tu', 'chat no', 'ma tuy', 'sung dan', 'lo phan ung'] },
  { id: 'illegal', label: 'Có thể vi phạm pháp luật hoặc bản quyền', keys: ['crack', 'hack', 'ban quyen lau', 'de thi', 'gian lan', 'lam ho bai', 'mua ban tai khoan'] },
  { id: 'ai', label: 'Có tự xây phần AI', keys: ['tri tue nhan tao', 'chatbot', 'machine learning', 'deep learning', 'app ai', 'ung dung ai', 'nen tang ai', 'dung ai', 'bang ai', 'ai chan doan', 'ai nhan dien', 'ai tu van'] },
  { id: 'physical', label: 'Làm ra sản phẩm thật bằng vật liệu hoặc máy móc', keys: ['ly giay', 'ly nhua', 'ly va', 'coc', 'ba ca phe', 'vat lieu', 'nhua', 'sinh hoc', 'che tao', 'san xuat', 'phan cung', 'iot', 'robot', 'drone', 'mach dien', 'hop dung'] },
  { id: 'marketplace', label: 'Sàn kết nối người mua và người bán', keys: ['san thuong mai', 'marketplace', 'san giao dich', 'ket noi nguoi ban', 'ket noi nguoi mua', 'san ket noi'] },
  { id: 'superapp', label: 'Cả hệ thống lớn làm cùng một lúc', keys: ['sieu ung dung', 'he sinh thai', 'toan dien', 'erp', 'all in one', 'tat ca trong mot'] },
  { id: 'logistics', label: 'Giao hàng hoặc vận chuyển', keys: ['giao hang', 'giao do an', 'shipper', 'van chuyen', 'logistics'] },
  { id: 'b2bLarge', label: 'Bán cho doanh nghiệp lớn hoặc cơ quan lớn', keys: ['benh vien', 'tap doan', 'giam doc', 'doanh nghiep lon', 'ngan hang', 'bo truong'] },
  { id: 'regulated', label: 'Dính đến sức khoẻ hoặc tiền bạc người khác', keys: ['y te', 'chan doan benh nhan', 'thuoc men', 'ke don thuoc', 'nha thuoc', 'dau tu', 'cho vay', 'chung khoan', 'tien ao', 'bao hiem', 'dieu tri'] },
  { id: 'software', label: 'Là website, app hoặc phần mềm', keys: ['app', 'ung dung', 'website', 'web', 'phan mem', 'nen tang'] },
];

NX.STRENGTH_ZONES = {
  design: { title: 'Shop nhỏ cần hình ảnh và nội dung bán hàng', prose: 'Shop nhỏ quanh bạn là khách hàng đầu tiên của bạn. Họ phải tự lo hình ảnh và bài đăng mỗi ngày nên rất cần người giúp. Bạn có thể làm gói ảnh và bài đăng cho vài shop thật, tính tiền theo gói nhỏ, làm từng đợt một. Cần kiểm chứng là shop đang làm ảnh bằng cách nào và họ đã từng trả tiền cho ai làm giúp chưa.' },
  code: { title: 'Nơi đang quản lý việc bằng giấy bút hoặc Sheet rối', prose: 'Ở quanh trường có nhiều nơi vẫn quản lý việc bằng giấy bút hoặc Sheet rối rít và rất dễ sai. Với bạn thì đây là việc phù hợp để thử. Bạn có thể làm một bảng Sheet hoặc biểu mẫu tự động cho đúng một việc lặp lại, làm tay trước khi vội viết code. Cần kiểm chứng là họ đang lưu thông tin ở đâu và việc nào hay bị nhầm hoặc quên.' },
  sell: { title: 'Hộ kinh doanh nhỏ muốn có thêm khách', prose: 'Hộ kinh doanh nhỏ quanh trường đều đang thật sự cần khách mới và không biết phải tìm khách ở đâu. Bạn có thể nhận bán hộ hoặc giới thiệu khách cho vài tiệm và hưởng phần trăm, làm từng đợt một để xem khách có tới không. Cần kiểm chứng là tiệm có sẵn lòng trả phần trăm cho khách mới không và khách mới hiện nay tới từ đâu.' },
  ops: { title: 'Nhóm làm project bị lệch việc', prose: 'Các nhóm sinh viên khác hay bị lệch việc vì không có ai nhắc hạn và không ai theo dõi. Bạn có thể làm mẫu chia việc và nhắc hạn bằng tay cho một nhóm cụ thể dùng thử, chưa cần viết phần mềm vội. Cần kiểm chứng là nhóm nào đang gặp chuyện này và họ đã thử cách nào.' },
  craft: { title: 'Đồ thủ công hoặc món ăn làm theo đơn', prose: 'Bạn bè, người ở ký túc xá thích món ăn và đồ làm tay theo đơn, đó là khách quen đầu tiên của bạn. Bạn có thể nhận làm vài món theo đơn đặt trước và bán qua nhóm quen, làm từng đợt một. Cần kiểm chứng là họ đã từng mua loại này ở đâu và họ đang chưa ưng chỗ nào.' },
};

NX.INTERVIEW_QS = [
  'Khi làm [việc X], điều gì làm bạn khó chịu hoặc mất thời gian nhất?',
  'Lần gần nhất bạn gặp chuyện đó là khi nào? Hôm đó chuyện gì đã xảy ra?',
  'Hiện giờ bạn xử lý chuyện đó bằng cách nào?',
  'Cách đó bất tiện ở chỗ nào, và bao lâu bạn gặp một lần?',
  'Bạn đã từng bỏ tiền, thời gian hay công sức để giải quyết chuyện này chưa? Cụ thể là gì?',
];

/* Kịch bản mẫu để xem nhanh. */
NX.PRESETS = [
  { name: 'Có ý tưởng rõ: nhóm marketing làm dịch vụ chẩn đoán lá', s: { schoolKind: 'fpt', schoolName: '', subjectKind: 'exe101', subjectName: '', goal: 'pass', budget: 'b1', teamSize: 4,
    team: [
      { name: 'An', caps: { sell: 3, write: 2 }, major: 'Marketing' }, { name: 'Bình', caps: { design: 2, write: 3 }, major: 'Thiết kế đồ hoạ' },
      { name: 'Chi', caps: { interview: 2, sell: 2 }, major: 'Kinh doanh' }, { name: 'Dũng', caps: { write: 2, finance: 1 }, major: 'Marketing' }],
    net: ['classmates', 'club'], sensitive: ['none'], ideaFork: 'yes',
    madlibs: {
      projectName: 'Lá Xanh',
      field: 'nông nghiệp',
      targetCustomer: 'Nông dân trồng rau quy mô nhỏ, quen của nhà mình ở quê',
      problem: 'Họ thấy lá bị đốm bệnh nhưng không biết là bệnh gì, thường phun thuốc tràn lan rồi mất cả vụ.',
      solution: 'Chụp ảnh lá gửi vào nhóm Zalo, mình tra bảng bệnh thường gặp và trả lời kèm khuyến cáo xử lý.',
      mvp: 'Một nhóm Zalo 10 nông dân quen, mình trả lời tay trong 2 tuần.',
    }, assets: {} } },
  { name: 'Ly và hộp từ bã cà phê, không có xưởng', s: { schoolKind: 'other', schoolName: 'ĐH Bách khoa TP.HCM', subjectKind: null, subjectName: '', goal: 'real', budget: 'b1', teamSize: 3,
    team: [{ name: 'Em', caps: { code: 3, design: 2 }, major: 'Công nghệ thông tin' }, { name: 'Phúc', caps: { sell: 2, write: 2 }, major: 'Marketing' }, { name: 'Giang', caps: { finance: 2, ops: 2 }, major: 'Kinh doanh' }],
    net: ['classmates', 'eatery'], sensitive: ['food'], ideaFork: 'no',
    idea: 'Làm ly và hộp đựng từ bã cà phê, thân thiện với môi trường', assets: {} } },
  { name: 'Bế tắc nông nghiệp, nhưng trưởng nhóm có cửa hàng vật tư', s: { schoolKind: 'fpt', schoolName: '', subjectKind: 'exe101', subjectName: '', goal: 'real', budget: 'b2', teamSize: 3,
    team: [{ name: 'Hà', caps: { sell: 2, ops: 2 }, extra: 'Phụ bán ở cửa hàng nhà từ nhỏ', major: 'Kinh doanh' }, { name: 'Khoa', caps: { code: 2, design: 2 }, major: 'Công nghệ thông tin' }, { name: 'Lan', caps: { write: 2, interview: 2 }, major: 'Marketing' }],
    net: ['family', 'classmates'], sensitive: ['none'], ideaFork: 'no',
    idea: 'Làm app AI chẩn đoán bệnh cây trồng cho nông dân',
    assets: { family: 'Nhà mình mở cửa hàng bán vật tư nông nghiệp, hạt giống và phân bón ở quê. Mình phụ bán từ nhỏ.', people: 'Có vài chú nông dân là khách quen lâu năm của nhà mình.' } } },
  { name: 'Ý tưởng hoang đường: pin hạt nhân mini', s: { schoolKind: 'fpt', schoolName: '', subjectKind: 'exe101', subjectName: '', goal: 'real', budget: 'b0', teamSize: 3,
    team: [{ name: 'Minh', caps: { code: 2 }, major: 'Công nghệ thông tin' }, { name: 'Nga', caps: { design: 2 }, major: 'Thiết kế đồ hoạ' }, { name: 'Oanh', caps: { write: 2 }, major: 'Marketing' }],
    net: ['classmates'], sensitive: ['none'], ideaFork: 'no',
    idea: 'Chế tạo pin hạt nhân mini cho điện thoại', assets: {} } },
  { name: 'Một mình, chưa có gì', s: { schoolKind: 'fpt', schoolName: '', subjectKind: 'exe101', subjectName: '', goal: 'unsure', budget: 'b0', teamSize: 1,
    team: [{ name: 'Tôi', caps: {}, unsure: true, major: 'Công nghệ thông tin' }], net: ['none'], sensitive: ['none'], ideaFork: 'no', idea: '', assets: {} } },
  { name: 'Nhóm cân đối, chưa có ý, mẹ mở quán cà phê', s: { schoolKind: 'fpt', schoolName: '', subjectKind: 'exe101', subjectName: '', goal: 'real', budget: 'b2', teamSize: 4,
    team: [{ name: 'Sơn', caps: { code: 3, ops: 2 }, major: 'Công nghệ thông tin' }, { name: 'Trang', caps: { design: 3, write: 2 }, major: 'Thiết kế đồ hoạ' }, { name: 'Uyên', caps: { sell: 3, interview: 3 }, major: 'Marketing' }, { name: 'Việt', caps: { finance: 2, ops: 2 }, major: 'Tài chính - Ngân hàng' }],
    net: ['classmates', 'eatery', 'club'], sensitive: ['none'], ideaFork: 'no', idea: '',
    pain: 'Mẹ mình hay nói chiều nào quán cũng rối vì khách order qua nhiều kênh khác nhau.',
    assets: { family: 'Mẹ mình mở quán cà phê nhỏ gần trường, mình phụ quán mỗi cuối tuần.' } } },
];
