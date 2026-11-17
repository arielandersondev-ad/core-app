"use client";

import { useState } from "react";
import { Appointment, getServiceById, formatCurrency } from "@/modules/clinic/__mocks__/data";
import { Icons } from "@/shared/components/ui/Icons";
import { MobileFloatingActionMenu, PullToRefresh } from "@/shared/components/ui";
import { WhatsAppModal } from "@/shared/components/ui/WhatsAppModal";
import { PaymentPromptModal } from "@/shared/components/ui/PaymentPromptModal";
import { CreateAppointmentModal, CreatePatientModal, RegisterPaymentModal, AppointmentDetailSheet } from "@/modules/clinic/components";
import { DentalWhatsAppContext, WhatsAppTemplateKey } from "@/shared/utils/whatsapp-generator";
import { useAgendaAppointments, isAppointmentOverdue as checkIsAppointmentOverdue, getDoctorDisplay } from "./agenda/hooks/useAgendaAppointments";
import { AgendaHeader } from "./agenda/AgendaHeader";
import { AgendaMetricsStrip } from "./agenda/AgendaMetricsStrip";
import { AgendaTimeline } from "./agenda/AgendaTimeline";

export function isAppointmentOverdue(apt: Appointment, nowDateStr: string, nowMinutes: number): boolean {
  return checkIsAppointmentOverdue(apt, nowDateStr, nowMinutes);
}

