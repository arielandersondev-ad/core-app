import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PasswordHasher } from "../domain/services/password-hasher.js";

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptPasswordHasher extends PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }
}
