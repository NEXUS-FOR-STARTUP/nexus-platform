import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ServicePackage } from "@/types";

export function useAdminPackages() {
  const queryClient = useQueryClient();

  const packagesQuery = useQuery<ServicePackage[]>({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/packages");
      return response.data;
    },
    refetchInterval: 10000,
  });

  const updatePackagePriceMutation = useMutation({
    mutationFn: async ({
      packageId,
      price,
    }: {
      packageId: string;
      price: number;
    }) => {
      const response = await apiClient.put(`/admin/packages/${packageId}/price`, {
        price,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  const updatePackageStatusMutation = useMutation({
    mutationFn: async ({
      packageId,
      isActive,
    }: {
      packageId: string;
      isActive: boolean;
    }) => {
      const response = await apiClient.put(`/admin/packages/${packageId}/status`, {
        is_active: isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  return {
    packages: packagesQuery.data || [],
    isLoading: packagesQuery.isLoading,
    updatePackagePrice: updatePackagePriceMutation.mutateAsync,
    updatePackageStatus: updatePackageStatusMutation.mutateAsync,
    isUpdatingPrice: updatePackagePriceMutation.isPending,
    isUpdatingStatus: updatePackageStatusMutation.isPending,
    isUpdating: updatePackagePriceMutation.isPending || updatePackageStatusMutation.isPending,
  };
}
