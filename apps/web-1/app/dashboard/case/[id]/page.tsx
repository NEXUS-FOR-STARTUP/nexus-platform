"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useCaseDetails } from "./hooks/useCaseDetails";
import CaseStatusHeader from "./_components/CaseStatusHeader";
import UnpaidAlertBanner from "./_components/UnpaidAlertBanner";
import WorkspaceSidebar from "./_components/WorkspaceSidebar";
import type { WorkspaceTab } from "./_components/WorkspaceSidebar";
import DocumentWorkspace from "./_components/documents/DocumentWorkspace";
import TabDiscussionChat from "./_components/TabDiscussionChat";
import ActivityTimeline from "./_components/ActivityTimeline";
import TabCaseSettings from "./_components/TabCaseSettings";
import CreditPanel from "./_components/CreditPanel";
import CaseOverviewPanel from "./_components/CaseOverviewPanel";
import CreditQuantityModal from "./_components/CreditQuantityModal";
import IntakeFormModal from "./_components/IntakeFormModal";
import ExternalFeedbackUploadModal from "./_components/ExternalFeedbackUploadModal";
import StudentDocumentUploadModal from "./_components/StudentDocumentUploadModal";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { Button } from "@mantine/core";
import { Users } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CaseWorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const {
    caseData,
    intakeSnapshot,
    teamFitReport,
    documentWorkspace,
    isLoading,
    error,
  } = useCaseDetails(id);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [isStudentUploadOpen, setIsStudentUploadOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [creditBuyOpened, setCreditBuyOpened] = useState(false);
  const [intakeFormOpened, setIntakeFormOpened] = useState(false);

  const creditBalance = caseData?.credit_balance ?? null;
  const creditLedger = caseData?.credit_ledger ?? undefined;
  const packageName = caseData?.package?.name ?? undefined;
  const pricePerCredit = caseData?.package?.price ?? undefined;

  if (isLoading) {
    return (
      <div className="space-y-6 w-full pb-12">
        <LoadingSkeleton variant="text-block" count={1} />
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="w-full p-4">
        <div className="p-4 bg-danger-soft border border-danger/10 text-danger rounded-xl font-body text-sm">
          Không thể tải dữ liệu không gian làm việc của hồ sơ. Vui lòng thử lại sau.
        </div>
      </div>
    );
  }

  const canIntake = caseData.allowed_transitions?.includes("intake") ?? false;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden animate-fade-in">
      <WorkspaceSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        messageCount={caseData.messages?.length}
        creditBalance={creditBalance ?? undefined}
      />

      <div className={`flex-grow flex flex-col h-full min-w-0 p-6 space-y-6 ${activeTab === "discussion" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {activeTab !== "discussion" && activeTab !== "overview" && (
          <CaseStatusHeader
            caseData={caseData}
            versions={[]}
            selectedVersion={0}
            onVersionChange={() => {}}
            onSelectTab={(tab) => setActiveTab(tab)}
          />
        )}

        {(activeTab === "timeline" || activeTab === "settings") && (
          <UnpaidAlertBanner
            caseData={caseData}
            onOpenPayment={() => router.push(`/dashboard/case/${id}/payment`)}
          />
        )}

        <div className="flex-grow min-h-0 flex flex-col">
          {activeTab === "overview" && (
            <CaseOverviewPanel
              caseData={caseData}
              onSelectTab={(tab) => setActiveTab(tab)}
              onEditIntake={() => setIntakeFormOpened(true)}
            />
          )}

          {activeTab === "documents" && (
            <>
              <div className="mb-4 flex justify-end gap-3">
                {canIntake && (
                  <Button
                    size="sm"
                    color="brand"
                    className="font-semibold cursor-pointer h-8.5 text-xs"
                    onClick={() => setIntakeFormOpened(true)}
                  >
                    <Users className="w-4 h-4" />
                    Cập nhật thông tin
                  </Button>
                )}
                <Button
                  size="sm"
                  color="brand"
                  className="font-semibold cursor-pointer h-8.5 text-xs"
                  onClick={() => setIsStudentUploadOpen(true)}
                >
                  Tải tài liệu
                </Button>
                <Button
                  size="sm"
                  color="brand"
                  variant="light"
                  className="font-semibold cursor-pointer h-8.5 text-xs"
                  onClick={() => setIsFeedbackOpen(true)}
                >
                  Tải đánh giá bên ngoài
                </Button>
              </div>
              <DocumentWorkspace workspace={documentWorkspace} />
            </>
          )}

          {activeTab === "discussion" && <TabDiscussionChat caseId={caseData.id} creditBalance={creditBalance ?? undefined} />}

          {activeTab === "credits" && (
            <CreditPanel
              creditBalance={creditBalance}
              creditLedger={creditLedger}
              payments={caseData.payments}
              packageName={packageName}
              pricePerCredit={pricePerCredit && pricePerCredit > 0 ? pricePerCredit : undefined}
              paymentStatus={caseData.payment_status}
              onBuyCredits={() => setCreditBuyOpened(true)}
            />
          )}

          {activeTab === "timeline" && <ActivityTimeline caseData={caseData} />}

          {activeTab === "settings" && <TabCaseSettings caseData={caseData} />}
        </div>
      </div>

      <StudentDocumentUploadModal isOpen={isStudentUploadOpen} onClose={() => setIsStudentUploadOpen(false)} caseId={id} />
      <IntakeFormModal caseId={id} opened={intakeFormOpened} onClose={() => setIntakeFormOpened(false)} />
      <ExternalFeedbackUploadModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        caseId={id}
        latestVersionNo={documentWorkspace?.checkpoints?.[0]?.latest_version_no || 1}
      />

      <CreditQuantityModal
        caseId={id}
        opened={creditBuyOpened}
        onClose={() => setCreditBuyOpened(false)}
        packageId={caseData?.package_id ?? undefined}
      />
    </div>
  );
}
