// ---------------------------------------------------------------------------
// CP1 Intake validation
// ---------------------------------------------------------------------------

export function validateCp1Intake(body: any): string[] {
  const errors: string[] = [];
  if (!body) {
    errors.push("Dữ liệu trống");
    return errors;
  }

  const hasText = (value: unknown, minLength = 1) => {
    return typeof value === "string" && value.trim().length >= minLength;
  };

  const hasLegacyContext =
    hasText(body.case_summary, 20) ||
    (Array.isArray(body.current_situations) &&
      body.current_situations.some((item: unknown) => hasText(item, 1)));

  // 1. Contact validation
  const contact = body.contact;
  if (!contact) {
    errors.push("Thiếu thông tin liên hệ");
  } else {
    if (!hasText(contact.full_name, 2)) {
      errors.push("Họ tên người liên hệ không hợp lệ (tối thiểu 2 ký tự)");
    }
    if (!hasText(contact.student_code, 5)) {
      errors.push("Mã số sinh viên không hợp lệ (tối thiểu 5 ký tự)");
    }
    if (!hasText(contact.team_role, 2)) {
      errors.push("Vai trò trong nhóm không hợp lệ");
    }
    if (!contact.zalo || typeof contact.zalo !== "string" || !/^\d{10}$/.test(contact.zalo.trim())) {
      errors.push("Số điện thoại Zalo không hợp lệ (phải bao gồm chính xác 10 chữ số)");
    }
    if (!contact.email || typeof contact.email !== "string" || !contact.email.includes("@")) {
      errors.push("Email liên hệ không hợp lệ");
    }
  }

  // 2. Main request validation
  const current_blocker = body.current_blocker;
  const support_needs = body.support_needs;

  const hasCurrentBlocker = hasText(current_blocker, 10);
  const hasPrimaryNeed =
    support_needs &&
    typeof support_needs.primary_need === "string" &&
    support_needs.primary_need.trim().length >= 5;

  if (!hasCurrentBlocker && !hasLegacyContext) {
    errors.push("Cần mô tả ngắn điểm kẹt hiện tại của nhóm");
  }
  if (!hasPrimaryNeed) {
    errors.push("Cần chọn nhu cầu hỗ trợ chính");
  }

  // 3. Documents validation
  const documents = body.documents;
  if (!Array.isArray(documents) || documents.length === 0) {
    errors.push("Thư mục tài liệu là bắt buộc");
  } else {
    const folderDoc = documents[0];
    const hasValidUrl = !!(
      (typeof folderDoc.file_url === 'string' && folderDoc.file_url.trim().length > 0) ||
      (typeof folderDoc.drive_url === 'string' && folderDoc.drive_url.trim().length > 0)
    );
    if (!hasValidUrl) {
      errors.push("Tài liệu phải có file_url hoặc drive_url hợp lệ");
    }
    if (
      !folderDoc.document_type ||
      typeof folderDoc.document_type !== "string" ||
      folderDoc.document_type.trim().length === 0
    ) {
      errors.push("Vui lòng chọn ít nhất một loại tài liệu có trong thư mục");
    }
  }

  // 4. Boundary confirmations validation
  const boundary_confirmations = body.boundary_confirmations;
  if (!Array.isArray(boundary_confirmations) || boundary_confirmations.length < 3) {
    errors.push("Phải xác nhận đầy đủ ít nhất 3 cam kết ranh giới");
  }

  return errors;
}
