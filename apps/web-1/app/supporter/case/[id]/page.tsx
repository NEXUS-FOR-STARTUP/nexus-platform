"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useCaseDetails } from "../../../dashboard/case/[id]/hooks/useCaseDetails";
import { caseRequiresPayment } from "@/lib/pricing";
import CaseStatusHeader from "../../../dashboard/case/[id]/_components/CaseStatusHeader";
import WorkspaceSidebar from "../../../dashboard/case/[id]/_components/WorkspaceSidebar";
import type { WorkspaceTab } from "../../../dashboard/case/[id]/_components/WorkspaceSidebar";
import DocumentWorkspace from "../../../dashboard/case/[id]/_components/documents/DocumentWorkspace";
import TabDiscussionChat from "../../../dashboard/case/[id]/_components/TabDiscussionChat";
import ActivityTimeline from "../../../dashboard/case/[id]/_components/ActivityTimeline";
import CaseOverviewPanel from "../../../dashboard/case/[id]/_components/CaseOverviewPanel";
import LoadingScreen from "@/components/ui/LoadingScreen";
import SupporterOutputUploadModal from "./_components/SupporterOutputUploadModal";
import { Button } from "@mantine/core";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SupporterCaseWorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: session, isPending: isAuthPending } = useSession();
  const { caseData, intakeSnapshot, documentWorkspace, isLoading, error } = useCaseDetails(id);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [isOutputUploadOpen, setIsOutputUploadOpen] = useState(false);

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
                <Button
                  size="sm"
                  color="brand"
                  className="font-semibold cursor-pointer h-8.5 text-xs"
                  onClick={() => setIsOutputUploadOpen(true)}
                >
                  Tải output hỗ trợ
                </Button>
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
    </div>
  );
}
