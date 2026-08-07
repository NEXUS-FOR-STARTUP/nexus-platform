export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ListNotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}
