export class MembershipAlreadyExistsError extends Error {
  constructor() {
    super('El usuario ya tiene una membresía activa en esta organización');
    this.name = MembershipAlreadyExistsError.name;
  }
}
