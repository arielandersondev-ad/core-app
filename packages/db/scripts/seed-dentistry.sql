-- Seed de desarrollo para el schema `dentistry`.
--
-- Usa la org CrowAnt y sus branches/membresías que ya existen en `core`.
-- Es idempotente (ON CONFLICT DO NOTHING) y las citas se anclan a `current_date`
-- para que la Agenda siempre tenga algo que mostrar.
--
-- Ejecutar desde packages/db:
--   npm run db:seed

\set ON_ERROR_STOP on

begin;

-- Servicios (Bs. en minor units: 15000 = Bs. 150.00)
insert into dentistry.dental_services
  (id, "organizationId", name, code, description, "basePriceMinor", currency,
   "durationMinutes", active, "createdByMembershipId", "updatedAt")
values
  ('01920000-0000-7000-8000-000000000001', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'Profilaxis dental', 'SRV-001', 'Limpieza, destartraje y fluorización.',
   18000, 'BOB', 45, true, '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000002', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'Resina simple', 'SRV-002', 'Restauración con resina en una cara.',
   25000, 'BOB', 60, true, '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000003', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'Endodoncia unirradicular', 'SRV-003', 'Tratamiento de conducto de un solo canal.',
   120000, 'BOB', 120, true, '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000004', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'Corona de porcelana', 'SRV-004', 'Corona metal-cerámica sobre preparation.',
   250000, 'BOB', 90, true, '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000005', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'Extracción simple', 'SRV-005', 'Exodontia de pieza permanente erupted.',
   35000, 'BOB', 40, true, '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000006', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'Blanqueamiento dental', 'SRV-006', 'Aclaramiento en consultorio.',
   60000, 'BOB', 75, false, '01a043d1-607b-75cd-a9e1-b3be724a0b38', now())
on conflict (id) do nothing;

-- Pacientes
insert into dentistry.patients
  (id, "organizationId", "documentType", "documentNumber", "firstName", "lastName",
   sex, "birthDate", phone, email, address, status, "createdByMembershipId", "updatedAt")
values
  ('01920000-0000-7000-8000-000000000101', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'CI', '11223344', 'María', 'Fernández Cruz', 'FEMALE', '1988-04-12',
   '+591 70111222', 'maria.fernandez@example.com', 'Av. Ballivián 1420', 'ACTIVE',
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000102', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'CI', '22334455', 'Jorge', 'Salazar Menacho', 'MALE', '1975-11-03',
   '+591 70222333', 'jorge.salazar@example.com', 'Calle Sucre 880', 'ACTIVE',
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000103', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'CI', '33445566', 'Carla', 'Mendoza Ríos', 'FEMALE', '1996-07-25',
   '+591 70333444', 'carla.mendoza@example.com', 'Av. Cañoto 455', 'ACTIVE',
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000104', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'CI', '44556677', 'Diego', 'Rojas Villca', 'MALE', '2001-02-18',
   '+591 70444555', 'diego.rojas@example.com', 'Av. Cristo Redentor 2210', 'ACTIVE',
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000105', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   'CI', '55667788', 'Lucía', 'Aguilar Peña', 'FEMALE', '1962-09-30',
   '+591 70555666', 'lucia.aguilar@example.com', 'Av. Teatinos 349', 'ACTIVE',
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now())
on conflict (id) do nothing;

-- Historias clínicas de una paciente
insert into dentistry.clinical_histories
  (id, "organizationId", "patientId", allergies, "currentMedications",
   "medicalHistory", "dentalHistory", "relevantConditions", observations,
   "createdByMembershipId", "updatedAt")
values
  ('01920000-0000-7000-8000-000000000601', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01920000-0000-7000-8000-000000000105',
   'Penicilina', 'Losartán 50 mg / día', 'Hipertensión arterial controlada.',
   'Exodoncias de 20 y 19 en 2011. Dos restorations de resina.', 'Hipertensión',
   'Paciente mayor; priorizar control de coagulación antes de extracción.',
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now())
on conflict (id) do nothing;

