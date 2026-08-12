"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, updateUser, changePassword } from "@/lib/auth-client";
import {
  Avatar,
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Text,
  Title,
  Stack,
  Group,
  Divider,
  Tabs,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Loader2, KeyRound, Save, Upload, User } from "lucide-react";

// ---------------------------------------------------------------------------
// Better Auth English → Vietnamese error translation
// ---------------------------------------------------------------------------

function translateError(message?: string): string {
  if (!message) return "";
  const map: Record<string, string> = {
    "invalid password": "Mật khẩu hiện tại không đúng.",
    "password is too weak": "Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn.",
    "user not found": "Không tìm thấy người dùng.",
    "invalid email or password": "Email hoặc mật khẩu không đúng.",
  };
  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key)) return value;
  }
  return message;
}

export default function ProfilePage() {
  const { data: sessionData, isPending } = useSession();
  const sUser = sessionData?.user as Record<string, any> | undefined;

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Mock Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sUser?.name) {
      setName(sUser.name);
    }
  }, [sUser?.name]);

  // ---------------------------------------------------------------------------
  // Loading / No session guards
  // ---------------------------------------------------------------------------

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!sUser) return null;

  // ---------------------------------------------------------------------------
  // Helpers & Error Handlers
  // ---------------------------------------------------------------------------

  const clearNameError = () => {
    if (nameError) setNameError("");
  };

  const clearPasswordError = (field: string) => {
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Avatar preview mock
  // ---------------------------------------------------------------------------

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        notifications.show({
          title: "Lỗi dung lượng",
          message: "Dung lượng file vượt quá 1 MB.",
          color: "red",
        });
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      notifications.show({
        title: "Tải ảnh thành công",
        message: "Ảnh đại diện đã được thay đổi xem trước.",
        color: "green",
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Save display name
  // ---------------------------------------------------------------------------

  const handleSaveName = async () => {
    if (!name.trim()) {
      setNameError("Tên hiển thị không được để trống.");
      return;
    }

    setSavingName(true);
    try {
      const { error } = await updateUser({ name: name.trim() });
      if (error) {
        notifications.show({
          title: "Lỗi",
          message: translateError(error.message) || "Không thể cập nhật tên hiển thị.",
          color: "red",
        });
      } else {
        notifications.show({
          title: "Thành công",
          message: "Đã cập nhật thông tin hồ sơ.",
          color: "green",
        });
      }
    } catch (err: any) {
      notifications.show({
        title: "Lỗi",
        message: err?.message || "Không thể cập nhật tên hiển thị.",
        color: "red",
      });
    } finally {
      setSavingName(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Change password
  // ---------------------------------------------------------------------------

  const handleChangePassword = async () => {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
    if (!newPassword) errs.newPassword = "Vui lòng nhập mật khẩu mới.";
    else if (newPassword.length < 8) errs.newPassword = "Mật khẩu mới phải ít nhất 8 ký tự.";
    if (newPassword !== confirmPassword) errs.confirmPassword = "Xác nhận mật khẩu không khớp.";

    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (error) {
        notifications.show({
          title: "Lỗi",
          message: translateError(error.message) || "Không thể đổi mật khẩu. Kiểm tra lại mật khẩu hiện tại.",
          color: "red",
        });
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordErrors({});
        notifications.show({
          title: "Thành công",
          message: "Đã đổi mật khẩu thành công. Vui lòng dùng mật khẩu mới cho lần đăng nhập tiếp theo.",
          color: "green",
        });
      }
    } catch (err: any) {
      notifications.show({
        title: "Lỗi",
        message: err?.message || "Không thể đổi mật khẩu. Kiểm tra lại mật khẩu hiện tại.",
        color: "red",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const usernameVal = sUser.email?.split("@")[0] || "user_" + sUser.id?.substring(0, 8);
  const avatarSrc = avatarPreview || sUser.image || undefined;

  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
      <Paper p="xl" radius="md" className="bg-surface-app border border-border-app w-full">
        {/* Header */}
        <div className="pb-4 mb-6 border-b border-border-app">
          <Title order={3} className="font-heading text-text-app font-medium">
            Hồ Sơ Của Tôi
          </Title>
          <Text size="sm" className="text-text-muted mt-1">
            Quản lý thông tin cá nhân và bảo mật tài khoản
          </Text>
        </div>

        {/* Tabs for Information Edit vs Password Change */}
        <Tabs defaultValue="info" color="brand" variant="outline" keepMounted={false}>
          <Tabs.List className="mb-6">
            <Tabs.Tab value="info" leftSection={<User className="w-4 h-4" />}>
              Thông tin cá nhân
            </Tabs.Tab>
            <Tabs.Tab value="password" leftSection={<KeyRound className="w-4 h-4" />}>
              Đổi mật khẩu
            </Tabs.Tab>
          </Tabs.List>

          {/* TAB 1: PROFILE INFO */}
          <Tabs.Panel value="info">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
              {/* Left Form */}
              <div className="md:col-span-8 space-y-6">
                <Stack gap="lg">
                  {/* Username Field */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                    <div className="sm:col-span-4 text-sm text-text-muted font-medium sm:text-right">
                      Tên đăng nhập
                    </div>
                    <div className="sm:col-span-8 space-y-1">
                      <Text className="font-medium text-text-app text-sm sm:text-base">
                        {usernameVal}
                      </Text>
                      <Text size="xs" className="text-text-muted">
                        Tên đăng nhập chỉ có thể thay đổi một lần.
                      </Text>
                    </div>
                  </div>

                  {/* Name Field */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                    <label className="sm:col-span-4 text-sm text-text-muted font-medium sm:text-right">
                      Tên hiển thị
                    </label>
                    <div className="sm:col-span-8">
                      <TextInput
                        value={name}
                        onChange={(e) => {
                          setName(e.currentTarget.value);
                          clearNameError();
                        }}
                        error={nameError || undefined}
                        placeholder="Nhập tên hiển thị"
                        className="font-body"
                        size="md"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                    <div className="sm:col-span-4 text-sm text-text-muted font-medium sm:text-right">
                      Email
                    </div>
                    <div className="sm:col-span-8">
                      <Text className="text-text-app text-sm sm:text-base font-medium">
                        {sUser.email ? `${sUser.email.slice(0, 2)}*****${sUser.email.slice(sUser.email.indexOf("@"))}` : "—"}
                      </Text>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 pt-4">
                    <div className="sm:col-span-4 hidden sm:block"></div>
                    <div className="sm:col-span-8">
                      <Button
                        onClick={handleSaveName}
                        loading={savingName}
                        leftSection={savingName ? undefined : <Save className="w-4 h-4" />}
                        color="brand"
                        size="md"
                        px="xl"
                      >
                        Lưu thông tin
                      </Button>
                    </div>
                  </div>
                </Stack>
              </div>

              {/* Right Avatar Panel */}
              <div className="md:col-span-4 md:border-l md:border-border-app md:pl-8 flex flex-col items-center justify-center py-4">
                <Stack align="center" gap="md">
                  <Avatar
                    src={avatarSrc}
                    size={120}
                    radius="100%"
                    className="border-2 border-border-app shadow-sm bg-gray-100"
                  >
                    {(sUser.name || "U").substring(0, 2).toUpperCase()}
                  </Avatar>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/jpeg,image/png"
                    className="hidden"
                  />

                  <Button
                    variant="default"
                    size="sm"
                    leftSection={<Upload className="w-4 h-4" />}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-border-app text-text-app"
                  >
                    Chọn ảnh
                  </Button>

                  <div className="text-center space-y-0.5 text-xs text-text-muted">
                    <Text size="xs" className="text-text-muted">Dung lượng file tối đa 1 MB</Text>
                    <Text size="xs" className="text-text-muted">Định dạng: .JPEG, .PNG</Text>
                  </div>
                </Stack>
              </div>
            </div>
          </Tabs.Panel>

          {/* TAB 2: CHANGE PASSWORD */}
          <Tabs.Panel value="password">
            <div className="max-w-xl py-4 space-y-6">
              <Stack gap="md">
                <Text size="sm" className="text-text-muted">
                  Để đảm bảo an toàn, vui lòng không chia sẻ mật khẩu của bạn với người khác.
                </Text>

                <PasswordInput
                  label="Mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.currentTarget.value);
                    clearPasswordError("currentPassword");
                  }}
                  error={passwordErrors.currentPassword || undefined}
                  placeholder="Nhập mật khẩu hiện tại"
                  size="md"
                />

                <PasswordInput
                  label="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.currentTarget.value);
                    clearPasswordError("newPassword");
                  }}
                  error={passwordErrors.newPassword || undefined}
                  placeholder="Ít nhất 8 ký tự"
                  size="md"
                />

                <PasswordInput
                  label="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.currentTarget.value);
                    clearPasswordError("confirmPassword");
                  }}
                  error={passwordErrors.confirmPassword || undefined}
                  placeholder="Nhập lại mật khẩu mới"
                  size="md"
                />

                <Button
                  color="brand"
                  onClick={handleChangePassword}
                  loading={changingPassword}
                  className="self-start mt-2"
                  size="md"
                  px="xl"
                >
                  Xác nhận đổi mật khẩu
                </Button>
              </Stack>
            </div>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </div>
  );
}

