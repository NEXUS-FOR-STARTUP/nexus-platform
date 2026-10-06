import { prisma } from '../apps/api/src/db.js';

const ADMIN_ID = 'JG9okn4jhTV6WttilpIzfacxlG1BerNJ';

function t(text: string, marks?: Array<{ type: 'bold' | 'italic' | 'underline' | 'strike' } | { type: 'link'; attrs: { href: string } }>) {
  return marks && marks.length > 0 ? { type: 'text', text, marks } : { type: 'text', text };
}

function p(...content: any[]) {
  return { type: 'paragraph', content: content.length > 0 ? content : [{ type: 'text', text: '' }] };
}

function h2(text: string) {
  return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] };
}

function _h3(text: string) {
  return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] };
}

function bq(text: string) {
  return {
    type: 'blockquote',
    content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text }] }],
  };
}

function ul(items: string[][]) {
  return {
    type: 'bulletList',
    content: items.map((subItems) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: subItems.map((str, idx) => (idx === 0 ? t(str, [{ type: 'bold' }]) : t(str))),
        },
      ],
    })),
  };
}

const articles = [
  {
    title: 'Xây dựng MVP trong 14 ngày: Bài học từ 50 dự án khởi nghiệp sinh viên thất bại',
    slug: 'xay-dung-mvp-trong-14-ngay-bai-hoc-tu-50-du-an-khoi-nghiep-sinh-vien-that-bai',
    excerpt: 'Hầu hết sinh viên thất bại không phải vì thiếu kỹ năng lập trình, mà vì họ dành 6 tháng xây dựng những tính năng mà không một ai thực sự cần đến.',
    cover_image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Đặng Tuấn Kiệt',
    published_days_ago: 1,
    content: {
      type: 'doc',
      content: [
        h2('1. Ảo tưởng về sản phẩm "hoàn hảo" ngày ra mắt'),
        p(t('Rất nhiều nhà sáng lập trẻ mắc kẹt trong vòng lặp tưởng tượng: họ nghĩ sản phẩm phải có đăng nhập bằng 5 mạng xã hội, có Dark Mode, thanh toán tự động và giao diện thật hào nhoáng thì khách hàng mới tin tưởng. Nhưng thực tế cay đắng là khách hàng chỉ quan tâm liệu bạn có giải quyết được nỗi đau lớn nhất của họ hay không.')),
        bq('Nếu bạn không cảm thấy ngượng ngùng khi tung ra phiên bản đầu tiên của sản phẩm, bạn đã ra mắt quá muộn rồi. — Reid Hoffman, Co-founder LinkedIn'),
        h2('2. Công thức MVP tinh gọn 14 ngày'),
        p(t('Để không đốt cháy năng lượng và tiền bạc vô ích, hãy áp dụng quy tắc 14 ngày nghiêm ngặt:')),
        ul([
          ['Ngày 1–3: Phỏng vấn 20 khách hàng tiềm năng. ', 'Chỉ hỏi về quá khứ và cách họ đang giải quyết vấn đề, tuyệt đối không hỏi họ "bạn có thích ý tưởng này không?".'],
          ['Ngày 4–10: Xây dựng luồng cốt lõi duy nhất (Single Happy Path). ', 'Cắt bỏ mọi tính năng rườm rà. Nếu là ứng dụng đặt lịch, chỉ cần form gửi giờ và số điện thoại.'],
          ['Ngày 11–14: Đưa sản phẩm cho 10 người đầu tiên dùng thử. ', 'Ngồi cạnh họ quan sát trực tiếp hoặc dùng Loom/Hotjar ghi lại thao tác.'],
        ]),
        h2('3. Lắng nghe hành vi, đừng lắng nghe lời khen xã giao'),
        p(t('Lời khen của bạn bè hay người thân là liều thuốc độc ngọt ngào nhất. Chỉ có hai chỉ số chứng minh giá trị thực: thời gian người dùng dành cho sản phẩm và mức độ sẵn sàng trả tiền của họ.')),
      ],
    },
  },
  {
    title: 'Tâm lý học hành vi trong thiết kế UX: Tại sao người dùng không làm những gì họ nói?',
    slug: 'tam-ly-hoc-hanh-vi-trong-thiet-ke-ux-tai-sao-nguoi-dung-khong-lam-nhung-gi-ho-noi',
    excerpt: 'Khoảng cách giữa lời nói và hành vi thực tế của con người là lý do tại sao hàng loạt khảo sát người dùng đưa ra kết luận hoàn toàn sai lệch.',
    cover_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Lê Bảo Trâm',
    published_days_ago: 2,
    content: {
      type: 'doc',
      content: [
        h2('1. Hiệu ứng Hawthorne và sự thiên lệch xã giao'),
        p(t('Khi bạn hỏi một ai đó trong buổi phỏng vấn: "Bạn có thích tính năng theo dõi chi tiêu tự động này không?", 90% sẽ trả lời "Có". Nhưng khi ứng dụng ra mắt, họ không hề mở nó lần thứ hai. Khi bị quan sát, con người luôn muốn tỏ ra thông thái, chăm chỉ và hào phóng hơn bản chất thật của họ.')),
        bq('Đừng lắng nghe những gì người dùng nói; hãy quan sát những gì họ thực sự làm. — Jakob Nielsen'),
        h2('2. Nguyên tắc ma sát nhận thức (Cognitive Friction)'),
        p(t('Mỗi cú nhấp chuột thêm, mỗi trường nhập liệu không cần thiết là một rào cản tâm lý khiến não bộ người dùng kích hoạt cơ chế phòng vệ lười biếng. Thiết kế UX xuất sắc là việc loại bỏ ma sát ở đúng chỗ và tạo ra động lực nội tại đúng lúc.')),
        ul([
          ['Định luật Hick: ', 'Càng nhiều lựa chọn, thời gian đưa ra quyết định càng kéo dài theo cấp số nhân.'],
          ['Hiệu ứng Zeigarnik: ', 'Con người có xu hướng nhớ và muốn hoàn thành các tác vụ dang dở hơn là tác vụ chưa bắt đầu (ứng dụng cực mạnh vào thanh tiến trình Onboarding).'],
        ]),
      ],
    },
  },
  {
    title: 'Hành trình từ đồ án tốt nghiệp đến vòng gọi vốn Pre-Seed 150.000 USD',
    slug: 'hanh-trinh-tu-do-an-tot-nghiep-den-vong-goi-von-pre-seed-150-000-usd',
    excerpt: 'Chia sẻ chân thực về những ngày tháng ngủ gầm bàn tại phòng lab, những lần bị quỹ từ chối và khoảnh khắc ký hợp đồng đầu tư đầu tiên.',
    cover_image_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Nguyễn Hoàng Nam',
    published_days_ago: 3,
    content: {
      type: 'doc',
      content: [
        h2('1. Bước ngoặt từ điểm 10 hội đồng đến con số 0 thị trường'),
        p(t('Đồ án của chúng tôi đạt điểm tuyệt đối tại trường đại học. Cả nhóm hí hửng nghĩ rằng mình đã tạo ra một kiệt tác công nghệ. Nhưng 3 tháng sau khi ra mắt, ứng dụng chỉ có vỏn vẹn 42 lượt tải, trong đó một nửa là người nhà và bạn bè cùng lớp.')),
        p(t('Đó là cú tát đầu tiên giúp chúng tôi tỉnh mộng: một bài toán học thuật xuất sắc không đồng nghĩa với một sản phẩm thương mại có người chịu chi tiền.')),
        h2('2. Chuẩn bị Pitch Deck: Bỏ bớt thuật ngữ, nói về số liệu'),
        p(t('Khi gặp các nhà đầu tư mạo hiểm (VCs), họ không quan tâm bạn dùng thuật ngữ AI phức tạp đến đâu. Họ chỉ hỏi 3 câu hỏi cốt lõi:')),
        ul([
          ['Vấn đề này lớn đến mức nào? ', 'Thị trường có đủ rộng để tạo ra một công ty 100 triệu USD không?'],
          ['Tại sao lại là các bạn và tại sao là bây giờ? ', 'Lợi thế bất công (Unfair Advantage) của đội ngũ là gì?'],
          ['Traction thực tế đâu? ', 'Tốc độ tăng trưởng tuần qua tuần (WoW) của người dùng tích cực.']],
        ),
      ],
    },
  },
  {
    title: 'DeepSeek vs OpenAI: Cuộc chiến mã nguồn mở và tương lai của các kỹ sư phần mềm',
    slug: 'deepseek-vs-openai-cuoc-chien-ma-nguon-mo-va-tuong-lai-ky-su-phan-mem',
    excerpt: 'Sự trỗi dậy của các mô hình mã nguồn mở hiệu năng cao đang tái định hình toàn bộ chuỗi giá trị AI toàn cầu.',
    cover_image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Vũ Quang Huy',
    published_days_ago: 4,
    content: {
      type: 'doc',
      content: [
        h2('1. Phá vỡ thế độc quyền của các ông lớn Big Tech'),
        p(t('Chỉ mới một năm trước, người ta vẫn tin rằng chỉ những tập đoàn sở hữu hàng trăm ngàn cụm GPU đắt đỏ mới có thể huấn luyện ra các mô hình ngôn ngữ lớn (LLM) vượt trội. Sự xuất hiện của các kiến trúc tối ưu như MoE (Mixture of Experts) và kỹ thuật Reasoning chưng cất (Distillation) đã chứng minh điều ngược lại.')),
        bq('Chi phí inference giảm 90% nghĩa là rào cản ứng dụng AI thực tế đã được gỡ bỏ hoàn toàn cho các kỹ sư trẻ.'),
        h2('2. Vai trò mới của Lập trình viên: Từ Coder thành System Orchestrator'),
        p(t('Viết code thuần túy sẽ ngày càng rẻ đi. Kỹ năng đắt giá nhất hiện nay là khả năng hiểu sâu domain nghiệp vụ, thiết kế kiến trúc hệ thống an toàn và biết cách kết hợp các mô hình chuyên biệt để tạo ra giá trị kinh doanh.')),
      ],
    },
  },
  {
    title: 'Nghệ thuật viết tài liệu kỹ thuật (Technical Writing) mà ai cũng muốn đọc',
    slug: 'nghe-thuat-viet-tai-lieu-ky-thuat-technical-writing-ma-ai-cung-muon-doc',
    excerpt: 'Tài liệu kỹ thuật tồi tệ là nguyên nhân hàng đầu khiến các thư viện mã nguồn mở thất bại và các dự án nội bộ bị chậm tiến độ nghiêm trọng.',
    cover_image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Trần Minh Khôi',
    published_days_ago: 5,
    content: {
      type: 'doc',
      content: [
        h2('1. Tư duy "Documentation as Code"'),
        p(t('Hãy coi tài liệu như một phần của codebase. Một đoạn code xuất sắc mà không ai biết cách chạy hoặc không ai hiểu tại sao nó được thiết kế như vậy thì chẳng khác nào một bãi mìn chôn sẵn cho người kế nhiệm.')),
        h2('2. Cấu trúc kim tự tháp trong tài liệu API'),
        ul([
          ['Quickstart trong 3 phút: ', 'Cho người đọc thấy kết quả ngay lập tức bằng một lệnh sao chép và chạy được.'],
          ['Khái niệm cốt lõi (Mental Model): ', 'Giải thích bức tranh tổng quan trước khi đi vào từng tham số chi tiết.'],
          ['Xử lý lỗi thực tế (Edge cases): ', 'Liệt kê các mã lỗi thường gặp và cách khắc phục từng bước.'],
        ]),
      ],
    },
  },
  {
    title: 'Quản lý tài chính cá nhân cho Founder trẻ: Sống sót qua thung lũng chết',
    slug: 'quan-ly-tai-chinh-ca-nhan-cho-founder-tre-song-sot-qua-thung-lung-chet',
    excerpt: 'Làm thế nào để không bị kiệt quệ tài chính cá nhân khi dự án khởi nghiệp chưa thể tạo ra dòng tiền dương trong năm đầu tiên?',
    cover_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Hoàng Thu Thủy',
    published_days_ago: 6,
    content: {
      type: 'doc',
      content: [
        h2('1. Thung lũng chết cá nhân (Personal Death Valley)'),
        p(t('Người ta thường nói về Runway của công ty, nhưng ít ai nhắc tới Runway của chính nhà sáng lập. Nếu bạn chỉ còn đủ tiền ăn mì gói trong 2 tuần tới, mọi quyết định sản phẩm của bạn sẽ bị bóp méo bởi sự hoảng loạn và áp lực cơm áo gạo tiền.')),
        bq('Một nhà sáng lập bình an về tâm lý và tài chính cơ bản là tài sản lớn nhất của một startup.'),
        h2('2. Chiến lược 3 quỹ dự phòng'),
        p(t('Trước khi toàn tâm toàn ý cho dự án, hãy đảm bảo bạn có ít nhất 6 tháng sinh hoạt phí cơ bản ở một tài khoản riêng biệt mà không bao giờ được phép rút ra để đắp vào chi phí server hay marketing của công ty.')),
      ],
    },
  },
  {
    title: 'Kiến trúc Clean Architecture trong thực tế: Đừng biến ứng dụng thành một mê cung',
    slug: 'kien-truc-clean-architecture-trong-thuc-te-dung-bien-ung-dung-thanh-me-cung',
    excerpt: 'Áp dụng máy móc các nguyên lý thiết kế của Uncle Bob có thể biến một ứng dụng CRUD đơn giản thành một thảm họa trừu tượng hóa quá mức.',
    cover_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Phạm Thế Phong',
    published_days_ago: 7,
    content: {
      type: 'doc',
      content: [
        h2('1. Sự cám dỗ của việc tạo ra 10 lớp Interface cho một hàm'),
        p(t('Tôi từng thấy những dự án Node.js mà để lấy một bản ghi người dùng từ Database, luồng dữ liệu phải đi qua Controller, DTO, UseCase, Domain Entity, Repository Interface, Repository Impl, Mapper, và ORM Model. Tổng cộng 8 tệp tin chỉ để thực hiện một câu SELECT đơn giản!')),
        h2('2. Clean Architecture thực dụng'),
        p(t('Mục tiêu tối thượng của Clean Architecture là độc lập với cơ sở dữ liệu và framework để phục vụ việc kiểm thử (unit testing) dễ dàng. Nếu bạn không viết test cho usecase đó, sự phức tạp bạn thêm vào chỉ là nợ kỹ thuật tự chuốc lấy.')),
      ],
    },
  },
  {
    title: 'Học cách nói "Không": Nghệ thuật quản lý kỳ vọng khi làm dự án tốt nghiệp',
    slug: 'hoc-cach-noi-khong-nghe-thuat-quan-ly-ky-vong-khi-lam-du-an-tot-nghiep',
    excerpt: 'Làm thế nào để bảo vệ phạm vi đồ án trước những yêu cầu tính năng liên tục nảy sinh từ giảng viên hướng dẫn và các thành viên trong nhóm?',
    cover_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Vũ Thùy Linh',
    published_days_ago: 8,
    content: {
      type: 'doc',
      content: [
        h2('1. Căn bệnh phình to phạm vi (Scope Creep)'),
        p(t('Mỗi tuần một ý tưởng mới. Tuần này thầy gợi ý thêm Blockchain, tuần sau bạn trưởng nhóm muốn tích hợp thêm VR, tuần tới lại muốn huấn luyện thêm mô hình AI riêng. Đến ngày bảo vệ, dự án có 20 tính năng nhưng không tính năng nào chạy trơn tru từ đầu đến cuối.')),
        bq('Nói CÓ với một tính năng mới đồng nghĩa với việc bạn đang nói KHÔNG với chất lượng và sự ổn định của những tính năng hiện tại.'),
        h2('2. Kỹ thuật "Parkinson\'s Feature Vault"'),
        p(t('Hãy tạo một danh sách ghi chú có tên "Tính năng cho phiên bản 2.0". Khi bất kỳ ai đưa ra ý tưởng mới hấp dẫn, hãy lắng nghe chân thành và ghi nhận nó vào danh sách này. Điều này giúp người đưa ý tưởng cảm thấy được tôn trọng mà vẫn bảo vệ được tiến độ hiện tại.')),
      ],
    },
  },
  {
    title: 'Tương lai của RAG (Retrieval-Augmented Generation) khi Context Window chạm mốc 1 triệu tokens',
    slug: 'tuong-lai-cua-rag-khi-context-window-cham-moc-1-trieu-tokens',
    excerpt: 'Liệu các cơ sở dữ liệu vector có trở nên lỗi thời khi các mô hình AI có thể nuốt trọn cả cuốn bách khoa toàn thư trong một lần prompt?',
    cover_image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Bùi Đăng Khoa',
    published_days_ago: 9,
    content: {
      type: 'doc',
      content: [
        h2('1. Ảo tưởng về "Needle in a Haystack"'),
        p(t('Mặc dù các mô hình như Gemini hay Claude có thể nhận 1-2 triệu tokens đầu vào, khả năng trích xuất chính xác và suy luận logic sâu sắc ở giữa văn bản dài (Lost in the Middle) vẫn suy giảm rõ rệt so với việc cung cấp cho mô hình một ngữ cảnh ngắn gọn, tập trung cao độ.')),
        h2('2. Chi phí và độ trễ (Latency & Cost)'),
        p(t('Gửi 1 triệu tokens cho mỗi câu hỏi sẽ khiến chi phí API tăng vọt và thời gian phản hồi kéo dài hàng chục giây. RAG thông minh (Hybrid Search kết hợp Dense Vector và Sparse BM25) vẫn là giải pháp kinh tế và nhanh nhất cho các hệ sinh thái sản phẩm thương mại.')),
      ],
    },
  },
  {
    title: 'Bẫy hoàn hảo chủ nghĩa – Kẻ thù số một của mọi sản phẩm đầu tay',
    slug: 'bay-hoan-hao-chu-nghia-ke-thu-so-mot-cua-moi-san-pham-dau-tay',
    excerpt: 'Nỗi sợ bị phán xét khiến nhiều bạn trẻ trì hoãn ra mắt sản phẩm vô thời hạn dưới vỏ bọc "chờ hoàn thiện thêm một chút nữa".',
    cover_image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Đỗ Thu Hà',
    published_days_ago: 10,
    content: {
      type: 'doc',
      content: [
        h2('1. Nguồn gốc của sự trì hoãn'),
        p(t('Sự hoàn hảo không phải là tiêu chuẩn cao trong công việc; nó thường là tấm khiên che đậy nỗi sợ thất bại. Chừng nào sản phẩm chưa ra mắt, bạn vẫn có thể tự an ủi rằng mình chưa thất bại. Nhưng sự im lặng của thị trường mới chính là câu trả lời trung thực nhất.')),
        bq('Hoàn thành tốt hơn hoàn hảo (Done is better than perfect). Hãy để thị trường dạy bạn cách sửa sai thay vì tự sửa trong phòng kín.'),
      ],
    },
  },
  {
    title: 'Xây dựng hệ thống Realtime hàng triệu kết nối với WebSocket và Centrifugo',
    slug: 'xay-dung-he-thong-realtime-hang-trieu-ket-noi-voi-websocket-va-centrifugo',
    excerpt: 'Kiến trúc chịu tải cao cho tính năng thông báo tức thì và chat đa người dùng mà không làm sập server API chính.',
    cover_image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Đinh Gia Bảo',
    published_days_ago: 11,
    content: {
      type: 'doc',
      content: [
        h2('1. Tại sao không nên duy trì kết nối WebSocket trực tiếp trên App Server?'),
        p(t('Khi ứng dụng web mở rộng, việc giữ hàng chục ngàn kết nối TCP mở trên Node.js hoặc Python sẽ nhanh chóng tiêu tốn bộ nhớ RAM và làm nghẽn Event Loop. Tách riêng tầng Realtime sang một dịch vụ chuyên biệt như Centrifugo viết bằng Go là quyết định kiến trúc mang tính sống còn.')),
        h2('2. Mô hình Outbox Pattern để chống mất dữ liệu'),
        p(t('Khi mạng chập chờn, client có thể mất kết nối đúng lúc server gửi sự kiện. Sử dụng outbox table kết hợp cơ chế Pub/Sub bảo đảm mọi thông báo đều được lưu vết bền bỉ và tự động đồng bộ lại khi người dùng online.')),
      ],
    },
  },
  {
    title: 'Case Study: Tối ưu hóa Database PostgreSQL từ 8.000ms xuống 45ms',
    slug: 'case-study-toi-uu-hoa-database-postgresql-tu-8000ms-xuong-45ms',
    excerpt: 'Hành trình điều tra câu truy vấn chậm chạp làm treo hệ thống trong giờ cao điểm và những bài học đắt giá về chỉ mục Indexing.',
    cover_image_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Nguyễn Việt Anh',
    published_days_ago: 12,
    content: {
      type: 'doc',
      content: [
        h2('1. Cơn ác mộng Seq Scan trên bảng 5 triệu dòng'),
        p(t('Khi kiểm tra `pg_stat_activity`, chúng tôi phát hiện hàng loạt truy vấn tìm kiếm trạng thái hồ sơ đang quét tuần tự toàn bộ bảng (Sequential Scan) thay vì sử dụng chỉ mục B-Tree.')),
        h2('2. Phân tích kế hoạch thực thi với EXPLAIN ANALYZE'),
        ul([
          ['Vấn đề 1: ', 'Sử dụng hàm trên cột có chỉ mục làm vô hiệu hóa index.'],
          ['Vấn đề 2: ', 'Thiếu Composite Index cho cặp điều kiện `(status, created_at DESC)` thường xuyên được sắp xếp.'],
          ['Kết quả: ', 'Sau khi bổ sung partial index và refactor câu query, thời gian phản hồi giảm từ 8.2s xuống chỉ còn 45ms, CPU server giảm từ 95% về 12%.'],
        ]),
      ],
    },
  },
  {
    title: 'Văn hóa Feedback không phòng thủ: Làm thế nào để đón nhận phản biện mà không tổn thương?',
    slug: 'van-hoa-feedback-khong-phong-thu-lam-the-nao-de-don-nhan-phan-bien',
    excerpt: 'Biến những lời chê bai gay gắt thành dữ liệu giá trị để nâng cấp tư duy và sản phẩm thay vì đối đầu cá nhân.',
    cover_image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Mai Ngọc Hân',
    published_days_ago: 13,
    content: {
      type: 'doc',
      content: [
        h2('1. Phân biệt giữa "Tôi là ai" và "Những gì tôi làm"'),
        p(t('Khi người dùng chê sản phẩm của bạn khó dùng, họ đang nhận xét về giao diện và trải nghiệm của phần mềm, chứ họ không hề tấn công nhân cách hay trí thông minh của bạn. Tách rời cái tôi (Ego) khỏi sản phẩm là bước trưởng thành quan trọng nhất của mọi nhà phát triển.')),
        bq('Coi feedback như một món quà được đóng gói vụng về. Nhiệm vụ của bạn là bóc lớp giấy thô ráp bên ngoài để lấy viên ngọc sự thật bên trong.'),
      ],
    },
  },
  {
    title: 'Microservices hay Monolith? Lời khuyên chân thành cho các nhóm khởi nghiệp năm 2026',
    slug: 'microservices-hay-monolith-loi-khuyen-chan-thanh-cho-nhom-khoi-nghiep',
    excerpt: 'Đừng vội chia nhỏ hệ thống khi bạn còn chưa hiểu rõ ranh giới nghiệp vụ của chính mô hình kinh doanh mà mình đang xây dựng.',
    cover_image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Cao Tiến Dũng',
    published_days_ago: 14,
    content: {
      type: 'doc',
      content: [
        h2('1. Cái bẫy "Netflix làm được thì mình cũng làm được"'),
        p(t('Nhiều nhóm sinh viên và startup mới bắt đầu đã chia dự án thành 10 repository microservices khác nhau. Kết quả là 80% thời gian bị lãng phí vào việc cấu hình mạng, xử lý phân tán dữ liệu, đồng bộ hoá phiên bản và sửa lỗi kết nối giữa các container.')),
        h2('2. Modular Monolith: Lựa chọn thông minh nhất'),
        p(t('Hãy bắt đầu bằng một khối Monolith duy nhất nhưng có cấu trúc thư mục module rõ ràng (Clean Architecture / Domain-Driven). Bạn có thể triển khai trên một máy chủ duy nhất với chi phí 5$/tháng mà vẫn sẵn sàng tách ra thành microservice khi có lượng người dùng đủ lớn.')),
      ],
    },
  },
  {
    title: 'Khởi nghiệp B2B SaaS tại Đông Nam Á: Bài toán tiếp cận khách hàng doanh nghiệp đầu tiên',
    slug: 'khoi-nghiep-b2b-saas-tai-dong-nam-a-bai-toan-tiep-can-khach-hang-dau-tien',
    excerpt: 'Bán phần mềm cho doanh nghiệp vừa và nhỏ (SMEs) tại thị trường nội địa đòi hỏi chiến lược hoàn toàn khác biệt so với mô hình Product-Led Growth của phương Tây.',
    cover_image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Trịnh Quốc Đạt',
    published_days_ago: 15,
    content: {
      type: 'doc',
      content: [
        h2('1. Niềm tin quan trọng hơn tính năng'),
        p(t('Các chủ doanh nghiệp truyền thống hiếm khi tự động đăng ký và quẹt thẻ tín dụng như các công ty công nghệ tại Thung lũng Silicon. Họ cần nhìn thấy mặt người đại diện, cần biết công ty có dịch vụ hỗ trợ trực tiếp và an tâm rằng dữ liệu của họ không bị thất thoát.')),
        h2('2. Chiến lược Pilot không tính phí để lấy Case Study thực tế'),
        p(t('Thay vì cố gắng bán ngay bản quyền đắt tiền, hãy đề nghị triển khai thử nghiệm cho 3 khách hàng đầu tiên với điều kiện duy nhất: họ cam kết sử dụng hàng ngày và cho phép bạn quay video phỏng vấn chia sẻ kết quả đo lường được sau 30 ngày.')),
      ],
    },
  },
  {
    title: 'Design System không chỉ là Figma: Cách đồng bộ giữa Designer và Front-end Developer',
    slug: 'design-system-khong-chi-la-figma-cach-dong-bo-designer-va-developer',
    excerpt: 'Làm thế nào để các Design Tokens trong file thiết kế biến thành các biến CSS đồng nhất trong mã nguồn mà không cần gõ lại bằng tay?',
    cover_image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Phan Minh Trang',
    published_days_ago: 16,
    content: {
      type: 'doc',
      content: [
        h2('1. Lỗ hổng chuyển giao (The Handoff Gap)'),
        p(t('Designer thiết kế một nút bấm với khoảng cách 12px, nhưng lập trình viên lại chọn class `p-3` (12px) hoặc tự ý viết `px-4 py-2`. Khi dự án phình to lên 50 trang, ứng dụng có tới 15 biến thể màu xanh khác nhau và 8 loại bo tròn nút khác nhau!')),
        h2('2. Thiết lập bộ quy chuẩn Design Tokens'),
        p(t('Bằng cách định nghĩa trước bảng màu quy ước, kích thước font chữ và khoảng cách trong theme Mantine hoặc Tailwind CSS, cả hai bên có thể dùng chung một ngôn ngữ giao tiếp chuẩn mực.')),
      ],
    },
  },
  {
    title: 'Bảo mật ứng dụng Web hiện đại: 10 lỗ hổng nguy hiểm nhất ngoài OWASP Top 10',
    slug: 'bao-mat-ung-dung-web-hien-dai-10-lo-hong-nguy-hiem-ngoai-owasp',
    excerpt: 'Những sai lầm ngớ ngẩn trong việc cấu hình CORS, lưu trữ JWT Token và quyền kiểm soát truy cập cấp đối tượng (BOLA/IDOR).',
    cover_image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Lưu Hải Nam',
    published_days_ago: 17,
    content: {
      type: 'doc',
      content: [
        h2('1. Lỗ hổng IDOR (Insecure Direct Object References)'),
        p(t('Rất nhiều API chỉ kiểm tra xem người dùng đã đăng nhập chưa, nhưng lại quên không kiểm tra xem người dùng đó có thực sự sở hữu ID tài liệu trong đường dẫn URL hay không. Chỉ cần đổi `orderId=1001` thành `orderId=1002`, kẻ tấn công có thể xem toàn bộ hóa đơn của người khác!')),
        h2('2. Lưu trữ token nhạy cảm trong localStorage'),
        p(t('Bất kỳ lỗ hổng XSS nào cũng có thể đọc sạch sẽ `localStorage` trong tích tắc. Luôn ưu tiên lưu trữ Refresh Token trong `httpOnly, secure, sameSite=strict` cookie để bảo vệ người dùng tối đa.')),
      ],
    },
  },
  {
    title: 'Sức mạnh của kỷ luật viết lách: Tại sao mỗi lập trình viên nên xây dựng một chiếc Digital Garden?',
    slug: 'suc-manh-ky-luat-viet-lach-tai-sao-lap-trinh-vien-nen-xay-dung-digital-garden',
    excerpt: 'Viết ra những gì bạn học được là phương pháp học tập tối ưu nhất để biến kiến thức rời rạc thành tư duy phản biện sắc bén.',
    cover_image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Nguyễn Thanh Phong',
    published_days_ago: 18,
    content: {
      type: 'doc',
      content: [
        h2('1. Kỹ thuật Feynman trong lập trình'),
        p(t('Nếu bạn không thể giải thích một khái niệm kỹ thuật phức tạp (như Cơ chế Garbage Collection hay B-Tree Index) cho một sinh viên năm nhất hiểu được bằng từ ngữ giản dị, điều đó chứng tỏ bạn vẫn chưa thực sự hiểu rõ bản chất của nó.')),
        bq('Viết không chỉ là để truyền đạt suy nghĩ; viết là công cụ để bạn biết mình đang thực sự nghĩ gì.'),
      ],
    },
  },
  {
    title: 'Từ Zero đến Production: Cẩm nang triển khai CI/CD với GitHub Actions và Docker',
    slug: 'tu-zero-den-production-cam-nang-trien-khai-cicd-github-actions-docker',
    excerpt: 'Tự động hóa hoàn toàn quy trình kiểm thử, đóng gói container và triển khai lên máy chủ VPS mà không cần can thiệp thủ công.',
    cover_image_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Hoàng Nhật Minh',
    published_days_ago: 19,
    content: {
      type: 'doc',
      content: [
        h2('1. Tạm biệt thời kỳ FTP và SSH thủ công kéo code'),
        p(t('Triển khai thủ công bằng lệnh `git pull` trực tiếp trên server sản phẩm là nguồn gốc của 90% sự cố ngoài giờ làm việc. Một pipeline CI/CD chuẩn mực phải đảm bảo: chạy test tự động, lint mã nguồn, build Docker image và rollback tức thì nếu có lỗi xảy ra.')),
        h2('2. Bí quyết tối ưu Docker Layer Caching'),
        p(t('Đặt lệnh copy `package.json` và cài đặt dependency trước khi copy toàn bộ mã nguồn giúp giảm thời gian build từ 10 phút xuống chỉ còn 45 giây cho mỗi lần đẩy code mới.')),
      ],
    },
  },
  {
    title: 'Triết lý thiết kế tối giản trong thời đại AI tràn lan thông tin rác',
    slug: 'triet-ly-thiet-ke-toi-gian-trong-thoi-dai-ai-tran-lan-thong-tin-rac',
    excerpt: 'Khi nội dung do AI tạo ra tràn ngập mọi ngõ ngách của internet, sự giản dị, tĩnh lặng và chân thực trở thành món hàng xa xỉ nhất.',
    cover_image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    author_byline: 'Dương Quỳnh Nga',
    published_days_ago: 20,
    content: {
      type: 'doc',
      content: [
        h2('1. Sự kiệt sức vì quá tải thông tin (Information Exhaustion)'),
        p(t('Mỗi ngày người dùng phải tiếp xúc với hàng ngàn bài viết giật tít, các video ngắn nhảy nhót liên tục và những giao diện đầy ắp banner nhấp nháy. Một trang web đọc bài yên tĩnh, với typography chuẩn mực và nền trắng thoáng đãng giống như một ốc đảo giữa sa mạc ồn ào.')),
        bq('Sự hoàn hảo đạt được không phải khi không còn gì để thêm vào, mà là khi không còn gì để lược bớt đi. — Antoine de Saint-Exupéry'),
      ],
    },
  },
];

