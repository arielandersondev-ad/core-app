import Image from "next/image";

type CrowAntBrandProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function CrowAntBrand({
  compact = false,
  inverse = false,
}: CrowAntBrandProps) {
  return (
    <span className="inline-flex items-center gap-3" aria-label="CrowAnt">
      <span
        className={`grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border ${
          inverse
            ? "border-primary-foreground/25 bg-primary-foreground/10"
            : "border-primary/35 bg-primary-subtle/55"
        }`}
      >
        <Image
          src="/brand/crowant-mark.png"
          alt=""
          aria-hidden="true"
          width={60}
          height={40}
          className="h-auto w-full object-contain dark:brightness-150"
          loading="eager"
        />
      </span>

      {!compact && (
        <span className="font-display text-xl font-semibold tracking-[0.12em]">
          CROW<span className={inverse ? "opacity-70" : "text-primary"}>ANT</span>
        </span>
      )}
    </span>
  );
}
