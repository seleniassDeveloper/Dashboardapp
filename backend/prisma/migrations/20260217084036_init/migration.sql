/*
  Warnings:

  - You are about to drop the column `fullName` on the `Client` table. All the data in the column will be lost.
  - Added the required column `workerId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Made the column `firstName` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "workerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "fullName",
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_serviceId_idx" ON "Appointment"("serviceId");

-- CreateIndex
CREATE INDEX "Appointment_workerId_idx" ON "Appointment"("workerId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
