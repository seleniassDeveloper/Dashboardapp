const fs = require('fs');

let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

if (!content.includes('model DataImportHistory')) {
  // Add relation to Business
  content = content.replace('bankMovements              BankMovement[]', 'bankMovements              BankMovement[]\n  dataImports                DataImportHistory[]');

  // Append new model
  const newModel = `
model DataImportHistory {
  id          String   @id @default(cuid())
  businessId  String
  name        String
  status      String   @default("COMPLETED")
  details     Json     
  createdAt   DateTime @default(now())
  
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId])
}
`;
  content += newModel;
  fs.writeFileSync('backend/prisma/schema.prisma', content);
}