async function main() {
  console.log('Seeding 20 long articles...');
  let count = 0;

  const categories = ['khoi-nghiep', 'cong-nghe', 'goc-nhin', 'huong-dan', 'san-pham'];
  const tagPool = [
    ['KhởiNghiệp', 'MVP', 'SinhViên'],
    ['AI', 'CôngNghệ', 'LLM'],
    ['KháchHàng', 'ProductMarketFit', 'Sales'],
    ['KinhDoanh', 'TàiChính', 'ĐầuTư'],
    ['KỹNăng', 'LãnhĐạo', 'ĐộiNgũ'],
    ['UX', 'ThiếtKế', 'SảnPhẩm'],
  ];

  for (const art of articles) {
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - art.published_days_ago);
    const assignedCategory = categories[count % categories.length];
    const assignedTags = tagPool[count % tagPool.length];

    await prisma.newsItem.upsert({
      where: { slug: art.slug },
      update: {
        title: art.title,
        type: 'article',
        status: 'published',
        category: assignedCategory,
        tags: assignedTags,
        excerpt: art.excerpt,
        content_json: art.content,
        cover_image_url: art.cover_image_url,
        cover_image_alt: art.title,
        published_at: publishedAt,
        updated_by_auth_user_id: ADMIN_ID,
      },
      create: {
        title: art.title,
        slug: art.slug,
        type: 'article',
        status: 'published',
        category: assignedCategory,
        tags: assignedTags,
        excerpt: art.excerpt,
        content_json: art.content,
        cover_image_url: art.cover_image_url,
        cover_image_alt: art.title,
        published_at: publishedAt,
        created_by_auth_user_id: ADMIN_ID,
        updated_by_auth_user_id: ADMIN_ID,
      },
    });

    count++;
    console.log(`[${count}/20] Seeded: ${art.title} (category: ${assignedCategory}, tags: ${assignedTags.join(', ')})`);
  }

  const total = await prisma.newsItem.count();
  console.log(`\nSuccessfully seeded ${count} long articles! Total in DB: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
