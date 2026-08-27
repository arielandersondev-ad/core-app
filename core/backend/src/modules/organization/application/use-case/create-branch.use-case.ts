import { Injectable } from "@nestjs/common";
import { BranchRepository } from "../../domain/repositories/branch.repository.js";
import { CreateBranchDto } from "../../presentation/dto/create-branch.dto.js";

@Injectable()
export class CreateBranchUseCase {
  constructor(private readonly branchRepo: BranchRepository) {}

  async execute(data: CreateBranchDto): Promise<any> {
    return await this.branchRepo.create(data);
  }
}
