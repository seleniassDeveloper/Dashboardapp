-- Enriquecer SalaryPayment para el portal de recibos (envío por email + detalle de comisiones)
ALTER TABLE "SalaryPayment" ADD COLUMN "businessId" TEXT;
ALTER TABLE "SalaryPayment" ADD COLUMN "period" TEXT;
ALTER TABLE "SalaryPayment" ADD COLUMN "commissionDetail" JSONB;
ALTER TABLE "SalaryPayment" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE "SalaryPayment" ADD COLUMN "emailedAt" TIMESTAMP(3);
ALTER TABLE "SalaryPayment" ADD COLUMN "emailStatus" TEXT;

CREATE INDEX "SalaryPayment_businessId_idx" ON "SalaryPayment"("businessId");

ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
