export abstract class VerticalAccessPolicy {
  abstract canAccessDentistry(organizationId: string, now: Date): Promise<boolean>;
}
