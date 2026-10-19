import { Button, Modal, Text } from "@mantine/core";

interface GuidedLeaveModalProps {
  opened: boolean;
  isSaving: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSaveAndLeave: () => void;
}

/** Asked when the user leaves the editor while drafts are still unsaved. */
export default function GuidedLeaveModal({ opened, isSaving, onClose, onDiscard, onSaveAndLeave }: GuidedLeaveModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Chưa lưu thay đổi" centered size="sm">
      <Text size="sm">Bạn có thay đổi chưa lưu. Muốn lưu trước khi quay về?</Text>
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button variant="default" size="sm" disabled={isSaving} onClick={onDiscard}>
          Bỏ thay đổi
        </Button>
        <Button size="sm" loading={isSaving} onClick={onSaveAndLeave}>
          Lưu và quay về
        </Button>
      </div>
    </Modal>
  );
}
