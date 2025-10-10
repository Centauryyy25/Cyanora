"use client";

import NavigationBar from "@/components/ui/navigation-bar";
import { PermissionGuard } from "@/components/permission-guard";
import { ApprovalCenter } from "@/components/approval-center";

export default function HRApprovalsPage() {
  return (
    <PermissionGuard requireAny={["LEAVE_APPROVE"]} redirectTo="/login">
      <main className="min-h-[100dvh] bg-background pb-24">
        <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-16 text-white">
          <h1 className="text-2xl font-semibold tracking-tight">Approval Center</h1>
          <p className="mt-1 text-sm text-white/80">Persetujuan Cuti/Izin/Sakit</p>
        </header>
        <ApprovalCenter />
        <NavigationBar homeHref="/home" />
      </main>
    </PermissionGuard>
  );
}
