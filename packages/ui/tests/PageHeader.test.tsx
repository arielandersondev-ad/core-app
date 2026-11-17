import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { PageHeader } from "../src/index";

const ACTIONS_WRAPPER_CLASSES = [
  "flex w-full flex-wrap items-center gap-2",
  "[&amp;&gt;*]:flex-1",
  "sm:w-auto",
  "sm:shrink-0",
  "md:[&amp;&gt;*]:flex-none",
];
const MAIN_ROW =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

describe("PageHeader Unit Tests", () => {
  describe("Mobile actions visibility", () => {
    it("renders the action content", () => {
      const html = renderToString(
        <PageHeader
          title="Atenciones clínicas"
          description="Historial de atenciones del paciente."
          action={
            <button type="button" className="btn">
              Nueva atención
            </button>
          }
        />
      );

      expect(html).toContain("Atenciones clínicas");
      expect(html).toContain("Historial de atenciones del paciente.");
      expect(html).toContain("Nueva atención");
    });

    it("does not hide the actions wrapper on mobile", () => {
      const html = renderToString(
        <PageHeader
          title="Atenciones clínicas"
          action={<button type="button">Nueva atención</button>}
        />
      );

      expect(html).not.toContain("hidden md:inline-flex");
    });

    it("stacks title and actions on mobile with a full-width actions row", () => {
      const html = renderToString(
        <PageHeader
          title="Atenciones clínicas"
          action={
            <>
              <button type="button">Filtrar</button>
              <button type="button">Exportar</button>
            </>
          }
        />
      );

      expect(html).toContain(MAIN_ROW);
      for (const cls of ACTIONS_WRAPPER_CLASSES) {
        expect(html).toContain(cls);
      }
      expect(html).toContain("Filtrar");
      expect(html).toContain("Exportar");
    });

    it("omits the actions wrapper when no action is provided", () => {
      const html = renderToString(<PageHeader title="Atenciones clínicas" />);

      expect(html).not.toContain("flex w-full flex-wrap items-center gap-2");
      expect(html).not.toContain("hidden md:inline-flex");
    });
  });

  describe("Supporting content", () => {
    it("renders breadcrumbs and badge", () => {
      const html = renderToString(
        <PageHeader
          title="Servicios"
          badge={<span>24 activos</span>}
          breadcrumbs={[
            { label: "Clínica", href: "#" },
            { label: "Servicios" },
          ]}
        />
      );

      expect(html).toContain("Migas de pan");
      expect(html).toContain("Clínica");
      expect(html).toContain("24 activos");
    });
  });
});
