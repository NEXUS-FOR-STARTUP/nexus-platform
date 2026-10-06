import { Skeleton, SimpleGrid, Container } from '@mantine/core';

export default function NewsLoading() {
  return (
    <Container size="lg" className="py-8 sm:py-12">
      {/* Top Search Toolbar Skeleton */}
      <div className="flex items-center gap-2.5 sm:gap-3 w-full mb-8">
        <Skeleton height={52} radius="md" className="flex-1" />
        <Skeleton height={52} width={100} radius="md" className="shrink-0" />
        <Skeleton height={52} width={110} radius="md" className="shrink-0" />
      </div>

      {/* Featured Hero Card Skeleton */}
      <div className="rounded-lg border border-border-app bg-surface-app p-5 sm:p-7 mb-8 sm:mb-10">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
          <Skeleton
            height={220}
            radius="md"
            className="w-full md:w-[320px] lg:w-[360px] aspect-[16/10] shrink-0"
          />
          <div className="flex-1 flex flex-col justify-between w-full">
            <div>
              {/* Author & Badge Row */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <Skeleton circle height={32} />
                  <div className="space-y-1.5">
                    <Skeleton height={13} width={100} radius="xs" />
                    <Skeleton height={11} width={65} radius="xs" />
                  </div>
                </div>
                <Skeleton height={24} width={75} radius="sm" />
              </div>

              {/* Title & Excerpt */}
              <Skeleton height={24} width="95%" radius="xs" mb={8} />
              <Skeleton height={24} width="70%" radius="xs" mb={14} />
              <Skeleton height={14} width="100%" radius="xs" mb={6} />
              <Skeleton height={14} width="85%" radius="xs" />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid of Horizontal Cards Skeleton */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border-app bg-surface-app p-4 sm:p-5 flex flex-col justify-between"
          >
            <div>
              {/* Card Author & Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton circle height={24} />
                  <Skeleton height={12} width={80} radius="xs" />
                  <Skeleton height={10} width={45} radius="xs" />
                </div>
                <Skeleton height={22} width={65} radius="sm" />
              </div>

              {/* Body: Title/Excerpt + Thumbnail */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Skeleton height={18} width="95%" radius="xs" mb={6} />
                  <Skeleton height={18} width="80%" radius="xs" mb={10} />
                  <Skeleton height={12} width="100%" radius="xs" mb={4} />
                  <Skeleton height={12} width="70%" radius="xs" />
                </div>
                <Skeleton
                  height={80}
                  radius="md"
                  className="w-[110px] sm:w-[125px] aspect-[16/10] shrink-0"
                />
              </div>
            </div>
          </div>
        ))}
      </SimpleGrid>
    </Container>
  );
}
