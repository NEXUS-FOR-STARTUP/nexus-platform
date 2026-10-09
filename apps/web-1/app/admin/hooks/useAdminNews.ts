import { isAxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  AdminNewsListQuery,
  NewsItemAdmin,
  CreateNewsItemInput,
  UpdateNewsItemInput,
} from '@repo/validation';

export interface AdminNewsListResult {
  items: NewsItemAdmin[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export function useAdminNewsList(params: AdminNewsListQuery) {
  return useQuery({
    queryKey: ['admin-news-list', params],
    queryFn: async () => {
      const res = await apiClient.get<AdminNewsListResult>('/admin/news', { params });
      return res.data;
    },
    refetchInterval: 30_000,
  });
}

export function useAdminNewsDetail(id: string) {
  return useQuery({
    queryKey: ['admin-news-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('ID là bắt buộc');
      const res = await apiClient.get<NewsItemAdmin>(`/admin/news/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateNewsItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateNewsItemInput) => {
      const res = await apiClient.post<NewsItemAdmin>('/admin/news', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-news-list'] });
    },
  });
}

export function useUpdateNewsItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNewsItemInput }) => {
      const res = await apiClient.put<NewsItemAdmin>(`/admin/news/${id}`, data);
      return res.data;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin-news-list'] });
      qc.invalidateQueries({ queryKey: ['admin-news-detail', updated.id] });
    },
  });
}

export function usePublishNewsItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, expected_updated_at }: { id: string; expected_updated_at: string }) => {
      const res = await apiClient.post<NewsItemAdmin>(`/admin/news/${id}/publish`, {
        expected_updated_at,
      });
      return res.data;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin-news-list'] });
      qc.invalidateQueries({ queryKey: ['admin-news-detail', updated.id] });
    },
  });
}

export function useUnpublishNewsItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, expected_updated_at }: { id: string; expected_updated_at: string }) => {
      const res = await apiClient.post<NewsItemAdmin>(`/admin/news/${id}/unpublish`, {
        expected_updated_at,
      });
      return res.data;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin-news-list'] });
      qc.invalidateQueries({ queryKey: ['admin-news-detail', updated.id] });
    },
  });
}

export function useDeleteNewsItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, expected_updated_at }: { id: string; expected_updated_at: string }) => {
      const res = await apiClient.delete(`/admin/news/${id}`, {
        params: { expected_updated_at },
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-news-list'] });
    },
  });
}

export function useUploadNewsCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      file,
      expected_updated_at,
    }: {
      id: string;
      file: File;
      expected_updated_at: string;
    }) => {
      const formData = new FormData();
      formData.append('cover', file);
      formData.append('expected_updated_at', expected_updated_at);
      const res = await apiClient.post<NewsItemAdmin>(`/admin/news/${id}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin-news-list'] });
      qc.invalidateQueries({ queryKey: ['admin-news-detail', updated.id] });
    },
  });
}

export function useUploadNewsContentImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await apiClient.post<{ url: string }>('/admin/news/images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.url;
      } catch (error) {
        const apiMessage = isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message
          : undefined;
        throw new Error(apiMessage ?? 'Không thể tải ảnh lên. Vui lòng thử lại.', { cause: error });
      }
    },
  });
}
