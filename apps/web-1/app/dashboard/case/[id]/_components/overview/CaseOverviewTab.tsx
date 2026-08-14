"use client";

import { Badge, Button, Card, SimpleGrid } from "@mantine/core";
import { AlertTriangle, ArrowRight, ClipboardList, FileText, Lightbulb, Target, Users } from "lucide-react";
import type { Case, TeamFitReport } from "@/types";
import { statusThemeMap } from "@/types";
import { buildCaseOverviewModel, type OverviewField, type OverviewMember } from "./caseOverviewModel";

interface CaseOverviewTabProps {
  caseData: Case;
  intakeSnapshot: unknown;
  teamFitReport: TeamFitReport | null;
  onOpenDocuments?: () => void;
  onOpenTimeline?: () => void;
}

function FieldList({ fields }: { fields: OverviewField[] }) {
  if (fields.length === 0) {
    return <p className="text-xs text-text-muted font-body">Chưa có dữ liệu.</p>;
  }

  return (
    <dl className="space-y-3">
      {fields.map((field) => (
        <div key={field.label}>
          <dt className="text-base uppercase tracking-[0.16em] text-text-muted font-semibold">{field.label}</dt>
          <dd className="mt-1 text-sm text-text-primary leading-relaxed font-body">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <Card withBorder radius="lg" className="border-border-subtle bg-surface-panel shadow-none">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-brand-soft/40 text-brand flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </span>
        <h3 className="font-heading text-base font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

function MemberList({ members }: { members: OverviewMember[] }) {
  if (members.length === 0) return null;

  return (
    <SectionCard title="Thành viên" icon={Users}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member, index) => (
          <div key={`${member.name}-${index}`} className="rounded-xl border border-border-subtle bg-surface-app p-4">
            <p className="font-heading text-sm font-semibold text-text-primary">{member.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-text-muted font-body">{member.detail}</p>
            {member.meta && <p className="mt-2 text-xs text-brand font-semibold font-body">{member.meta}</p>}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function GapList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-text-primary font-heading mb-2">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2 text-sm text-text-primary font-body leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CaseOverviewTab({ caseData, intakeSnapshot, teamFitReport, onOpenDocuments, onOpenTimeline }: CaseOverviewTabProps) {
  const model = buildCaseOverviewModel(caseData, intakeSnapshot, teamFitReport);
  const stage = statusThemeMap[model.summary.stage];

  return (
    <div className="space-y-5 pb-10">
      <Card withBorder radius="xl" className="border-brand/10 bg-gradient-to-br from-brand-soft/30 via-surface-panel to-surface-panel shadow-none">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge color="brand" variant="light" radius="xl">{model.summary.caseCode}</Badge>
              <Badge color={stage?.color === "warning" ? "yellow" : stage?.color === "success" ? "green" : "gray"} variant="light" radius="xl">
                {stage?.label || model.summary.stage}
              </Badge>
            </div>
            <h2 className="font-heading text-2xl font-bold text-text-primary">Tổng quan hồ sơ</h2>
            <p className="mt-2 text-sm text-text-muted leading-relaxed font-body">
              {model.summary.text || "Chưa có tóm tắt hồ sơ. Các phần bên dưới chỉ hiển thị dữ liệu nhóm đã cung cấp."}
            </p>
          </div>
          <div className="grid gap-2 text-sm font-body text-text-primary min-w-60">
            <div className="rounded-xl bg-surface-app/80 border border-border-subtle px-4 py-3">
              <p className="text-base uppercase tracking-[0.16em] text-text-muted font-semibold">Gói dịch vụ</p>
              <p className="mt-1 font-semibold">{model.summary.packageName}</p>
            </div>
            <div className="rounded-xl bg-surface-app/80 border border-border-subtle px-4 py-3">
              <p className="text-base uppercase tracking-[0.16em] text-text-muted font-semibold">SLA / Deadline</p>
              <p className="mt-1 font-semibold">{model.summary.deadline}</p>
            </div>
          </div>
        </div>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <SectionCard title="Nhóm" icon={Users}>
          <FieldList fields={model.teamFields} />
        </SectionCard>
        <SectionCard title="Liên hệ" icon={ClipboardList}>
          <FieldList fields={model.contactFields} />
        </SectionCard>
      </SimpleGrid>

      {model.ideaFields.length > 0 && (
        <SectionCard title="Ý tưởng" icon={Lightbulb}>
          <FieldList fields={model.ideaFields} />
        </SectionCard>
      )}

      <MemberList members={model.members} />

      {(model.hasFreeAnalysis || model.currentBlocker || model.supportNeeds.length > 0 || model.expectedOutputs) && (
        <SectionCard title="Điểm cần chú ý" icon={Target}>
          <div className="grid gap-5 lg:grid-cols-2">
            <GapList title="Khoảng trống đội ngũ" items={model.teamGaps} />
            <GapList title="Khoảng trống thương mại" items={model.commercialGaps} />
            {model.currentBlocker && (
              <div>
                <h4 className="text-sm font-semibold text-text-primary font-heading mb-2">Vướng mắc hiện tại</h4>
                <p className="text-sm text-text-primary leading-relaxed font-body">{model.currentBlocker}</p>
              </div>
            )}
            {model.supportNeeds.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-text-primary font-heading mb-2">Nhu cầu hỗ trợ</h4>
                <ul className="space-y-2">
                  {model.supportNeeds.map((item, index) => (
                    <li key={`support-${index}`} className="text-sm text-text-primary leading-relaxed font-body">{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {model.expectedOutputs && (
              <div className="lg:col-span-2 rounded-xl border border-border-subtle bg-surface-app p-4">
                <h4 className="text-sm font-semibold text-text-primary font-heading mb-2">Kết quả mong đợi</h4>
                <p className="text-sm text-text-primary leading-relaxed font-body">{model.expectedOutputs}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <Card withBorder radius="lg" className="border-border-subtle bg-surface-panel shadow-none">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-heading text-base font-semibold text-text-primary">Đi tiếp nhanh</h3>
            <p className="mt-1 text-xs text-text-muted font-body">Mở tài liệu hoặc lịch sử mà không lặp lại bảng dữ liệu trong tab tổng quan.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onOpenDocuments && (
              <Button size="sm" variant="light" color="brand" onClick={onOpenDocuments} rightSection={<ArrowRight className="w-3.5 h-3.5" />}>
                Tài liệu
              </Button>
            )}
            {onOpenTimeline && (
              <Button size="sm" variant="subtle" color="gray" onClick={onOpenTimeline} leftSection={<FileText className="w-3.5 h-3.5" />}>
                Lịch sử
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
