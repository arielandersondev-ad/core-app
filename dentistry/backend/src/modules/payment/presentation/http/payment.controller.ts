import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { DentistryPrincipal } from '../../../auth/application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from '../../../auth/presentation/http/decorators/current-principal.decorator.js';
import { RequireModule } from '../../../auth/presentation/http/decorators/require-module.decorator.js';
import { RequirePermission } from '../../../auth/presentation/http/decorators/require-permission.decorator.js';
import { DentistryJwtGuard } from '../../../auth/presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryModuleGuard } from '../../../auth/presentation/http/guards/dentistry-module.guard.js';
import { DentistryPermissionGuard } from '../../../auth/presentation/http/guards/dentistry-permission.guard.js';
import {
  GetEncounterPaymentProposalUseCase,
  GetEncounterPaymentUseCase,
  GetPaymentUseCase,
  GetTreatmentAccountUseCase,
  ListPaymentsUseCase,
} from '../../application/use-case/get-payments.use-case.js';
import { RegisterEncounterPaymentUseCase } from '../../application/use-case/register-encounter-payment.use-case.js';
import { RegisterTreatmentPaymentUseCase } from '../../application/use-case/register-treatment-payment.use-case.js';
import { VoidPaymentUseCase } from '../../application/use-case/void-payment.use-case.js';
import type { PaymentProposal } from '../../domain/entities/payment.entity.js';
import type { PaymentInput } from '../../application/payment-rules.js';
import {
  ListPaymentsQueryDto,
  RegisterEncounterPaymentDto,
  RegisterTreatmentPaymentDto,
  VoidPaymentDto,
} from '../dto/payment.dto.js';
import {
  PaymentResponseDto,
  TreatmentAccountResponseDto,
} from '../dto/payment.response.dto.js';

type PaymentPage = {
  items: PaymentResponseDto[];
  pagination: PaginatedResult<unknown>['pagination'];
};

type PaymentBody = Omit<RegisterTreatmentPaymentDto, 'branchId'> &
  Omit<RegisterEncounterPaymentDto, 'treatmentId'>;

function toInput(dto: PaymentBody): PaymentInput {
  return {
    amountMinor: dto.amountMinor,
    paymentMethod: dto.paymentMethod,
    currency: dto.currency,
    paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
    reference: dto.reference,
    notes: dto.notes,
  };
}

@Controller('patients/:patientId')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard, DentistryModuleGuard)
@RequireModule('payments')
export class PaymentController {
  constructor(
    private readonly listUseCase: ListPaymentsUseCase,
    private readonly getUseCase: GetPaymentUseCase,
    private readonly getEncounterPaymentUseCase: GetEncounterPaymentUseCase,
    private readonly proposalUseCase: GetEncounterPaymentProposalUseCase,
    private readonly accountUseCase: GetTreatmentAccountUseCase,
    private readonly registerTreatmentUseCase: RegisterTreatmentPaymentUseCase,
    private readonly registerEncounterUseCase: RegisterEncounterPaymentUseCase,
    private readonly voidUseCase: VoidPaymentUseCase,
  ) {}

  @Get('payments')
  @RequirePermission('dentistry:payments:read')
  async list(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: ListPaymentsQueryDto,
  ): Promise<PaymentPage> {
    const result = await this.listUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      authorizedBranchIds: principal.branchIds,
      treatmentId: query.treatmentId,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      items: result.items.map(PaymentResponseDto.fromEntity),
      pagination: result.pagination,
    };
  }

  @Get('payments/:paymentId')
  @RequirePermission('dentistry:payments:read')
  async getById(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.getUseCase.execute(
      { organizationId: principal.organizationId, patientId },
      paymentId,
      principal.branchIds,
    );
    return PaymentResponseDto.fromEntity(payment);
  }

  @Post('payments/:paymentId/void')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('dentistry:payments:void')
  async void(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: VoidPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.voidUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      paymentId,
      authorizedBranchIds: principal.branchIds,
      reason: dto.reason,
      actorMembershipId: principal.membershipId,
    });
    return PaymentResponseDto.fromEntity(payment);
  }

  /** Estado de cuenta: presupuesto, cobrado y saldo acumulado por pago. */
  @Get('treatments/:treatmentId/account')
  @RequirePermission('dentistry:payments:read')
  async account(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('treatmentId', ParseUUIDPipe) treatmentId: string,
  ): Promise<TreatmentAccountResponseDto> {
    const account = await this.accountUseCase.execute(
      { organizationId: principal.organizationId, patientId },
      treatmentId,
    );
    return TreatmentAccountResponseDto.fromAccount(account);
  }

  /** Anticipo, pago al contado o abono entre visitas. */
  @Post('treatments/:treatmentId/payments')
  @RequirePermission('dentistry:payments:create')
  async registerForTreatment(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('treatmentId', ParseUUIDPipe) treatmentId: string,
    @Body() dto: RegisterTreatmentPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.registerTreatmentUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      treatmentId,
      branchId: dto.branchId,
      authorizedBranchIds: principal.branchIds,
      input: toInput(dto),
      actorMembershipId: principal.membershipId,
    });
    return PaymentResponseDto.fromEntity(payment);
  }

  /** Pago vigente de la atención; 404 si todavía no tiene abono. */
  @Get('clinical-encounters/:encounterId/payment')
  @RequirePermission('dentistry:payments:read')
  async getForEncounter(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.getEncounterPaymentUseCase.execute(
      { organizationId: principal.organizationId, patientId },
      encounterId,
      principal.branchIds,
    );
    return PaymentResponseDto.fromEntity(payment);
  }

  /** Monto sugerido al finalizar la atención; solo una propuesta, no crea nada. */
  @Get('clinical-encounters/:encounterId/payment-proposal')
  @RequirePermission('dentistry:payments:read')
  proposal(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
  ): Promise<PaymentProposal> {
    return this.proposalUseCase.execute(
      { organizationId: principal.organizationId, patientId },
      encounterId,
      principal.branchIds,
    );
  }

  /** Abono de una atención (1:1). Una atención sin pago es una prórroga. */
  @Post('clinical-encounters/:encounterId/payment')
  @RequirePermission('dentistry:payments:create')
  async registerForEncounter(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: RegisterEncounterPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.registerEncounterUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      encounterId,
      treatmentId: dto.treatmentId,
      authorizedBranchIds: principal.branchIds,
      input: toInput(dto),
      actorMembershipId: principal.membershipId,
    });
    return PaymentResponseDto.fromEntity(payment);
  }
}
