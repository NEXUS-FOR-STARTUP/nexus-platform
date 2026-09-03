import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function usePackagePrice(packageId: string | undefined) {
  return useQuery({
    queryKey: ["package", "price", packageId],
    queryFn: () => apiClient.get(`/packages/${packageId}`).then((r) => r.data as { price: number }),
    enabled: Boolean(packageId),
  });
}
