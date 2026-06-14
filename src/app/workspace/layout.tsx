export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This provides a clean, full-height background for your workspace
    // without interfering with the dynamic components inside the page.
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      {children}
    </div>
  );
}
