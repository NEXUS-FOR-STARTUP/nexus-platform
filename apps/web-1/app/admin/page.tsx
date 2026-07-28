"use client";

import React, { useState } from "react";
import { useAdminPayments } from "./hooks/useAdminPayments";
import { useAdminCases } from "./hooks/useAdminCases";
import { useAdminDocuments } from "./hooks/useAdminDocuments";
import { useAdminPackages } from "./hooks/useAdminPackages";
import AdminPaymentVerificationTable from "./_components/AdminPaymentVerificationTable";
import AdminCaseAssignmentTable from "./_components/AdminCaseAssignmentTable";
import AdminDocumentsTable from "./_components/AdminDocumentsTable";
import AdminPackagesSettings from "./_components/AdminPackagesSettings";
import StatsDashboard from "./_components/StatsDashboard";
import RejectionReasonModal from "./_components/RejectionReasonModal";
import ApprovePaymentModal from "./_components/ApprovePaymentModal";
import { useAdminStats } from "./hooks/useAdminStats";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { Shield, CreditCard, UserCheck, CheckCircle, FileText, Settings, BarChart3, AlertTriangle, FolderKanban } from "lucide-react";
import { Tooltip, UnstyledButton, Title, Text, Badge, Divider } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import classes from "../../components/layout/DoubleNavbar.module.css";

