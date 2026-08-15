"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Ban, CheckCircle, UserPlus, Users, MoreVertical } from "lucide-react";
import { Table, Pagination, Badge, TextInput, Select, Group, Button, ActionIcon, Tooltip, Menu } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAdminUsers } from "../hooks/useAdminUsers";
import CreateUserModal from "./CreateUserModal";
import BanUserModal from "./BanUserModal";

const ROLE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "admin", label: "Admin" },
  { value: "supporter", label: "Supporter" },
  { value: "user", label: "Student" },
  { value: "banned", label: "Bị khóa" },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const roleThemeMap: Record<string, string> = {
  admin: "red",
  supporter: "brand",
  user: "gray",
};

const roleLabelMap: Record<string, string> = {
  admin: "Admin",
  supporter: "Supporter",
  user: "Student",
};

export default function AdminUsersTable() {
  const [activePage, setActivePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const itemsPerPage = 10;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [banTarget, setBanTarget] = useState<{ userId: string; userName: string } | null>(null);

  const params = useMemo(() => {
    const p: Record<string, any> = {
      limit: itemsPerPage,
      offset: (activePage - 1) * itemsPerPage,
    };
    if (searchQuery.trim()) {
      p.searchValue = searchQuery.trim();
    }
    if (roleFilter === "banned") {
      p.filterField = "banned";
      p.filterValue = "true";
    } else if (roleFilter !== "all") {
      p.filterField = "role";
      p.filterValue = roleFilter;
    }
    if (sortBy === "created_at_desc") {
      p.sortBy = "createdAt";
      p.sortDirection = "desc";
    } else if (sortBy === "created_at_asc") {
      p.sortBy = "createdAt";
      p.sortDirection = "asc";
    } else if (sortBy === "name_asc") {
      p.sortBy = "name";
      p.sortDirection = "asc";
    } else if (sortBy === "name_desc") {
      p.sortBy = "name";
      p.sortDirection = "desc";
    }
    return p;
  }, [searchQuery, roleFilter, activePage, sortBy]);

  const { users, total, isLoading, createUser, isCreating, banUser, isBanning, unbanUser, isUnbanning } =
    useAdminUsers(params);

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, roleFilter]);

  const handleCreateUser = async (data: { email: string; name: string; role?: string }) => {
    try {
      await createUser(data);
      setShowCreateModal(false);
      notifications.show({
        title: "Tạo tài khoản thành công",
        message: `Đã tạo tài khoản cho ${data.name} và gửi email thông báo.`,
        color: "green",
      });
    } catch (e: any) {
      notifications.show({
        title: "Lỗi",
        message: e?.response?.data?.message || "Không thể tạo tài khoản.",
        color: "red",
      });
      throw e;
    }
  };

  const handleBanUser = async (reason: string) => {
    if (!banTarget) return;
    try {
      await banUser({ userId: banTarget.userId, banReason: reason || undefined });
      setBanTarget(null);
      notifications.show({
        title: "Đã khóa tài khoản",
        message: `Đã khóa tài khoản ${banTarget.userName} và gửi email thông báo.`,
        color: "green",
      });
    } catch (e: any) {
      notifications.show({
        title: "Lỗi",
        message: e?.response?.data?.message || "Không thể khóa tài khoản.",
        color: "red",
      });
      throw e;
    }
  };

  const handleUnbanUser = async (userId: string, userName: string) => {
    try {
      await unbanUser(userId);
      notifications.show({
        title: "Đã mở khóa tài khoản",
        message: `Đã mở khóa tài khoản ${userName} và gửi email thông báo.`,
        color: "green",
      });
    } catch (e: any) {
      notifications.show({
        title: "Lỗi",
        message: e?.response?.data?.message || "Không thể mở khóa tài khoản.",
        color: "red",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 border border-border-app rounded-lg bg-surface-app text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
          <Users className="w-5 h-5 text-text-muted animate-pulse" />
        </div>
        <p className="font-body text-base text-text-muted">Đang tải danh sách người dùng...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="space-y-4">
        <Group gap="sm" style={{ width: "100%" }}>
          <TextInput
            placeholder="Tìm theo tên người dùng..."
            leftSection={<Search className="w-4 h-4 text-text-muted" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            radius="md"
            style={{ flexGrow: 1 }}
          />
          <Select
            placeholder="Vai trò"
            data={ROLE_FILTER_OPTIONS}
            value={roleFilter}
            onChange={(val) => setRoleFilter(val || "all")}
            radius="md"
            style={{ width: 150 }}
          />
          <Button
            leftSection={<UserPlus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
            color="brand"
            radius="md"
            className="font-body font-semibold text-xs cursor-pointer"
          >
            Tạo người dùng mới
          </Button>
        </Group>
        <div className="p-8 border border-border-app rounded-lg bg-surface-app text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
            <Users className="w-5 h-5 text-success" />
          </div>
          <div className="space-y-0.5">
            <p className="font-heading font-semibold text-xs text-text-app">Không có người dùng nào</p>
            <p className="font-body text-base text-text-muted">
              Danh sách trống hoặc chưa có dữ liệu phù hợp.
            </p>
          </div>
        </div>
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onConfirm={handleCreateUser}
          isSubmitting={isCreating}
        />
        <BanUserModal
          isOpen={banTarget !== null}
          userName={banTarget?.userName || ""}
          onClose={() => setBanTarget(null)}
          onConfirm={handleBanUser}
          isSubmitting={isBanning}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 font-body text-xs text-text-app">
      <Group gap="sm" style={{ width: "100%" }}>
        <TextInput
          placeholder="Tìm theo tên người dùng..."
          leftSection={<Search className="w-4 h-4 text-text-muted" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          style={{ flexGrow: 1 }}
        />
        <Select
          placeholder="Sắp xếp"
          data={[
            { value: "created_at_desc", label: "Mới nhất" },
            { value: "created_at_asc", label: "Cũ nhất" },
            { value: "name_asc", label: "Tên A → Z" },
            { value: "name_desc", label: "Tên Z → A" },
          ]}
          value={sortBy}
          onChange={(val) => setSortBy(val || "created_at_desc")}
          radius="md"
          style={{ width: 160 }}
        />
        <Select
          placeholder="Vai trò"
          data={ROLE_FILTER_OPTIONS}
          value={roleFilter}
          onChange={(val) => setRoleFilter(val || "all")}
          radius="md"
          style={{ width: 150 }}
        />
        <Button
          leftSection={<UserPlus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
          color="brand"
          radius="md"
          className="font-body font-semibold text-xs cursor-pointer"
        >
          Tạo người dùng mới
        </Button>
      </Group>

      <Table.ScrollContainer minWidth={700}>
        <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead className="bg-brand-soft">
            <Table.Tr>
              <Table.Th className="text-left">Họ tên</Table.Th>
              <Table.Th className="text-left">Email</Table.Th>
              <Table.Th className="text-left">Vai trò</Table.Th>
              <Table.Th className="text-left">Trạng thái</Table.Th>
              <Table.Th className="text-left">Ngày tạo</Table.Th>
              <Table.Th className="text-center w-24">Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users
              .filter((user: any) => user.role?.toLowerCase() !== "system" && user.email !== "system@nexus.internal")
              .map((user: any) => (
              <Table.Tr
                key={user.id}
                className={`hover:bg-surface-soft/30 transition-colors ${user.banned ? "bg-red-50/30 dark:bg-red-950/20" : ""}`}
              >
                <Table.Td className="font-heading font-semibold">{user.name}</Table.Td>
                <Table.Td className="text-text-subtle">{user.email}</Table.Td>
                <Table.Td>
                  <Badge color={roleThemeMap[user.role] || "gray"} variant="light" size="sm">
                    {roleLabelMap[user.role] || user.role}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {user.banned ? (
                    <Tooltip label={user.banReason || "Không có lý do"} withArrow>
                      <Badge color="red" variant="light" size="sm">
                        Bị khóa
                      </Badge>
                    </Tooltip>
                  ) : (
                    <Badge color="green" variant="light" size="sm">
                      Hoạt động
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td className="text-text-subtle">{formatDate(user.created_at || user.createdAt)}</Table.Td>
                <Table.Td className="text-center">
                  <Menu shadow="md" width={180} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" className="cursor-pointer mx-auto">
                        <MoreVertical className="w-4 h-4" />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown className="bg-surface-app border border-border-app p-1 rounded-lg">
                      {user.banned ? (
                        <Menu.Item
                          leftSection={<CheckCircle className="w-3.5 h-3.5 text-success" />}
                          onClick={() => handleUnbanUser(user.id, user.name)}
                          disabled={isUnbanning}
                          className="text-text-app hover:bg-surface-soft cursor-pointer text-xs font-semibold"
                        >
                          Mở khóa tài khoản
                        </Menu.Item>
                      ) : (
                        <Menu.Item
                          leftSection={<Ban className="w-3.5 h-3.5 text-danger" />}
                          onClick={() => setBanTarget({ userId: user.id, userName: user.name })}
                          className="text-danger hover:bg-danger-soft cursor-pointer text-xs font-semibold"
                        >
                          Khóa tài khoản
                        </Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination total={totalPages} value={activePage} onChange={setActivePage} size="sm" />
        </div>
      )}

      <p className="text-text-muted text-center">
        Hiển thị {users.length} / {total} người dùng
      </p>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateUser}
        isSubmitting={isCreating}
      />

      <BanUserModal
        isOpen={banTarget !== null}
        userName={banTarget?.userName || ""}
        onClose={() => setBanTarget(null)}
        onConfirm={handleBanUser}
        isSubmitting={isBanning}
      />
    </div>
  );
}
