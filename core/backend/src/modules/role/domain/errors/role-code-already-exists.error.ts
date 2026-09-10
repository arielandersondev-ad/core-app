export class RoleCodeAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`Ya existe un rol con el código ${code} en el alcance indicado`);
    this.name = RoleCodeAlreadyExistsError.name;
  }
}
