export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex items-center justify-center bg-owly-bg px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
