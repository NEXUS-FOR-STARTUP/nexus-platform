// Generated from packages/validation/src/catalogs (cp1.ts + questions-cp1.ts). Answers are made-up sample text.
const CP1_PHASES=[
 {
  "title": "Thông tin nhóm",
  "questions": [
   {
    "id": "cp1_team_name",
    "text": "Tên nhóm của bạn là gì?",
    "explanation": "Ghi đúng tên nhóm như trong danh sách đăng ký môn học (kèm mã nhóm nếu có).",
    "actions": [
     "Đối chiếu với danh sách nhóm của lớp trước khi lưu."
    ],
    "classification": "recommended",
    "answer": "MentorMap"
   },
   {
    "id": "cp1_team_members",
    "text": "Nhóm gồm những thành viên nào và mỗi người phụ trách công việc gì?",
    "explanation": "Mỗi thành viên một dòng, theo dạng: Họ tên, vai trò, công việc phụ trách cụ thể.\nVí dụ: \"Nguyễn Văn A, Trưởng nhóm, phụ trách nghiên cứu khách hàng và phỏng vấn người dùng.\"",
    "actions": [
     "Không bỏ sót thành viên nào.",
     "Công việc phải là hành động cụ thể (nghiên cứu, phỏng vấn, thiết kế...), không chỉ ghi \"thành viên\"."
    ],
    "classification": "recommended",
    "answer": "Phung Luu Hoang Long, Trưởng nhóm, phụ trách quản lý dự án và phỏng vấn mentor.\nThành viên 2, phụ trách full-stack web.\nThành viên 3, phụ trách tài chính và mô hình kinh doanh.\nThành viên 4, phụ trách nội dung học liệu và đào tạo mentor.\nThành viên 5, phụ trách truyền thông và chăm sóc sinh viên."
   },
   {
    "id": "cp1_idea_name",
    "text": "Tên ý tưởng / sản phẩm của nhóm là gì?",
    "explanation": "Tên phải cho người đọc biết sản phẩm làm gì, cho ai. Không dùng slogan chung chung.\nKhông đạt: \"Nền tảng kết nối thông minh.\"\nĐạt: \"Ứng dụng đặt chỗ học nhóm theo giờ tại quán cà phê gần trường đại học.\"",
    "actions": [
     "Đưa tên cho người chưa biết dự án đọc: họ có đoán được sản phẩm làm gì không?"
    ],
    "classification": "required",
    "answer": "Nền tảng kèm học 1-1 giữa tân sinh viên năm nhất và anh chị khóa trên điểm A/A+ cho các môn đại cương."
   }
  ]
 },
 {
  "title": "Khách hàng mục tiêu",
  "questions": [
   {
    "id": "cp1_primary_customer",
    "text": "Khách hàng chính của nhóm là ai?",
    "explanation": "Chọn MỘT nhóm khách hàng đủ hẹp để nhóm tìm được người thật trong vòng một tuần. Cần nêu đủ 6 ý:\n- Họ là ai\n- Độ tuổi\n- Bối cảnh họ hoạt động\n- Hành vi cụ thể liên quan đến vấn đề\n- Khả năng chi trả\n- Lý do nhóm chọn nhóm người này trước tiên\nKhông đạt: \"Sinh viên\", \"Người đi làm\", \"Doanh nghiệp vừa và nhỏ\".\nĐạt: \"Sinh viên đại học năm 2 đến năm 3 tại TP.HCM, thường học nhóm 3 đến 6 người sau giờ học ít nhất hai lần mỗi tuần để làm bài tập nhóm, có thể chi khoảng 30 đến 50 nghìn mỗi buổi.\"",
    "actions": [
     "Tự kiểm tra: bạn kể được nơi hoặc nhóm cụ thể để tìm 10 người như vậy trong một tuần không?",
     "Không để một nhãn chung (\"sinh viên\", \"người đi làm\") đứng một mình."
    ],
    "classification": "required",
    "answer": "Tân sinh viên năm nhất, 18 đến 19 tuổi, ở TP.HCM, đang học Toán rời rạc, Lập trình C hoặc Tiếng Anh. Họ thường học một mình hoặc theo nhóm bạn cùng lớp, có thể chi khoảng 50 đến 80 nghìn mỗi buổi kèm. Nhóm chọn họ trước vì tỉ lệ rớt môn đại cương cao nhất ở năm đầu."
   },
   {
    "id": "cp1_non_priority_customer",
    "text": "Ai không phải là khách hàng ưu tiên trong giai đoạn đầu?",
    "explanation": "Nêu nhóm người nhóm cố tình chưa phục vụ và lý do cụ thể. Mục này giúp nhóm biết mình đang bỏ ai ra ngoài và vì sao quyết định đó hợp lý lúc này, không phải danh sách những người nhóm không thích.\nVí dụ: \"Chưa phục vụ sinh viên năm nhất, vì họ chưa có nhiều bài tập nhóm nên ít gặp vấn đề này.\"",
    "actions": [
     "Mỗi nhóm bị loại phải kèm một lý do, không để trống lý do."
    ],
    "classification": "recommended",
    "answer": "Chưa phục vụ sinh viên năm 3 trở lên, vì họ ít học môn đại cương và đã quen cách học riêng."
   },
   {
    "id": "cp1_role_breakdown",
    "text": "Các bên tham gia (User, Customer, Payer, Partner) là ai?",
    "explanation": "Bốn vai cần xác định:\n- User: người dùng sản phẩm\n- Customer: người ra quyết định dùng sản phẩm\n- Payer: người trả tiền\n- Partner: đối tác cung cấp nguồn lực\nNếu chỉ có một bên duy nhất, ghi: \"Chỉ có một bên duy nhất.\"\nNếu có nhiều bên, mỗi vai viết một đoạn riêng theo mẫu: \"[Tên vai] là [họ là ai]. Pain riêng của họ là [vấn đề họ gặp]. Lợi ích khi tham gia là [điều họ được]. Lý do họ sẽ tham gia là [động lực cụ thể].\"\nNếu một bên giữ nhiều vai (ví dụ vừa là User vừa là Payer), ghi rõ điều đó.",
    "actions": [
     "Không gộp lợi ích của nhiều bên thành một mô tả chung.",
     "Nếu Payer khác User, giải thích vì sao Payer có động lực trả tiền."
    ],
    "classification": "recommended",
    "answer": "User là tân sinh viên năm nhất. Customer cũng là tân sinh viên. Payer là tân sinh viên, một số trường hợp phụ huynh trả thay. Partner là các mentor khóa trên điểm A/A+. Mentor tham gia vì được thu nhập thêm và tích lũy kinh nghiệm giảng dạy."
   }
  ]
 },
 {
  "title": "Câu chuyện khách hàng",
  "questions": [
   {
    "id": "cp1_customer_story",
    "text": "Câu chuyện về một khách hàng tiêu biểu cụ thể là gì?",
    "explanation": "Kể về MỘT người dùng tiêu biểu: có tên, tuổi, bối cảnh, mục tiêu và rào cản. Nên dựa trên một người thật nhóm đã trò chuyện hoặc quan sát. Câu chuyện phải đủ cụ thể để người đọc hình dung ra người thật.\nKhông đạt: \"Người dùng là sinh viên gặp khó khăn khi học nhóm.\"\nĐạt: \"Minh, 20 tuổi, sinh viên năm 2 tại TP.HCM. Minh thường học nhóm 4 người vào tối thứ Ba và thứ Năm. Mỗi lần tìm chỗ, Minh phải nhắn tin hỏi mấy bạn, đi thử 2 đến 3 quán rồi mới biết còn bàn lớn và có ổ điện không. Hôm deadline môn Marketing, cả nhóm mất gần một tiếng tìm chỗ trước khi ngồi được.\"",
    "actions": [
     "Kiểm tra đủ 5 yếu tố: tên, tuổi, bối cảnh, mục tiêu, rào cản."
    ],
    "classification": "recommended",
    "answer": "Linh, 18 tuổi, tân sinh viên năm nhất. Linh học Lập trình C nhưng không hiểu con trỏ. Mỗi lần bí, Linh nhắn nhiều bạn, chờ hơn một ngày mới có người trả lời. Gần kiểm tra giữa kỳ, Linh mất hai buổi tối mà vẫn chưa làm được bài."
   }
  ]
 },
 {
  "title": "Vấn đề của khách hàng (Pain Point)",
  "questions": [
   {
    "id": "cp1_main_problem",
    "text": "Vấn đề chính của khách hàng là gì?",
    "explanation": "Viết vấn đề từ góc nhìn khách hàng đang gặp phải, không phải nhận xét của nhóm. Cần nêu:\n- Vấn đề xảy ra trong tình huống nào\n- Xảy ra thường xuyên đến mức nào\n- Hậu quả cụ thể, tính bằng thời gian, tiền bạc, rủi ro hoặc cơ hội bị mất\nKhông đạt: \"Sinh viên mất thời gian tìm chỗ học nhóm.\"\nĐạt: \"Sinh viên năm 2 đến năm 3 phải mất 30 đến 60 phút để tìm chỗ học nhóm mỗi khi gần deadline. Nếu không tìm được chỗ phù hợp, cả nhóm phải ngồi tạm hoặc đổi địa điểm nhiều lần, khiến buổi học bị trễ và mọi người mất tập trung.\"",
    "actions": [
     "Có ít nhất một con số hoặc mức độ đo được (phút, tiền, số lần)."
    ],
    "classification": "required",
    "answer": "Tân sinh viên năm nhất thường mất 1 đến 2 ngày để tìm người giải đáp một bài khó trước kỳ kiểm tra. Nếu không tìm được, họ nợ kiến thức và nguy cơ rớt môn đại cương tăng lên."
   },
   {
    "id": "cp1_problem_severity",
    "text": "Vì sao vấn đề này đủ đau để khách hàng chủ động tìm giải pháp?",
    "explanation": "\"Đủ đau\" nghĩa là khách hàng sẵn sàng bỏ công, bỏ tiền hoặc đổi thói quen để giải quyết. Trả lời thẳng:\n- Đây là vấn đề thật hay chỉ là \"hơi bất tiện\"?\n- Điều gì xảy ra nếu không giải quyết?\n- Vấn đề lặp lại đủ thường xuyên để khách hàng chịu thay đổi hành vi không?\nDấu hiệu tốt: khách hàng đã tự tìm cách xử lý (hỏi bạn, thử nhiều quán, trả tiền cho giải pháp tạm).",
    "actions": [
     "Nêu ít nhất một việc khách hàng đã làm để tự giải quyết, nếu có."
    ],
    "classification": "required",
    "answer": "Rớt môn đại cương làm trễ lộ trình và tốn thêm học phí học lại. Nhiều bạn đã tự trả tiền cho gia sư ngoài, hoặc lập nhóm học nhưng thiếu định hướng."
   }
  ]
 },
 {
  "title": "Cách khách hàng đang giải quyết hiện tại",
  "questions": [
   {
    "id": "cp1_current_alternatives",
    "text": "Hiện tại khách hàng đang dùng cách nào để giải quyết vấn đề?",
    "explanation": "Không có cách hiện tại thì không đánh giá được sản phẩm của nhóm có tốt hơn hay không, nên mục này rất quan trọng.\nLiệt kê mọi cách khách hàng đang tự xử lý, kể cả \"không làm gì\" hoặc \"chấp nhận sống chung với vấn đề\". Mỗi cách viết thành một câu mô tả họ làm gì cụ thể.\nVí dụ: \"Nhắn tin hỏi từng bạn trong nhóm quán nào còn chỗ.\"; \"Đi thử 2 đến 3 quán rồi mới chọn.\"; \"Không đặt trước, đến thư viện ngồi tạm.\"",
    "actions": [
     "Mỗi cách là một câu riêng, bắt đầu bằng hành động của khách hàng."
    ],
    "classification": "required",
    "answer": "Nhắn hỏi bạn cùng lớp.\nThuê gia sư ngoài trung tâm.\nTự xem video trên YouTube.\nKhông làm gì và hy vọng qua môn."
   },
   {
    "id": "cp1_alternatives_analysis",
    "text": "Phân tích từng cách khách hàng đang dùng hiện tại",
    "explanation": "Với mỗi cách ở câu trước, viết một đoạn phân tích theo bốn chiều:\n- Tốn tiền không, bao nhiêu\n- Tốn thời gian không, ở bước nào\n- Bất tiện cụ thể ở đâu trong quy trình\n- Vì sao khách hàng vẫn tiếp tục dùng dù biết nó bất tiện (chiều quan trọng nhất)",
    "actions": [
     "Mỗi cách trả lời đủ 4 chiều, không bỏ chiều \"vì sao vẫn dùng\"."
    ],
    "classification": "recommended",
    "answer": "Hỏi bạn cùng lớp: miễn phí nhưng phải chờ, bạn cũng chưa chắc hiểu. Vẫn dùng vì quen và không tốn tiền.\nGia sư ngoài: 200 đến 300 nghìn mỗi buổi, khó tìm người đúng môn. Vẫn dùng vì sợ rớt.\nVideo YouTube: miễn phí nhưng không giải đáp riêng câu hỏi của mình. Vẫn dùng vì tiện."
   },
   {
    "id": "cp1_required_improvement",
    "text": "Sản phẩm phải tốt hơn ở điểm nào cụ thể để khách hàng chịu đổi hành vi?",
    "explanation": "Nêu khác biệt rõ ràng, đo được so với cách khách hàng đang làm. Không viết chung chung kiểu \"tiện hơn\" hay \"nhanh hơn\". Phải nói nhanh hơn bao nhiêu, tiện ở bước cụ thể nào.\nVí dụ: \"Rút thời gian tìm chỗ từ 30 đến 60 phút xuống dưới 5 phút bằng cách xem bàn trống và ổ điện của các quán gần trường trên một màn hình.\"",
    "actions": [
     "Có con số hoặc tên bước cụ thể, không dùng \"tiện hơn / nhanh hơn\" đứng một mình."
    ],
    "classification": "required",
    "answer": "Rút thời gian có người giải đáp từ 1 đến 2 ngày xuống dưới 2 giờ, với giá khoảng 1/3 gia sư ngoài."
   }
  ]
 },
 {
  "title": "Giải pháp",
  "questions": [
   {
    "id": "cp1_solution_description",
    "text": "Sản phẩm làm gì, cho ai, trong tình huống nào?",
    "explanation": "Mô tả sản phẩm theo ba chiều: làm gì cụ thể, cho ai cụ thể, trong tình huống nào cụ thể.\nTránh các cụm từ mơ hồ: \"nền tảng thông minh\", \"tối ưu trải nghiệm\", \"AI tự động\", \"all-in-one\", \"kết nối\". Nếu buộc phải dùng, định nghĩa ngay bên dưới: từ này nghĩa là gì cụ thể, ai đánh giá được, đo bằng tiêu chí nào.",
    "actions": [
     "Rà lại câu trả lời, tìm và thay các từ mơ hồ ở danh sách trên."
    ],
    "classification": "required",
    "answer": "Nền tảng cho tân sinh viên đặt buổi kèm 1-1 online với anh chị khóa trên đã đạt điểm A/A+ cùng môn, ngay trong tuần có bài kiểm tra."
   },
   {
    "id": "cp1_solution_mechanism",
    "text": "Cơ chế tác động: sản phẩm giảm pain bằng cách nào?",
    "explanation": "Mô tả theo luồng bốn bước:\n- Input: người dùng cung cấp gì cho sản phẩm?\n- Xử lý: sản phẩm làm gì với input đó, theo cơ chế nào?\n- Output: người dùng nhận được gì cụ thể?\n- Hành động: output đó giúp người dùng làm gì tốt hơn so với trước?\nVí dụ: Input là giờ học, số người, khu vực. Xử lý là lọc các quán còn bàn phù hợp. Output là danh sách 3 quán kèm bàn trống và ổ điện. Hành động là giữ bàn trong vài phút thay vì nhắn hỏi từng quán.",
    "actions": [
     "Đủ 4 bước theo đúng thứ tự, không chỉ liệt kê tính năng."
    ],
    "classification": "required",
    "answer": "Input: môn học, chủ đề đang vướng, khung giờ rảnh. Xử lý: ghép với mentor đúng môn còn trống giờ. Output: danh sách 3 mentor kèm giá và đánh giá. Hành động: sinh viên đặt buổi kèm trong vài phút thay vì nhắn hỏi từng người."
   },
   {
    "id": "cp1_core_features",
    "text": "Tính năng lõi của bản đầu tiên là gì?",
    "explanation": "Mỗi tính năng một dòng, theo dạng: [Tên tính năng]: giải quyết [pain cụ thể] (Có / Không có trong bản đầu).\nVí dụ: \"Xem bàn trống theo giờ: giải quyết việc phải nhắn hỏi từng quán (Có trong bản đầu).\"",
    "actions": [
     "Mỗi tính năng phải gắn với một pain đã nêu ở phần Pain Point."
    ],
    "classification": "recommended",
    "answer": "Tìm mentor theo môn: giải quyết việc không biết hỏi ai (Có trong bản đầu).\nĐặt lịch kèm 1-1: giải quyết việc chờ trả lời lâu (Có trong bản đầu).\nĐánh giá buổi kèm: giúp đo chất lượng mentor (Không có trong bản đầu)."
   },
   {
    "id": "cp1_out_of_scope",
    "text": "Những gì nhóm chủ động không làm ở giai đoạn đầu?",
    "explanation": "Nêu từng tính năng hoặc nhóm người dùng nhóm chủ động chưa làm / chưa phục vụ ở giai đoạn đầu, kèm lý do.\nVí dụ: \"Chưa làm thanh toán online: giai đoạn đầu giữ chỗ miễn phí để tập trung kiểm chứng nhu cầu.\"",
    "actions": [
     "Mỗi mục kèm một lý do, không chỉ liệt kê tên."
    ],
    "classification": "required",
    "answer": "Chưa làm thanh toán online: giai đoạn đầu thu tiền thủ công để tập trung kiểm chứng nhu cầu.\nChưa phục vụ sinh viên năm 3 trở lên: nhu cầu của họ khác môn đại cương."
   }
  ]
 },
 {
  "title": "MVP / Bản thử nghiệm đầu tiên",
  "questions": [
   {
    "id": "cp1_riskiest_assumption",
    "text": "Giả định nguy hiểm nhất cần test trước là gì?",
    "explanation": "Giả định nguy hiểm nhất là điều nhóm đang tin là đúng nhưng chưa kiểm chứng, và nếu sai thì toàn bộ ý tưởng không còn hoạt động. Chỉ chọn MỘT giả định quan trọng nhất, không liệt kê nhiều.\nVí dụ: \"Sinh viên chịu trả 30 đến 50 nghìn mỗi buổi để được giữ chỗ trước.\"",
    "actions": [
     "Thử đảo ngược: nếu giả định này sai, ý tưởng còn lý do tồn tại không? Nếu còn, hãy chọn giả định khác."
    ],
    "classification": "required",
    "answer": "Tân sinh viên chịu trả 50 đến 80 nghìn mỗi buổi để được mentor khóa trên kèm 1-1."
   },
   {
    "id": "cp1_mvp_definition",
    "text": "MVP của nhóm là gì?",
    "explanation": "MVP là cách test nhỏ nhất để kiểm chứng giả định nguy hiểm nhất ở câu trước, không phải một app nhỏ hơn.\nCó thể là Google Form, landing page, nhóm Zalo, Notion, hoặc concierge MVP (nhóm tự làm thủ công phía sau, khách hàng vẫn thấy như đang dùng sản phẩm).\nCần giải thích vì sao cách này đủ để kiểm chứng giả định đó.\nVí dụ: \"Tạo Google Form để sinh viên chọn giờ và khu vực; nhóm tự gọi quán xác nhận bàn rồi nhắn lại qua Zalo.\"",
    "actions": [
     "Làm được trong vài ngày bằng công cụ có sẵn, không cần lập trình."
    ],
    "classification": "required",
    "answer": "Tạo Google Form để sinh viên chọn môn và khung giờ; nhóm tự ghép mentor rồi nhắn lại qua Zalo. Cách này đủ để kiểm chứng việc sinh viên có sẵn sàng trả tiền mà không cần lập trình."
   },
   {
    "id": "cp1_mvp_test_plan",
    "text": "Test MVP với ai, ở đâu, khi nào?",
    "explanation": "Cụ thể đến mức có thể bắt tay làm ngay. Nêu đủ: số lượng người, họ là ai, tìm họ qua kênh nào, và khoảng thời gian test.\nVí dụ: \"10 đến 15 sinh viên năm 2 đến năm 3 tại Đại học Kinh tế TP.HCM, tìm qua nhóm Facebook lớp học, test trong tuần từ ngày 14 đến ngày 20 tháng này.\"",
    "actions": [
     "Đủ 4 ý: số lượng, đối tượng, kênh, ngày bắt đầu và kết thúc."
    ],
    "classification": "required",
    "answer": "20 tân sinh viên năm nhất tại Đại học FPT, tìm qua nhóm Facebook khóa, test trong tuần từ 14 đến 20 tháng này."
   },
   {
    "id": "cp1_mvp_pass_fail",
    "text": "Tiêu chí pass và fail của MVP là gì?",
    "explanation": "Viết thành ba đoạn riêng:\n- Pass: kết quả nào, đo được, chứng minh giả định đúng?\n- Fail: kết quả nào chứng minh giả định sai?\n- Nếu fail: nhóm sẽ điều chỉnh theo hướng nào?\nVí dụ Pass: \"Ít nhất 8 trong 15 người đặt chỗ qua form trong tuần test.\" Fail: \"Dưới 4 người đặt chỗ.\" Nếu fail: \"Phỏng vấn lại để tìm lý do, đổi nhóm khách hàng hoặc đổi cách thu tiền.\"",
    "actions": [
     "Pass và Fail đều có con số cụ thể, được quyết định trước khi test."
    ],
    "classification": "required",
    "answer": "Pass: ít nhất 8 trong 20 người đặt buổi kèm có trả phí.\nFail: dưới 4 người đặt.\nNếu fail: phỏng vấn lại để tìm lý do, đổi mức giá hoặc đổi nhóm khách hàng."
   }
  ]
 },
 {
  "title": "Bằng chứng và giả định",
  "questions": [
   {
    "id": "cp1_evidence_assumptions",
    "text": "Đâu là dữ liệu thực tế (bằng chứng), đâu là giả định chưa kiểm chứng?",
    "explanation": "Viết thành hai phần riêng.\nPhần 1: Những điều nhóm biết từ dữ liệu thực tế. Liệt kê từng điều kèm nguồn, theo loại: phỏng vấn (bao nhiêu người, hỏi về gì), khảo sát (bao nhiêu phản hồi, từ nguồn nào), quan sát (quan sát gì, ở đâu, khi nào), thử nghiệm đã làm, số liệu thứ cấp (nguồn, năm).\nPhần 2: Những điều nhóm đang giả định và chưa kiểm chứng. Với mỗi giả định, nêu: \"nếu giả định này sai thì điều gì xảy ra với ý tưởng?\" và \"cách test nhỏ nhất để kiểm chứng\".\nNếu chưa có bằng chứng nào, ghi thẳng: \"Chưa có bằng chứng. Toàn bộ nội dung trong tài liệu hiện là giả định cần kiểm chứng.\"",
    "actions": [
     "Mỗi bằng chứng có nguồn và con số (bao nhiêu người, khi nào).",
     "Không để trống: nếu chưa có gì thì ghi rõ \"Chưa có bằng chứng\"."
    ],
    "classification": "required",
    "answer": "Dữ liệu thực tế: khảo sát 32 tân sinh viên trong lớp, 24 người nói từng nhờ bạn giải bài khó; đã tổ chức 5 buổi kèm thử nghiệm với 40 mentor đăng ký.\nGiả định chưa kiểm chứng: sinh viên chịu trả 50 đến 80 nghìn mỗi buổi. Nếu sai, mô hình thu phí không hoạt động. Cách test nhỏ nhất: chạy Google Form trong một tuần."
   }
  ]
 },
 {
  "title": "Mô hình doanh thu dự kiến",
  "questions": [
   {
    "id": "cp1_revenue_model",
    "text": "Mô hình doanh thu dự kiến là gì?",
    "explanation": "Ở bước mô tả ý tưởng này, nhóm chưa cần chứng minh doanh thu thật, nhưng phải xác định ai có thể trả tiền và vì lý do gì. Viết một đoạn trả lời bốn câu hỏi:\n- Ai là người trả tiền?\n- Họ trả vì nhận được giá trị cụ thể nào?\n- Thu tiền theo hình thức nào (một lần, định kỳ, theo lượt dùng, hoa hồng)?\n- Những điều trên là dữ liệu thực tế hay giả định?\nNếu người trả tiền không phải người dùng, giải thích vì sao họ có động lực trả.",
    "actions": [
     "Trả lời đủ 4 câu hỏi, đánh dấu rõ điều nào là giả định."
    ],
    "classification": "recommended",
    "answer": "Người trả tiền là tân sinh viên. Họ trả vì được giải đáp nhanh, đúng môn. Thu tiền theo từng buổi, nhóm giữ 20% hoa hồng. Mức giá và hoa hồng hiện là giả định chưa kiểm chứng."
   }
  ]
 }
];
