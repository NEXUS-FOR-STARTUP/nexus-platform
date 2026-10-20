import {
  ROLE_TRACK_CODES,
  ROLE_TRACK_LABELS,
  TEAM_FIT_VERDICT_LABELS,
  isTeamFitFreeReportV2,
  type TeamFitAiOutput,
  type TeamFitHandoffItem,
  type TeamFitLegacyFreeReport,
  type TeamFitMachineStats,
  type TeamFitSavedResult,
} from "@repo/validation";
import { List, Paper, SimpleGrid, Text } from "@mantine/core";
import { AreaList, GapDetails, HandoffList, SectionTitle, Stat } from "./TeamFitReportParts";

// Bố cục đọc từ trên xuống: kết luận → số liệu → độ phủ nghề → từng mảng (gập/mở) →
// vai trò thiếu & câu hỏi (2 cột) → câu cần tài liệu. Chữ nội dung luôn size sm, lh 1.6.
export function TeamFitReportCard({ report }: { report: TeamFitSavedResult }) {
  return isTeamFitFreeReportV2(report) ? (
    <FreeReportBody
      machineStats={report.machineStats}
      ai={report.ai}
      handoff={report.handoff}
    />
  ) : (
    <LegacyReportBody report={report} />
  );
}

function Verdict({ ai }: { ai: TeamFitAiOutput | null }) {
  if (!ai) {
    return (
      <Paper withBorder radius="md" p="lg">
        <Text size="sm" lh={1.6}>
          AI chưa đưa ra nhận định lượt này. Bấm &quot;Kiểm tra lại&quot; để thử lại.
        </Text>
      </Paper>
    );
  }
  const isReady = ai.verdict === "san_sang";
  return (
    <Paper withBorder radius="md" p="lg">
      <Text size="sm" c="dimmed">
        Đội ngũ có đủ người không?
      </Text>
      <Text fz={28} fw={700} lh={1.2} c={isReady ? "green" : "orange"}>
        {TEAM_FIT_VERDICT_LABELS[ai.verdict]}
      </Text>
    </Paper>
  );
}

function FreeReportBody({
  machineStats,
  ai,
  handoff,
}: {
  machineStats: TeamFitMachineStats;
  ai: TeamFitAiOutput | null;
  handoff: TeamFitHandoffItem[];
}) {
  const coveredTracks = ROLE_TRACK_CODES.filter(
    (code) => machineStats.trackCoverage[code] > 0,
  ).length;

  return (
    <div className="space-y-8">
      <Verdict ai={ai} />

      <section>
        <SectionTitle>Số liệu nhóm</SectionTitle>
        <SimpleGrid cols={3} spacing="sm">
          <Stat value={String(machineStats.distinctMajors)} label="ngành đào tạo" />
          <Stat
            value={`${coveredTracks}/${ROLE_TRACK_CODES.length}`}
            label="mảng nghề có người"
          />
          <Stat value={String(machineStats.experiencedCount)} label="người có kinh nghiệm" />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm" mt="sm">
          {ROLE_TRACK_CODES.map((code) => {
            const count = machineStats.trackCoverage[code];
            return (
              <Paper key={code} withBorder radius="md" p="md">
                <Text size="sm" fw={600}>
                  {ROLE_TRACK_LABELS[code]}
                </Text>
                <Text size="sm" c={count > 0 ? undefined : "red"}>
                  {count > 0 ? `${count} người` : "Chưa có ai"}
                </Text>
              </Paper>
            );
          })}
        </SimpleGrid>
        {machineStats.emptyFields.length > 0 && (
          <Text size="sm" c="dimmed" mt="sm">
            Ô còn trống: {machineStats.emptyFields.join(", ")}
          </Text>
        )}
      </section>

      {ai && (
        <>
          <section>
            <SectionTitle>Từng mảng</SectionTitle>
            <AreaList areas={ai.areas} />
          </section>
          <GapDetails ai={ai} />
        </>
      )}

      <section>
        <SectionTitle>Chưa trả lời được từ mô tả ngắn</SectionTitle>
        <HandoffList handoff={handoff} />
      </section>
    </div>
  );
}

function LegacyReportBody({ report }: { report: TeamFitLegacyFreeReport }) {
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Nhóm có thể đang thiếu</SectionTitle>
        <List spacing="xs" size="sm">
          {report.teamGaps.map((gap, i) => (
            <List.Item key={i}>{gap}</List.Item>
          ))}
        </List>
      </section>
      <section>
        <SectionTitle>Ý tưởng cần làm rõ thêm</SectionTitle>
        <List spacing="xs" size="sm">
          {report.commercialGaps.map((gap, i) => (
            <List.Item key={i}>{gap}</List.Item>
          ))}
        </List>
      </section>
    </div>
  );
}
