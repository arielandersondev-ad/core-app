"use client";

import { useState, useEffect } from "react";
import {
  DentalWhatsAppContext,
  DENTAL_WHATSAPP_TEMPLATES,
  WhatsAppTemplateKey,
  buildWhatsAppUrl,
  normalizePhoneNumber,
} from "@/shared/utils/whatsapp-generator";
import { Icons } from "@/shared/components/ui/Icons";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: DentalWhatsAppContext | null;
  defaultTemplate?: WhatsAppTemplateKey;
  onSent?: (templateKey: WhatsAppTemplateKey) => void;
}

export function WhatsAppModal({
  isOpen,
  onClose,
  context,
  defaultTemplate = "confirmacion",
  onSent,
}: WhatsAppModalProps) {
  const [selectedKey, setSelectedKey] =
    useState<WhatsAppTemplateKey>(defaultTemplate);
  const [customText, setCustomText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (context) {
      const tpl =
        DENTAL_WHATSAPP_TEMPLATES.find((t) => t.key === defaultTemplate) ||
        DENTAL_WHATSAPP_TEMPLATES[0];
      setSelectedKey(tpl.key);
      setCustomText(tpl.generateText(context));
    }
  }, [context, defaultTemplate, isOpen]);

  if (!isOpen || !context) return null;

  const handleSelectTemplate = (key: WhatsAppTemplateKey) => {
    setSelectedKey(key);
    const tpl = DENTAL_WHATSAPP_TEMPLATES.find((t) => t.key === key);
    if (tpl) {
      setCustomText(tpl.generateText(context));
    }
  };

  const cleanPhone = normalizePhoneNumber(context.patientPhone, "591");
  const waUrl = buildWhatsAppUrl(context.patientPhone, customText);

  const handleOpenWhatsApp = () => {
    if (onSent) onSent(selectedKey);
    window.open(waUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      // Clipboard fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet */}
      <div
        className="relative z-10 w-full sm:max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-[var(--border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--surface)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              {Icons.whatsapp}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm sm:text-base font-bold text-[var(--foreground)] truncate">
                Mensaje de WhatsApp
              </h3>
              <p className="text-[11px] font-mono text-[var(--muted)] truncate">
                {context.patientName} · +{cleanPhone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto">
          {/* Template chips */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] block mb-1.5">
              Plantilla rápida
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {DENTAL_WHATSAPP_TEMPLATES.map((tpl) => {
                const isActive = selectedKey === tpl.key;
                return (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    <span>{tpl.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context pill */}
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 flex items-center justify-between text-xs font-mono text-[var(--muted)]">
            <span className="truncate">
              📅 {context.dateStr} · ⏰ {context.timeStr}
            </span>
            <span className="truncate font-semibold text-[var(--foreground)] ml-2">
              🦷 {context.serviceName}
            </span>
          </div>

          {/* Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                Mensaje pre-rellenado (editable)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                {copied ? "✓ Copiado" : "Copiar texto"}
              </button>
            </div>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={5}
              className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none leading-relaxed"
              placeholder="Escribe el mensaje para el paciente..."
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 border border-[var(--border)] rounded-xl text-xs sm:text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex-1 h-11 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span className="w-5 h-5 flex items-center justify-center">
              {Icons.whatsapp}
            </span>
            <span>Abrir WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
