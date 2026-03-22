type TopNeededSkusListProps = {
  skus: string[];
  max?: number;
};

export function TopNeededSkusList({ skus, max = 5 }: TopNeededSkusListProps) {
  const show = skus.slice(0, max);
  if (show.length === 0) return <span className="text-gray-500">—</span>;
  return (
    <span className="text-sm">
      {show.join(", ")}
      {skus.length > max ? ` +${skus.length - max}` : ""}
    </span>
  );
}
