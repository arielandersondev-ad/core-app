import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/infrastructure/prisma.module.js';
import { DentistryAuthModule } from '../auth/dentistry-auth.module.js';
import { PatientModule } from '../patient/patient.module.js';
import { PaymentAccess } from './application/payment-access.js';
import {
  GetEncounterPaymentProposalUseCase,
  GetEncounterPaymentUseCase,
  GetPaymentUseCase,
  GetTreatmentAccountUseCase,
  ListPaymentsUseCase,
} from './application/use-case/get-payments.use-case.js';
import { RegisterEncounterPaymentUseCase } from './application/use-case/register-encounter-payment.use-case.js';
import { RegisterTreatmentPaymentUseCase } from './application/use-case/register-treatment-payment.use-case.js';
import { VoidPaymentUseCase } from './application/use-case/void-payment.use-case.js';
import { PaymentRepository } from './domain/repositories/payment.repository.js';
import { PrismaPaymentRepository } from './infrastructure/prisma-payment.repository.js';
import { PaymentController } from './presentation/http/payment.controller.js';

@Module({
  imports: [PrismaModule, DentistryAuthModule, PatientModule],
  controllers: [PaymentController],
  providers: [
    { provide: PaymentRepository, useClass: PrismaPaymentRepository },
    PaymentAccess,
    ListPaymentsUseCase,
    GetPaymentUseCase,
    GetEncounterPaymentUseCase,
    GetEncounterPaymentProposalUseCase,
    GetTreatmentAccountUseCase,
    RegisterTreatmentPaymentUseCase,
    RegisterEncounterPaymentUseCase,
    VoidPaymentUseCase,
  ],
  exports: [PaymentRepository],
})
export class PaymentModule {}