-- Tratamientos en curso
insert into dentistry.treatments
  (id, "organizationId", "patientId", "serviceId", "responsibleMembershipId",
   status, diagnosis, "agreedPriceMinor", currency, "estimatedSessions",
   "startedAt", "createdByMembershipId", "updatedAt")
values
  ('01920000-0000-7000-8000-000000000201', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01920000-0000-7000-8000-000000000102', '01920000-0000-7000-8000-000000000003',
   '01a0e914-8874-735c-86f3-3cfc0bc8c99b', 'IN_PROGRESS',
   'Pulpitis irreversible en pieza 46.', 120000, 'BOB', 2,
   current_date - 21, '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000202', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01920000-0000-7000-8000-000000000103', '01920000-0000-7000-8000-000000000004',
   '01a0e916-2075-7732-b5d1-5db292843347', 'IN_PROGRESS',
   'Pérdida de estructura coronaria en pieza 16.', 250000, 'BOB', 3,
   current_date - 10, '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000203', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01920000-0000-7000-8000-000000000101', '01920000-0000-7000-8000-000000000002',
   '01a0e914-8874-735c-86f3-3cfc0bc8c99b', 'COMPLETED',
   'Caries oclusal en pieza 36.', 25000, 'BOB', 1,
   current_date - 40, '01a043d1-607b-75cd-a9e1-b3be724a0b38', now())
on conflict (id) do nothing;

-- Citas de hoy y de días cercanos
insert into dentistry.appointments
  (id, "organizationId", "branchId", "patientId", "professionalMembershipId",
   "serviceId", "treatmentId", "startsAt", "endsAt", status, reason, notes,
   "createdByMembershipId", "updatedAt")
values
  ('01920000-0000-7000-8000-000000000301', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000101',
   '01a0e914-8874-735c-86f3-3cfc0bc8c99b', '01920000-0000-7000-8000-000000000001',
   null, current_date + time '08:30', current_date + time '09:15', 'CONFIRMED',
   'Control preventivo anual', null,
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000302', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000102',
   '01a0e914-8874-735c-86f3-3cfc0bc8c99b', '01920000-0000-7000-8000-000000000003',
   '01920000-0000-7000-8000-000000000201', current_date + time '09:30',
   current_date + time '11:30', 'SCHEDULED', 'Continuación de endodoncia',
   'Traer radiografía periapical.', '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000303', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000103',
   '01a0e916-2075-7732-b5d1-5db292843347', '01920000-0000-7000-8000-000000000004',
   '01920000-0000-7000-8000-000000000202', current_date + time '11:45',
   current_date + time '13:15', 'SCHEDULED', 'Preparación para corona', null,
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000304', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000104',
   '01a0e916-2075-7732-b5d1-5db292843347', '01920000-0000-7000-8000-000000000005',
   null, current_date + time '14:30', current_date + time '15:10', 'WAITING_ROOM',
   'Dolor molar', 'Paciente refiere dolor nocturno.', 
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000305', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000105',
   '01a0e914-8874-735c-86f3-3cfc0bc8c99b', '01920000-0000-7000-8000-000000000001',
   null, current_date + time '16:00', current_date + time '16:45', 'SCHEDULED',
   'Evaluación pre-quirúrgica', 'Paciente hipertensa.', 
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000306', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000101',
   '01a0e916-2075-7732-b5d1-5db292843347', '01920000-0000-7000-8000-000000000002',
   '01920000-0000-7000-8000-000000000203', (current_date - interval '2 days') + time '10:00',
   (current_date - interval '2 days') + time '11:00', 'COMPLETED',
   'Restauración de pieza 36', 'Resina Curada.', 
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now())
on conflict (id) do nothing;

