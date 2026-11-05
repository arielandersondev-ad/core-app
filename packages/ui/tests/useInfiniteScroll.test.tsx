import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  useInfiniteScroll,
  InfiniteScrollSentinel,
} from "../src/index";

describe("useInfiniteScroll & InfiniteScrollSentinel Unit Tests (HAG-26)", () => {
  describe("SSR & Exports", () => {
    it("exports useInfiniteScroll and InfiniteScrollSentinel correctly from @app/ui", () => {
      expect(typeof useInfiniteScroll).toBe("function");
      expect(typeof InfiniteScrollSentinel).toBe("function");
    });

    it("runs safely during SSR without window.IntersectionObserver", () => {
      const html = renderToString(
        <InfiniteScrollSentinel
          hasMore={true}
          isLoadingMore={false}
          onLoadMore={() => {}}
        />
      );

      expect(html).toContain('data-component="infinite-scroll-sentinel"');
      expect(html).toContain('role="status"');
    });
  });

  describe("InfiniteScrollSentinel Visual States", () => {
    it("renders loading spinner and discrete message when isLoadingMore is true", () => {
      const html = renderToString(
        <InfiniteScrollSentinel
          hasMore={true}
          isLoadingMore={true}
          loadingMessage="Cargando más tratamientos clínicos…"
        />
      );

      expect(html).toContain('data-component="infinite-scroll-sentinel"');
      expect(html).toContain("animate-spin");
      expect(html).toContain("Cargando más tratamientos clínicos…");
    });

    it("renders endMessage when !hasMore and not loading", () => {
      const html = renderToString(
        <InfiniteScrollSentinel
          hasMore={false}
          isLoadingMore={false}
          isLoading={false}
          total={12}
          currentCount={12}
          endMessage="Fin del catálogo de servicios clínicos"
        />
      );

      expect(html).toContain('data-component="infinite-scroll-sentinel"');
      expect(html).not.toContain("animate-spin");
      expect(html).toContain("Fin del catálogo de servicios clínicos");
    });

    it("does not render endMessage while hasMore is true", () => {
      const html = renderToString(
        <InfiniteScrollSentinel
          hasMore={true}
          isLoadingMore={false}
          isLoading={false}
          total={20}
          currentCount={10}
        />
      );

      expect(html).not.toContain("Has llegado al final");
      expect(html).not.toContain("animate-spin");
    });

    it("formats default count summary when total and currentCount are provided and hasMore is false", () => {
      const html = renderToString(
        <InfiniteScrollSentinel
          hasMore={false}
          isLoadingMore={false}
          isLoading={false}
          total={30}
          currentCount={30}
        />
      );

      expect(html).toContain("Has llegado al final del catálogo (30 de 30 registros)");
    });
  });
});
