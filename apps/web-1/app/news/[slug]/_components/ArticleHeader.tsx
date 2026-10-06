import { Badge, Avatar } from '@mantine/core';
import { ArticleShareButton } from './ArticleShareButton';

interface ArticleHeaderProps {
  title: string;
  excerpt?: string | null;
  authorName: string;
  authorInitials: string;
  authorAvatarUrl?: string | null;
  publishedDate: string;
}

export function ArticleHeader({
  title,
  excerpt,
  authorName,
  authorInitials,
  authorAvatarUrl,
  publishedDate,
}: ArticleHeaderProps) {
  return (
    <header className="mb-10">
      <Badge
        color="blue"
        variant="light"
        size="lg"
        radius="sm"
        className="font-bold tracking-wider uppercase mb-5 px-3.5 py-1.5 !text-xs sm:!text-sm bg-blue-50 text-[#288ad6] !border-0"
      >
        Khởi nghiệp & Công nghệ
      </Badge>

      <h1 className="text-2xl sm:text-3xl md:text-[34px] font-black text-text-app tracking-tight leading-snug mb-4 sm:mb-5">
        {title}
      </h1>

      {/* Excerpt / Tóm tắt: nằm ngay dưới tiêu đề, tô mờ, font nhỏ lại, giữ italic */}
      {excerpt && (
        <p className="font-serif italic text-base sm:text-[17px] leading-[1.75] text-text-muted mb-7 sm:mb-8">
          {excerpt}
        </p>
      )}

      {/* Byline row: Avatar + Author + Date + Share Action (No borders, no icons, no read time, no bullets) */}
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <div className="flex items-center gap-3">
          <Avatar
            src={authorAvatarUrl}
            color="blue"
            radius="xl"
            size="md"
            className="font-semibold text-xs border border-border-app"
          >
            {authorInitials}
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-app hover:text-[#288ad6] transition-colors">
              {authorName}
            </span>
            <span className="text-xs text-text-muted">{publishedDate}</span>
          </div>
        </div>

        <ArticleShareButton title={title} />
      </div>
    </header>
  );
}
