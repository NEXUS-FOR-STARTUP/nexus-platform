import Image from "next/image";

export default function MaintenancePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-app text-text-app text-center antialiased">
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Hình minh họa bảo trì */}
        <div className="w-full max-w-[340px] sm:max-w-[400px] mb-8">
          <Image
            src="/maintenance.svg"
            alt="Hệ thống đang bảo trì"
            width={400}
            height={260}
            priority
            className="w-full h-auto select-none pointer-events-none"
          />
        </div>

        {/* Tiêu đề tiếng Việt */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-app tracking-tight mb-3">
          Hệ thống đang bảo trì
        </h1>

        {/* Mô tả tiếng Việt */}
        <p className="text-sm sm:text-base text-text-muted max-w-md leading-relaxed">
          Trang web hiện đang trong quá trình bảo trì và nâng cấp hệ thống. Chúng tôi sẽ sớm quay trở lại.
        </p>
      </div>
    </main>
  );
}
