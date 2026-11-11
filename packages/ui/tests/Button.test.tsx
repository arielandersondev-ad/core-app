import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { Button, buttonClassName, StatusMessage } from "../src/index";

describe("buttonClassName", () => {
  it("uses focus-visible ring instead of focus ring", () => {
    const classes = buttonClassName();
    expect(classes).toContain("focus-visible:ring-2");
    expect(classes).not.toMatch(/(^|\s)focus:/);
  });

  it("lists transition properties explicitly instead of transition-all", () => {
    expect(buttonClassName()).not.toContain("transition-all");
  });

  it("applies variant, size, fullWidth and extra classes", () => {
    const classes = buttonClassName({
      variant: "outline",
      size: "sm",
      fullWidth: true,
      className: "custom-x",
    });
    expect(classes).toContain("border-[var(--border)]");
    expect(classes).toContain("h-8");
    expect(classes).toContain("w-full");
    expect(classes).toContain("custom-x");
  });

  it("exposes stable theme hooks for the variant", () => {
    expect(buttonClassName().split(" ")).toEqual(
      expect.arrayContaining(["ui-button", "ui-button--primary"]),
    );
    expect(buttonClassName({ variant: "outline" })).toContain("ui-button--outline");
  });

  it("is the same class string rendered by Button", () => {
    const html = renderToString(
      <Button variant="danger" size="lg">
        Eliminar
      </Button>,
    );
    expect(html).toContain(`class="${buttonClassName({ variant: "danger", size: "lg" })}"`);
  });
});

describe("Button accessibility", () => {
  it("hides decorative icons from assistive tech", () => {
    const html = renderToString(
      <Button leftIcon={<svg />} rightIcon={<svg />}>
        Guardar
      </Button>,
    );
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
  });

  it("marks loading buttons as busy and disabled", () => {
    const html = renderToString(<Button loading>Guardar</Button>);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
  });
});

describe("StatusMessage", () => {
  it("renders loading as a polite status with spinner", () => {
    const html = renderToString(<StatusMessage variant="loading" message="Cargando pacientes…" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("animate-spin");
    expect(html).toContain("Cargando pacientes…");
  });

  it("renders error as alert with action", () => {
    const html = renderToString(
      <StatusMessage
        variant="error"
        message="No se pudo cargar."
        description="Revisa tu conexión."
        action={<button type="button">Reintentar</button>}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("aria-live");
    expect(html).toContain("Revisa tu conexión.");
    expect(html).toContain("Reintentar");
  });

  it("defaults to info status without spinner", () => {
    const html = renderToString(<StatusMessage message="Sin conexión." />);
    expect(html).toContain('role="status"');
    expect(html).not.toContain("animate-spin");
  });
});
