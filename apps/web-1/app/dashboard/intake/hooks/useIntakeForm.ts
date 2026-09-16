"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
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
  isAiOnlyPackage?: boolean;
}

export function useIntakeForm(options: UseIntakeFormOptions = {}) {
  const {
    packageId = "",
    caseId = null,
    initialData = null,
    isAiOnlyPackage = false,
  } = options;

  const isAiOnly =
    isAiOnlyPackage ||
    packageId === "pkg_ai_audit" ||
    initialData?.package_id === "pkg_ai_audit";
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoaded, setIsLoaded] = useState(false);
  const didHydrateRef = useRef(false);

  const baseInitialValues: IntakeData = initialData
    ? {
        ...INITIAL_VALUES,
        ...initialData,
        package_id: packageId || initialData.package_id || "",
        support_needs: isAiOnly
          ? { primary_need: "", extra_notes: "" }
          : { ...INITIAL_VALUES.support_needs, ...(initialData.support_needs || {}) },
      }
    : {
        ...INITIAL_VALUES,
        package_id: packageId,
        support_needs: isAiOnly
          ? { primary_need: "", extra_notes: "" }
          : INITIAL_VALUES.support_needs,
      };

  const [draftValues, setDraftValues] = useState<IntakeData>(baseInitialValues);

  const form = useForm({
    defaultValues: draftValues,
    onSubmit: async ({ value }) => {
      await submitMutation.mutateAsync(value);
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // UPDATE: wait for API snapshot then reset — defaultValues only apply on first mount
    if (caseId) {
      if (!initialData || didHydrateRef.current) return;
      didHydrateRef.current = true;
      const effectivePkg = packageId || initialData.package_id || "";
      const isAiCase = isAiOnly || effectivePkg === "pkg_ai_audit";
      const merged: IntakeData = {
        ...INITIAL_VALUES,
        ...initialData,
        package_id: effectivePkg,
        contact: { ...INITIAL_VALUES.contact, ...(initialData.contact || {}) },
        team_context: { ...INITIAL_VALUES.team_context, ...(initialData.team_context || {}) },
        support_needs: isAiCase
          ? { primary_need: "", extra_notes: "" }
          : { ...INITIAL_VALUES.support_needs, ...(initialData.support_needs || {}) },
      };
      setDraftValues(merged);
      form.reset(merged);
      setIsLoaded(true);
      return;
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const draftPkg = packageId || parsed.package_id || "";
        const isAiDraft = isAiOnly || draftPkg === "pkg_ai_audit";
        setDraftValues((prev) => ({
          ...prev,
          ...parsed,
          current_blocker: "",
          package_id: draftPkg,
          support_needs: isAiDraft
            ? { primary_need: "", extra_notes: "" }
            : parsed.support_needs || prev.support_needs,
        }));
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, [packageId, caseId, initialData, isAiOnly]);

  const submitMutation = useMutation({
    mutationFn: async (data: IntakeData) => {
      let payload: Partial<IntakeData> = { ...data };
      if (isAiOnly) {
        const { support_needs: _unused, ...restWithoutSupport } = payload;
        payload = restWithoutSupport;
      }
      if (caseId) {
        const response = await apiClient.post(`/cases/${caseId}/intake`, payload);
        return response.data;
      }
      const response = await apiClient.post("/cases", payload);
      return response.data;
    },
    onSuccess: (result, variables) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      const redirectId = caseId || result.id;
      queryClient.invalidateQueries({ queryKey: ["case", redirectId] });
      queryClient.invalidateQueries({ queryKey: ["case-intake", redirectId] });
      const targetPackage = variables.package_id || packageId;
      const shouldCheckout = !caseId && targetPackage && targetPackage !== "pkg_tf_free";
      router.push(`/dashboard/case/${redirectId}${shouldCheckout ? "?checkout=true" : ""}`);
    },
  });

  // Only persist draft for CREATE mode (new cases). UPDATE mode uses
  // initialData from the case API, not localStorage.
  const saveDraft = (values: IntakeData) => {
    if (typeof window !== "undefined" && !caseId) {
      const valuesToSave = { ...values };
      if (isAiOnly) {
        valuesToSave.support_needs = { primary_need: "", extra_notes: "" };
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(valuesToSave));
    }
  };

  const clearDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    const resetValues: IntakeData = initialData
      ? {
          ...INITIAL_VALUES,
          ...initialData,
          package_id: packageId || initialData.package_id || "",
          support_needs: isAiOnly
            ? { primary_need: "", extra_notes: "" }
            : initialData.support_needs || INITIAL_VALUES.support_needs,
        }
      : {
          ...INITIAL_VALUES,
          package_id: packageId,
          support_needs: isAiOnly
            ? { primary_need: "", extra_notes: "" }
            : INITIAL_VALUES.support_needs,
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
