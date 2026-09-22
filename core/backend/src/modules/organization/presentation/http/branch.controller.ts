import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { CreateBranchUseCase } from "../../application/use-case/create-branch.use-case.js";
import { CreateBranchDto } from "../dto/create-branch.dto.js";
import { JwtAuthGuard } from '../../../auth/presentation/http/guards/jwt-auth.guard.js';
import { CoreAccessGuard } from '../../../auth/presentation/http/guards/core-access.guard.js';
import { RequireCoreAccess } from '../../../auth/presentation/http/decorators/require-core-access.decorator.js';

@Controller('branches')
@UseGuards(JwtAuthGuard, CoreAccessGuard)
export class BranchController {
  constructor(private readonly createBranchUseCase: CreateBranchUseCase) {}

  @Post('create')
  @RequireCoreAccess('branches:create')
  async createBranch(
    @Body() body: CreateBranchDto
  ) {
    return await this.createBranchUseCase.execute(body);
  }
}
