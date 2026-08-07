export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}