-- Consultas clínicas (dos abiertas, una cerrada)
insert into dentistry.clinical_encounters
  (id, "organizationId", "branchId", "patientId", "appointmentId", "treatmentId",
   "professionalMembershipId", "startedAt", "endedAt", "chiefComplaint", diagnosis,
   "procedurePerformed", evolution, recommendations, notes,
   "createdByMembershipId", "updatedAt")
values
  ('01920000-0000-7000-8000-000000000401', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000105',
   '01920000-0000-7000-8000-000000000305', null,
   '01a0e914-8874-735c-86f3-3cfc0bc8c99b', current_date + time '16:00', null,
   'Dolor al masticar en molar inferior derecho.', 'Gingivitis crónica localizada.',
   'Profilaxis y ajuste de oclusión.', null,
   'Reforzar técnica de cepillado; control en 30 días.', null,
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000402', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000102',
   '01920000-0000-7000-8000-000000000302',
   '01920000-0000-7000-8000-000000000201',
   '01a0e914-8874-735c-86f3-3cfc0bc8c99b', current_date + time '09:30', null,
   'Dolor espontáneo nocturno en pieza 46.', 'Pulpitis irreversible sintomática.',
   'Apertura de cámara y medicación intracanal.', null,
   'Completar obturación en la próxima sesión.', 'Paciente con claustrofobia leve.',
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000403', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000101',
   '01920000-0000-7000-8000-000000000306',
   '01920000-0000-7000-8000-000000000203',
   '01a0e916-2075-7732-b5d1-5db292843347', (current_date - interval '2 days') + time '10:00',
   (current_date - interval '2 days') + time '11:00', 'Caries oclusal.', 'Biopulpotomía.',
   'Apertura, eliminación de caries y restauración con resina.',
   'Paciente asintomático en la sesión.', 'Sellante en fosas adyacentes.', null,
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now())
on conflict (id) do nothing;

-- Pagos en bolivianos (amountMinor)
insert into dentistry.payments
  (id, "organizationId", "branchId", "patientId", "appointmentId",
   "clinicalEncounterId", "treatmentId", "amountMinor", currency, "paymentMethod",
   reference, "paidAt", status, notes, "receivedByMembershipId", "updatedAt")
values
  ('01920000-0000-7000-8000-000000000501', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000101',
   '01920000-0000-7000-8000-000000000306', '01920000-0000-7000-8000-000000000403',
   '01920000-0000-7000-8000-000000000203', 25000, 'BOB', 'efectivo', 'REC-0001',
   (current_date - interval '2 days') + time '11:05', 'COMPLETED', 'Pago contra recibo.',
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000502', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000102',
   '01920000-0000-7000-8000-000000000302', null,
   '01920000-0000-7000-8000-000000000201', 60000, 'BOB', 'tarjeta', 'REC-0002',
   current_date + time '09:40', 'COMPLETED', 'Abono 50% de la primera sesión.',
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now()),
  ('01920000-0000-7000-8000-000000000503', '01a02b78-b1a4-72ac-87e0-3699e5182d3d',
   '01a043d0-05e1-77ce-b3fe-aeccb845bbf0', '01920000-0000-7000-8000-000000000103',
   '01920000-0000-7000-8000-000000000303', null,
   '01920000-0000-7000-8000-000000000202', 83333, 'BOB', 'transferencia', 'REC-0003',
   current_date + time '11:50', 'COMPLETED', 'Tercer pago del plan de corona.',
   '01a043d1-607b-75cd-a9e1-b3be724a0b38', now())
on conflict (id) do nothing;

commit;

select 'patients' as tabla, count(*) from dentistry.patients
union all select 'dental_services', count(*) from dentistry.dental_services
union all select 'treatments', count(*) from dentistry.treatments
union all select 'appointments', count(*) from dentistry.appointments
union all select 'clinical_encounters', count(*) from dentistry.clinical_encounters
union all select 'payments', count(*) from dentistry.payments;
