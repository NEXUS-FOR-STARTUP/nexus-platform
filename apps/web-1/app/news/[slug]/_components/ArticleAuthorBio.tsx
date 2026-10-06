import { Avatar } from '@mantine/core';

interface ArticleAuthorBioProps {
  authorName: string;
  authorInitials: string;
  authorAvatarUrl?: string | null;
}

export function ArticleAuthorBio({
  authorName,
  authorInitials,
  authorAvatarUrl,
}: ArticleAuthorBioProps) {
  return (
    <div className="mt-8 p-6 rounded-lg bg-surface-app border border-border-app flex items-start gap-4">
      <Avatar
        src={authorAvatarUrl}
        color="blue"
        radius="xl"
        size="lg"
        className="font-semibold text-base border border-border-app shrink-0"
      >
        {authorInitials}
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-text-app text-base">{authorName}</h4>
          <span className="text-xs text-brand font-medium bg-brand/10 px-2 py-0.5 rounded">
            Tác giả
          </span>
        </div>
        <p className="text-sm text-text-muted leading-relaxed font-serif">
          Ban biên tập nội dung & cố vấn chuyên môn tại Nexus Platform. Đồng hành cùng các nhà sáng lập trẻ trên hành trình biến ý tưởng thành hiện thực.
        </p>
      </div>
    </div>
  );
}
