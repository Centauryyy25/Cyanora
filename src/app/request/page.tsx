import NavigationBar from "@/components/ui/navigation-bar";

export default function RequestPage() {
  return (
    <div className="min-h-[100dvh] p-4 pb-20">
      <h1 className="text-xl font-semibold">Request</h1>
      <p className="text-muted-foreground mt-2">
        Pengajuan cuti, izin, atau permintaan lainnya akan dikelola di sini.
      </p>
      <NavigationBar homeHref="/home" />
    </div>
  );
}
