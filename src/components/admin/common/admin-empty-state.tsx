type Props = {
  emoji: string;
  message: string;
  testId?: string;
};

export default function AdminEmptyState({ emoji, message, testId }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
      <span className="text-3xl">{emoji}</span>
      <p className="text-xs text-gray-500" data-testid={testId}>
        {message}
      </p>
    </div>
  );
}
