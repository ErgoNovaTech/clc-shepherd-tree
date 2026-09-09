import { getInitials } from "@/lib/utils/image";
import { cn } from "@/lib/utils/cn";

const COLORS = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function PersonAvatar({
  name,
  photo,
  size = "md",
  className,
}: {
  name: string;
  photo?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-12 w-12 text-sm", lg: "h-20 w-20 text-xl" }[size];

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local/base64 photos only, no remote loader needed
      <img
        src={photo}
        alt={name}
        className={cn(sizeClasses, "rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClasses,
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        colorForName(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
