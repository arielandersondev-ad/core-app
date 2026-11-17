import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  ResponsiveTable,
  ResponsiveTableDesktop,
  ResponsiveTableMobile,
  MobileCardItem,
  MobileCardList,
} from "../src/index";

describe("ResponsiveTable & MobileCardItem Unit Tests (HAG-14)", () => {
  const sampleData = [
    { id: "1", name: "Clínica Dental San Juan", nit: "76.123.456-7", country: "Chile" },
    { id: "2", name: "Red Dental Providencia", nit: "81.456.789-0", country: "Bolivia" },
  ];

  describe("Data-driven ResponsiveTable", () => {
    it("renders both desktop table structure and mobile card list with correct responsive breakpoint classes", () => {
      const html = renderToString(
        <ResponsiveTable
          items={sampleData}
          caption="Organizaciones"
          columns={[
            { header: "Organización", accessor: "name" },
            { header: "NIT", accessor: "nit" },
            { header: "País", accessor: "country" },
          ]}
          renderCard={(item) => (
            <MobileCardItem
              title={item.name}
              fields={[
                { label: "NIT", value: item.nit },
                { label: "País", value: item.country },
              ]}
            />
          )}
          footer="Total: 2 registros"
        />
      );

      // Desktop table verification
      expect(html).toContain('data-component="responsive-table-desktop"');
      expect(html).toContain("hidden md:block");
      expect(html).toContain("<table");
      expect(html).toContain("Organización");
      expect(html).toContain("NIT");
      expect(html).toContain("País");
      expect(html).toContain("Clínica Dental San Juan");
      expect(html).toContain("Total: 2 registros");

      // Mobile card list verification
      expect(html).toContain('data-component="responsive-table-mobile"');
      expect(html).toContain("md:hidden");
      expect(html).toContain('data-component="mobile-card-list"');
      expect(html).toContain('data-component="mobile-card-item"');
    });

    it("supports custom breakpoint prop (e.g. lg)", () => {
      const html = renderToString(
        <ResponsiveTable
          items={sampleData}
          breakpoint="lg"
          columns={[{ header: "Nombre", accessor: "name" }]}
        />
      );

      expect(html).toContain("hidden lg:block");
      expect(html).toContain("lg:hidden");
    });

    it("renders emptyState when items collection is empty", () => {
      const html = renderToString(
        <ResponsiveTable
          items={[]}
          columns={[{ header: "Nombre", accessor: "name" }]}
          emptyState={<p data-testid="empty">No hay elementos disponibles</p>}
        />
      );

      expect(html).toContain("No hay elementos disponibles");
      expect(html).not.toContain("<table");
    });
  });

  describe("Slots Composable Mode", () => {
    it("renders explicit desktop and mobile slots cleanly", () => {
      const html = renderToString(
        <ResponsiveTable
          desktop={<div data-testid="custom-table">Custom Desktop Table</div>}
          mobile={<div data-testid="custom-cards">Custom Mobile Cards</div>}
        />
      );

      expect(html).toContain("Custom Desktop Table");
      expect(html).toContain("hidden md:block");
      expect(html).toContain("Custom Mobile Cards");
      expect(html).toContain("md:hidden");
    });
  });

  describe("MobileCardItem Component", () => {
    it("renders avatar, title, subtitle, badge, fields, and actions", () => {
      const html = renderToString(
        <MobileCardItem
          avatar={<span data-testid="avatar">AV</span>}
          title="Camila Silva"
          subtitle="camila@example.com"
          badge={<span>Activo</span>}
          fields={[
            { label: "Teléfono", value: "+56 9 1234 5678", mono: true },
            { label: "Documento", value: "18.234.567-8" },
          ]}
          actions={<button>Editar</button>}
        >
          <div>Contenido extra</div>
        </MobileCardItem>
      );

      expect(html).toContain('data-component="mobile-card-item"');
      expect(html).toContain("Camila Silva");
      expect(html).toContain("camila@example.com");
      expect(html).toContain("Activo");
      expect(html).toContain("Teléfono");
      expect(html).toContain("+56 9 1234 5678");
      expect(html).toContain("Documento");
      expect(html).toContain("18.234.567-8");
      expect(html).toContain("Editar");
      expect(html).toContain("Contenido extra");
    });

    it("applies interactive hover and cursor styling when onClick is provided", () => {
      const html = renderToString(
        <MobileCardItem
          title="Interactive Item"
          onClick={() => {}}
        />
      );

      expect(html).toContain("cursor-pointer");
    });
  });

  describe("Subcomponent Assignment & Exports", () => {
    it("assigns subcomponents onto ResponsiveTable correctly", () => {
      expect(ResponsiveTable.Desktop).toBe(ResponsiveTableDesktop);
      expect(ResponsiveTable.Mobile).toBe(ResponsiveTableMobile);
      expect(ResponsiveTable.Card).toBe(MobileCardItem);
      expect(ResponsiveTable.CardList).toBe(MobileCardList);
    });
  });
});