export default function AdminHubPage() {
  const {
    payments,
    isLoading: isPaymentsLoading,
    verifyPayment,
    isVerifying,
  } = useAdminPayments();

  const {
    cases,
    isCasesLoading,
    supporters,
    isSupportersLoading,
    assignSupporter,
    isAssigning,
    acceptCase,
    rejectCase,
    requestMoreInfo,
    deleteCase,
  } = useAdminCases();

  const {
    documents,
    isLoading: isDocsLoading,
    deleteDocument,
    isDeleting: isDeletingDoc,
  } = useAdminDocuments();

  const {
    packages,
    isLoading: isPackagesLoading,
    updatePackagePrice,
    updatePackageStatus,
    isUpdatingPrice,
    isUpdatingStatus,
  } = useAdminPackages();

  const [statsPeriod, setStatsPeriod] = useState("30d");
  const statsQuery = useAdminStats(statsPeriod);

  // Modal control states
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [approvingPaymentId, setApprovingPaymentId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"payments" | "cases" | "documents" | "packages" | "stats">("stats");
  const [paymentFilter, setPaymentFilter] = useState<"pending" | "history">("pending");
  const [caseFilter, setCaseFilter] = useState<"all" | "triage" | "unassigned" | "assigned" | "crud">("all");

  const handleApproveClick = (paymentId: string) => {
    setApprovingPaymentId(paymentId);
  };

  const handleConfirmApprove = async (paymentId: string) => {
    try {
      await verifyPayment({ paymentId, status: "paid" });
      notifications.show({
        title: "Duyệt thanh toán thành công",
        message: "Đã duyệt thanh toán thành công!",
        color: "green",
      });
    } catch (e: any) {
      notifications.show({
        title: "Lỗi",
        message: e?.response?.data?.message || "Gặp lỗi khi duyệt thanh toán.",
        color: "red",
      });
      throw e;
    }
  };

  const handleRejectClick = (paymentId: string) => {
    setRejectingPaymentId(paymentId);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingPaymentId) return;
    try {
      await verifyPayment({
        paymentId: rejectingPaymentId,
        status: "rejected",
        rejectionReason: reason,
      });
      setRejectingPaymentId(null);
      notifications.show({
        title: "Đã từ chối thanh toán",
        message: "Đã từ chối minh chứng thanh toán và gửi lý do cho sinh viên.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        title: "Lỗi",
        message: "Gặp lỗi khi thực hiện từ chối thanh toán.",
        color: "red",
      });
    }
  };

  const handleAssignSupporter = async (caseId: string, supporterId: string) => {
    try {
      await assignSupporter({ caseId, supporterId });
      notifications.show({
        title: "Phân công thành công",
        message: "Đã phân công Supporter chuyên môn phụ trách case thành công!",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        title: "Lỗi",
        message: "Gặp lỗi khi thực hiện phân công.",
        color: "red",
      });
    }
  };

  const handleAcceptCase = async (caseId: string) => {
    try {
      await acceptCase(caseId);
      notifications.show({
        title: "Duyệt hồ sơ thành công",
        message: "Đã duyệt hồ sơ và chuyển sang hàng chờ phân công.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        title: "Lỗi",
        message: "Gặp lỗi khi duyệt hồ sơ.",
        color: "red",
      });
    }
  };

  const handleRejectCase = async (caseId: string, reason: string) => {
    try {
      await rejectCase({ caseId, reason });
      notifications.show({
        title: "Từ chối hồ sơ thành công",
        message: "Đã từ chối hồ sơ thành công.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        title: "Lỗi",
        message: "Gặp lỗi khi từ chối hồ sơ.",
        color: "red",
      });
    }
  };

  const handleRequestMoreInfo = async (caseId: string, query: string) => {
    try {
      await requestMoreInfo({ caseId, query });
      notifications.show({
        title: "Gửi yêu cầu thành công",
        message: "Đã gửi yêu cầu làm rõ cho học viên.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        title: "Lỗi",
        message: "Gặp lỗi khi gửi yêu cầu.",
        color: "red",
      });
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hồ sơ đề tài này không? Hành động này không thể hoàn tác.")) {
      try {
        await deleteCase(caseId);
        notifications.show({
          title: "Xóa hồ sơ thành công",
          message: "Đã xóa hồ sơ khỏi hệ thống.",
          color: "green",
        });
      } catch (e) {
        notifications.show({
          title: "Lỗi",
          message: "Gặp lỗi khi thực hiện xóa hồ sơ.",
          color: "red",
        });
      }
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      notifications.show({
        title: "Xóa tài liệu thành công",
        message: "Đã xóa tài liệu khỏi hệ thống thành công!",
        color: "green",
      });
    } catch (e: any) {
      notifications.show({
        title: "Lỗi",
        message: `Gặp lỗi khi xóa tài liệu: ${e?.message || "Unknown error"}`,
        color: "red",
      });
    }
  };

  const isLoading = isPaymentsLoading || isCasesLoading || isSupportersLoading || isDocsLoading || isPackagesLoading;

  const pendingPaymentsCount = payments.filter((p) => p.status === "pending_verification").length;
  const unassignedCasesCount = cases.filter((c) => c.internal_status === "triage_pending" || c.internal_status === "accepted_unassigned").length;

  const filteredPayments = React.useMemo(() => {
    if (paymentFilter === "pending") {
      return payments.filter((p) => p.status === "pending_verification");
    }
    return payments.filter((p) => p.status !== "pending_verification");
  }, [payments, paymentFilter]);

  const filteredCases = React.useMemo(() => {
    if (caseFilter === "crud") {
      return cases;
    }
    const active = cases.filter(
      (c) =>
        c.internal_status === "triage_pending" ||
        c.internal_status === "accepted_unassigned" ||
        c.internal_status === "assigned"
    );
    if (caseFilter === "triage") {
      return active.filter((c) => c.internal_status === "triage_pending");
    }
    if (caseFilter === "unassigned") {
      return active.filter((c) => c.internal_status === "accepted_unassigned");
    }
    if (caseFilter === "assigned") {
      return active.filter((c) => c.internal_status === "assigned");
    }
    return active;
  }, [cases, caseFilter]);

  const getHeaderInfo = () => {
    if (activeSection === "stats") {
      return {
        title: "Thống kê hệ thống",
        description: "Tổng quan dữ liệu case, doanh thu và hiệu suất vận hành theo mốc thời gian.",
        icon: BarChart3,
      };
    }
    if (activeSection === "payments") {
      return {
        title: "Duyệt minh chứng thanh toán",
        description: "Kiểm tra thông tin giao dịch chuyển khoản và ảnh đối chiếu từ học viên.",
        icon: CreditCard,
      };
    }
    if (activeSection === "cases") {
      if (caseFilter === "crud") {
        return {
          title: "Quản lý toàn bộ hồ sơ hệ thống",
          description: "Xem chi tiết hoặc xóa hồ sơ khỏi cơ sở dữ liệu hệ thống.",
          icon: FolderKanban,
        };
      }
      return {
        title: "Phân công Supporter chuyên môn",
        description: "Chỉ định Supporter phụ trách đánh giá và sửa đổi bản thảo phản biện cho hồ sơ mới.",
        icon: UserCheck,
      };
    }
    if (activeSection === "documents") {
      return {
        title: "Quản lý hệ thống tài liệu",
        description: "Xem, tải xuống và gỡ bỏ tài liệu khỏi cơ sở dữ liệu & Cloudinary.",
        icon: FileText,
      };
    }
    return {
      title: "Thiết lập gói dịch vụ",
      description: "Bật/tắt hiển thị với khách hàng mới và cập nhật đơn giá các gói trên hệ thống.",
      icon: Settings,
    };
  };

  const currentHeader = getHeaderInfo();
  const HeaderIcon = currentHeader.icon;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden animate-fade-in font-body text-xs text-text-app">
      {/* Sidebar Navigation (Mantine DoubleNavbar) - always visible */}
      <nav className={classes.navbar}>
        <div className={classes.wrapper}>
          {/* Primary Rail (Icons) */}
            <aside className={classes.aside}>
              <Tooltip label="Thống kê" position="right" withArrow>
                <UnstyledButton
                  onClick={() => setActiveSection("stats")}
                  className={classes.mainLink}
                  data-active={activeSection === "stats" || undefined}
                >
                  <BarChart3 className="w-5 h-5" />
                </UnstyledButton>
              </Tooltip>

              <Tooltip label="Duyệt thanh toán" position="right" withArrow>
                <UnstyledButton
                  onClick={() => setActiveSection("payments")}
                  className={classes.mainLink}
                  data-active={activeSection === "payments" || undefined}
                >
                  <CreditCard className="w-5 h-5" />
                  {pendingPaymentsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full text-xs font-semibold bg-warning text-white flex items-center justify-center border-2 border-surface-app">
                      {pendingPaymentsCount}
                    </span>
                  )}
                </UnstyledButton>
              </Tooltip>

              <Tooltip label="Duyệt & Phân công" position="right" withArrow>
                <UnstyledButton
                  onClick={() => setActiveSection("cases")}
                  className={classes.mainLink}
                  data-active={activeSection === "cases" || undefined}
                >
                  <UserCheck className="w-5 h-5" />
                  {unassignedCasesCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full text-xs font-semibold bg-brand text-white flex items-center justify-center border-2 border-surface-app">
                      {unassignedCasesCount}
                    </span>
                  )}
                </UnstyledButton>
              </Tooltip>

              <Tooltip label="Quản lý tài liệu" position="right" withArrow>
                <UnstyledButton
                  onClick={() => setActiveSection("documents")}
                  className={classes.mainLink}
                  data-active={activeSection === "documents" || undefined}
                >
                  <FileText className="w-5 h-5" />
                </UnstyledButton>
              </Tooltip>

              <Tooltip label="Cấu hình giá gói" position="right" withArrow>
                <UnstyledButton
                  onClick={() => setActiveSection("packages")}
                  className={classes.mainLink}
                  data-active={activeSection === "packages" || undefined}
                >
                  <Settings className="w-5 h-5" />
                </UnstyledButton>
              </Tooltip>
            </aside>

          {/* Secondary Panel (Details / Submenu) */}
          <div className={classes.main}>
            <div className="mb-4">
              <Title order={6} className={classes.title}>
                {activeSection === "stats" ? "Thống kê" : activeSection === "payments" ? "Giao dịch" : activeSection === "cases" ? "Hồ sơ đề tài" : activeSection === "documents" ? "Quản lý tài liệu" : "Cấu hình gói"}
              </Title>
              <Text size="sm" c="dimmed" className="font-body">
                {activeSection === "stats"
                  ? "Tổng quan dữ liệu vận hành."
                  : activeSection === "payments"
                  ? "Duyệt minh chứng chuyển khoản."
                  : activeSection === "cases"
                  ? "Phân loại ý tưởng & phân công."
                  : activeSection === "documents"
                  ? "Danh mục tài liệu trên hệ thống."
                  : "Cấu hình đơn giá gói dịch vụ."}
              </Text>
            </div>

            <Divider className="border-border-app mb-4" />

            {/* Sub-menu filters */}
            {activeSection === "stats" ? (
              <div className="flex flex-col gap-1">
                <UnstyledButton
                  className={classes.link}
                  data-active={true}
                >
                  <span>Tổng quan</span>
                </UnstyledButton>
              </div>
            ) : activeSection === "payments" ? (
              <div className="flex flex-col gap-1">
                <UnstyledButton
                  onClick={() => setPaymentFilter("pending")}
                  className={classes.link}
                  data-active={paymentFilter === "pending" || undefined}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Chờ xác minh</span>
                    {pendingPaymentsCount > 0 && (
                      <Badge color="warning" size="sm" variant="light">
                        {pendingPaymentsCount}
                      </Badge>
                    )}
                  </div>
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => setPaymentFilter("history")}
                  className={classes.link}
                  data-active={paymentFilter === "history" || undefined}
                >
                  <span>Lịch sử giao dịch</span>
                </UnstyledButton>
              </div>
            ) : activeSection === "cases" ? (
              <div className="flex flex-col gap-1">
                <UnstyledButton
                  onClick={() => setCaseFilter("all")}
                  className={classes.link}
                  data-active={caseFilter === "all" || undefined}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Tất cả cần xử lý</span>
                    {unassignedCasesCount > 0 && (
                      <Badge color="brand" size="sm" variant="light">
                        {unassignedCasesCount}
                      </Badge>
                    )}
                  </div>
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => setCaseFilter("triage")}
                  className={classes.link}
                  data-active={caseFilter === "triage" || undefined}
                >
                  <span>Chờ duyệt</span>
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => setCaseFilter("unassigned")}
                  className={classes.link}
                  data-active={caseFilter === "unassigned" || undefined}
                >
                  <span>Chờ phân công</span>
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => setCaseFilter("assigned")}
                  className={classes.link}
                  data-active={caseFilter === "assigned" || undefined}
                >
                  <span>Đang phản biện</span>
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => setCaseFilter("crud")}
                  className={classes.link}
                  data-active={caseFilter === "crud" || undefined}
                >
                  <span>Quản lý toàn bộ hồ sơ</span>
                </UnstyledButton>
              </div>
            ) : activeSection === "documents" ? (
              <div className="flex flex-col gap-1">
                <UnstyledButton
                  className={classes.link}
                  data-active={true}
                >
                  <span>Tất cả tài liệu</span>
                </UnstyledButton>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <UnstyledButton
                  className={classes.link}
                  data-active={true}
                >
                  <span>Danh sách gói dịch vụ</span>
                </UnstyledButton>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area - Scrollable */}
      <div className="flex-grow flex flex-col h-full min-w-0 overflow-y-auto p-6 space-y-6">
        {/* Dynamic Main Header */}
        <div className="flex items-center gap-3 shrink-0 pb-2 border-b border-border-app/50">
          <div className="w-10 h-10 rounded-xl bg-brand-soft/40 text-brand flex items-center justify-center shrink-0">
            <HeaderIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-app">{currentHeader.title}</h1>
            <p className="text-text-muted text-xs mt-0.5">{currentHeader.description}</p>
          </div>
        </div>

        {/* SLA Alert Banner - global overdue warning */}
        {!statsQuery.isLoading && statsQuery.data && statsQuery.data.slaBreachCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-danger-soft border border-danger/20 text-danger text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>🔴 {statsQuery.data.slaBreachCount} hồ sơ đang quá hạn SLA — cần kiểm tra và phân công lại.</span>
          </div>
        )}

        {/* 2. Loading State or Section Content */}
        {isLoading ? (
          <div className="space-y-6 flex-grow">
            <LoadingSkeleton variant="table-row" count={2} />
            <LoadingSkeleton variant="table-row" count={2} />
          </div>
        ) : (
          <div className="flex-grow min-h-0">
            {activeSection === "stats" ? (
              <div>
                {statsQuery.isLoading ? (
                  <LoadingSkeleton variant="card" count={1} />
                ) : statsQuery.error ? (
                  <div className="p-4 bg-danger-soft border border-danger/10 text-danger rounded-xl text-sm">
                    Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.
                  </div>
                ) : (
                  <StatsDashboard
                    data={statsQuery.data}
                    isLoading={statsQuery.isLoading}
                    period={statsPeriod}
                    onPeriodChange={setStatsPeriod}
                  />
                )}
              </div>
            ) : activeSection === "payments" ? (
              <div>
                <AdminPaymentVerificationTable
                  payments={filteredPayments}
                  onApprove={handleApproveClick}
                  onReject={handleRejectClick}
                />
              </div>
            ) : activeSection === "cases" ? (
              <div>
                <AdminCaseAssignmentTable
                  cases={filteredCases}
                  supporters={supporters}
                  onAssign={handleAssignSupporter}
                  isAssigning={isAssigning}
                  onAccept={handleAcceptCase}
                  onReject={handleRejectCase}
                  onRequestMoreInfo={handleRequestMoreInfo}
                  isCrudMode={caseFilter === "crud"}
                  onDelete={handleDeleteCase}
                />
              </div>
            ) : activeSection === "documents" ? (
              <div>
                <AdminDocumentsTable
                  documents={documents}
                  onDelete={handleDeleteDocument}
                  isDeleting={isDeletingDoc}
                />
              </div>
            ) : (
              <div>
                <AdminPackagesSettings
                  packages={packages}
                  onUpdatePrice={updatePackagePrice}
                  onUpdateStatus={updatePackageStatus}
                  isUpdatingPrice={isUpdatingPrice}
                  isUpdatingStatus={isUpdatingStatus}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={rejectingPaymentId !== null}
        onClose={() => setRejectingPaymentId(null)}
        onConfirm={handleConfirmReject}
        isSubmitting={isVerifying}
      />

      {/* 5. Approve Payment Modal */}
      <ApprovePaymentModal
        paymentId={approvingPaymentId}
        onClose={() => setApprovingPaymentId(null)}
        onConfirm={handleConfirmApprove}
      />
    </div>
  );
}
