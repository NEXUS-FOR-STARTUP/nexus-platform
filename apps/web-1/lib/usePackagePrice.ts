import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface PackagePriceData {
  id: string;
  name: string;
  price: number;
}

export function usePackagePrice(packageId: string | undefined, enabled = true) {
  return useQuery<PackagePriceData>({
    queryKey: ["package", "price", packageId],
    queryFn: async () => {
      const res = await apiClient.get<PackagePriceData>(`/packages/${packageId}`);
      return res.data;
    },
    enabled: Boolean(packageId) && enabled,
    staleTime: 1000 * 60 * 30, // 30 phút
    gcTime: 1000 * 60 * 60, // 60 phút
  });
}
