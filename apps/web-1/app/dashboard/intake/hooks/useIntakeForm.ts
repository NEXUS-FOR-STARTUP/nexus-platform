import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { IntakeData, IntakeDocument } from "../_types/intake.types";

const LOCAL_STORAGE_KEY = "nexus_intake_draft";

const INITIAL_VALUES: IntakeData = {
  package_id: "",
  current_blocker: "",
  current_situations: [],
  case_summary: "",
  contact: {
    full_name: "",
    student_code: "",
    team_role: "",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "",
    project_name: "",
    team_status_summary: "",
  },
  support_needs: {
    primary_need: "",
    extra_notes: "",
  },
  documents: [],
  lecturer_feedback: "",
  expected_outputs: "",
  boundary_confirmations: [],
  school: "",
  course_context: "",
};

interface UseIntakeFormOptions {
  packageId?: string;
  caseId?: string | null;
  initialData?: IntakeData | null;
}

export function useIntakeForm(options: UseIntakeFormOptions = {}) {
  const { packageId = "", caseId = null, initialData = null } = options;

  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoaded, setIsLoaded] = useState(false);

  const baseInitialValues: IntakeData = initialData
    ? { ...INITIAL_VALUES, ...initialData, package_id: packageId || initialData.package_id || "" }
    : { ...INITIAL_VALUES, package_id: packageId };

  const [draftValues, setDraftValues] = useState<IntakeData>(baseInitialValues);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Only load localStorage draft in CREATE mode, not UPDATE mode.
      // UPDATE mode (caseId) should use intake_snapshot from API, not stale team-fit data.
      if (!caseId) {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setDraftValues((prev) => ({
              ...prev,
              ...parsed,
              package_id: packageId || parsed.package_id || "",
            }));
          } catch (e) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        }
      }
      setIsLoaded(true);
    }
  }, [packageId, caseId]);

  const submitMutation = useMutation({
    mutationFn: async (data: IntakeData) => {
      if (caseId) {
        const response = await apiClient.post(`/cases/${caseId}/intake`, data);
        return response.data;
      }
      const response = await apiClient.post("/cases", data);
      return response.data;
    },
    onSuccess: (result) => {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      const redirectId = caseId || result.id;
      router.push(`/dashboard/case/${redirectId}`);
    },
  });

  const form = useForm({
    defaultValues: draftValues,
    onSubmit: async ({ value }) => {
      await submitMutation.mutateAsync(value);
    },
  });

  useEffect(() => {
    if (isLoaded) {
      form.reset(draftValues);
    }
  }, [isLoaded, draftValues, form]);

  const saveDraft = (values: IntakeData) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(values));
    }
  };

  const clearDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    const resetValues: IntakeData = {
      ...INITIAL_VALUES,
      package_id: packageId,
    };
    setDraftValues(resetValues);
    form.reset(resetValues);
  };

  const addDocument = useCallback(
    (uploadResult: { file_url: string; original_name: string; document_type: string }) => {
      const currentDocs = (form.getFieldValue("documents") as IntakeDocument[]) || [];
      const newDoc: IntakeDocument = {
        source_type: "upload",
        file_url: uploadResult.file_url,
        document_type: uploadResult.document_type,
        role_description: uploadResult.original_name,
      };
      form.setFieldValue("documents", [...currentDocs, newDoc]);
    },
    [form],
  );

  const removeDocument = useCallback(
    (index: number) => {
      const currentDocs = (form.getFieldValue("documents") as IntakeDocument[]) || [];
      const updated = currentDocs.filter((_, i) => i !== index);
      form.setFieldValue("documents", updated);
    },
    [form],
  );

  return {
    form,
    isLoaded,
    saveDraft,
    clearDraft,
    addDocument,
    removeDocument,
    isSubmitting: submitMutation.isPending,
    error: submitMutation.error
      ? (submitMutation.error as any).response?.data?.message || "Đã xảy ra lỗi khi tạo hồ sơ."
      : null,
  };
}
