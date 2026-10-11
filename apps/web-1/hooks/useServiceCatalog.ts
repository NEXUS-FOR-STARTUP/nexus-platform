import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ServicePackageDto {
  id: string;
  name: string;
  price: number;
  credits_granted: number | null;
  service_type: { code: string; name: string } | null;
  is_active: boolean;
}

export function useServiceCatalog() {
  return useQuery<ServicePackageDto[]>({
    queryKey: ["packages"],
    queryFn: async () => {
      const res = await apiClient.get<ServicePackageDto[]>("/packages");
      return res.data;
    },
    staleTime: 1000 * 60 * 15,
  });
}

/** Purchasable packages for a service type code (e.g. cp1_audit): active, priced, with credits. Free init package (0đ) never appears in buy flows. */
export function filterPackagesByService(packages: ServicePackageDto[] | undefined, serviceCode: string): ServicePackageDto[] {
  if (!packages) return [];
  return packages.filter((p) => p.is_active && p.price > 0 && (p.credits_granted ?? 0) > 0 && p.service_type?.code === serviceCode);
}
