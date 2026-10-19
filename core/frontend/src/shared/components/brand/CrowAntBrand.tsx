import { CrowAntMark } from "./CrowAntMark";

type CrowAntBrandProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function CrowAntBrand({
  compact = false,
  inverse = false,
}: CrowAntBrandProps) {
  return (
    <span className="inline-flex items-center gap-3" role="img" aria-label="CrowAnt">
      <CrowAntMark
        className={`h-9 w-[54px] shrink-0 ${inverse ? "[&_path]:fill-current" : ""}`}
      />

      {!compact && (
        <span className="font-display text-[22px] font-semibold tracking-[-0.055em]">
          <span className={inverse ? "" : "text-primary"}>Crow</span>
          <span className={inverse ? "opacity-80" : "text-hazelnut"}>Ant</span>
        </span>
      )}
    </span>
  );
}
