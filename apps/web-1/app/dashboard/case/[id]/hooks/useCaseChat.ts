import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { appendMessageAsc } from "@/lib/case-message-utils";
import { CaseMessage, CaseMessagesPage } from "@/types";

const MESSAGE_PAGE_SIZE = 50;

export function useCaseChat(caseId: string) {
  const queryClient = useQueryClient();

  const messagesQuery = useInfiniteQuery<
    CaseMessagesPage,
    Error,
    InfiniteData<CaseMessagesPage>,
    string[],
    string | undefined
  >({
    queryKey: ["case-messages", caseId],
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get<CaseMessagesPage>(`/cases/${caseId}/messages`, {
        params: { limit: MESSAGE_PAGE_SIZE, cursor: pageParam }, // axios bỏ qua cursor khi undefined
      });
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: () => undefined, // forward pagination không dùng — bắt buộc khai báo trong v5
    getPreviousPageParam: (firstPage) => firstPage.next_cursor ?? undefined,
    enabled: !!caseId,
    refetchInterval: 60_000, // giữ nguyên fallback 60s — refetch chỉ các page đã load (thường 1 page)
  });

  // TanStack v5 prepend page cũ vào ĐẦU mảng pages khi fetchPreviousPage
  // → pages = [cũ nhất ... mới nhất]; mỗi page đã asc → flatten theo thứ tự pages là cũ → mới.
  const messages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    const flat: CaseMessage[] = [];
    for (const page of pages) flat.push(...page.messages);
    return flat;
  }, [messagesQuery.data]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post<CaseMessage>(`/cases/${caseId}/messages`, { content });
      return response.data;
    },
    // Thay invalidateQueries bằng optimistic append: POST trả về message đầy đủ
    // (createCaseMessage include sender). WS cũng push cùng message → dedupe theo id chặn trùng.
    onSuccess: (newMessage) => {
      queryClient.setQueryData<InfiniteData<CaseMessagesPage>>(
        ["case-messages", caseId],
        (old) => {
          if (!old?.pages?.length) return old;
          // Page cuối cùng = trang mới nhất (pages = cũ → mới). Gắn tin mới vào đây.
          const lastIndex = old.pages.length - 1;
          const last = old.pages[lastIndex];
          if (last.messages.some((m) => m.id === newMessage.id)) return old;
          return {
            ...old,
            pages: [
              ...old.pages.slice(0, lastIndex),
              { ...last, messages: appendMessageAsc(last.messages, newMessage) },
            ],
          };
        },
      );
    },
  });

  return {
    messages,
    hasPreviousPage: messagesQuery.hasPreviousPage,
    isFetchingPreviousPage: messagesQuery.isFetchingPreviousPage,
    fetchPreviousPage: messagesQuery.fetchPreviousPage,
    isLoading: messagesQuery.isLoading,
    isFetching: messagesQuery.isFetching,
    error: messagesQuery.error,
    refetch: messagesQuery.refetch,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error,
    resetSendError: sendMessageMutation.reset,
  };
}
