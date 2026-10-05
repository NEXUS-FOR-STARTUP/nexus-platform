import { Skeleton, SimpleGrid } from '@mantine/core';

export default function NewsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8 sm:mb-12">
        <Skeleton height={40} width={280} radius="md" mb={12} />
        <Skeleton height={20} width={420} radius="md" mb={24} />
        <div className="flex gap-2">
          <Skeleton height={32} width={70} radius="xl" />
          <Skeleton height={32} width={80} radius="xl" />
          <Skeleton height={32} width={70} radius="xl" />
        </div>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-border-app bg-surface-app">
            <Skeleton height={180} radius="md" mb={14} />
            <Skeleton height={14} width="40%" radius="sm" mb={10} />
            <Skeleton height={20} width="90%" radius="sm" mb={8} />
            <Skeleton height={14} width="70%" radius="sm" />
          </div>
        ))}
      </SimpleGrid>
    </div>
  );
}
