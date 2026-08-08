import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Trash2,
  ExternalLink,
  Search,
  AlertCircle,
  Calendar,
  User,
  Folder,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  ActionIcon,
  Pagination,
  Badge,
  TextInput,
  Select,
  Group,
  Text,
  Tooltip,
  Modal,
  Button,
} from "@mantine/core";

interface DocumentRecordDto {
  id: string;
  case_id: string;
  case_code: string;
  team_name: string;
  checkpoint_id: string;
  doc_type: string;
  original_name: string;
  canonical_name: string;
  extension: string;
  mime_type: string;
  file_url: string;
  download_url: string;
  cloudinary_public_id: string;
  uploaded_by: string;
  uploaded_by_email: string;
  created_at: string;
}

interface AdminDocumentsTableProps {
  documents: DocumentRecordDto[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export default function AdminDocumentsTable({
  documents,
  onDelete,
  isDeleting,
}: AdminDocumentsTableProps) {
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExtension, setSelectedExtension] = useState("all");
  const [selectedDocType, setSelectedDocType] = useState("all");
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; name: string } | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (ext?: string | null) => {
    const e = ext?.toLowerCase() || "";
    if (e === "pdf") return <FileText className="w-4 h-4 text-red-500 shrink-0" />;
    if (["docx", "doc"].includes(e)) return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
    if (["xlsx", "xls", "csv"].includes(e)) return <FileText className="w-4 h-4 text-green-500 shrink-0" />;
    if (["pptx", "ppt"].includes(e)) return <FileText className="w-4 h-4 text-orange-500 shrink-0" />;
    if (["md", "txt"].includes(e)) return <FileText className="w-4 h-4 text-gray-500 shrink-0" />;
    return <FileText className="w-4 h-4 text-brand shrink-0" />;
  };

  // Get unique file extensions for the filter
  const availableExtensions = useMemo(() => {
    const exts = new Set<string>();
    documents.forEach((d) => {
      if (d.extension) {
        exts.add(d.extension.toLowerCase());
      }
    });
    return Array.from(exts).sort();
  }, [documents]);

