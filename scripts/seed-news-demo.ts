import { prisma } from '../apps/api/src/db.js';

const ADMIN_ID = 'JG9okn4jhTV6WttilpIzfacxlG1BerNJ';

async function seed() {
  console.log('Seeding demo news items...');

  const items = [
    {
      type: 'article',
      status: 'published',
      title: 'Nexus Platform ra mắt bộ công cụ tăng tốc thẩm định dự án khởi nghiệp sinh viên',
      slug: 'nexus-platform-ra-mat-bo-cong-cu-tang-toc-tham-dinh-du-an-khoi-nghiep-sinh-vien',
      excerpt: 'Nền tảng Nexus chính thức đưa vào vận hành hệ thống đánh giá tự động dựa trên AI và quy trình thẩm định đa tầng, giúp các nhóm sinh viên hoàn thiện hồ sơ dự án nhanh gấp 3 lần.',
      cover_image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      cover_image_alt: 'Giao diện thẩm định dự án khởi nghiệp Nexus Platform',
      published_at: new Date(Date.now() - 3600 * 1000 * 2), // 2 hours ago
      content_json: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Bước đột phá trong hỗ trợ ươm tạo khởi nghiệp' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Nhằm đồng hành cùng sinh viên trong hành trình biến ý tưởng trên giảng đường thành các dự án kinh doanh khả thi, ' },
              { type: 'text', marks: [{ type: 'bold' }], text: 'Nexus Platform' },
              { type: 'text', text: ' đã chính thức triển khai bộ tính năng đánh giá tự động và hỗ trợ cố vấn thông minh.' },
            ],
          },
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    marks: [{ type: 'italic' }],
                    text: '“Sứ mệnh của chúng tôi là thu hẹp khoảng cách giữa ý tưởng sơ khai và yêu cầu khắt khe của các quỹ đầu tư mạo hiểm.”',
                  },
                ],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: 'Các tính năng nổi bật vừa ra mắt' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'bold' }], text: 'Thẩm định hồ sơ AI: ' },
                      { type: 'text', text: 'Phân tích tính khả thi của mô hình kinh doanh chỉ trong vài phút.' },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'bold' }], text: 'Không gian làm việc cộng tác: ' },
                      { type: 'text', text: 'Hỗ trợ kết nối trực tiếp với đội ngũ cố vấn chuyên môn (Mentors).' },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'bold' }], text: 'Xuất báo cáo chuẩn quỹ đầu tư: ' },
                      { type: 'text', text: 'Tự động tạo báo cáo thẩm định định dạng PDF chuyên nghiệp.' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Các đội thi sinh viên hiện đã có thể truy cập hệ thống để nộp đề tài và nhận phản hồi chi tiết từ hệ thống.',
              },
            ],
          },
        ],
      },
    },
    {
      type: 'article',
      status: 'published',
      title: '5 sai lầm phổ biến khi xây dựng mô hình Lean Canvas mà các founder trẻ hay gặp',
      slug: '5-sai-lam-pho-bien-khi-xay-dung-mo-hinh-lean-canvas-ma-cac-founder-tre-hay-gap',
      excerpt: 'Phân tích chi tiết những cạm bẫy thường gặp trong việc xác định Problem-Solution Fit và phương pháp thực tế để thuyết phục ban giám khảo trong các cuộc thi khởi nghiệp.',
      cover_image_url: 'https://res.cloudinary.com/demo/image/upload/c_fill,w_800,h_450/sample.jpg',
      cover_image_alt: 'Mô hình Lean Canvas cho startup',
      published_at: new Date('2026-10-05T14:15:00Z'),
      content_json: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Hiểu đúng về bản đồ kinh doanh tinh gọn' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Lean Canvas là công cụ một trang tuyệt vời giúp phác thảo nhanh mô hình kinh doanh. Tuy nhiên, rất nhiều bạn sinh viên rơi vào cái bẫy "làm cho có" hoặc nhầm lẫn giữa giải pháp công nghệ và giá trị cốt lõi mang lại cho khách hàng.',
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: 'Những lỗi sai kinh điển' }],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'bold' }], text: 'Yêu giải pháp hơn yêu vấn đề: ' },
                      { type: 'text', text: 'Tập trung quá mức vào tính năng phần mềm thay vì nỗi đau thực tế của khách hàng.' },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'bold' }], text: 'Xác định tệp khách hàng quá rộng: ' },
                      { type: 'text', text: 'Nhắm mục tiêu "tất cả mọi người" thay vì tập trung vào nhóm khách hàng tiên phong (early adopters).' },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'bold' }], text: 'Nhầm lẫn lợi thế bất công (Unfair Advantage): ' },
                      { type: 'text', text: 'Xem ý tưởng hay sự chăm chỉ là lợi thế cạnh tranh khó sao chép.' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hãy liên tục cập nhật và kiểm chứng từng giả định trong mô hình của bạn trước khi bắt tay vào lập trình sản phẩm.',
              },
            ],
          },
        ],
      },
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
      published_at: new Date(Date.now() - 3600 * 1000 * 5), // 5 hours ago
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
      published_at: new Date('2026-10-04T10:00:00Z'),
      content_json: null,
    },
    {
      type: 'article',
      status: 'draft',
      title: '[Bản nháp] Cẩm nang chuẩn bị hồ sơ gọi vốn vòng Hạt giống (Seed Round) 2026',
      slug: 'cam-nang-chuan-bi-ho-so-goi-von-vong-hat-giong-seed-round-2026',
      excerpt: 'Tài liệu hướng dẫn nội bộ chi tiết dành cho các nhóm dự án xuất sắc chuẩn bị bước vào Demo Day và tiếp cận các quỹ đầu tư.',
      cover_image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      cover_image_alt: 'Tài liệu gọi vốn hạt giống',
      published_at: null,
      content_json: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Checklist tài liệu cần chuẩn bị trước Demo Day' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Đây là bản nháp đang được đội ngũ cố vấn Nexus biên soạn và hoàn thiện.' },
            ],
          },
        ],
      },
    },
  ];

  for (const item of items) {
    const created = await prisma.newsItem.upsert({
      where: {
        slug: item.slug || `video-${item.youtube_video_id}`,
      },
      update: {
        title: item.title,
        excerpt: item.excerpt,
        content_json: item.content_json,
        youtube_video_id: item.youtube_video_id,
        cover_image_url: item.cover_image_url,
        cover_image_alt: item.cover_image_alt,
        status: item.status,
        published_at: item.published_at,
        updated_by_auth_user_id: ADMIN_ID,
      },
      create: {
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
  console.log(`Done! Total news items in DB: ${total}`);
}

seed()
  .catch((e) => {
    console.error('Error seeding news:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
