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

type CreateOrganizationButtonProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateOrganizationButton({
  open: controlledOpen,
  onOpenChange,
}: CreateOrganizationButtonProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

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

      <CreateOrganizationDialog
        open={isOpen}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
