export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Removed overflow-x-hidden so sticky elements can function properly!
    <div className="min-h-screen bg-white w-full">
      {children}
    </div>
  );
}
