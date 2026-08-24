import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/infrastructure/prisma.service.js";
import { CreateUser, User } from "../domain/entities/user.entity.js";

@Injectable()
export class PrismaUserRepository {
  constructor(
    private prisma: PrismaService
  ) {}

  async createUser(data: CreateUser): Promise<User> {
    const row = await this.prisma.orm.public.User.create(data)
    return {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      status: row.status,
      emailVerifiedAt: row.emailVerifiedAt,
      deleted: row.deleted,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }
}
