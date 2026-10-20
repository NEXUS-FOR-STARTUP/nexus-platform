import { ActionIcon, Group, Paper, Select, Stack, Text } from "@mantine/core";
import { X } from "@phosphor-icons/react/ssr";
import FileTypeIcon from "@/components/ui/FileTypeIcon";

const BYTES_PER_MB = 1024 * 1024;

interface UploadFileRowProps {
  file: File;
  category: string | null;
  categoryOptions: { value: string; label: string }[];
  onCategoryChange: (value: string) => void;
  onRemove: () => void;
}

export default function UploadFileRow({ file, category, categoryOptions, onCategoryChange, onRemove }: UploadFileRowProps) {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <FileTypeIcon name={file.name} size={36} />
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>{file.name}</Text>
              <Text size="sm" c="dimmed">{(file.size / BYTES_PER_MB).toFixed(2)} MB</Text>
            </Stack>
          </Group>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onRemove} aria-label={`Bỏ ${file.name}`}>
            <X size={16} />
          </ActionIcon>
        </Group>
        <Select
          label="Loại tài liệu"
          placeholder="Chọn loại tài liệu"
          description="AI dùng loại này để phân loại tài liệu của bạn"
          data={categoryOptions}
          value={category}
          onChange={(val) => val && onCategoryChange(val)}
          allowDeselect={false}
        />
      </Stack>
    </Paper>
  );
}
