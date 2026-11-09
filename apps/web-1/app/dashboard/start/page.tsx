"use client";

import { useState } from "react";
import { Button, Group, Loader, Paper, Stack, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import { ASSET_RULES, IDEA_RULES, ideaModeOf } from "@repo/validation";
import { CreateProjectModal } from "../_components/CreateProjectModal";
import { StartStepper } from "./_components/StartStepper";
import { IntroStep } from "./_components/steps/IntroStep";
import { BasicsStep } from "./_components/steps/BasicsStep";
import { TeamStep } from "./_components/steps/TeamStep";
import { AssetsStep } from "./_components/steps/AssetsStep";
import { NetworkStep } from "./_components/steps/NetworkStep";
import { IdeaForkStep } from "./_components/steps/IdeaForkStep";
import { FormStep } from "./_components/steps/FormStep";
import { SensStep } from "./_components/steps/SensStep";
import { ConfirmStep } from "./_components/steps/ConfirmStep";
import { ResultView } from "./_components/result/ResultView";
import { useStartFlow } from "./_hooks/useStartFlow";

const FPT_SCHOOL = "Đại học FPT";
const OTHER_VALUE = "Khác";

export default function StartPage() {
  const flow = useStartFlow();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  if (!flow.isClient) {
    return (
      <div className="flex justify-center py-20">
        <Loader size="sm" color="brand" />
      </div>
    );
  }

  const shell = {
    form: flow.form,
    patch: flow.patch,
    error: flow.error,
    onBack: flow.back,
    onNext: flow.next,
  };

  const renderStep = () => {
    switch (flow.step) {
      case "intro":
        return <IntroStep hasSaved={flow.hasSaved} onStart={() => flow.go("basics")} onResume={() => flow.go("result")} />;
      case "basics":
        return <BasicsStep {...shell} />;
      case "team":
        return <TeamStep {...shell} />;
      case "assets":
        return <AssetsStep {...shell} busy={flow.labelBusy} />;
      case "assetsConfirm":
        return (
          <ConfirmStep
            kind="assets"
            catalog={ASSET_RULES}
            suggested={(flow.labels.assets?.labels.map((l) => l.id) ?? []).filter((id) => ASSET_RULES.some((r) => r.id === id))}
            aiOk={flow.labels.assets?.aiOk ?? false}
            tags={flow.form.assetTags}
            onTags={(next) => flow.patch({ assetTags: next })}
            error={flow.error}
            onBack={flow.back}
            onNext={flow.next}
          />
        );
      case "network":
        return <NetworkStep {...shell} busy={flow.labelBusy} />;
      case "idea":
        return <IdeaForkStep {...shell} />;
      case "form":
        return <FormStep {...shell} busy={flow.labelBusy} />;
      case "formConfirm":
        return (
          <ConfirmStep
            kind="idea"
            catalog={IDEA_RULES}
            suggested={(flow.labels.idea?.labels.map((l) => l.id) ?? []).filter((id) => IDEA_RULES.some((r) => r.id === id))}
            aiOk={flow.labels.idea?.aiOk ?? false}
            tags={flow.form.ideaTags}
            onTags={(next) => flow.patch({ ideaTags: next })}
            error={flow.error}
            onBack={flow.back}
            onNext={flow.next}
          />
        );
      case "sens":
        return <SensStep {...shell} busy={flow.saving} />;
      case "result":
        if (!flow.report || !flow.input) {
          return (
            <Paper withBorder p="xl" style={{ borderRadius: "var(--ui-radius)" }}>
              <Stack gap="md">
                <Text size="sm" lh={1.6}>
                  Chưa có đủ câu trả lời để xem kết quả. Bắt đầu lại từ câu hỏi đầu tiên giúp mình.
                </Text>
                <Group>
                  <Button color="brand" onClick={() => flow.go("basics")}>
                    Bắt đầu
                  </Button>
                </Group>
              </Stack>
            </Paper>
          );
        }
        const effectiveMode = ideaModeOf(flow.input);
        return (
          <ResultView
            report={flow.report}
            input={flow.input}
            ideaMode={effectiveMode}
            structureIncomplete={flow.form.ideaMode === "structured" && effectiveMode === "draft"}
            aiResult={flow.aiResult}
            aiFailed={flow.aiFailed}
            aiLoading={flow.aiLoading}
            saving={flow.saving}
            saveFailed={flow.saveFailed}
            savedCaseId={flow.savedCaseId}
            onCreateProject={() => {
              setModalKey((k) => k + 1);
              setModalOpen(true);
            }}
            onOpenCase={(id) => router.push(`/dashboard/case/${id}`)}
            onEdit={() => flow.go(flow.form.ideaMode === "none" ? "idea" : "form")}
            onRestart={flow.restart}
          />
        );
      default:
        return null;
    }
  };

  const showStepper = flow.step !== "intro" && flow.step !== "result";

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="text-center space-y-2" hidden={!showStepper}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-app">
          Chuẩn bị trước khi vào dự án
        </h1>
        <p className="font-body text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
          Trả lời vài câu về nhóm, tài nguyên và ý tưởng. Cuối cùng bạn nhận được một bản nhận xét ngắn: nhóm mạnh gì, nên tìm ai, ý tưởng có ổn không.
        </p>
      </div>

      {showStepper ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-1 lg:sticky lg:top-6">
            <StartStepper step={flow.step} furthest={flow.furthest} onStep={flow.go} />
          </div>
          <div className="lg:col-span-3 max-w-3xl">{renderStep()}</div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">{renderStep()}</div>
      )}

      <CreateProjectModal
        key={modalKey}
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        initialValues={{
          projectName: (flow.form.madlibs.projectName ?? "").trim(),
          school: flow.form.school === "fpt" ? FPT_SCHOOL : OTHER_VALUE,
          courseContext: flow.form.course === "exe101" ? "EXE101" : OTHER_VALUE,
        }}
        onCreated={flow.onCaseCreated}
      />
    </div>
  );
}
