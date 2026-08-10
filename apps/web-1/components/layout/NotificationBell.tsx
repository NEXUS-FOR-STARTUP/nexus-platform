"use client";

import { useRouter } from "next/navigation";
import { ActionIcon, Badge, Menu, ScrollArea, Text } from "@mantine/core";
import { Bell } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useNotifications } from "@/lib/hooks/useNotifications";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export default function NotificationBell() {
  const router = useRouter();
  const { listQuery, unreadQuery, markRead, markAllRead } = useNotifications();

  const unreadCount = unreadQuery.data ?? 0;
  const items = listQuery.data ?? [];

  const handleItemClick = async (id: string, link: string | null) => {
    await markRead.mutateAsync(id);
    if (link) router.push(link);
  };

  return (
    <Menu shadow="md" width={360} position="bottom-end" closeOnItemClick={false}>
      <Menu.Target>
        <div className="relative cursor-pointer">
          <ActionIcon
            variant="subtle"
            radius="xl"
            size="lg"
            aria-label="Thông báo"
            className="hover:bg-surface-soft"
          >
            <Bell className="w-5 h-5" />
          </ActionIcon>
          {unreadCount > 0 && (
            <Badge
              size="xs"
              color="red"
              circle
              style={{ position: "absolute", top: 0, right: 0 }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
      </Menu.Target>

      <Menu.Dropdown className="bg-surface-app border border-border-app rounded-lg p-1">
        <div className="px-3 py-2 border-b border-border-app mb-1">
          <Text className="font-semibold font-body text-base text-text-app">Thông báo</Text>
        </div>

        {items.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Text className="font-body text-base text-text-muted">Không có thông báo</Text>
          </div>
        ) : (
          <ScrollArea h={320}>
            {items.map((n) => (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => handleItemClick(n.id, n.link)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleItemClick(n.id, n.link);
                  }
                }}
                className={`px-3 py-2.5 cursor-pointer border-b border-border-app last:border-b-0 transition-colors ${
                  n.read_at ? "" : "bg-brand-soft/30"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read_at && (
                    <span className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <Text className="font-semibold font-body text-base text-text-app truncate">
                      {n.title}
                    </Text>
                    {n.body && (
                      <Text
                        className="font-body text-sm text-text-muted mt-0.5"
                        lineClamp={2}
                      >
                        {n.body}
                      </Text>
                    )}
                    <Text className="font-body text-xs text-text-muted/70 mt-1">
                      {dayjs(n.created_at).fromNow()}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
        <div className="px-3 pt-1 pb-1.5">
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={unreadCount === 0}
            className="text-base font-body text-text-muted hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </Menu.Dropdown>
    </Menu>
  );
}
