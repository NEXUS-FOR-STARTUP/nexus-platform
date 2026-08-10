import React, { useState, useEffect, useMemo } from "react";
import { Payment } from "@/types";
import { Check, X, FileText, Image as ImageIcon, ExternalLink, AlertCircle, MoreVertical, Search } from "lucide-react";
import { Table, ActionIcon, Menu, Pagination, Badge, TextInput, Select, Group } from "@mantine/core";
import { formatPrice } from "@/lib/pricing";

interface AdminPaymentVerificationTableProps {
  payments: Payment[];
  onApprove: (paymentId: string) => void;
  onReject: (paymentId: string) => void;
}

export default function AdminPaymentVerificationTable({
  payments,
  onApprove,
  onReject,
}: AdminPaymentVerificationTableProps) {
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 5;

  // Search, filter, and sort state
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

  // Filter and sort payments
  const filteredAndSortedPayments = useMemo(() => {
    let result = [...payments];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.case?.case_code?.toLowerCase().includes(query) ||
          p.package?.name?.toLowerCase().includes(query)
      );
    }

    if (selectedStatus && selectedStatus !== "all") {
      result = result.filter((p) => p.status === selectedStatus);
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
  }, [payments, searchQuery, selectedStatus, sortBy]);

  // Reset page when filtering or payments change
  useEffect(() => {
    setActivePage(1);
  }, [payments.length, searchQuery, selectedStatus, sortBy]);

  if (payments.length === 0) {
    return (
      <div className="p-8 border border-border-app rounded-lg bg-surface-app text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
          <Check className="w-5 h-5 text-success" />
        </div>
        <div className="space-y-0.5">
          <p className="font-heading font-semibold text-base text-text-app">Không có giao dịch nào</p>
          <p className="font-body text-base text-text-muted">
            Danh sách trống hoặc chưa có dữ liệu giao dịch phù hợp.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredAndSortedPayments.length / itemsPerPage);
  const paginatedPayments = filteredAndSortedPayments.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Group gap="sm" mb="md" style={{ width: "100%" }}>
        <TextInput
          placeholder="Tìm theo mã hồ sơ, tên gói..."
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
            { value: "pending_verification", label: "Chờ xác minh" },
            { value: "paid", label: "Đã duyệt" },
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

      <Table.ScrollContainer minWidth={1050}>
        <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm" horizontalSpacing="xs">
          <Table.Thead className="bg-brand-soft">
            <Table.Tr>
              <Table.Th className="text-left whitespace-nowrap min-w-[100px]">Mã hồ sơ</Table.Th>
              <Table.Th className="text-left whitespace-nowrap min-w-[100px]">Gói dịch vụ</Table.Th>
              <Table.Th className="text-left whitespace-nowrap min-w-[90px]">Người nộp</Table.Th>
              <Table.Th className="text-left whitespace-nowrap min-w-[90px]">Số tiền</Table.Th>
              <Table.Th className="text-left whitespace-nowrap min-w-[150px]">Nội dung chuyển khoản</Table.Th>
              <Table.Th className="text-left whitespace-nowrap min-w-[120px]">Mã GD ngân hàng</Table.Th>
              <Table.Th className="text-left whitespace-nowrap min-w-[110px]">Thời gian gửi</Table.Th>
              <Table.Th className="text-left whitespace-nowrap min-w-[120px]">Biên lai giao dịch</Table.Th>
              <Table.Th className="text-center whitespace-nowrap min-w-[130px]" style={{ textAlign: "center" }}>Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredAndSortedPayments.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={9} className="text-center py-8 text-text-muted font-body text-sm">
                  Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedPayments.map((payment) => (
                <Table.Tr key={payment.id} className="hover:bg-surface-soft/30 transition-colors">
                  <Table.Td className="font-heading font-semibold text-xs whitespace-nowrap" title={payment.case?.case_code || "CASE"}>
                    {payment.case?.case_code && payment.case.case_code.length > 30 ? `${payment.case.case_code.slice(0, 30)}...` : (payment.case?.case_code || "CASE")}
                  </Table.Td>
                  <Table.Td className="font-semibold text-text-muted whitespace-nowrap" title={payment.package?.name || "Gói dịch vụ"}>
                    {payment.package?.name && payment.package.name.length > 30 ? `${payment.package.name.slice(0, 30)}...` : (payment.package?.name || "Gói dịch vụ")}
                  </Table.Td>
                  <Table.Td className="text-text-subtle whitespace-nowrap">
                    {payment.payer?.display_username || payment.payer?.name || "—"}
                  </Table.Td>
                  <Table.Td className="font-heading font-semibold text-red-600 text-xs whitespace-nowrap">
                    {formatPrice(payment.amount)}
                  </Table.Td>
                  <Table.Td className="text-text-subtle font-mono text-xs">
                    {payment.transfer_content || "—"}
                  </Table.Td>
                  <Table.Td className="text-text-subtle font-mono text-xs">
                    {payment.bank_transaction_id || "—"}
                  </Table.Td>
                  <Table.Td className="text-text-subtle">
                    {formatDate(payment.created_at)}
                  </Table.Td>
                  <Table.Td>
                    {payment.proof_file_url ? (
                      <a
                        href={payment.proof_file_url.startsWith("http")
                          ? payment.proof_file_url
                          : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${payment.proof_file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand hover:underline font-semibold"
                      >
                        {isPdf(payment.proof_file_url) ? (
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
                    <div className="flex items-center justify-center w-full">
                      {payment.status === "pending_verification" ? (
                        <Menu shadow="md" width={160} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" className="cursor-pointer">
                              <MoreVertical className="w-4 h-4" />
                            </ActionIcon>
                          </Menu.Target>

                          <Menu.Dropdown className="bg-surface-app border border-border-app p-1 rounded-lg">
                            <Menu.Item
                              leftSection={<Check className="w-3.5 h-3.5 text-success" />}
                              onClick={() => onApprove(payment.id)}
                              className="text-text-app hover:bg-surface-soft cursor-pointer text-xs font-semibold"
                            >
                              Duyệt
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<X className="w-3.5 h-3.5 text-danger" />}
                              onClick={() => onReject(payment.id)}
                              className="text-danger hover:bg-danger-soft cursor-pointer text-xs font-semibold"
                            >
                              Từ chối
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      ) : payment.status === "paid" ? (
                        <Badge color="green" variant="light" size="md" className="font-semibold whitespace-nowrap">
                          Đã duyệt
                        </Badge>
                      ) : (
                        <Badge color="red" variant="light" size="md" className="font-semibold whitespace-nowrap">
                          Bị từ chối
                        </Badge>
                      )}
                    </div>
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
