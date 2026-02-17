-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ALTER COLUMN "fullName" DROP NOT NULL;
