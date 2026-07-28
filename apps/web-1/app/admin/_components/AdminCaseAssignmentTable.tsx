"use client";

import React, { useState, useEffect, useMemo } from "react";
import { User, statusThemeMap } from "@/types";
import { CheckCircle, Search, MoreVertical, Trash2, Eye, Shield } from "lucide-react";
import { Button, Select, Badge, Table, Pagination, TextInput, Group, Menu, ActionIcon, Tooltip } from "@mantine/core";

// Import extracted modals
import AdminCaseDetailModal from "./AdminCaseDetailModal";
import AssignSupporterModal from "./AssignSupporterModal";
import RejectCaseModal from "./RejectCaseModal";
import RequestMoreInfoModal from "./RequestMoreInfoModal";
import ApproveCaseModal from "./ApproveCaseModal";

interface AdminCaseAssignmentTableProps {
  cases: any[];
  supporters: User[];
  onAssign: (caseId: string, supporterId: string) => Promise<void>;
  isAssigning?: boolean;
  onAccept: (caseId: string) => Promise<void>;
  onReject: (caseId: string, reason: string) => Promise<void>;
  onRequestMoreInfo: (caseId: string, query: string) => Promise<void>;
  isCrudMode?: boolean;
  onDelete?: (caseId: string) => Promise<void>;
}

function getSlaRowClass(deadline: string | null | undefined): string {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "bg-danger-soft/30"; // overdue - red tint
  if (diff < 12 * 60 * 60 * 1000) return "bg-warning-soft/30"; // <12h - yellow tint
  if (diff < 24 * 60 * 60 * 1000) return "bg-warning-soft/15"; // <24h - subtle yellow
  return ""; // OK - no tint
}

