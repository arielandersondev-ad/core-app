"use client";

interface PaymentPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  patientName: string;
  serviceName: string;
  priceFormatted: string;
}

export function PaymentPromptModal({
  isOpen,
  onClose,
  onConfirmPayment,
  patientName,
  serviceName,
  priceFormatted,
}: PaymentPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full sm:max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden p-6 flex flex-col gap-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl">
          💳
        </div>

        <div>
          <h3 className="font-display text-lg font-bold text-[var(--foreground)]">
            Cita finalizada con éxito
          </h3>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            ¿Deseas registrar el cobro de esta atención ahora antes de que el
            paciente se retire?
          </p>
        </div>

        {/* Summary pill */}
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-left">
          <p className="text-xs font-medium text-[var(--foreground)] truncate">
            👤 {patientName}
          </p>
          <div className="flex items-center justify-between text-xs text-[var(--muted)] mt-1">
            <span>🦷 {serviceName}</span>
            <span className="font-mono font-bold text-[var(--primary)] text-sm">
              {priceFormatted}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onConfirmPayment}
            className="w-full h-11 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-sm font-semibold hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Registrar cobro ahora</span>
            <span>→</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--foreground)] font-medium transition-colors"
          >
            Cobrar más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
