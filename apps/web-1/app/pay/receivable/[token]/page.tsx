import type { Metadata } from "next";
import PayReceivableView from "./_components/PayReceivableView";

// Token lives in the URL: never index, never leak it through the Referer header.
export const metadata: Metadata = {
  title: "Thanh toán",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PayReceivableView token={token} />;
}
