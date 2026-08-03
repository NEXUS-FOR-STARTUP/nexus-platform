import { AppError } from "../../../shared/domain/app-error.js";
import { asNonEmptyString } from "../../../shared/infrastructure/http-helpers.js";
import { isFinalCaseStage } from "../domain/case.types.js";
import {
  findCaseByIdWithMembers,
  findFirstIntakeUnit,
  updateCaseSettings,
} from "../infrastructure/persistence/case.repository.js";
import { prisma } from "../../../db.js";
import type { UpdateCaseSettingsRequest } from "./cases.dto.js";

export async function updateCaseSettingsUseCase(
  userId: string,
  userRole: string,
  caseId: string,
  body: UpdateCaseSettingsRequest,
) {
  const existingCase = await findCaseByIdWithMembers(caseId);

  if (!existingCase) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  const isOwner = existingCase.owner_auth_user_id === userId;
  const isMember = existingCase.members.some((m: any) => m.auth_user_id === userId);
  const isAdmin = userRole === "admin";

  if (!isOwner && !isMember && !isAdmin) {
    throw new AppError(403, "FORBIDDEN", "Không có quyền chỉnh sửa dự án này");
  }

  if (isFinalCaseStage(existingCase.user_facing_stage)) {
    throw new AppError(
      400,
      "INVALID_CASE_STAGE",
      "Dự án đã ở trạng thái cuối, không thể chỉnh sửa cài đặt",
    );
  }

  if (body.team_name !== undefined) {
    if (
      typeof body.team_name !== "string" ||
      (body.team_name.trim().length > 0 && body.team_name.trim().length < 2) ||
      body.team_name.trim().length > 100
    ) {
      throw new AppError(400, "VALIDATION_ERROR", "Tên nhóm phải từ 2 đến 100 ký tự");
    }
  }
  if (body.school !== undefined) {
    if (
      typeof body.school !== "string" ||
      (body.school.trim().length > 0 && body.school.trim().length < 2) ||
      body.school.trim().length > 100
    ) {
      throw new AppError(400, "VALIDATION_ERROR", "Tên trường phải từ 2 đến 100 ký tự");
    }
  }
  if (body.course_context !== undefined) {
    if (
      typeof body.course_context !== "string" ||
      (body.course_context.trim().length > 0 &&
        body.course_context.trim().length < 2) ||
      body.course_context.trim().length > 100
    ) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Thông tin môn học phải từ 2 đến 100 ký tự",
      );
    }
  }
  if (body.group_no !== undefined) {
    if (
      typeof body.group_no !== "string" ||
      (body.group_no.trim().length > 0 && body.group_no.trim().length > 10)
    ) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Số thứ tự nhóm không hợp lệ (tối đa 10 ký tự)",
      );
    }
  }

  const team_name =
    body.team_name === undefined
      ? existingCase.team_name
      : asNonEmptyString(body.team_name, 2) || null;
  const school =
    body.school === undefined
      ? existingCase.school
      : asNonEmptyString(body.school, 2) || null;
  const course_context =
    body.course_context === undefined
      ? existingCase.course_context
      : asNonEmptyString(body.course_context, 2) || null;
  const group_no =
    body.group_no === undefined
      ? existingCase.group_no
      : asNonEmptyString(body.group_no, 1) || null;

  const updatedCase = await updateCaseSettings(caseId, {
    team_name,
    school,
    course_context,
    group_no,
  });

  // Also update intake snapshot JSON if contact/idea/intake fields are provided
  if (body.contact || body.idea || body.current_blocker || body.support_needs) {
    const intakeUnit = await findFirstIntakeUnit(caseId);
    let parsedContent: Record<string, any> = {};
    if (intakeUnit?.content) {
      try {
        parsedContent = JSON.parse(intakeUnit.content);
      } catch {
        parsedContent = {};
      }
    }

    const mergedContent = {
      ...parsedContent,
      team_context: {
        ...(parsedContent.team_context || {}),
        project_name: team_name || parsedContent.team_context?.project_name,
        group_no: group_no || parsedContent.team_context?.group_no,
        school: school || parsedContent.team_context?.school,
        course_context: course_context || parsedContent.team_context?.course_context,
      },
      contact: {
        ...(parsedContent.contact || {}),
        ...(body.contact || {}),
      },
      idea_context: {
        ...(parsedContent.idea_context || parsedContent.idea || {}),
        ...(body.idea || {}),
      },
      idea: {
        ...(parsedContent.idea || parsedContent.idea_context || {}),
        ...(body.idea || {}),
      },
      current_blocker: body.current_blocker !== undefined ? body.current_blocker : parsedContent.current_blocker,
      support_needs: {
        ...(parsedContent.support_needs || {}),
        ...(body.support_needs || {}),
      },
      boundary_confirmations: body.boundary_confirmations !== undefined ? body.boundary_confirmations : parsedContent.boundary_confirmations,
      school: school || parsedContent.school,
      course_context: course_context || parsedContent.course_context,
    };

    if (intakeUnit) {
      await prisma.lifecycleUnit.update({
        where: { id: intakeUnit.id },
        data: { content: JSON.stringify(mergedContent) },
      });
    }
  }

  return updatedCase;
}
