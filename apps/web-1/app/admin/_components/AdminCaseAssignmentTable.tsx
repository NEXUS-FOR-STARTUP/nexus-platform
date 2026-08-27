"use client";

import React, { useState, useEffect } from "react";
import { User, statusThemeMap } from "@/types";
import { CheckCircle, Search, MoreVertical, Trash2, Eye, RefreshCw, UserCheck, X } from "lucide-react";
import { Select, Badge, Table, Pagination, TextInput, Group, Menu, ActionIcon, Tooltip } from "@mantine/core";
import AdminCaseDetailModal from "./AdminCaseDetailModal";
import AssignSupporterModal from "./AssignSupporterModal";
import RejectCaseModal from "./RejectCaseModal";
import ApproveCaseModal from "./ApproveCaseModal";
import { isCasePaymentComplete } from "@/lib/pricing";
import type { AdminCaseListItem } from "../hooks/useAdminCases";

interface AdminCaseAssignmentTableProps {
  cases: AdminCaseListItem[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  supporters: User[];
  onAssign: (caseId: string, supporterId: string) => Promise<void>;
  isAssigning?: boolean;
  onAccept: (caseId: string) => Promise<void>;
  onReject: (caseId: string, reason: string) => Promise<void>;
  isCrudMode?: boolean;
  onDelete?: (caseId: string) => Promise<void>;
  onRefresh?: () => void;
}

function getSlaRowClass(deadline: string | null | undefined): string {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "bg-danger-soft/30";
  if (diff < 12 * 60 * 60 * 1000) return "bg-warning-soft/30";
  if (diff < 24 * 60 * 60 * 1000) return "bg-warning-soft/15";
  return "";
}

export default function AdminCaseAssignmentTable({
  cases,
  total,
  page,
  limit,
  onPageChange,
  search,
  onSearchChange,
  sortValue,
  onSortChange,
  supporters,
  onAssign,
  onAccept,
  onReject,
  isCrudMode = false,
  onDelete,
  onRefresh,
}: AdminCaseAssignmentTableProps) {
  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);
  const [assignCaseId, setAssignCaseId] = useState<string | null>(null);
  const [rejectingCaseId, setRejectingCaseId] = useState<string | null>(null);
  const [acceptingCaseId, setAcceptingCaseId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const activePage = page;

  return (
    <div className="space-y-4 font-body text-xs text-text-app">
      <Group gap="sm" mb="md" style={{ width: "100%" }}>
        <TextInput
          placeholder="Tìm theo mã hồ sơ, tên nhóm, chủ sở hữu..."
          leftSection={<Search className="w-4 h-4 text-text-muted" />}
          value={search}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          radius="md"
          style={{ flexGrow: 1 }}
        />
        <Select
          placeholder="Sắp xếp"
          data={[
            { value: "created_at_desc", label: "Mới nhất" },
            { value: "created_at_asc", label: "Cũ nhất" },
            { value: "case_code_asc", label: "Mã hồ sơ (A-Z)" },
            { value: "case_code_desc", label: "Mã hồ sơ (Z-A)" },
          ]}
          value={sortValue}
          onChange={(val) => onSortChange(val || "created_at_desc")}
          radius="md"
          style={{ width: 180 }}
        />
        {onRefresh && (
          <Tooltip label="Làm mới" position="bottom" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onRefresh}
              className="cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {total === 0 ? (
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
      ) : (
      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead className="bg-brand-soft">
            <Table.Tr>
              <Table.Th className="text-left">Mã hồ sơ</Table.Th>
              <Table.Th className="text-left">Nhóm / Đề tài</Table.Th>
              <Table.Th className="text-left">Gói dịch vụ</Table.Th>
              <Table.Th className="text-left">Trạng thái</Table.Th>
              <Table.Th className="text-left">Người phụ trách</Table.Th>
              <Table.Th className="text-center w-20">SLA</Table.Th>
              <Table.Th className="text-center w-24">Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {cases.map((item) => {
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
                    <Table.Td>
                      {item.assigned_supporter?.name ? (
                        <div className="flex items-center gap-1.5 font-semibold text-text-app">
                          <UserCheck className="w-3.5 h-3.5 text-brand shrink-0" />
                          <span className="truncate" title={item.assigned_supporter.name}>
                            {item.assigned_supporter.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs italic">Chưa phân công</span>
                      )}
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
                        <Menu shadow="md" width={200} position="bottom-end">
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
                            {item.internal_status === "triage_pending" && item.user_facing_stage === "submitted" && (
                              <>
                                <Menu.Item
                                  leftSection={<X className="w-3.5 h-3.5 text-danger" />}
                                  onClick={() => setRejectingCaseId(item.id)}
                                  className="text-danger hover:bg-danger-soft cursor-pointer text-xs font-semibold"
                                >
                                  Từ chối
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<CheckCircle className="w-3.5 h-3.5 text-success" />}
                                  onClick={isCasePaymentComplete(item) ? () => setAcceptingCaseId(item.id) : undefined}
                                  disabled={!isCasePaymentComplete(item)}
                                  title={!isCasePaymentComplete(item) ? "Chưa hoàn tất thanh toán" : undefined}
                                  className="text-text-app hover:bg-surface-soft cursor-pointer text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Duyệt hồ sơ
                                </Menu.Item>
                              </>
                            )}
                            {(item.internal_status === "accepted_unassigned" || item.internal_status === "assigned") && (
                              <Menu.Item
                                leftSection={<UserCheck className="w-3.5 h-3.5 text-brand" />}
                                onClick={() => setAssignCaseId(item.id)}
                                className="text-text-app hover:bg-surface-soft cursor-pointer text-xs font-semibold"
                              >
                                {item.internal_status === "assigned" ? "Phân công lại" : "Phân công Supporter"}
                              </Menu.Item>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      )}

      {totalPages > 1 && total > 0 && (
        <div className="flex justify-center pt-2">
          <Pagination
            total={totalPages}
            value={activePage}
            onChange={onPageChange}
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
        const days = Math.floor(hours / 24)
        setTimeLeft(`${days}d ${hours % 24}h`)
        setColorClass("text-success")
      } else if (hours < 4) {
        setTimeLeft(`${hours}h ${minutes}m`);
        setColorClass("text-danger font-semibold");
      } else if (hours < 12) {
        setTimeLeft(`${hours}h ${minutes}m`);
        setColorClass("text-warning font-semibold");
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
        setColorClass("text-success");
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
