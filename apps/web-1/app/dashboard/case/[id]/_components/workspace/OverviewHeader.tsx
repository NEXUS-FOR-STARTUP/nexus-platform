import PageHead from "../ui/PageHead";
import CaseCodeChip from "./CaseCodeChip";

interface OverviewHeaderProps {
  teamName?: string;
  caseCode?: string;
}

export default function OverviewHeader({ teamName, caseCode }: OverviewHeaderProps) {
  return (
    <PageHead
      title="Tổng quan dự án"
      note={
        <>
          {teamName ?? "Dự án của bạn"}
          {caseCode && <CaseCodeChip code={caseCode} />}
        </>
      }
    />
  );
}
