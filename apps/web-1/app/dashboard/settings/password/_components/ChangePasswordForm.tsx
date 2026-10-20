"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Eye, EyeSlash, Info } from "@phosphor-icons/react";
import {
  useHasPasswordQuery,
  usePasswordMutations,
} from "../../hooks/usePasswordMutations";
import classes from "../password.module.css";

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordForm() {
  const hasPasswordQuery = useHasPasswordQuery();
  const hasPassword = hasPasswordQuery.data === true;
  const { changePassword, setPassword } = usePasswordMutations();
  const pending = changePassword.isPending || setPassword.isPending;

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    } as ChangePasswordFormValues,
    onSubmit: ({ value }) => {
      if (!hasPassword) {
        setPassword.mutate(value.newPassword, { onSuccess: () => form.reset() });
        return;
      }
      changePassword.mutate(
        { currentPassword: value.currentPassword, newPassword: value.newPassword },
        { onSuccess: () => form.reset() },
      );
    },
  });

  if (hasPasswordQuery.isError && hasPasswordQuery.data === undefined) {
    return (
      <p className={classes.note}>
        Không thể tải trạng thái mật khẩu. Vui lòng thử lại sau.
      </p>
    );
  }

  if (hasPasswordQuery.isPending) {
    return (
      <div className={classes.colNarrow}>
        <div className={classes.card}>
          <div className={classes.skeletonRow} style={{ height: "180px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className={classes.colNarrow}>
      <div className={classes.card}>
        <div className={classes.cardHead}>
          <h2 className={classes.title}>
            {hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu"}
          </h2>
          <p className={classes.note}>
            {hasPassword
              ? "Cập nhật mật khẩu để bảo mật tài khoản tốt hơn."
              : "Tài khoản đăng nhập qua mạng xã hội chưa có mật khẩu."}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          noValidate
        >
          {hasPassword && (
            <form.Field
              name="currentPassword"
              validators={{
                onChange: ({ value }: { value: string }) =>
                  !value ? "Vui lòng nhập mật khẩu hiện tại." : undefined,
              }}
            >
              {(field) => (
                <div className={classes.field}>
                  <label htmlFor="current-pw">
                    <span>Mật khẩu hiện tại</span>
                    <span className={classes.req}>*</span>
                  </label>
                  <div className={classes.inputWrap}>
                    <input
                      id="current-pw"
                      type={showCurrent ? "text" : "password"}
                      placeholder="Nhập mật khẩu hiện tại"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={`${classes.input} ${field.state.meta.errors[0] ? classes.inputErr : ""}`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className={classes.eyeBtn}
                      onClick={() => setShowCurrent(!showCurrent)}
                      tabIndex={-1}
                      aria-label={showCurrent ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showCurrent ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {field.state.meta.errors[0] && (
                    <p className={classes.errText}>{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>
          )}

          <form.Field
            name="newPassword"
            validators={{
              onChange: ({ value }: { value: string }) => {
                if (!value) return "Vui lòng nhập mật khẩu mới.";
                if (value.length < 8) return "Mật khẩu mới phải ít nhất 8 ký tự.";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className={classes.field}>
                <label htmlFor="new-pw">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{hasPassword ? "Mật khẩu mới" : "Mật khẩu"}</span>
                    <span className={classes.req}>*</span>
                    <span title="Tối thiểu 8 ký tự. Không nên trùng mật khẩu đã dùng ở nơi khác." style={{ cursor: "help", display: "inline-flex" }}>
                      <Info size={14} className="text-muted" />
                    </span>
                  </div>
                </label>
                <div className={classes.inputWrap}>
                  <input
                    id="new-pw"
                    type={showNew ? "text" : "password"}
                    placeholder="Ít nhất 8 ký tự"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={`${classes.input} ${field.state.meta.errors[0] ? classes.inputErr : ""}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={classes.eyeBtn}
                    onClick={() => setShowNew(!showNew)}
                    tabIndex={-1}
                    aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showNew ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {field.state.meta.errors[0] && (
                  <p className={classes.errText}>{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="confirmPassword"
            validators={{
              onChangeListenTo: ["newPassword"],
              onChange: ({ value }: { value: string }) =>
                value !== form.getFieldValue("newPassword")
                  ? "Xác nhận mật khẩu không khớp."
                  : undefined,
            }}
          >
            {(field) => (
              <div className={classes.field}>
                <label htmlFor="confirm-pw">
                  <span>{hasPassword ? "Xác nhận mật khẩu mới" : "Xác nhận mật khẩu"}</span>
                  <span className={classes.req}>*</span>
                </label>
                <div className={classes.inputWrap}>
                  <input
                    id="confirm-pw"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={`${classes.input} ${field.state.meta.errors[0] ? classes.inputErr : ""}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={classes.eyeBtn}
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                    aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {field.state.meta.errors[0] && (
                  <p className={classes.errText}>{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          <div className={classes.formActions}>
            <button
              type="submit"
              className={classes.btnPrimary}
              disabled={pending}
            >
              {pending ? "Đang xử lý..." : hasPassword ? "Xác nhận đổi mật khẩu" : "Đặt mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
