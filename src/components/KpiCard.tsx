interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export default function KpiCard({ title, value, sub, color = "blue" }: KpiCardProps) {
  const accent: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-3xl font-bold ${accent[color] ?? accent.blue}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
