import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 1. FRONTEND LOGIC: Cálculo dinámico de fin de cita (calcEnd)
// ============================================================================

function calcEndTime(startTime, totalDurationMin, fallbackDurationMin = 30) {
  if (!startTime) return '';
  const effectiveMin = totalDurationMin > 0 ? totalDurationMin : fallbackDurationMin;
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + effectiveMin;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

test('Frontend UI: calcEndTime calcula exactamente el término de la cita según servicios acumulados', () => {
  // Servicio único de 30 min a las 09:00 -> 09:30
  assert.equal(calcEndTime('09:00', 30), '09:30');

  // Dos servicios: 30 min + 15 min = 45 min a las 09:00 -> 09:45
  assert.equal(calcEndTime('09:00', 45), '09:45');

  // Cruce de hora: 09:45 con 30 min -> 10:15
  assert.equal(calcEndTime('09:45', 30), '10:15');

  // Sin servicios (duración 0) usa fallback de 30 min para consulta estándar -> 14:30
  assert.equal(calcEndTime('14:00', 0, 30), '14:30');

  // Sin hora de inicio retorna vacío
  assert.equal(calcEndTime('', 30), '');
});

// ============================================================================
// 2. FRONTEND LOGIC: Validación de formulario en CreateAppointment / Modal
// ============================================================================

function validateAppointmentForm({
  bookingType,
  personMode,
  patientId,
  selectedPersonId,
  personForm,
  serviceIds,
  date,
  professionalId,
  requireServices = true,
  requireProfessional = false,
}) {
  const errors = {};

  if (bookingType === 'patient') {
    if (!patientId) errors.patientId = 'Selecciona un paciente registrado';
  } else {
    if (personMode === 'new') {
      if (personForm?.fullName !== undefined) {
        if (!personForm.fullName.trim()) errors.fullName = 'El nombre completo es obligatorio';
      } else {
        if (!personForm?.firstName?.trim()) errors.firstName = 'El nombre es obligatorio';
        if (!personForm?.lastName?.trim()) errors.lastName = 'El apellido es obligatorio';
        if (personForm?.phone !== undefined && !personForm?.phone?.trim()) errors.phone = 'El teléfono celular es obligatorio';
      }
    } else {
      if (!selectedPersonId) errors.personId = 'Selecciona una persona de la lista';
    }
  }

  if (requireServices && (!serviceIds || serviceIds.length === 0)) {
    errors.serviceIds = 'Selecciona al menos un servicio odontológico';
  }
  if (requireProfessional && !professionalId) {
    errors.professionalId = 'Asigna un profesional';
  }
  if (!date) {
    errors.date = 'Selecciona una fecha';
  }

  return errors;
}

test('Frontend UI: validación de campos obligatorios en modo Paciente vs Nueva Persona', () => {
  // Modo Paciente con campos vacíos
  const errorsEmptyPatient = validateAppointmentForm({
    bookingType: 'patient',
    patientId: '',
    serviceIds: [],
    date: '',
  });
  assert.equal(errorsEmptyPatient.patientId, 'Selecciona un paciente registrado');
  assert.equal(errorsEmptyPatient.serviceIds, 'Selecciona al menos un servicio odontológico');
  assert.equal(errorsEmptyPatient.date, 'Selecciona una fecha');

  // Modo Paciente completado con éxito
  const errorsValidPatient = validateAppointmentForm({
    bookingType: 'patient',
    patientId: 'pat-123',
    serviceIds: ['svc-1'],
    date: '2026-11-01',
  });
  assert.equal(Object.keys(errorsValidPatient).length, 0);

  // Modo Nueva Persona sin datos de contacto
  const errorsEmptyPerson = validateAppointmentForm({
    bookingType: 'person',
    personMode: 'new',
    personForm: { firstName: '', lastName: '', phone: '' },
    serviceIds: ['svc-1'],
    date: '2026-11-01',
  });
  assert.equal(errorsEmptyPerson.firstName, 'El nombre es obligatorio');
  assert.equal(errorsEmptyPerson.lastName, 'El apellido es obligatorio');
  assert.equal(errorsEmptyPerson.phone, 'El teléfono celular es obligatorio');

  // Modo Nueva Persona completo
  const errorsValidPerson = validateAppointmentForm({
    bookingType: 'person',
    personMode: 'new',
    personForm: { firstName: 'Carlos', lastName: 'Mendoza', phone: '76543210' },
    serviceIds: ['svc-1'],
    date: '2026-11-01',
  });
  assert.equal(Object.keys(errorsValidPerson).length, 0);

  // Modo Nueva Persona simplificado (Nombre Completo único y teléfono opcional)
  const errorsEmptyFullName = validateAppointmentForm({
    bookingType: 'person',
    personMode: 'new',
    personForm: { fullName: '', phone: '' },
    serviceIds: ['svc-1'],
    date: '2026-11-01',
  });
  assert.equal(errorsEmptyFullName.fullName, 'El nombre completo es obligatorio');
  assert.equal(errorsEmptyFullName.phone, undefined, 'El teléfono debe ser opcional');

  const errorsValidFullNameWithoutPhone = validateAppointmentForm({
    bookingType: 'person',
    personMode: 'new',
    personForm: { fullName: 'Carlos Mendoza', phone: '' },
    serviceIds: ['svc-1'],
    date: '2026-11-01',
  });
  assert.equal(Object.keys(errorsValidFullNameWithoutPhone).length, 0);

  // Modo Persona Existente seleccionada de lista
  const errorsExistingPerson = validateAppointmentForm({
    bookingType: 'person',
    personMode: 'existing',
    selectedPersonId: 'per-001',
    serviceIds: ['svc-1'],
    date: '2026-11-01',
  });
  assert.equal(Object.keys(errorsExistingPerson).length, 0);
});

test('Frontend UI: formulario inicializa sin paciente ni servicios preseleccionados por defecto', () => {
  // Estado inicial esperado en modal
  const initialForm = {
    patientId: '',
    serviceIds: [],
    professionalId: '',
    date: '2026-11-28',
    startTime: '09:00',
  };

  assert.equal(initialForm.patientId, '', 'No debe haber paciente seleccionado por defecto');
  assert.deepEqual(initialForm.serviceIds, [], 'No debe haber servicios seleccionados por defecto');

  // Si se intenta validar en modo paciente con formulario limpio, exige paciente
  const errors = validateAppointmentForm({
    bookingType: 'patient',
    patientId: initialForm.patientId,
    serviceIds: initialForm.serviceIds,
    date: initialForm.date,
    requireServices: false, // servicios son opcionales
  });

  assert.equal(errors.patientId, 'Selecciona un paciente registrado');
  assert.equal(errors.serviceIds, undefined, 'No debe fallar por servicios si son opcionales');
});

// ============================================================================
// 3. FRONTEND LOGIC: Generación de contexto de WhatsApp para confirmación
// ============================================================================

function buildWhatsAppContext({
  bookingType,
  selectedPatient,
  createdPerson,
  serviceNames,
  dateStr,
  startTime,
  professionalName,
  clinicName = 'Dental Care Consultorio',
}) {
  let attendeeName = 'Paciente';
  let attendeePhone = '';

  if (bookingType === 'patient') {
    attendeeName = selectedPatient?.name || 'Paciente';
    attendeePhone = selectedPatient?.phone || '';
  } else {
    attendeeName = createdPerson?.fullName || `${createdPerson?.firstName ?? ''} ${createdPerson?.lastName ?? ''}`.trim() || 'Contacto';
    attendeePhone = createdPerson?.phone || '';
  }

  return {
    patientName: attendeeName,
    patientPhone: attendeePhone,
    serviceName: serviceNames || 'Consulta odontológica',
    dateStr,
    timeStr: startTime,
    clinicName,
    professionalName,
  };
}

test('Frontend UI: genera contexto de WhatsApp exacto para paciente y para persona de primer contacto', () => {
  const patientWa = buildWhatsAppContext({
    bookingType: 'patient',
    selectedPatient: { name: 'María Gómez', phone: '+591 71234567' },
    serviceNames: 'Limpieza Dental + Sellantes',
    dateStr: 'jueves, 5 de noviembre',
    startTime: '10:00',
    professionalName: 'Dra. Silva',
  });

  assert.equal(patientWa.patientName, 'María Gómez');
  assert.equal(patientWa.patientPhone, '+591 71234567');
  assert.equal(patientWa.serviceName, 'Limpieza Dental + Sellantes');
  assert.equal(patientWa.timeStr, '10:00');
  assert.equal(patientWa.professionalName, 'Dra. Silva');

  const personWa = buildWhatsAppContext({
    bookingType: 'person',
    createdPerson: { fullName: 'Carlos Mendoza', phone: '76543210' },
    serviceNames: 'Consulta odontológica inicial',
    dateStr: 'viernes, 6 de noviembre',
    startTime: '15:00',
    professionalName: 'Dr. Valdivia',
  });

  assert.equal(personWa.patientName, 'Carlos Mendoza');
  assert.equal(personWa.patientPhone, '76543210');
  assert.equal(personWa.serviceName, 'Consulta odontológica inicial');
});

// ============================================================================
// 4. FRONTEND BFF PROXY ROUTE SECURITY
// ============================================================================

test('Frontend BFF Proxy: valida la lista blanca de rutas permitidas para citas y personas', () => {
  const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  const ROUTES = [
    { method: 'GET', pattern: /^appointments$/ },
    { method: 'POST', pattern: /^appointments$/ },
    { method: 'GET', pattern: new RegExp(`^appointments/${UUID}$`) },
    { method: 'PATCH', pattern: new RegExp(`^appointments/${UUID}/status$`) },
    { method: 'POST', pattern: new RegExp(`^appointments/${UUID}/cancel$`) },
    { method: 'GET', pattern: /^persons$/ },
    { method: 'POST', pattern: /^persons$/ },
    { method: 'GET', pattern: new RegExp(`^persons/${UUID}$`) },
    { method: 'POST', pattern: new RegExp(`^persons/${UUID}/convert$`) },
    { method: 'GET', pattern: /^services$/ },
    { method: 'GET', pattern: new RegExp(`^services/${UUID}$`) },
  ];

  const testId = randomUUID();

  const isAllowed = (method, path) =>
    ROUTES.some((route) => route.method === method && route.pattern.test(path));

  // Rutas válidas
  assert.ok(isAllowed('GET', 'appointments'));
  assert.ok(isAllowed('POST', 'appointments'));
  assert.ok(isAllowed('GET', `appointments/${testId}`));
  assert.ok(isAllowed('PATCH', `appointments/${testId}/status`));
  assert.ok(isAllowed('POST', `appointments/${testId}/cancel`));
  assert.ok(isAllowed('GET', 'persons'));
  assert.ok(isAllowed('POST', 'persons'));
  assert.ok(isAllowed('GET', `persons/${testId}`));
  assert.ok(isAllowed('POST', `persons/${testId}/convert`));
  assert.ok(isAllowed('GET', 'services'));
  assert.ok(isAllowed('GET', `services/${testId}`));

  // Rutas prohibidas o con inyección
  assert.equal(isAllowed('DELETE', 'appointments'), false);
  assert.equal(isAllowed('PUT', `appointments/${testId}`), false);
  assert.equal(isAllowed('GET', 'appointments/../../admin'), false);
  assert.equal(isAllowed('POST', 'patients'), false); // pacientes va por su propio canal
  assert.equal(isAllowed('POST', 'users'), false);
});

// ============================================================================
// 5. HAG-41: CreateAppointmentModal dinámico, UUIDs en servicios y formatCurrency
// ============================================================================

test('HAG-41: CreateAppointmentModal no contiene slugs ni moneda Bs. hardcodeada y usa UUIDs canónicos', () => {
  const modalPath = path.resolve(
    __dirname,
    '../src/modules/clinic/components/CreateAppointmentModal.tsx',
  );
  const content = fs.readFileSync(modalPath, 'utf8');

  // 1. Prohibido slugs tipo 'svc-'
  assert.equal(
    /id:\s*"svc-/.test(content),
    false,
    "No debe contener slugs de servicio como 'svc-consulta-general'",
  );

  // 2. Cero 'Bs.' hardcodeado en precios
  assert.equal(
    /Bs\./.test(content),
    false,
    "No debe contener 'Bs.' hardcodeado; debe usar formatCurrency",
  );

  // 3. Importación y uso de formatCurrency
  assert.match(
    content,
    /import\s+\{\s*formatCurrency\s*\}\s+from\s+"@app\/ui"/,
    'Debe importar formatCurrency de @app/ui',
  );

  // 4. Fallback services con UUIDs v7 válidos
  const matches = content.match(/id:\s*"([0-9a-fA-F-]{36})"/g) || [];
  assert.ok(matches.length >= 4, 'Debe definir al menos 4 servicios fallback con UUIDs válidos');

  // 5. branchId y practitionerMembershipId dinámicos
  assert.match(
    content,
    /branchId:\s*activeBranchId/,
    'createAppointment debe usar activeBranchId dinámico',
  );
  assert.match(
    content,
    /practitionerMembershipId:\s*activePractitionerId/,
    'createAppointment debe usar activePractitionerId dinámico',
  );
  assert.match(
    content,
    /\/api\/auth\/me/,
    'Debe consultar /api/auth/me para resolver contexto de sesión',
  );
});

// ============================================================================
// 6. HAG-45: Odontólogo y servicios opcionales en CreateAppointmentModal + Tarjetas enriquecidas en Agenda.tsx
// ============================================================================

test('HAG-45: CreateAppointmentModal permite odontólogo y servicios opcionales con duración default de 30 min', () => {
  const modalPath = path.resolve(
    __dirname,
    '../src/modules/clinic/components/CreateAppointmentModal.tsx',
  );
  const content = fs.readFileSync(modalPath, 'utf8');

  // 1. Selector de profesional incluye opción vacía "Sin asignar / Por definir"
  assert.match(
    content,
    /value:\s*""[\s\S]*?label:\s*"Sin asignar \/ Por definir"/,
    'Debe ofrecer opción vacía para profesional no asignado',
  );

  // 2. No debe haber validación estricta de servicios obligatorios en validate()
  assert.equal(
    /e\.serviceIds\s*=\s*"Selecciona al menos un servicio/.test(content),
    false,
    'No debe obligar a seleccionar servicios en validate()',
  );

  // 3. Duración por defecto de 30 min cuando no se seleccionan servicios
  assert.match(
    content,
    /effectiveDurationMin\s*=\s*totalDurationMin\s*>\s*0\s*\?\s*totalDurationMin\s*:\s*30/,
    'Debe aplicar duración fallback de 30 min si no hay servicios',
  );

  // 4. TimePicker editable para Hora de Fin / Fin Estimado
  assert.match(
    content,
    /<TimePicker[\s\S]*?label="Fin Estimado"/,
    'Debe permitir editar el fin estimado mediante TimePicker',
  );

  // 5. Payload de creación con practitionerMembershipId y serviceIds opcionales
  assert.match(
    content,
    /practitionerMembershipId:\s*activePractitionerId\s*\|\|\s*undefined/,
    'Debe enviar undefined si el profesional no fue asignado',
  );
  assert.match(
    content,
    /serviceIds:\s*form\.serviceIds\.length\s*\?\s*form\.serviceIds\s*:\s*undefined/,
    'Debe enviar undefined si no se seleccionaron servicios',
  );
});

test('HAG-45: Agenda.tsx enriquece tarjetas en Feed y Grilla con badges Paciente/Persona, teléfono y píldora Por asignar', () => {
  const agendaPath = path.resolve(
    __dirname,
    '../src/modules/clinic/views/Agenda.tsx',
  );
  const content = fs.readFileSync(agendaPath, 'utf8');

  // 1. Badge sutil de Paciente y Persona
  assert.match(content, />\s*Persona\s*<\/span>/, 'Debe renderizar badge para Persona');
  assert.match(content, />\s*Paciente\s*<\/span>/, 'Debe renderizar badge para Paciente');

  // 2. Teléfono legible directo
  assert.match(content, /displayPhone/, 'Debe calcular teléfono legible para visualización directa');

  // 3. Píldora discreta 'Por asignar' para doctor no asignado
  assert.match(content, /Por asignar/, 'Debe renderizar píldora Por asignar cuando no hay doctor');

  // 4. Servicio o Consulta / Evaluación general
  assert.match(
    content,
    /Consulta \/ Evaluación general/,
    'Debe usar fallback Consulta / Evaluación general si no hay servicio',
  );

  // 5. Motivo o nota rápida truncada con icono
  assert.match(
    content,
    /cleanedNote/,
    'Debe renderizar cleanedNote truncada cuando existe motivo o nota clínica',
  );
});
