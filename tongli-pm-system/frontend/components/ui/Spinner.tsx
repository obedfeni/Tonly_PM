export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = { sm: "w-4 h-4 border-2", md: "w-6 h-6 border-2", lg: "w-10 h-10 border-[3px]" }[size];
  return <div className={`${s} border-blue-500 border-t-transparent rounded-full animate-spin`} />;
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
