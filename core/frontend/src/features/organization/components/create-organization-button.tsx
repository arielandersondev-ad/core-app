"use client";

import { useState } from "react";
import { CreateOrganizationDialog } from "./create-organization-dialog";

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CreateOrganizationButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 md:flex"
      >
        <PlusIcon />
        Nueva organización
      </button>

      <button
        type="button"
        aria-label="Crear nueva organización"
        onClick={() => setOpen(true)}
        className="fixed right-5 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
      >
        <PlusIcon />
      </button>

      <CreateOrganizationDialog
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}