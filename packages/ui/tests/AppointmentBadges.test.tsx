import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  Badge,
  ContactTypeBadge,
  AppointmentStatusBadge,
  type ContactType,
  type AppointmentStatusKey,
} from "../src/index";

describe("Appointment & Contact Badges Unit Tests (HAG-46)", () => {
  describe("Badge with new variants", () => {
    it("renders patient badge with emerald styling classes", () => {
      const html = renderToString(
        <Badge variant="patient" dot>
          Paciente
        </Badge>
      );
      expect(html).toContain("Paciente");
      expect(html).toContain("bg-emerald-500/10");
      expect(html).toContain("text-emerald-800");
    });

    it("renders person badge with amber styling classes", () => {
      const html = renderToString(
        <Badge variant="person" dot>
          Persona
        </Badge>
      );
      expect(html).toContain("Persona");
      expect(html).toContain("bg-amber-500/10");
      expect(html).toContain("text-amber-800");
    });
  });

  describe("ContactTypeBadge helper component", () => {
    it("renders 'Paciente' by default when type is 'patient'", () => {
      const html = renderToString(<ContactTypeBadge type="patient" />);
      expect(html).toContain("Paciente");
      expect(html).toContain("bg-emerald-500/10");
    });

    it("renders 'Persona' by default when type is 'person'", () => {
      const html = renderToString(<ContactTypeBadge type="person" />);
      expect(html).toContain("Persona");
      expect(html).toContain("bg-amber-500/10");
    });

    it("allows custom label override", () => {
      const html = renderToString(
        <ContactTypeBadge type="person" label="Contacto Rápido" />
      );
      expect(html).toContain("Contacto Rápido");
      expect(html).not.toContain("Persona");
    });
  });

  describe("AppointmentStatusBadge component", () => {
    it("renders canonical SCHEDULED status badge", () => {
      const html = renderToString(
        <AppointmentStatusBadge status="SCHEDULED" />
      );
      expect(html).toContain("Programada");
      expect(html).toContain("bg-stone-400");
    });

    it("renders CONFIRMED status badge with emerald dot", () => {
      const html = renderToString(
        <AppointmentStatusBadge status="CONFIRMED" />
      );
      expect(html).toContain("Confirmada");
      expect(html).toContain("bg-emerald-600");
    });

    it("renders WAITING_ROOM status badge", () => {
      const html = renderToString(
        <AppointmentStatusBadge status="WAITING_ROOM" />
      );
      expect(html).toContain("En sala de espera");
    });

    it("renders IN_PROGRESS status badge", () => {
      const html = renderToString(
        <AppointmentStatusBadge status="IN_PROGRESS" />
      );
      expect(html).toContain("En curso (Sillón)");
    });

    it("handles lowercase descriptive status keys like 'en_sala'", () => {
      const html = renderToString(
        <AppointmentStatusBadge status="en_sala" />
      );
      expect(html).toContain("En sala de espera");
    });

    it("falls back gracefully for unknown status keys", () => {
      const html = renderToString(
        <AppointmentStatusBadge status="UNKNOWN_STATE" />
      );
      expect(html).toContain("Programada");
    });
  });
});
