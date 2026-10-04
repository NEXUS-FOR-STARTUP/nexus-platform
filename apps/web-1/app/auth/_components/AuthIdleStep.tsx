"use client";

import Link from "next/link";
import { Anchor, Button, Checkbox, Text } from "@mantine/core";
import { GoogleButton } from "./GoogleButton";

interface AuthIdleStepProps {
  agreed: boolean;
  setAgreed: (val: boolean) => void;
  busy: boolean;
  googleLoading: boolean;
  onGoogle: () => void;
  onEmail: () => void;
}

export function AuthIdleStep({
  agreed,
  setAgreed,
  busy,
  googleLoading,
  onGoogle,
  onEmail,
}: AuthIdleStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <GoogleButton
          onClick={() => {
            if (agreed) onGoogle();
          }}
          loading={googleLoading}
          disabled={!agreed}
        >
          Tiếp tục với Google
        </GoogleButton>

        <Button
          fullWidth
          radius="md"
          size="md"
          variant="default"
          className="h-10 cursor-pointer font-medium border-border-app hover:bg-surface-soft transition-colors"
          onClick={() => {
            if (agreed) onEmail();
          }}
          disabled={!agreed}
        >
          Tiếp tục với Email
        </Button>
      </div>

      <Checkbox
        checked={agreed}
        onChange={(e) => setAgreed(e.currentTarget.checked)}
        disabled={busy}
        radius="sm"
        color="brand"
        label={
          <Text size="xs" className="font-body text-text-muted select-none">
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <Anchor
              component={Link}
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand font-medium hover:underline inline"
              onClick={(e) => e.stopPropagation()}
            >
              Điều khoản dịch vụ
            </Anchor>{" "}
            và{" "}
            <Anchor
              component={Link}
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand font-medium hover:underline inline"
              onClick={(e) => e.stopPropagation()}
            >
              Chính sách bảo mật
            </Anchor>{" "}
            của Nexus.
          </Text>
        }
      />
    </div>
  );
}
