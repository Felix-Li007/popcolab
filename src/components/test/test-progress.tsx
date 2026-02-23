type Props = {
  current: number;
  total: number;
};

export default function TestProgress({ current, total }: Props) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 font-medium">
          Question {current} of {total}
        </span>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-deep rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
