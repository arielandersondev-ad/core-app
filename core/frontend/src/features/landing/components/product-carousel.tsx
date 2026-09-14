"use client";

import { useRef } from "react";
import { products } from "@/features/landing/data/products";

const statusLabels = {
  available: "Disponible",
  development: "En desarrollo",
  soon: "Próximamente",
} as const;

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <path
        d={direction === "left" ? "M17 10H3m5-5-5 5 5 5" : "M3 10h14m-5-5 5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  function move(direction: "left" | "right") {
    trackRef.current?.scrollBy({
      left: direction === "right" ? 380 : -380,
      behavior: "smooth",
    });
  }

  return (
    <div className="mt-12">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted">Desliza para explorar el ecosistema.</p>
        <div className="hidden items-center gap-2 sm:flex">
          {(["left", "right"] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => move(direction)}
              aria-label={direction === "left" ? "Ver productos anteriores" : "Ver productos siguientes"}
              className="grid size-10 place-items-center rounded-md border border-border bg-background text-muted transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Arrow direction={direction} />
            </button>
          ))}
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 [scrollbar-color:var(--primary)_transparent] [scrollbar-width:thin]"
      >
        {products.map((product, index) => (
          <article
            key={product.name}
            className="group flex min-h-[360px] w-[84vw] max-w-[360px] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary/45 sm:w-[360px]"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-14 place-items-center rounded-md border border-primary/30 bg-primary-subtle/45 font-mono text-sm font-medium tracking-[0.12em] text-primary">
                {product.accent}
              </span>
              <span className="font-mono text-xs text-gold-accent">0{index + 1}</span>
            </div>

            <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-primary">
              {product.eyebrow}
            </p>
            <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em]">
              {product.name}
            </h3>
            <p className="mt-4 text-base leading-7 text-muted">{product.description}</p>

            <div className="mt-auto pt-8">
              <div className="flex flex-wrap gap-2">
                {product.capabilities.map((capability) => (
                  <span key={capability} className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted">
                    {capability}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <span className={`size-1.5 rounded-full ${product.status === "available" ? "bg-primary" : "bg-gold-accent"}`} />
                  {statusLabels[product.status]}
                </span>
                <span className="text-primary transition-transform group-hover:translate-x-1">
                  <Arrow direction="right" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
