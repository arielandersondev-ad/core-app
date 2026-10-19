import type { SVGProps } from "react";
import { crowantGeometry } from "./crowant-geometry";

export function CrowAntAnimals(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 530 420" fillRule="evenodd" shapeRendering="geometricPrecision" aria-hidden="true" {...props}>
      <path d={crowantGeometry.crow} fill="var(--primary)" />
      <path d={crowantGeometry.ant} fill="var(--hazelnut)" />
    </svg>
  );
}
