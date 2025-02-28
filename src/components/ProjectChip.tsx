import clsx from "clsx";

export default function ProjectChip({
  isHighlighted,
  text,
}: {
  isHighlighted: boolean;
  text: string;
}) {
  return (
    <li
      className={clsx(
        "bg-gray-200 px-2 py-1 rounded-md",
        isHighlighted && "bg-green-500 text-white"
      )}
    >
      {text}
    </li>
  );
}
