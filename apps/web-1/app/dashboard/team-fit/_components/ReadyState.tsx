import { Sparkles } from 'lucide-react';

interface ReadyStateProps {
  onEvaluate?: () => void;
  isLoading?: boolean;
}

export default function ReadyState({ onEvaluate, isLoading }: ReadyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-1">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-text-app">
        Sẵn sàng kiểm tra sơ bộ
      </h3>
      <p className="text-sm text-text-muted leading-relaxed">
        Nexus sẽ kiểm tra sơ bộ thông tin về ý tưởng và đội ngũ để chỉ ra những điểm còn chưa rõ hoặc năng lực nhóm có thể đang thiếu.
      </p>
      {onEvaluate && (
        <button
          type="button"
          onClick={onEvaluate}
          disabled={isLoading}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white font-semibold text-sm rounded-xl hover:bg-brand/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          Bắt đầu kiểm tra nhanh
        </button>
      )}
    </div>
  );
}
