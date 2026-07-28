import { Lightbulb } from 'lucide-react';

export default function ReadyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <Lightbulb className="h-8 w-8 text-muted" />
      <p className="text-sm text-muted">
        Nhấn &quot;Đánh giá&quot; để AI phân tích đội ngũ của bạn
      </p>
    </div>
  );
}
