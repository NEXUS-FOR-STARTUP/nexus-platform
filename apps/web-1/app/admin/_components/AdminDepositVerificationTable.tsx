import React, { useState, useEffect, useMemo } from "react";
import { Check, X, FileText, Image as ImageIcon, ExternalLink, AlertCircle, MoreVertical, Search } from "lucide-react";
import { Table, ActionIcon, Menu, Pagination, Badge, TextInput, Select, Group } from "@mantine/core";
import { formatPrice } from "@/lib/pricing";
import type { Deposit } from "@/types/payment";

interface AdminDepositVerificationTableProps {
  deposits: Deposit[];
  onApprove: (depositId: string) => void;
  onReject: (depositId: string) => void;
}

export default function AdminDepositVerificationTable({
  deposits,
  onApprove,
  onReject,
}: AdminDepositVerificationTableProps) {
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 5;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created_at_desc");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPdf = (url?: string | null) => {
    if (!url) return false;
    return url.toLowerCase().endsWith(".pdf");
  };

  const filteredAndSortedDeposits = useMemo(() => {
    let result = [...deposits];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.transfer_content?.toLowerCase().includes(query) ||
          d.bank_transaction_id?.toLowerCase().includes(query) ||
          d.user?.display_username?.toLowerCase().includes(query) ||
          d.user?.name?.toLowerCase().includes(query)
      );
    }

    if (selectedStatus && selectedStatus !== "all") {
      result = result.filter((d) => d.status === selectedStatus);
    }

    result.sort((a, b) => {
      if (sortBy === "created_at_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "created_at_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "amount_desc") {
        return b.amount - a.amount;
      }
      if (sortBy === "amount_asc") {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [deposits, searchQuery, selectedStatus, sortBy]);

  useEffect(() => {
    setActivePage(1);
  }, [deposits.length, searchQuery, selectedStatus, sortBy]);

  if (deposits.length === 0) {
    return (
      <div className="p-8 border border-border-app rounded-lg bg-surface-app text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
          <Check className="w-5 h-5 text-success" />
        </div>
        <div className="space-y-0.5">
          <p className="font-heading font-semibold text-xs text-text-app">Không có giao dịch nào</p>
          <p className="font-body text-base text-text-muted">
            Danh sách trống hoặc chưa có dữ liệu giao dịch phù hợp.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredAndSortedDeposits.length / itemsPerPage);
  const paginatedDeposits = filteredAndSortedDeposits.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  return (
    <div className="space-y-4">
      <Group gap="sm" mb="md" style={{ width: "100%" }}>
        <TextInput
          placeholder="Tìm theo nội dung chuyển khoản, tên người nạp..."
          leftSection={<Search className="w-4 h-4 text-text-muted" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          style={{ flexGrow: 1 }}
        />
        <Select
          placeholder="Trạng thái"
          data={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "pending", label: "Chờ xác minh" },
            { value: "verified", label: "Đã duyệt" },
            { value: "rejected", label: "Bị từ chối" },
          ]}
          value={selectedStatus}
          onChange={(val) => setSelectedStatus(val || "all")}
          radius="md"
          style={{ width: 160 }}
        />
        <Select
          placeholder="Sắp xếp"
          data={[
            { value: "created_at_desc", label: "Mới nhất" },
            { value: "created_at_asc", label: "Cũ nhất" },
            { value: "amount_desc", label: "Số tiền (Giảm dần)" },
            { value: "amount_asc", label: "Số tiền (Tăng dần)" },
          ]}
          value={sortBy}
          onChange={(val) => setSortBy(val || "created_at_desc")}
          radius="md"
          style={{ width: 160 }}
        />
      </Group>

      <Table.ScrollContainer minWidth={600}>
        <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead className="bg-brand-soft">
            <Table.Tr>
              <Table.Th className="text-left">Người nạp</Table.Th>
              <Table.Th className="text-left">Nội dung chuyển khoản</Table.Th>
              <Table.Th className="text-left">Số tiền</Table.Th>
              <Table.Th className="text-left">Mã GD ngân hàng</Table.Th>
              <Table.Th className="text-left">Thời gian</Table.Th>
              <Table.Th className="text-left">Biên lai</Table.Th>
              <Table.Th className="text-center w-28">Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredAndSortedDeposits.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center py-8 text-text-muted font-body text-xs">
                  Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedDeposits.map((deposit) => (
                <Table.Tr key={deposit.id} className="hover:bg-surface-soft/30 transition-colors">
                  <Table.Td className="text-text-subtle">
                    {deposit.user?.display_username || deposit.user?.name || "—"}
                  </Table.Td>
                  <Table.Td className="text-text-subtle font-mono text-xs">
                    {deposit.transfer_content || "—"}
                  </Table.Td>
                  <Table.Td className="font-heading font-semibold text-red-600 text-xs">
                    {formatPrice(deposit.amount)}
                  </Table.Td>
                  <Table.Td className="text-text-subtle font-mono text-xs">
                    {deposit.bank_transaction_id || "—"}
                  </Table.Td>
                  <Table.Td className="text-text-subtle">
                    {formatDate(deposit.created_at)}
                  </Table.Td>
                  <Table.Td>
                    {deposit.proof_file_url ? (
                      <a
                        href={deposit.proof_file_url.startsWith("http")
                          ? deposit.proof_file_url
                          : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${deposit.proof_file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand hover:underline font-semibold"
                      >
                        {isPdf(deposit.proof_file_url) ? (
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>Xem minh chứng</span>
                        <ExternalLink className="w-3.5 h-3.5 text-text-subtle" />
                      </a>
                    ) : (
                      <span className="text-text-subtle italic flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Không tìm thấy file
                      </span>
                    )}
                  </Table.Td>
                  <Table.Td className="text-center">
                    {deposit.status === "pending" ? (
                      <Menu shadow="md" width={160} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" className="cursor-pointer mx-auto">
                            <MoreVertical className="w-4 h-4" />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown className="bg-surface-app border border-border-app p-1 rounded-lg">
                          <Menu.Item
                            leftSection={<Check className="w-3.5 h-3.5 text-success" />}
                            onClick={() => onApprove(deposit.id)}
                            className="text-text-app hover:bg-surface-soft cursor-pointer text-xs font-semibold"
                          >
                            Duyệt
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<X className="w-3.5 h-3.5 text-danger" />}
                            onClick={() => onReject(deposit.id)}
                            className="text-danger hover:bg-danger-soft cursor-pointer text-xs font-semibold"
                          >
                            Từ chối
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    ) : deposit.status === "verified" ? (
                      <Badge color="green" variant="light" size="md" className="font-semibold">
                        Đã duyệt
                      </Badge>
                    ) : (
                      <Badge color="red" variant="light" size="md" className="font-semibold">
                        Bị từ chối
                      </Badge>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            total={totalPages}
            value={activePage}
            onChange={setActivePage}
            size="md"
            color="brand"
            radius="md"
          />
        </div>
      )}
    </div>
  );
}