export default function Agenda(props: { onNavigate?: (s: string, p?: Record<string, string>) => void }) {
  void props;
  const agenda = useAgendaAppointments();
  const [waContext, setWaContext] = useState<DentalWhatsAppContext | null>(null);
  const [waTemplate, setWaTemplate] = useState<WhatsAppTemplateKey>("confirmacion");
  const [isWaOpen, setIsWaOpen] = useState(false);
  const [paymentPromptAppointment, setPaymentPromptAppointment] = useState<Appointment | null>(null);
  const [isCreateApptOpen, setIsCreateApptOpen] = useState(false);
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [selectedDetailCitaId, setSelectedDetailCitaId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [paymentModalState, setPaymentModalState] = useState<{ open: boolean; patientId?: string; amount?: number; serviceId?: string; concept?: string }>({ open: false });

  const handleOpenWhatsApp = (apt: Appointment) => {
    const svc = getServiceById(apt.serviceId);
    const pro = getDoctorDisplay(apt.professionalId);
    const dateFormatted = new Date(apt.date + "T12:00:00").toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" });
    const defaultTpl: WhatsAppTemplateKey = apt.status === "en_sala" ? "turno_listo" : apt.status === "no_asistio" ? "no_show" : apt.status === "completada" ? "post_tratamiento" : "confirmacion";
    setWaContext({
      patientName: apt.patientName || apt.personName || "Paciente sin nombre",
      patientPhone: apt.patientPhone || apt.personPhone || "",
      serviceName: apt.serviceName || svc?.name || "Consulta odontológica",
      dateStr: dateFormatted,
      timeStr: apt.startTime,
      clinicName: "Dental Care Consultorio",
      professionalName: pro?.name,
    });
    setWaTemplate(defaultTpl);
    setIsWaOpen(true);
  };

  const handleRefreshAppointments = async () => {
    // Recargar citas por fecha: fetchAppointments({ date }) mediante TanStack Query refetch
    await agenda.handleRefreshAppointments();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-4 pb-24 h-full">
      <AgendaHeader
        date={agenda.date} onDateChange={agenda.changeDate} viewMode={agenda.viewMode} onViewModeChange={agenda.setViewMode}
        totalCount={agenda.counters.totalCount} onOpenCreateModal={() => setIsCreateApptOpen(true)}
      />

      <AgendaMetricsStrip
        statusFilter={agenda.statusFilter} onStatusFilterChange={agenda.setStatusFilter}
        totalCount={agenda.counters.totalCount} waitingOrChair={agenda.counters.waitingOrChair}
        confirmedCount={agenda.counters.confirmedCount} noShowCount={agenda.counters.noShowCount}
      />

      <PullToRefresh onRefresh={handleRefreshAppointments}>
        <AgendaTimeline
          viewMode={agenda.viewMode} isLoading={agenda.isLoading} isError={agenda.isError} onRetry={() => void agenda.refetch()}
          dayAppts={agenda.dayAppts} expandedId={agenda.expandedId} onToggleExpand={agenda.handleToggleExpand}
          nowDateStr={agenda.nowDateStr} nowMinutes={agenda.nowMinutes} onOpenCreateModal={() => setIsCreateApptOpen(true)}
          onOpenDetail={(aptId) => {
            const apt = { id: aptId };
            setSelectedDetailCitaId(apt.id); setIsDetailSheetOpen(true);
          }}
          onOpenWhatsApp={handleOpenWhatsApp}
          onStatusChange={(id, status) => {
            agenda.handleQuickStatusChange(id, status, (completed) => setPaymentPromptAppointment(completed));
          }}
        />
      </PullToRefresh>

      <MobileFloatingActionMenu
        ariaLabel="Acciones rápidas de agenda"
        className="md:hidden"
        actions={[
          { label: "Nueva Cita", icon: Icons.calendar, variant: "primary", onClick: () => setIsCreateApptOpen(true) },
          { label: "Nuevo Paciente", icon: Icons.users, onClick: () => setIsCreatePatientOpen(true) },
          { label: "Cobro Rápido", icon: Icons.dollarSign, onClick: () => setPaymentModalState({ open: true }) },
        ]}
      />

      <WhatsAppModal isOpen={isWaOpen} onClose={() => setIsWaOpen(false)} context={waContext} defaultTemplate={waTemplate} />

      {paymentPromptAppointment && (
        <PaymentPromptModal
          isOpen={!!paymentPromptAppointment}
          onClose={() => setPaymentPromptAppointment(null)}
          onConfirmPayment={() => {
            const sid = paymentPromptAppointment.serviceId;
            setPaymentModalState({
              open: true,
              patientId: paymentPromptAppointment.patientId,
              amount: getServiceById(sid)?.price || 0,
              serviceId: sid,
              concept: `Cobro por ${getServiceById(sid)?.name || "Atención Odontológica"}`,
            });
            setPaymentPromptAppointment(null);
          }}
          patientName={paymentPromptAppointment.patientName || paymentPromptAppointment.personName || "Paciente sin nombre"}
          serviceName={getServiceById(paymentPromptAppointment.serviceId)?.name || "Atención Odontológica"}
          priceFormatted={formatCurrency(getServiceById(paymentPromptAppointment.serviceId)?.price || 0)}
        />
      )}

      <CreateAppointmentModal open={isCreateApptOpen} initialDate={agenda.date} onClose={() => setIsCreateApptOpen(false)} onSuccess={() => void agenda.refetch()} />
      <CreatePatientModal open={isCreatePatientOpen} onClose={() => setIsCreatePatientOpen(false)} />
      <RegisterPaymentModal open={paymentModalState.open} initialPatientId={paymentModalState.patientId} initialAmount={paymentModalState.amount} initialServiceId={paymentModalState.serviceId} initialConcept={paymentModalState.concept} onClose={() => setPaymentModalState({ open: false })} onSuccess={() => setPaymentModalState({ open: false })} />
      <AppointmentDetailSheet
        open={isDetailSheetOpen}
        citaId={selectedDetailCitaId}
        initialAppointment={agenda.appointmentsList.find((a) => a.id === selectedDetailCitaId)}
        onClose={() => { setIsDetailSheetOpen(false); setSelectedDetailCitaId(null); }}
        onStatusUpdated={() => void agenda.refetch()}
        onOpenPayment={(id, patientId, amount) => { setIsDetailSheetOpen(false); setPaymentModalState({ open: true, patientId, amount }); }}
        onOpenWhatsApp={(patientName, patientPhone, serviceName, dateStr, timeStr) => {
          setIsDetailSheetOpen(false);
          setWaContext({ patientName, patientPhone, serviceName, dateStr, timeStr, clinicName: "Dental Care Consultorio" });
          setWaTemplate("confirmacion");
          setIsWaOpen(true);
        }}
      />
    </div>
  );
}
