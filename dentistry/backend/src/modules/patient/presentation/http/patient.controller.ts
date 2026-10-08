import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePatientUseCase } from '../../application/use-case/create-patient.use-case.js';
import { GetPatientByIdUseCase } from '../../application/use-case/get-patient-by-id.use-case.js';
import { ListPatientsUseCase } from '../../application/use-case/list-patients.use-case.js';
import { UpdatePatientUseCase } from '../../application/use-case/update-patient.use-case.js';
import { CreatePatientDto } from '../dto/create-patient.dto.js';
import { PatientResponseDto } from '../dto/patient.response.dto.js';
import { UpdatePatientDto } from '../dto/update-patient.dto.js';

@Controller('patients')
export class PatientController {
  constructor(
    private readonly listPatientsUseCase: ListPatientsUseCase,
    private readonly getPatientByIdUseCase: GetPatientByIdUseCase,
    private readonly createPatientUseCase: CreatePatientUseCase,
    private readonly updatePatientUseCase: UpdatePatientUseCase,
  ) {}

  @Get()
  async list(
    @Query('organizationId') organizationId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ): Promise<PatientResponseDto[]> {
    const patients = await this.listPatientsUseCase.execute({
      organizationId,
      search,
      status,
    });
    return patients.map(PatientResponseDto.fromEntity);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.getPatientByIdUseCase.execute(
      id,
      organizationId,
    );
    return PatientResponseDto.fromEntity(patient);
  }

  @Post()
  async create(@Body() dto: CreatePatientDto): Promise<PatientResponseDto> {
    const patient = await this.createPatientUseCase.execute({
      organizationId: dto.organizationId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      sex: dto.sex,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      address: dto.address,
      notes: dto.notes,
      createdByMembershipId: dto.createdByMembershipId,
    });
    return PatientResponseDto.fromEntity(patient);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    const patient = await this.updatePatientUseCase.execute({
      id,
      organizationId: dto.organizationId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      sex: dto.sex,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      address: dto.address,
      notes: dto.notes,
      updatedByMembershipId: dto.updatedByMembershipId,
    });
    return PatientResponseDto.fromEntity(patient);
  }
}
