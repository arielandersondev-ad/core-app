import type { SVGProps } from "react";
import { crowantGeometry } from "./crowant-geometry";

export function CrowAntMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 580 350" fillRule="evenodd" shapeRendering="geometricPrecision" aria-hidden="true" {...props}>
      <path d={crowantGeometry.monogramC} fill="var(--primary)" />
      <path d={crowantGeometry.monogramA} fill="var(--hazelnut)" />
    </svg>
  );
}
