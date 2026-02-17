-- DropIndex
DROP INDEX "Appointment_clientId_idx";

-- DropIndex
DROP INDEX "Appointment_serviceId_idx";

-- DropIndex
DROP INDEX "Appointment_workerId_idx";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "workerFirstName" TEXT,
ADD COLUMN     "workerLastName" TEXT;