export default function AdminCaseAssignmentTable({
  cases,
  supporters,
  onAssign,
  onAccept,
  onReject,
  onRequestMoreInfo,
  isCrudMode = false,
  onDelete,
}: AdminCaseAssignmentTableProps) {
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 5;

  // Modal control states (store the ID of the active case for the modal)
  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);
  const [assignCaseId, setAssignCaseId] = useState<string | null>(null);
  const [rejectingCaseId, setRejectingCaseId] = useState<string | null>(null);
  const [infoRequestCaseId, setInfoRequestCaseId] = useState<string | null>(null);
  const [acceptingCaseId, setAcceptingCaseId] = useState<string | null>(null);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("all");
  const [sortBy, setSortBy] = useState("created_at_desc");

  // Extract unique packages dynamically
  const uniquePackages = useMemo(() => {
    const pkgs = new Set<string>();
    cases.forEach((c) => {
      if (c.package_name) pkgs.add(c.package_name);
    });
    return Array.from(pkgs);
  }, [cases]);

  // Filter and sort cases
  const filteredAndSortedCases = useMemo(() => {
    let result = [...cases];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.case_code?.toLowerCase().includes(query) ||
          c.team_name?.toLowerCase().includes(query) ||
          c.owner_name?.toLowerCase().includes(query)
      );
    }

    if (selectedPackage && selectedPackage !== "all") {
      result = result.filter((c) => c.package_name === selectedPackage);
    }

    result.sort((a, b) => {
      if (sortBy === "created_at_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "created_at_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "case_code_asc") {
        return (a.case_code || "").localeCompare(b.case_code || "");
      }
      if (sortBy === "case_code_desc") {
        return (b.case_code || "").localeCompare(a.case_code || "");
      }
      return 0;
    });

    return result;
  }, [cases, searchQuery, selectedPackage, sortBy]);

  // Reset page when filtering or cases change
  useEffect(() => {
    setActivePage(1);
  }, [cases.length, searchQuery, selectedPackage, sortBy]);

  if (cases.length === 0) {
    return (
      <div className="p-8 border border-border-app rounded-lg bg-surface-app text-center flex flex-col items-center justify-center gap-3 font-body text-xs text-text-app">
        <div className="w-10 h-10 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-success" />
        </div>
        <div className="space-y-0.5">
          <p className="font-heading font-semibold text-xs text-text-app">Không có hồ sơ nào cần xử lý</p>
          <p className="font-body text-base text-text-muted">
            Tất cả các hồ sơ đã được xử lý xong hoặc không tìm thấy hồ sơ phù hợp.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredAndSortedCases.length / itemsPerPage);
  const paginatedCases = filteredAndSortedCases.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  return (
    <div className="space-y-4 font-body text-xs text-text-app">
      {/* Search and Filters */}
      <Group gap="sm" mb="md" style={{ width: "100%" }}>
        <TextInput
          placeholder="Tìm theo mã hồ sơ, tên nhóm, chủ sở hữu..."
          leftSection={<Search className="w-4 h-4 text-text-muted" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          style={{ flexGrow: 1 }}
        />
        <Select
          placeholder="Gói dịch vụ"
          data={[{ value: "all", label: "Tất cả các gói" }, ...uniquePackages.map(p => ({ value: p, label: p }))]}
          value={selectedPackage}
          onChange={(val) => setSelectedPackage(val || "all")}
          radius="md"
          style={{ width: 160 }}
        />
        <Select
          placeholder="Sắp xếp"
          data={[
            { value: "created_at_desc", label: "Mới nhất" },
            { value: "created_at_asc", label: "Cũ nhất" },
            { value: "case_code_asc", label: "Mã hồ sơ (A-Z)" },
            { value: "case_code_desc", label: "Mã hồ sơ (Z-A)" },
          ]}
          value={sortBy}
          onChange={(val) => setSortBy(val || "created_at_desc")}
          radius="md"
          style={{ width: 180 }}
        />
      </Group>

      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead className="bg-brand-soft">
            <Table.Tr>
              <Table.Th className="text-left">Mã hồ sơ</Table.Th>
              <Table.Th className="text-left">Nhóm / Đề tài</Table.Th>
              <Table.Th className="text-left">Gói dịch vụ</Table.Th>
              <Table.Th className="text-left">Trạng thái</Table.Th>
              <Table.Th className="text-center w-20">SLA</Table.Th>
              <Table.Th className="text-center w-24">Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredAndSortedCases.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center py-8 text-text-muted">
                  Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedCases.map((item) => {
                return (
                  <Table.Tr key={item.id} className={`${getSlaRowClass(item.sla_deadline_at)} hover:bg-surface-soft/30 transition-colors`}>
                    <Table.Td className="font-heading font-semibold text-xs" title={item.case_code}>
                      {item.case_code && item.case_code.length > 30 ? `${item.case_code.slice(0, 30)}...` : item.case_code}
                    </Table.Td>
                    <Table.Td>
                      <div className="font-semibold text-text-app" title={item.team_name || "Chưa đặt tên"}>
                        {item.team_name && item.team_name.length > 30 ? `${item.team_name.slice(0, 30)}...` : (item.team_name || "Chưa đặt tên")}
                      </div>
                      <div className="text-base text-text-muted" title={item.owner_name}>
                        Chủ sở hữu: {item.owner_name && item.owner_name.length > 30 ? `${item.owner_name.slice(0, 30)}...` : item.owner_name}
                      </div>
                    </Table.Td>
                    <Table.Td className="text-text-muted" title={item.package_name}>
                      {item.package_name && item.package_name.length > 30 ? `${item.package_name.slice(0, 30)}...` : item.package_name}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          statusThemeMap[item.internal_status]?.color === "default" ? "gray"
                          : statusThemeMap[item.internal_status]?.color === "primary" ? "brand"
                          : statusThemeMap[item.internal_status]?.color === "warning" ? "yellow"
                          : statusThemeMap[item.internal_status]?.color === "danger" ? "red"
                          : statusThemeMap[item.internal_status]?.color === "success" ? "teal"
                          : "gray"
                        }
                        variant="light"
                        size="md"
                      >
                        {statusThemeMap[item.internal_status]?.label || item.internal_status}
                      </Badge>
                    </Table.Td>
                    <Table.Td className="text-center">
                      <SlaTimer deadline={item.sla_deadline_at} />
                    </Table.Td>
                    <Table.Td className="text-center">
                      {isCrudMode ? (
                        <Menu shadow="md" width={160} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" className="cursor-pointer mx-auto">
                              <MoreVertical className="w-4 h-4" />
                            </ActionIcon>
                          </Menu.Target>

                          <Menu.Dropdown className="bg-surface-app border border-border-app p-1 rounded-lg">
                            <Menu.Item
                              leftSection={<Eye className="w-3.5 h-3.5 text-brand" />}
                              onClick={() => setDetailCaseId(item.id)}
                              className="text-text-app hover:bg-surface-soft cursor-pointer text-xs font-semibold"
                            >
                              Xem chi tiết
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                              onClick={() => onDelete && onDelete(item.id)}
                              className="text-danger hover:bg-danger-soft cursor-pointer text-xs font-semibold"
                            >
                              Xoá hồ sơ
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      ) : (
                        <Button
                          variant="subtle"
                          size="xs"
                          color="brand"
                          onClick={() => setDetailCaseId(item.id)}
                          className="font-semibold cursor-pointer mx-auto"
                        >
                          Xem chi tiết
                        </Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })
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
            size="sm"
            color="brand"
            radius="md"
          />
        </div>
      )}

      {/* ── Render Extracted Modals ── */}
      <AdminCaseDetailModal
        caseId={detailCaseId}
        onClose={() => setDetailCaseId(null)}
        onReject={(id) => { setRejectingCaseId(id); setDetailCaseId(null); }}
        onRequestMoreInfo={(id) => { setInfoRequestCaseId(id); setDetailCaseId(null); }}
        onApprove={(id) => { setAcceptingCaseId(id); setDetailCaseId(null); }}
        onAssign={(id) => { setAssignCaseId(id); setDetailCaseId(null); }}
      />

      <AssignSupporterModal
        caseId={assignCaseId}
        onClose={() => setAssignCaseId(null)}
        supporters={supporters}
        onAssign={onAssign}
      />

      <RejectCaseModal
        caseId={rejectingCaseId}
        onClose={() => setRejectingCaseId(null)}
        onReject={onReject}
      />

      <RequestMoreInfoModal
        caseId={infoRequestCaseId}
        onClose={() => setInfoRequestCaseId(null)}
        onRequestMoreInfo={onRequestMoreInfo}
      />

      <ApproveCaseModal
        caseId={acceptingCaseId}
        onClose={() => setAcceptingCaseId(null)}
        onApprove={onAccept}
      />
    </div>
  );
}

/* ── SLA Countdown Timer ── */
function SlaTimer({ deadline }: { deadline: string | null | undefined }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [colorClass, setColorClass] = useState("");

  useEffect(() => {
    if (!deadline) {
      setTimeLeft("—");
      setColorClass("text-text-muted");
      return;
    }
    const target = new Date(deadline).getTime();
    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft("Quá hạn");
        setColorClass("text-danger font-semibold");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days} ngày`);
        setColorClass("text-green");
      } else if (hours < 4) {
        setTimeLeft(`${hours}h ${minutes}m`);
        setColorClass("text-danger font-semibold");
      } else if (hours < 12) {
        setTimeLeft(`${hours}h ${minutes}m`);
        setColorClass("text-warning font-semibold");
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
        setColorClass("text-green");
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return <span className={colorClass}>{timeLeft}</span>;

  return (
    <Tooltip label={new Date(deadline).toLocaleString("vi-VN")} withArrow position="top">
      <span className={colorClass}>{timeLeft}</span>
    </Tooltip>
  );
}
