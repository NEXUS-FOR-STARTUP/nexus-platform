"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { PACKAGE_KEYS } from "@/lib/pricing";
import { useSession } from "@/lib/auth-client";
import { filterTransitions } from "@/_types/transitions";
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


import ExternalFeedbackUploadModal from "./_components/ExternalFeedbackUploadModal";
import StudentDocumentUploadModal from "./_components/StudentDocumentUploadModal";
import StatusGuidanceCard from "./_components/StatusGuidanceCard";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { Button } from "@mantine/core";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CaseWorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const {
    caseData,
    intakeSnapshot,
    documentWorkspace,
    isLoading,
    error,
    allowedTransitions,
    openRequestsForMoreInfo,
    confirmComplete,
    isConfirmingComplete,
  } = useCaseDetails(id);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [isStudentUploadOpen, setIsStudentUploadOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [creditBuyOpened, setCreditBuyOpened] = useState(false);

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

  const stage = caseData.user_facing_stage;
  const isPreSubmission = stage === "intake_pending" || stage === "intake_ready";
  const isIntakePending = stage === "intake_pending";

  const isOwner = !!session?.user?.id && session.user.id === caseData.owner_auth_user_id;
  const filteredTransitions = filterTransitions(allowedTransitions, {
    role: "user",
    isOwner,
    isAssignedSupporter: false,
  });
  const canSubmitRevision = filteredTransitions.includes("T9_SUBMIT_REVISION");
  const canEditIntake = filteredTransitions.includes("T16_EDIT_INTAKE");
  const canOpenIntake = [
    "T2_SUBMIT_INTAKE",
    "T16_EDIT_INTAKE",
    "T3_RESUBMIT_AFTER_REJECT",
    "T4_RESUBMIT_AFTER_VETO",
  ].some((t) => filteredTransitions.includes(t));

  const isTabAvailable = (tab: WorkspaceTab): boolean => {
    if (!isPreSubmission) return true;
    if (stage === "intake_pending") return tab === "overview" || tab === "settings" || tab === "credits";
    if (stage === "intake_ready") return tab === "overview" || tab === "documents" || tab === "settings" || tab === "credits";
    return true;
  };

  const handleTabChange = (tab: WorkspaceTab) => {
    if (isTabAvailable(tab)) setActiveTab(tab);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden animate-fade-in">
      <WorkspaceSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        messageCount={caseData.messages?.length}
        creditBalance={creditBalance ?? undefined}
        stage={stage}
      />

      <div className={`flex-grow flex flex-col h-full min-w-0 p-6 ${activeTab === "discussion" ? "overflow-hidden" : "space-y-6 overflow-y-auto"}`}>
        {activeTab !== "discussion" && (
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
            creditBalance={creditBalance}
            onBuyCredits={() => setCreditBuyOpened(true)}
          />
        )}

        <div className={`w-full flex flex-col ${activeTab === "discussion" ? "flex-1 min-h-0 h-full" : "pb-8"}`}>
          {activeTab === "overview" && (
            <CaseOverviewPanel
              caseData={caseData}
              intakeSnapshot={intakeSnapshot}
              onSelectTab={(tab) => setActiveTab(tab)}
              onEditIntake={canEditIntake ? () => router.push(`/dashboard/intake?caseId=${id}`) : undefined}
              guidanceCard={
                <StatusGuidanceCard
                  caseData={caseData}
                  creditBalance={creditBalance}
                  openRequestsForMoreInfo={openRequestsForMoreInfo}
                  allowedTransitions={filteredTransitions}
                  onSelectTab={(tab) => setActiveTab(tab)}
                  onOpenPayment={isIntakePending || stage === "report_ready" ? () => setCreditBuyOpened(true) : undefined}
                  onOpenIntake={canOpenIntake ? () => router.push(`/dashboard/intake?caseId=${id}`) : undefined}
                  onSubmitRevision={() => setIsStudentUploadOpen(true)}
                  onConfirmComplete={confirmComplete}
                  isConfirmingComplete={isConfirmingComplete}
                />
              }
            />
          )}

          {activeTab === "documents" && (
            <>
              <div className="mb-4 flex justify-end gap-3">
                {canEditIntake && (
                  <Button
                    size="sm"
                    color="brand"
                    className="font-semibold cursor-pointer h-8.5 text-xs"
                    onClick={() => router.push(`/dashboard/intake?caseId=${id}`)}
                  >
                    Cập nhật thông tin
                  </Button>
                )}
                {canSubmitRevision && (
                  <Button
                    size="sm"
                    color="brand"
                    className="font-semibold cursor-pointer h-8.5 text-xs"
                    onClick={() => setIsStudentUploadOpen(true)}
                  >
                    Tải tài liệu
                  </Button>
                )}
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

          {activeTab === "discussion" && <TabDiscussionChat caseId={caseData.id} />}

          {activeTab === "credits" && (
            <CreditPanel
              creditBalance={creditBalance}
              creditLedger={creditLedger}
              orders={caseData.orders}
              packageName={packageName}
              pricePerCredit={pricePerCredit && pricePerCredit > 0 ? pricePerCredit : undefined}
              onBuyCredits={() => setCreditBuyOpened(true)}
            />
          )}

          {activeTab === "timeline" && <ActivityTimeline caseData={caseData} />}

          {activeTab === "settings" && <TabCaseSettings caseData={caseData} intakeSnapshot={intakeSnapshot} />}
        </div>
      </div>

      <StudentDocumentUploadModal isOpen={isStudentUploadOpen} onClose={() => setIsStudentUploadOpen(false)} caseId={id} />
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
        packageId={PACKAGE_KEYS.AUDIT}
        currentPackageId={caseData?.package_id ?? undefined}
      />
    </div>
  );
}
