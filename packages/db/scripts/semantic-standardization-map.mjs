/** Nominal-only mapping shared by the migration and parity checks. */
export const tableRenames = {
  core: {
    Authorization: 'UserCredential',
    Session: 'AuthSession',
    Membership: 'OrganizationMembership',
    MembershipBranch: 'OrganizationMembershipBranch',
    MembershipRole: 'OrganizationMembershipRole',
    OrganizationPlan: 'OrganizationPlanAssignment',
  },
  dentistry: {
    patients: 'Patient',
    clinical_histories: 'PatientHealthProfile',
    appointments: 'Appointment',
    clinical_encounters: 'ClinicalEncounter',
    dental_services: 'DentalService',
    dental_service_supplies: 'DentalServiceSupply',
    appointment_services: 'AppointmentService',
    treatments: 'Treatment',
    payments: 'Payment',
    clinical_files: 'ClinicalFile',
    radiographs: 'Radiograph',
  },
};

export const modelRenames = {
  Authorization: 'UserCredential', Session: 'AuthSession',
  Membership: 'OrganizationMembership', MembershipBranch: 'OrganizationMembershipBranch',
  MembershipRole: 'OrganizationMembershipRole', OrganizationPlan: 'OrganizationPlanAssignment',
  ClinicalHistory: 'PatientHealthProfile',
};

/** Keys are target physical table names, not arbitrary field occurrences. */
export const columnRenames = {
  'core.Plan': { configuration: 'entitlements', active: 'isActive' },
  'dentistry.DentalService': { active: 'isActive' },
  'dentistry.Appointment': {
    professionalMembershipId: 'practitionerMembershipId', startsAt: 'scheduledStartAt',
    endsAt: 'scheduledEndAt', cancelledAt: 'canceledAt',
    cancelledByMembershipId: 'canceledByMembershipId',
  },
  'dentistry.ClinicalEncounter': {
    professionalMembershipId: 'practitionerMembershipId', diagnosis: 'diagnosisSummary',
    procedurePerformed: 'procedureSummary', evolution: 'progressNotes', recommendations: 'patientInstructions',
  },
  'dentistry.Treatment': {
    responsibleMembershipId: 'practitionerMembershipId', diagnosis: 'diagnosisSummary',
  },
};

export const relationRenames = {
  User: { authorization: 'credential', sessions: 'authSessions' },
  Organization: { plans: 'planAssignments' },
  Plan: { organizations: 'organizationAssignments' },
  OrganizationMembership: { branches: 'branchAssignments', roles: 'roleAssignments' },
  Patient: { clinicalHistory: 'healthProfile' },
};

export const preservedColumns = ['deleted', 'serviceId', 'inventoryItemId', 'takenAt'];
export const quoteIdentifier = (value) => '"' + value.replaceAll('"', '""') + '"';
