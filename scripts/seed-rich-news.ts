import { prisma } from '../apps/api/src/db.js';
import { TipTapDocSchema } from '../packages/validation/src/index.js';

const ADMIN_ID = 'JG9okn4jhTV6WttilpIzfacxlG1BerNJ';

// Helper to build text nodes
function t(text: string, marks?: Array<{ type: 'bold' | 'italic' | 'underline' | 'strike' } | { type: 'link'; attrs: { href: string } }>) {
  return marks && marks.length > 0 ? { type: 'text', text, marks } : { type: 'text', text };
}

function p(...content: any[]) {
  return { type: 'paragraph', content: content.length > 0 ? content : [{ type: 'text', text: '' }] };
}

function h2(text: string) {
  return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] };
}

function h3(text: string) {
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

function ol(items: string[][]) {
  return {
    type: 'orderedList',
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

function hr() {
  return { type: 'horizontalRule' };
}

// ========================================================
// ARTICLE 1: Xu hướng AI Việt Nam 2025-2026
// ========================================================
const article1Doc = {
  type: 'doc',
  content: [
    h2('1. Sự thoái trào của làn sóng "Wrapper AI" và bình minh của Vertical AI'),
    p(
      t('Trong giai đoạn 2023–2024, thế giới chứng kiến sự bùng nổ của hàng nghìn startup công nghệ xây dựng trên giao diện OpenAI API. Chỉ cần một prompt khéo léo bọc quanh GPT-4, một sản phẩm đã có thể ra đời sau một đêm. Tuy nhiên, bước sang giai đoạn '),
      t('2025–2026', [{ type: 'bold' }]),
      t(', các quỹ đầu tư mạo hiểm và khách hàng doanh nghiệp tại Việt Nam đã không còn mặn mà với các sản phẩm mang tính "bề nổi" này.')
    ),
    p(
      t('Thực tế chỉ ra rằng: một tính năng mới trong bản cập nhật của OpenAI hay Google hoàn toàn có thể xóa sổ một startup chỉ sau một tuần nếu sản phẩm đó thiếu đi con hào kinh tế (moat) về '),
      t('dữ liệu bản địa và hiểu biết sâu sắc về ngành (domain expertise)', [{ type: 'bold' }]),
      t('.')
    ),
    bq('“Không doanh nghiệp nào sẵn sàng trả 50 USD/tháng cho một chatbot biết làm thơ, nhưng họ sẽ vui vẻ chi 5.000 USD/tháng cho một AI Agent có thể đối soát hóa đơn thuế và giảm 80% sai sót kho vận.” — Nhận định từ một nhà đầu tư tại Tech in Asia Vietnam.'),
    h2('2. Bốn trụ cột phát triển của Startup AI Việt Nam giai đoạn mới'),
    p(t('Các dự án công nghệ nhận được vốn trong thời gian gần đây đều tập trung vào việc giải quyết những "nỗi đau" nhức nhối trong các lĩnh vực truyền thống:')),
    ul([
      ['Retail & E-commerce AI: ', 'Tự động hóa livestream bán hàng 24/7 và trợ lý bán hàng qua giọng nói (Voice AI) tối ưu hóa theo phương ngữ Bắc - Trung - Nam, giúp tăng tỉ lệ chốt đơn tới 35%.'],
      ['Agentic AI cho SME: ', 'Chuyển từ Chatbot hội thoại thông thường sang các "Nhân viên số tự trị" (Autonomous Agents) có khả năng tự động thực thi chuỗi tác vụ: lập phiếu thu, gửi email nhắc nợ, đồng bộ tồn kho trên sàn TMĐT.'],
      ['Sản xuất và Chuỗi cung ứng: ', 'Hệ thống AI thị giác máy tính (Computer Vision) kiểm định chất lượng đường may trong ngành dệt may và phát hiện lỗi bo mạch điện tử với độ chính xác trên 99.2%.'],
      ['Mô hình tối ưu chi phí (Small Language Models - SLM): ', 'Tận dụng các mô hình ngôn ngữ nhỏ được tinh chỉnh (fine-tuned) để chạy trên hạ tầng máy chủ cục bộ hoặc thiết bị IoT, giảm thiểu 70% chi phí gọi API đám mây.'],
    ]),
    hr(),
    h2('3. Những rào cản mang tính sống còn đối với nhà sáng lập trẻ'),
    p(t('Mặc dù Việt Nam hiện đứng thứ 2 khu vực Đông Nam Á về số lượng dự án GenAI (chiếm 27%, chỉ sau Singapore), các nhóm sáng lập sinh viên vẫn đang đối mặt với ba "hòn đá tảng" lớn:')),
    ol([
      ['Khoảng cách từ PoC đến Hợp đồng thương mại: ', 'Một bản demo chạy mượt mà trên môi trường máy tính cá nhân hoàn toàn khác xa với việc triển khai vào hệ thống ERP phức tạp của doanh nghiệp có hàng nghìn nhân viên.'],
      ['Chi phí hạ tầng tính toán (Compute Cost): ', 'Chi phí thuê GPU để huấn luyện và duy trì dịch vụ AI có thể "đốt" sạch số vốn hạt giống chỉ trong vài tháng nếu mô hình không được tối ưu hóa kiến trúc.'],
      ['Khủng hoảng dữ liệu sạch: ', 'Hầu hết dữ liệu của doanh nghiệp nội địa còn rời rạc, lưu trên Excel hoặc giấy tờ quét mờ, đòi hỏi công sức tiền xử lý khổng lồ trước khi đưa vào mô hình học máy.'],
    ]),
    h2('4. Lời khuyên hành động dành cho các đội thi tại Nexus Platform'),
    p(
      t('Nếu bạn đang ấp ủ một đề tài khởi nghiệp công nghệ trong trường đại học, hãy nhớ quy tắc vàng: '),
      t('Bán giá trị giải pháp, không bán thuật toán', [{ type: 'bold' }]),
      t('. Đừng cố gắng tạo ra một "ChatGPT thứ hai", hãy tạo ra công cụ tốt nhất giúp một xưởng may 50 công nhân tại Bình Dương không bị chậm hạn giao hàng.')
    ),
    p(
      t('Hãy tận dụng các nguồn lực cố vấn và báo cáo thẩm định tại Nexus Platform để hoàn thiện hồ sơ dự án của bạn ngay hôm nay.')
    ),
  ],
};

// ========================================================
// ARTICLE 2: Hành trình tìm Product-Market Fit (PMF)
// ========================================================
const article2Doc = {
  type: 'doc',
  content: [
    h2('1. Cạm bẫy lớn nhất của các nhà sáng lập: Nhầm lẫn giữa Traffic và PMF'),
    p(
      t('Rất nhiều nhà sáng lập trẻ ăn mừng khi bài đăng trên mạng xã hội đạt 10.000 lượt tương tác, hoặc ứng dụng có 5.000 lượt tải sau tuần đầu tiên ra mắt. Nhưng 3 tháng sau, tỉ lệ người dùng hoạt động hàng ngày (DAU) rơi tự do về con số 0. Đó là lúc họ nhận ra mình đã rơi vào cái bẫy kinh điển: '),
      t('Sự chú ý nhất thời không phải là Product-Market Fit', [{ type: 'bold' }]),
      t('.')
    ),
    p(
      t('Product-Market Fit (Sự phù hợp giữa sản phẩm và thị trường) chỉ thực sự xuất hiện khi sản phẩm của bạn giải quyết một nhu cầu cấp thiết đến mức người dùng không thể ngừng sử dụng và sẵn sàng giới thiệu cho người khác mà bạn không cần tốn một đồng quảng cáo.')
    ),
    bq('“Khách hàng không mua những gì bạn làm ra, họ mua những gì sản phẩm đó giúp họ đạt được. Nếu bạn biến mất vào ngày mai mà không ai nhớ tới bạn, bạn chưa từng có PMF.” — Marc Andreessen.'),
    h2('2. Case Study: Hai ngả đường tìm kiếm PMF của Spiderum và Vietcetera'),
    p(t('Nhìn vào bức tranh các nền tảng nội dung số hàng đầu tại Việt Nam, chúng ta có thể rút ra những bài học đắt giá về cách tiếp cận mô hình kinh doanh:')),
    h3('Bài học từ Spiderum: Từ diễn đàn cộng đồng đến mô hình xuất bản đa kênh'),
    p(
      t('Khởi đầu là một diễn đàn viết bài và thảo luận trí thức, Spiderum thu hút hàng trăm nghìn bạn trẻ đam mê viết lách. Tuy nhiên, chi phí máy chủ và vận hành nhanh chóng đặt ra bài toán dòng tiền. Quảng cáo banner trực tuyến mang lại doanh thu bèo bọt và làm hỏng trải nghiệm người đọc.')
    ),
    p(
      t('Đội ngũ sáng lập đã thực hiện một bước chuyển mình (pivot) mang tính chiến lược: '),
      t('Đóng gói nội dung số thành các ấn phẩm sách vật lý', [{ type: 'bold' }]),
      t('. Chuỗi sách "Người trong muôn nghề" đã trở thành hiện tượng xuất bản, bán ra hàng trăm nghìn bản và mở ra nguồn doanh thu vững chắc cho cộng đồng tác giả.')
    ),
    h3('Bài học từ Vietcetera: Đa dạng hóa định dạng và chinh phục khách hàng B2B'),
    p(
      t('Bắt đầu như một trang blog tiếng Anh dành cho du khách và chuyên gia nước ngoài, Vietcetera nhận thấy thị trường quá hẹp để mở rộng quy mô. Họ quyết định tái định vị thương hiệu sang tiếng Việt, nhắm thẳng vào thế hệ Gen Z và Millennials năng động.')
    ),
    p(
      t('Thay vì chỉ viết bài, họ tiên phong trong làn sóng Podcast chất lượng cao (Have A Sip, Vietnam Innovators). PMF của Vietcetera không đến từ việc thu phí đọc giả, mà đến từ '),
      t('giải pháp truyền thông thương hiệu cao cấp (Branded Content)', [{ type: 'bold' }]),
      t(' cho các tập đoàn đa quốc gia muốn tiếp cận tệp độc giả tri thức.')
    ),
    hr(),
    h2('3. Framework 3 bước tự kiểm tra PMF cho dự án của bạn'),
    p(t('Trước khi bước vào phòng pitching trước hội đồng giám khảo hoặc nhà đầu tư, hãy tự vấn nhóm của mình ba câu hỏi cốt lõi:')),
    ul([
      ['Đo lường Đường cong Giữ chân (Retention Curve): ', 'Đường cong tỉ lệ quay lại sau 30 ngày (Day-30 Retention) có đi ngang (flatten) không? Nếu nó tiếp tục dốc xuống về 0, bạn chưa đạt PMF.'],
      ['Chỉ số "Rất thất vọng" của Sean Ellis: ', 'Nếu sản phẩm ngừng hoạt động vào ngày mai, có ít nhất 40% người dùng trả lời họ sẽ "Rất thất vọng" hay không?'],
      ['Bằng chứng về Mức độ sẵn sàng chi trả (Willingness to Pay): ', 'Khách hàng có sẵn sàng ký cam kết trả trước (Letter of Intent - LOI) hoặc đặt cọc tiền mặt để sử dụng tính năng của bạn không?'],
    ]),
    h2('4. Kết luận: PMF là một hành trình lặp liên tục, không phải đích đến một lần'),
    p(
      t('Thị trường và đối thủ luôn biến động không ngừng. Đạt được PMF ở quy mô 100 khách hàng đầu tiên không có nghĩa là bạn sẽ tự động giữ được nó khi mở rộng lên 10.000 khách hàng. Hãy giữ cho đội ngũ của mình luôn khiêm tốn, lắng nghe phản hồi của người dùng mỗi ngày và không ngừng thử nghiệm.')
    ),
  ],
};

// ========================================================
// ARTICLE 3: Cẩm nang sinh viên gọi vốn hạt giống
// ========================================================
const article3Doc = {
  type: 'doc',
  content: [
    h2('1. Tư duy đúng về nguồn vốn khởi nghiệp trong trường đại học'),
    p(
      t('Hầu hết sinh viên tham gia các cuộc thi khởi nghiệp thường mang tâm lý: '),
      t('“Có tiền đầu tư rồi mới làm sản phẩm”', [{ type: 'italic' }]),
      t('. Đây là tư duy sai lầm lớn nhất khiến 95% dự án chết yểu ngay sau khi rời khỏi sân khấu trao giải.')
    ),
    p(
      t('Các nhà đầu tư thiên thần (Angel Investors) và các vườn ươm khởi nghiệp không bao giờ đầu tư vào một bản thuyết trình PowerPoint bóng bẩy. Họ đầu tư vào '),
      t('khả năng thực thi (execution power) và tốc độ tạo ra sản phẩm thử nghiệm', [{ type: 'bold' }]),
      t(' của một nhóm sáng lập gắn kết.')
    ),
    bq('“Ý tưởng chỉ là hệ số nhân. Sự thực thi mới là giá trị hàng triệu đô. Một ý tưởng bình thường với sự thực thi xuất sắc sẽ luôn đánh bại một ý tưởng thiên tài nhưng chỉ nằm trên giấy.” — Derek Sivers.'),
    h2('2. Bốn cột mốc cần vượt qua để chinh phục vòng Hạt giống (Seed Round)'),
    ol([
      ['Cột mốc 1: Bản mẫu thô sơ nhưng có người dùng thật (Scrappy MVP): ', 'Không cần kiến trúc microservices hay giao diện đồ họa phức tạp. Hãy dựng một trang web đơn giản bằng No-code, kết nối Google Sheets hoặc tự động gửi email thủ công để giải quyết vấn đề cho 10 người đầu tiên.'],
      ['Cột mốc 2: Sự thấu hiểu khách hàng sâu sắc (Customer Discovery): ', 'Bạn phải thực hiện ít nhất 30 cuộc phỏng vấn trực tiếp 1-1 với khách hàng tiềm năng. Bạn phải biết họ thức dậy lúc mấy giờ, họ bực bội điều gì nhất trong công việc hàng ngày và họ đang dùng công cụ gì để đối phó.'],
      ['Cột mốc 3: Đội ngũ hạt nhân bù trừ năng lực (The Dream Team): ', 'Một startup trường học lý tưởng cần có đủ 3 mảnh ghép: Hacker (người hiểu sâu về kỹ thuật, xây dựng sản phẩm), Hustler (người bán hàng, mở rộng thị trường) và Hipster (người thiết kế trải nghiệm người dùng).'],
      ['Cột mốc 4: Tín hiệu tăng trưởng ban đầu (Early Traction): ', 'Tăng trưởng 10% mỗi tuần, dù bắt đầu từ con số nhỏ 10 khách hàng lên 11 khách hàng, vẫn là tín hiệu chứng minh sản phẩm đang đi đúng hướng.'],
    ]),
    hr(),
    h2('3. Chuẩn bị hồ sơ Pitch Deck thế nào để gây ấn tượng trong 3 phút?'),
    p(t('Một bộ slide gọi vốn hạt giống tiêu chuẩn chỉ nên có từ 10 đến 12 trang, tập trung trả lời 5 câu hỏi trọng yếu:')),
    ul([
      ['Vấn đề là gì? ', 'Tại sao vấn đề này lại đau đớn và tại sao lại là ngay lúc này (Why now)?'],
      ['Giải pháp của bạn: ', 'Sản phẩm hoạt động thế nào và vượt trội hơn các giải pháp thay thế ở điểm gì?'],
      ['Quy mô thị trường (TAM/SAM/SOM): ', 'Thị trường có đủ lớn để tạo ra doanh nghiệp triệu đô không?'],
      ['Mô hình kiếm tiền: ', 'Bạn thu tiền của ai, thu bao nhiêu và biên lợi nhuận ước tính là bao nhiêu?'],
      ['Tại sao là các bạn? ', 'Lợi thế cá nhân và cam kết sống chết của đội ngũ với dự án này.'],
    ]),
    h2('4. Lời kết'),
    p(
      t('Hành trình khởi nghiệp từ ghế nhà trường là trường học thực tế khắc nghiệt nhưng tuyệt vời nhất. Hãy sử dụng Nexus Platform làm bệ phóng, lắng nghe phản hồi của các mentor và không ngừng tôi luyện sản phẩm của bạn mỗi ngày.')
    ),
  ],
};

async function seed() {
  console.log('Seeding comprehensive real-world articles...');

  // Validate AST docs with Zod schema
  console.log('Validating Article 1 AST...', TipTapDocSchema.safeParse(article1Doc).success);
  console.log('Validating Article 2 AST...', TipTapDocSchema.safeParse(article2Doc).success);
  console.log('Validating Article 3 AST...', TipTapDocSchema.safeParse(article3Doc).success);

  // Clear existing items to maintain clean demo dataset
  await prisma.newsItem.deleteMany({});
  console.log('Cleared old news_items');

  const now = Date.now();

  const items = [
    {
      type: 'article',
      status: 'published',
      title: 'Toàn cảnh khởi nghiệp AI tại Việt Nam 2025–2026: Từ bẫy Wrapper đến kỷ nguyên Vertical AI',
      slug: 'toan-canh-khoi-nghiep-ai-tai-viet-nam-2025-2026-tu-bay-wrapper-den-ky-nguyen-vertical-ai',
      excerpt: 'Phân tích chuyên sâu về sự dịch chuyển từ các ứng dụng Chatbot bọc API sang Agentic AI chuyên sâu theo ngành và bài toán sống còn về con hào dữ liệu bản địa tại thị trường Việt Nam.',
      cover_image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      cover_image_alt: 'Bức tranh khởi nghiệp trí tuệ nhân tạo AI Việt Nam',
      published_at: new Date(now - 3600 * 1000 * 2), // 2 hours ago
      content_json: article1Doc,
    },
    {
      type: 'article',
      status: 'published',
      title: 'Hành trình tìm kiếm Product-Market Fit: Bài học thực chiến từ Spiderum và Vietcetera',
      slug: 'hanh-trinh-tim-kiem-product-market-fit-bai-hoc-thuc-chien-tu-spiderum-va-vietcetera',
      excerpt: 'Đừng nhầm lẫn giữa lượng truy cập ban đầu và sự phù hợp thị trường. Phân tích case study về cách hai nền tảng nội dung hàng đầu pivot và xây dựng mô hình dòng tiền bền vững.',
      cover_image_url: 'https://res.cloudinary.com/demo/image/upload/c_fill,w_800,h_450/sample.jpg',
      cover_image_alt: 'Hành trình tìm kiếm Product-Market Fit cho startup',
      published_at: new Date(now - 3600 * 1000 * 6), // 6 hours ago
      content_json: article2Doc,
    },
    {
      type: 'article',
      status: 'published',
      title: 'Từ giảng đường đến vòng gọi vốn hạt giống: 4 cột mốc sinh viên khởi nghiệp cần vượt qua',
      slug: 'tu-giang-duong-den-vong-goi-von-hat-giong-4-cot-moc-sinh-vien-khoi-nghiep-can-vuot-qua',
      excerpt: 'Cẩm nang thực tế giải mã tư duy sai lầm về nguồn vốn, hướng dẫn xây dựng MVP tinh gọn và bí quyết cấu trúc bài thuyết trình Pitch Deck 3 phút gây ấn tượng với các quỹ đầu tư.',
      cover_image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      cover_image_alt: 'Sinh viên khởi nghiệp gọi vốn vòng hạt giống',
      published_at: new Date(now - 3600 * 1000 * 18), // 18 hours ago
      content_json: article3Doc,
    },
    {
      type: 'video',
      status: 'published',
      title: 'Kỹ năng Pitching thực chiến: 3 phút chinh phục ban giám khảo và nhà đầu tư',
      slug: null,
      excerpt: 'Chia sẻ từ các chuyên gia khởi nghiệp về cấu trúc bài nói 3 phút, cách làm slide tinh gọn và phong thái trả lời câu hỏi phản biện tự tin.',
      youtube_video_id: '8aGhZQkoFbQ',
      cover_image_url: null,
      cover_image_alt: null,
      published_at: new Date(now - 3600 * 1000 * 24), // 1 day ago
      content_json: null,
    },
    {
      type: 'video',
      status: 'published',
      title: 'Y Combinator: Cách tìm kiếm và kiểm chứng ý tưởng khởi nghiệp đột phá',
      slug: null,
      excerpt: 'Bài giảng kinh điển của đối tác Y Combinator về phương pháp phát hiện các vấn đề thực tế đáng giá và cách kiểm chứng nhu cầu thị trường.',
      youtube_video_id: 'Th8JoIan4dg',
      cover_image_url: null,
      cover_image_alt: null,
      published_at: new Date(now - 3600 * 1000 * 48), // 2 days ago
      content_json: null,
    },
    {
      type: 'article',
      status: 'draft',
      title: '[Bản nháp] Tiêu chí đánh giá tính khả thi tài chính và định giá dự án tiền doanh thu',
      slug: 'tieu-chi-danh-gia-tinh-kha-thi-tai-chinh-va-dinh-gia-du-an-tien-doanh-thu',
      excerpt: 'Tài liệu hướng dẫn nội bộ phân tích chi phí vận hành, tính toán điểm hòa vốn và các phương pháp định giá Berkus, Scorecard cho các startup công nghệ.',
      cover_image_url: 'https://res.cloudinary.com/demo/image/upload/c_fill,w_800,h_450/sample.jpg',
      cover_image_alt: 'Định giá tài chính dự án khởi nghiệp',
      published_at: null,
      content_json: {
        type: 'doc',
        content: [
          h2('Bản nháp tài liệu nội bộ Nexus Platform'),
          p(t('Tài liệu đang được ban cố vấn tài chính hoàn thiện để đưa vào bộ thư viện hướng dẫn cho sinh viên.')),
        ],
      },
    },
  ];

  for (const item of items) {
    const created = await prisma.newsItem.create({
      data: {
        type: item.type,
        status: item.status,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content_json: item.content_json,
        youtube_video_id: item.youtube_video_id,
        cover_image_url: item.cover_image_url,
        cover_image_alt: item.cover_image_alt,
        published_at: item.published_at,
        created_by_auth_user_id: ADMIN_ID,
        updated_by_auth_user_id: ADMIN_ID,
      },
    });
    console.log(`✓ Inserted [${created.type}] ${created.title} (${created.status})`);
  }

  const total = await prisma.newsItem.count();
  console.log(`\nAll done! Total news items in DB: ${total}`);
}

seed()
  .catch((e) => {
    console.error('Error seeding news:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
