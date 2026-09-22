import {
  ROLE_TRACK_CODES,
  ROLE_TRACK_LABELS,
  TEAM_FIT_AREA_STATE_LABELS,
  TEAM_FIT_LEVEL_LABELS,
  TEAM_FIT_VERDICT_LABELS,
  isTeamFitFreeReportV2,
  type TeamFitAiOutput,
  type TeamFitHandoffItem,
  type TeamFitIndustryRole,
  type TeamFitLegacyFreeReport,
  type TeamFitMachineStats,
  type TeamFitSavedResult,
} from "@repo/validation";
import { Badge, Card, Divider, List, Text } from "@mantine/core";

// Quy ước đọc dễ: mọi dòng nội dung dùng size sm, lh 1.6; chỉ chú thích meta mới dùng xs.
// Toàn bộ kết quả nằm trong 1 Card, các phần cách nhau bằng Divider, không icon trang trí.
export function TeamFitReportCard({ report }: { report: TeamFitSavedResult }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text size="md" fw={700}>
        Kết quả sơ bộ
      </Text>
      <Text size="xs" c="dimmed">
        Dựa trên mô tả ngắn của nhóm.
      </Text>
      <Divider my="md" />
      {isTeamFitFreeReportV2(report) ? (
        <FreeReportBody
          machineStats={report.machineStats}
          ai={report.ai}
          handoff={report.handoff}
        />
      ) : (
        <LegacyReportBody report={report} />
      )}
    </Card>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text size="sm" fw={700} mb="xs">
      {children}
    </Text>
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
  const missingRoles = ai?.industryRoles.filter((role) => role.conThieu) ?? [];
  return (
    <>
      <SectionTitle>Đã kiểm tra</SectionTitle>
      <Text size="sm" lh={1.6} mb="xs">
        {machineStats.distinctMajors} ngành đào tạo · phủ {coveredTracks}/
        {ROLE_TRACK_CODES.length} mảng nghề · {machineStats.experiencedCount}{" "}
        người có kinh nghiệm · {machineStats.emptyFields.length} ô còn trống
      </Text>
      <div className="space-y-1">
        {ROLE_TRACK_CODES.map((code) => (
          <div key={code} className="flex items-center justify-between gap-2">
            <Text size="sm">{ROLE_TRACK_LABELS[code]}</Text>
            <Text size="sm" c={machineStats.trackCoverage[code] > 0 ? undefined : "dimmed"}>
              {machineStats.trackCoverage[code] > 0
                ? `${machineStats.trackCoverage[code]} người`
                : "Chưa có ai"}
            </Text>
          </div>
        ))}
      </div>
      {machineStats.emptyFields.length > 0 && (
        <Text size="sm" c="dimmed" mt="xs">
          Ô còn để trống: {machineStats.emptyFields.join(", ")}
        </Text>
      )}

      <Divider my="md" />
      <SectionTitle>AI nhận định</SectionTitle>
      {ai ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Text size="sm" fw={600}>
              Kết luận sơ bộ:
            </Text>
            <Badge
              size="sm"
              variant="light"
              color={ai.verdict === "san_sang" ? "green" : "orange"}
            >
              {TEAM_FIT_VERDICT_LABELS[ai.verdict]}
            </Badge>
          </div>
          {ai.areas.map((area) => (
            <div key={area.ten}>
              <div className="flex items-center gap-2">
                <Badge
                  size="xs"
                  variant="light"
                  color={area.trangThai === "yeu" ? "red" : "green"}
                >
                  {TEAM_FIT_AREA_STATE_LABELS[area.trangThai]}
                </Badge>
                <Text size="sm" fw={600}>
                  {area.ten}
                </Text>
                <Text size="sm" c="dimmed">
                  Mức độ: {TEAM_FIT_LEVEL_LABELS[area.mucDo]}
                </Text>
              </div>
              <Text size="sm" lh={1.6} mt={2}>
                {area.lyDo}
              </Text>
              <Text size="sm" c="dimmed" fs="italic" lh={1.6}>
                Dẫn chứng: {area.danChung}
              </Text>
            </div>
          ))}
          <div>
            <Text size="sm" fw={600}>
              Vai trò còn thiếu
            </Text>
            {missingRoles.length > 0 ? (
              <List spacing={4} size="sm">
                {missingRoles.map((role: TeamFitIndustryRole) => (
                  <List.Item key={role.vaiTro}>
                    {role.vaiTro} — {role.lyDo}
                  </List.Item>
                ))}
              </List>
            ) : (
              <Text size="sm" c="dimmed">
                Không thấy vai trò cốt lõi nào còn thiếu.
              </Text>
            )}
          </div>
          <div>
            <Text size="sm" fw={600}>
              Câu hội đồng có thể hỏi
            </Text>
            <List type="ordered" spacing={4} size="sm">
              {ai.committeeQuestions.map((question) => (
                <List.Item key={question}>{question}</List.Item>
              ))}
            </List>
          </div>
        </div>
      ) : (
        <Text size="sm" c="dimmed" lh={1.6}>
          Lượt này AI chưa đưa ra nhận định. Phần &quot;Đã kiểm tra&quot; và các
          câu bên dưới vẫn đúng — nhóm bấm &quot;Kiểm tra lại&quot; để thử lại
          phần nhận định.
        </Text>
      )}

      <Divider my="md" />
      <SectionTitle>Những câu nhóm chưa trả lời được</SectionTitle>
      <Text size="sm" c="dimmed" lh={1.6} mb="xs">
        Lượt kiểm tra nhanh chỉ đọc phần mô tả ngắn nên 4 câu này chưa trả lời
        được. Kèm theo là thứ nhóm cần nộp để trả lời.
      </Text>
      <List type="ordered" spacing="xs" size="sm">
        {handoff.map((item) => (
          <List.Item key={item.cauHoi}>
            {item.cauHoi}
            <Text size="xs" c="dimmed">
              Cần nộp: {item.canNopGi}
            </Text>
          </List.Item>
        ))}
      </List>
    </>
  );
}

function LegacyReportBody({ report }: { report: TeamFitLegacyFreeReport }) {
  return (
    <>
      <SectionTitle>Nhóm có thể đang thiếu</SectionTitle>
      <List spacing="xs" size="sm" mb="md">
        {report.teamGaps.map((gap, i) => (
          <List.Item key={i}>{gap}</List.Item>
        ))}
      </List>
      <SectionTitle>Ý tưởng cần làm rõ thêm</SectionTitle>
      <List spacing="xs" size="sm">
        {report.commercialGaps.map((gap, i) => (
          <List.Item key={i}>{gap}</List.Item>
        ))}
      </List>
    </>
  );
}
