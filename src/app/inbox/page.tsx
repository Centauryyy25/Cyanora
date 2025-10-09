import NavigationBar from "@/components/ui/navigation-bar";

export default function InboxPage() {
  return (
    <div className="min-h-[100dvh] p-4 pb-20">
      <h1 className="text-xl font-semibold">Inbox</h1>
      <p className="text-muted-foreground mt-2">
        Notifikasi dan pesan internal muncul di sini.
      </p>
      <NavigationBar homeHref="/home" />
    </div>
  );
}
