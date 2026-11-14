import { Metadata } from "next";
import Container from "@/components/Container";
import DropAdminClient from "./DropAdminClient";
import { getAllSpecialRewardClaims, getDropAnalytics } from "@/lib/ecosystemDb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — CXRNER DROP Management",
};

export default async function AdminDropPage() {
  const [claims, analytics] = await Promise.all([
    getAllSpecialRewardClaims(),
    getDropAnalytics(),
  ]);

  return (
    <div className="min-h-screen bg-[#07050d] text-white pt-24 pb-20 selection:bg-[#8737FF] selection:text-white">
      <Container className="max-w-6xl">
        <DropAdminClient initialClaims={claims} initialAnalytics={analytics} />
      </Container>
    </div>
  );
}
