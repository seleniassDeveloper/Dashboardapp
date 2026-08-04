-- AlterTable
ALTER TABLE "DashboardWidget" ADD COLUMN IF NOT EXISTS "businessId" TEXT,
ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DashboardWidget_userId_businessId_idx" ON "DashboardWidget"("userId", "businessId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DashboardWidget_businessId_fkey'
    ) THEN
        ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
