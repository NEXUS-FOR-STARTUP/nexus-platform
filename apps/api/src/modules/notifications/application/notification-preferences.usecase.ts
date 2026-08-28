import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  UpdateNotificationPreferenceSchema,
  toNotificationPreferenceResponse,
  type NotificationPreferenceResponse,
} from "@repo/validation";
import { AppError } from "../../../shared/domain/app-error.js";
import {
  findNotificationPreference,
  upsertNotificationPreference,
} from "../infrastructure/persistence/notification-preference.repository.js";

type PreferenceDeps = {
  findByUserId?: typeof findNotificationPreference;
  upsert?: typeof upsertNotificationPreference;
};

export async function getNotificationPreferencesUseCase(
  userId: string,
  deps: PreferenceDeps = {},
): Promise<NotificationPreferenceResponse> {
  const findByUserId = deps.findByUserId ?? findNotificationPreference;
  const row = await findByUserId(userId);
  return toNotificationPreferenceResponse(row ?? { ...DEFAULT_NOTIFICATION_PREFERENCES });
}

export async function updateNotificationPreferencesUseCase(
  userId: string,
  input: unknown,
  deps: PreferenceDeps = {},
): Promise<NotificationPreferenceResponse> {
  const parsed = UpdateNotificationPreferenceSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Dữ liệu cài đặt thông báo không hợp lệ", parsed.error.flatten());
  }

  const upsert = deps.upsert ?? upsertNotificationPreference;
  const saved = await upsert(userId, parsed.data);
  return toNotificationPreferenceResponse(saved);
}
