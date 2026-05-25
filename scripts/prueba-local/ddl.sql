CREATE TABLE IF NOT EXISTS "Client" (
  "id" TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "Service" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "price" INTEGER NOT NULL,
  "duration" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "availableOnline" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "Worker" (
  "id" TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "roleTitle" TEXT,
  "customFields" JSONB,
  "availableOnline" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" TEXT PRIMARY KEY,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "clientId" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "reminderSentAt" TIMESTAMP(3),
  "reminderType" TEXT,
  "source" TEXT NOT NULL DEFAULT 'dashboard',
  CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "FormSchema" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "entity" TEXT,
  "component" TEXT,
  "schemaType" TEXT NOT NULL DEFAULT 'legacy',
  "fields" JSONB NOT NULL DEFAULT '[]',
  "fieldRefs" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "BusinessModel" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "allowedTriggers" JSONB NOT NULL,
  "allowedActions" JSONB NOT NULL,
  "templateWorkflows" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "Workflow" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "businessModelId" TEXT NOT NULL,
  "trigger" JSONB NOT NULL,
  "steps" JSONB NOT NULL,
  "transitions" JSONB NOT NULL DEFAULT '[]',
  "screens" JSONB NOT NULL DEFAULT '[]',
  "runCount" INTEGER NOT NULL DEFAULT 0,
  "lastRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workflow_businessModelId_fkey" FOREIGN KEY ("businessModelId") REFERENCES "BusinessModel"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Workflow_businessModelId_idx" ON "Workflow"("businessModelId");
CREATE INDEX IF NOT EXISTS "Workflow_status_idx" ON "Workflow"("status");
CREATE TABLE IF NOT EXISTS "WorkerSchedule" (
  "id" TEXT PRIMARY KEY,
  "workerId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkerSchedule_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "WorkerSchedule_workerId_dayOfWeek_idx" ON "WorkerSchedule"("workerId","dayOfWeek");
CREATE TABLE IF NOT EXISTS "WorkerService" (
  "workerId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "customPrice" INTEGER,
  CONSTRAINT "WorkerService_pkey" PRIMARY KEY ("workerId","serviceId"),
  CONSTRAINT "WorkerService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WorkerService_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "WorkerService_serviceId_idx" ON "WorkerService"("serviceId");
CREATE TABLE IF NOT EXISTS "DashboardWidget" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "config" JSONB NOT NULL,
  "layout" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "DashboardWidget_userId_idx" ON "DashboardWidget"("userId");
CREATE TABLE IF NOT EXISTS "Business" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "logo" TEXT,
  "description" TEXT,
  "bookingEnabled" BOOLEAN NOT NULL DEFAULT true,
  "bookingPrimaryColor" TEXT NOT NULL DEFAULT '#10b981',
  "bookingConfirmationMessage" TEXT DEFAULT '¡Tu reserva ha sido confirmada con éxito!',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "ScheduleBlock" (
  "id" TEXT PRIMARY KEY,
  "workerId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleBlock_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ScheduleBlock_workerId_idx" ON "ScheduleBlock"("workerId");
