"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useCaseDetails } from "../../../dashboard/case/[id]/hooks/useCaseDetails";
import { caseRequiresPayment } from "@/lib/pricing";
import { filterTransitions } from "@/_types/transitions";
import CaseStatusHeader from "../../../dashboard/case/[id]/_components/CaseStatusHeader";
import WorkspaceSidebar from "../../../dashboard/case/[id]/_components/WorkspaceSidebar";
import type { WorkspaceTab } from "../../../dashboard/case/[id]/_components/WorkspaceSidebar";
import DocumentWorkspace from "../../../dashboard/case/[id]/_components/documents/DocumentWorkspace";
import TabDiscussionChat from "../../../dashboard/case/[id]/_components/TabDiscussionChat";
import ActivityTimeline from "../../../dashboard/case/[id]/_components/ActivityTimeline";
import CaseOverviewPanel from "../../../dashboard/case/[id]/_components/CaseOverviewPanel";
import LoadingScreen from "@/components/ui/LoadingScreen";
import SupporterOutputUploadModal from "./_components/SupporterOutputUploadModal";
import SupporterRequestInfoModal from "./_components/SupporterRequestInfoModal";
import { useSupporterActions } from "../../hooks/useSupporterActions";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Play, HelpCircle, RefreshCw, Clock } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SupporterCaseWorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: session, isPending: isAuthPending } = useSession();
  const { caseData, intakeSnapshot, documentWorkspace, isLoading, error, allowedTransitions } =
    useCaseDetails(id);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [isOutputUploadOpen, setIsOutputUploadOpen] = useState(false);
  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(false);

  const {
    startWork,
    isStartingWork,
    requestMoreInfo,
    startReviewRevision,
    isStartingReviewRevision,
  } = useSupporterActions(id);

  React.useEffect(() => {
    if (!isAuthPending && !session) {
      router.push("/auth");
    } else if (!isAuthPending && session) {
      const userRole = (session.user as { role?: string }).role;
      if (userRole !== "supporter" && userRole !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [session, isAuthPending, router]);

  if (isAuthPending || isLoading) {
    return <LoadingScreen message="Đang tải không gian làm việc của Supporter..." />;
  }

  if (error || !caseData) {
    return (
      <div className="w-full p-4">
        <div className="p-4 bg-danger-soft border border-danger/10 text-danger rounded-xl font-body text-sm">
          Không thể tải hồ sơ phản biện. Vui lòng thử lại.
        </div>
      </div>
    );
  }

  const isAssignedSupporter =
    !!session?.user?.id && caseData.assigned_supporter_auth_user_id === session.user.id;
  const filteredTransitions = filterTransitions(allowedTransitions, {
    role: "supporter",
    isOwner: false,
    isAssignedSupporter,
  });

  const canStartWork = filteredTransitions.includes("T7_START_WORK");
  const canRequestInfo = filteredTransitions.includes("T8_REQUEST_INFO");
  const canStartReviewRevision = filteredTransitions.includes("T10_START_REVIEW_REVISION");
  const canUploadOutput = filteredTransitions.includes("T11_SUBMIT_OUTPUT");
  const isWaitingUser = caseData.internal_status === "waiting_user";
  const isReportReady = caseData.internal_status === "report_ready_to_publish";

  const hasActionBar = canStartWork || canRequestInfo || canStartReviewRevision;

  const handleStartWork = async () => {
    try {
      await startWork();
      notifications.show({ title: "Đã bắt đầu xử lý", message: "Hồ sơ đã chuyển sang trạng thái phản biện.", color: "green" });
    } catch {
      notifications.show({ title: "Lỗi", message: "Không thể bắt đầu xử lý. Vui lòng thử lại.", color: "red" });
    }
  };

  const handleStartReviewRevision = async () => {
    try {
      await startReviewRevision();
      notifications.show({ title: "Đã tiếp nhận", message: "Đã tiếp nhận bản sửa đổi và tiếp tục thẩm định.", color: "green" });
    } catch {
      notifications.show({ title: "Lỗi", message: "Không thể tiếp nhận bản sửa đổi. Vui lòng thử lại.", color: "red" });
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden animate-fade-in">
      <WorkspaceSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== "settings") {
            setActiveTab(tab);
          }
        }}
        messageCount={caseData.messages?.length}
        hideSettings
        hideCredits
      />

      <div className={`flex-grow flex flex-col h-full min-w-0 p-6 space-y-6 ${activeTab === "discussion" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {activeTab !== "discussion" && (
          <CaseStatusHeader
            caseData={caseData}
            versions={[]}
            selectedVersion={0}
            onVersionChange={() => {}}
            onSelectTab={(tab) => setActiveTab(tab)}
          />
        )}

        {caseRequiresPayment(caseData) && (
          <div className="p-4 rounded-xl bg-warning-soft border border-warning/15 text-warning font-body text-xs flex items-center gap-2 shrink-0">
            <span>⚠️ Nhóm sinh viên chưa hoàn tất thanh toán hồ sơ này. Lưu ý trước khi gửi báo cáo phản biện chính thức.</span>
          </div>
        )}

        {isWaitingUser && (
          <div className="p-4 rounded-xl bg-warning-soft border border-warning/15 text-warning font-body text-xs flex items-center gap-2 shrink-0">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Đang chờ sinh viên nộp bản bổ sung theo yêu cầu.</span>
          </div>
        )}

        {isReportReady && (
          <div className="p-4 rounded-xl bg-info-soft border border-info/15 text-info font-body text-xs flex items-center gap-2 shrink-0">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Đã giao báo cáo — chờ sinh viên xác nhận hoàn thành.</span>
          </div>
        )}

        {hasActionBar && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canStartWork && (
              <Button
                size="sm"
                color="brand"
                className="font-semibold cursor-pointer h-8.5 text-xs"
                leftSection={<Play className="w-3.5 h-3.5" />}
                loading={isStartingWork}
                onClick={handleStartWork}
              >
                Bắt đầu xử lý
              </Button>
            )}
            {canRequestInfo && (
              <Button
                size="sm"
                variant="light"
                color="orange"
                className="font-semibold cursor-pointer h-8.5 text-xs"
                leftSection={<HelpCircle className="w-3.5 h-3.5" />}
                onClick={() => setIsRequestInfoOpen(true)}
              >
                Yêu cầu bổ sung
              </Button>
            )}
            {canStartReviewRevision && (
              <Button
                size="sm"
                variant="light"
                color="brand"
                className="font-semibold cursor-pointer h-8.5 text-xs"
                leftSection={<RefreshCw className="w-3.5 h-3.5" />}
                loading={isStartingReviewRevision}
                onClick={handleStartReviewRevision}
              >
                Tiếp nhận bản sửa đổi
              </Button>
            )}
          </div>
        )}

        <div className="flex-grow min-h-0 flex flex-col">
          {activeTab === "overview" && (
            <CaseOverviewPanel
              caseData={caseData}
              intakeSnapshot={intakeSnapshot}
              onSelectTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "documents" && (
            <>
              <div className="mb-4 flex justify-end">
                {canUploadOutput && (
                  <Button
                    size="sm"
                    color="brand"
                    className="font-semibold cursor-pointer h-8.5 text-xs"
                    onClick={() => setIsOutputUploadOpen(true)}
                  >
                    Tải output hỗ trợ
                  </Button>
                )}
              </div>
              <DocumentWorkspace workspace={documentWorkspace} />
            </>
          )}

          {activeTab === "discussion" && <TabDiscussionChat caseId={caseData.id} />}

          {activeTab === "timeline" && <ActivityTimeline caseData={caseData} />}
        </div>
      </div>

      <SupporterOutputUploadModal
        isOpen={isOutputUploadOpen}
        onClose={() => setIsOutputUploadOpen(false)}
        caseId={id}
      />

      <SupporterRequestInfoModal
        isOpen={isRequestInfoOpen}
        onClose={() => setIsRequestInfoOpen(false)}
        onRequestMoreInfo={requestMoreInfo}
      />
    </div>
  );
}
