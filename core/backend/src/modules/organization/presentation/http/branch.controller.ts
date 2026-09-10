import { Controller, Post, Body } from "@nestjs/common";
import { CreateBranchUseCase } from "../../application/use-case/create-branch.use-case.js";
import { CreateBranchDto } from "../dto/create-branch.dto.js";

@Controller('branches')
export class BranchController {
  constructor(private readonly createBranchUseCase: CreateBranchUseCase) {}

  @Post('create')
  async createBranch(
    @Body() body: CreateBranchDto
  ) {
    return await this.createBranchUseCase.execute(body);
  }
}