  // Get unique document types for the filter
  const availableDocTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((d) => {
      if (d.doc_type) {
        types.add(d.doc_type);
      }
    });
    return Array.from(types).sort();
  }, [documents]);

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let result = [...documents];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
         (d) =>
           d.original_name?.toLowerCase().includes(query) ||
           d.case_code?.toLowerCase().includes(query) ||
           d.team_name?.toLowerCase().includes(query) ||
           d.uploaded_by?.toLowerCase().includes(query) ||
           d.uploaded_by_email?.toLowerCase().includes(query)
      );
    }

    // Extension filter
    if (selectedExtension && selectedExtension !== "all") {
      result = result.filter((d) => d.extension?.toLowerCase() === selectedExtension);
    }

    // Document type filter
    if (selectedDocType && selectedDocType !== "all") {
      result = result.filter((d) => d.doc_type === selectedDocType);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "created_at_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "created_at_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "name_asc") {
        return (a.original_name || "").localeCompare(b.original_name || "");
      }
      if (sortBy === "name_desc") {
        return (b.original_name || "").localeCompare(a.original_name || "");
      }
      return 0;
    });

    return result;
  }, [documents, searchQuery, selectedExtension, selectedDocType, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, selectedExtension, selectedDocType, sortBy]);

  const handleDeleteClick = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${name}"?\nHành động này sẽ xóa file khỏi Cloudinary và gỡ hoàn toàn khỏi cơ sở dữ liệu.`)) {
      onDelete(id);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="p-8 border border-border-app rounded-lg bg-surface-app text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
          <FileText className="w-5 h-5 text-text-muted" />
        </div>
        <div className="space-y-0.5">
          <p className="font-heading font-semibold text-xs text-text-app">Không có tài liệu nào</p>
          <p className="font-body text-base text-text-muted">
            Hệ thống hiện tại chưa có dữ liệu tài liệu nào được tải lên.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredAndSortedDocuments.length / itemsPerPage);
  const paginatedDocs = filteredAndSortedDocuments.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Group gap="sm" mb="md" style={{ width: "100%" }}>
        <TextInput
          placeholder="Tìm theo tên tài liệu, mã hồ sơ, người tải..."
          leftSection={<Search className="w-4 h-4 text-text-muted" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          style={{ flexGrow: 1 }}
        />
        <Select
          placeholder="Định dạng"
          data={[
            { value: "all", label: "Tất cả định dạng" },
            ...availableExtensions.map((ext) => ({ value: ext, label: `.${ext.toUpperCase()}` })),
          ]}
          value={selectedExtension}
          onChange={(val) => setSelectedExtension(val || "all")}
          radius="md"
          style={{ width: 150 }}
        />
        <Select
          placeholder="Loại tài liệu"
          data={[
            { value: "all", label: "Tất cả loại" },
            ...availableDocTypes.map((type) => ({ value: type, label: type })),
          ]}
          value={selectedDocType}
          onChange={(val) => setSelectedDocType(val || "all")}
          radius="md"
          style={{ width: 150 }}
        />
        <Select
          placeholder="Sắp xếp"
          data={[
            { value: "created_at_desc", label: "Mới nhất" },
            { value: "created_at_asc", label: "Cũ nhất" },
            { value: "name_asc", label: "Tên (A-Z)" },
            { value: "name_desc", label: "Tên (Z-A)" },
          ]}
          value={sortBy}
          onChange={(val) => setSortBy(val || "created_at_desc")}
          radius="md"
          style={{ width: 140 }}
        />
      </Group>

      {/* Table */}
      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead className="bg-brand-soft">
            <Table.Tr>
              <Table.Th className="text-left min-w-[200px]">Tên tài liệu</Table.Th>
              <Table.Th className="text-left w-20">Định dạng</Table.Th>
              <Table.Th className="text-left w-28">Loại</Table.Th>
              <Table.Th className="text-left min-w-[150px]">Dự án liên quan</Table.Th>
              <Table.Th className="text-left min-w-[150px]">Người tải lên</Table.Th>
              <Table.Th className="text-left min-w-[140px]">Ngày tải</Table.Th>
              <Table.Th className="text-center w-20" style={{ textAlign: "center" }}>Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredAndSortedDocuments.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center py-8 text-text-muted font-body text-xs">
                  Không tìm thấy tài liệu phù hợp với bộ lọc hiện tại.
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedDocs.map((doc) => (
                <Table.Tr key={doc.id} className="hover:bg-surface-soft/30 transition-colors">
                  {/* File name & Download URL */}
                  <Table.Td>
                    <div className="flex items-center gap-2 max-w-[280px]">
                      {getFileIcon(doc.extension)}
                      <div className="truncate">
                        {doc.file_url ? (
                          <a
                            href={doc.download_url || doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-brand hover:underline flex items-center gap-1 inline-flex"
                            title={doc.original_name}
                          >
                            <span className="truncate max-w-[220px]">{doc.original_name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                          </a>
                        ) : (
                          <span className="text-text-app font-semibold" title={doc.original_name}>
                            {doc.original_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Table.Td>

                  {/* Extension */}
                  <Table.Td className="font-mono text-base">
                    <Badge color="gray" variant="light" size="sm">
                      {doc.extension ? `.${doc.extension.toUpperCase()}` : "RAW"}
                    </Badge>
                  </Table.Td>

                  {/* Doc type */}
                  <Table.Td>
                    <Badge color="blue" variant="light" size="sm">
                      {doc.doc_type}
                    </Badge>
                  </Table.Td>

                  {/* Related Case */}
                  <Table.Td>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-heading font-semibold text-base text-text-app flex items-center gap-1">
                        <Folder className="w-3.5 h-3.5 text-brand" />
                        {doc.case_code}
                      </span>
                      <span className="text-base text-text-muted truncate max-w-[180px]">
                        {doc.team_name}
                      </span>
                    </div>
                  </Table.Td>

                  {/* Uploaded By */}
                  <Table.Td>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-base text-text-app flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-text-muted" />
                        {doc.uploaded_by}
                      </span>
                      <span className="text-base text-text-muted truncate max-w-[180px]">
                        {doc.uploaded_by_email}
                      </span>
                    </div>
                  </Table.Td>

                  {/* Date Created */}
                  <Table.Td className="text-text-subtle text-base">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      {formatDate(doc.created_at)}
                    </span>
                  </Table.Td>

                  {/* Action */}
                  <Table.Td className="text-center">
                    <Tooltip label="Xóa tài liệu khỏi hệ thống" withArrow position="left">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => setDeletingDoc({ id: doc.id, name: doc.original_name })}
                        disabled={isDeleting}
                        className="cursor-pointer mx-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            total={totalPages}
            value={activePage}
            onChange={setActivePage}
            color="brand"
            size="sm"
            radius="md"
          />
        </div>
      )}

      {/* Document Delete Confirmation Modal */}
      <Modal
        opened={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        title={
          <div className="flex items-center gap-2 text-danger font-heading font-semibold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Xác nhận xóa tài liệu</span>
          </div>
        }
        centered
        radius="lg"
        padding="lg"
        overlayProps={{ opacity: 0.55, blur: 4 }}
      >
        <div className="space-y-5 font-body">
          <p className="text-text-app text-sm leading-relaxed">
            Bạn có chắc chắn muốn xóa tài liệu{" "}
            <span className="font-bold text-danger bg-danger-soft/40 px-2 py-0.5 rounded-md inline-block my-0.5 border border-danger/20">
              {deletingDoc?.name}
            </span>{" "}
            khỏi hệ thống không?
          </p>
          <div className="p-3 bg-danger-soft/20 border border-danger/20 rounded-xl text-xs text-danger font-medium">
            Tài liệu sẽ bị xóa khỏi hệ thống và lưu trữ, hành động này không thể hoàn tác.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setDeletingDoc(null)}
              className="font-medium cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              color="red"
              size="sm"
              onClick={() => {
                if (deletingDoc) {
                  onDelete(deletingDoc.id);
                  setDeletingDoc(null);
                }
              }}
              className="font-medium cursor-pointer"
            >
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
