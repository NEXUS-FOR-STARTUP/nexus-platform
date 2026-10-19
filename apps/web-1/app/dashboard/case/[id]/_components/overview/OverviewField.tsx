interface OverviewFieldProps {
  label: string;
  value: string;
}

/** Label + value; renders nothing when the project has no data for it. */
export default function OverviewField({ label, value }: OverviewFieldProps) {
  if (!value) return null;
  return (
    <div>
      <span className="text-text-muted text-sm font-medium block mb-0.5">{label}</span>
      <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed break-words">{value}</p>
    </div>
  );
}
