export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24 gap-3 text-secondary text-sm">
      <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      불러오는 중…
    </div>
  );
}
