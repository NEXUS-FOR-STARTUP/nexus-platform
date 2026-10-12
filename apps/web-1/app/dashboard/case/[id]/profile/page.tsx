"use client";

import { use } from "react";
import { Container } from "@mantine/core";
import { useCaseDetails } from "../hooks/useCaseDetails";
import ProjectProfileForm from "../_components/workspace/profile/ProjectProfileForm";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function CaseProfilePage({ params }: ProfilePageProps) {
  const { id } = use(params);
  const { caseData, intakeSnapshot, isLoading, error } = useCaseDetails(id);

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <LoadingSkeleton variant="card" count={3} />
      </Container>
    );
  }

  if (error || !caseData) {
    return (
      <Container size="md" py="xl">
        <div className="p-4 bg-danger-soft border border-danger/10 text-danger rounded-xl text-sm">
          Không thể tải dữ liệu hồ sơ dự án.
        </div>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <ProjectProfileForm
        caseId={id}
        caseData={caseData}
        intakeSnapshot={intakeSnapshot}
      />
    </Container>
  );
}
