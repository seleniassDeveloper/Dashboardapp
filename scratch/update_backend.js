const fs = require('fs');

let content = fs.readFileSync('backend/src/routes/google.routes.js', 'utf8');

// For Clients
content = content.replace(
`            const nameVal = row[mapping.firstName];
            if (!nameVal) {
              failedCount++;
              skippedDetails.push({ row: rowNum, motive: "Falta nombre del cliente" });
              return;
            }

            let firstName = nameVal.trim();
            let lastName = "";
            if (mapping.lastName && row[mapping.lastName]) {
              lastName = row[mapping.lastName].trim();
            } else {
              const parts = nameVal.trim().split(/\\s+/);
              if (parts.length > 1) {
                firstName = parts[0];
                lastName = parts.slice(1).join(" ");
              }
            }`,
`            const nameVal = mapping.firstName && row[mapping.firstName] ? row[mapping.firstName] : "";
            let firstName = nameVal ? nameVal.trim() : "Cliente";
            let lastName = nameVal ? "" : "Anónimo";
            if (nameVal) {
              if (mapping.lastName && row[mapping.lastName]) {
                lastName = row[mapping.lastName].trim();
              } else {
                const parts = nameVal.trim().split(/\\s+/);
                if (parts.length > 1) {
                  firstName = parts[0];
                  lastName = parts.slice(1).join(" ");
                }
              }
            }`
);

// For Services
content = content.replace(
`            const name = row[mapping.name];
            if (!name) {
              failedCount++;
              skippedDetails.push({ row: rowNum, motive: "Falta nombre del servicio" });
              return;
            }`,
`            const nameVal = mapping.name && row[mapping.name] ? row[mapping.name] : "";
            const name = nameVal ? nameVal.trim() : "Servicio Importado";`
);

// For Workers
content = content.replace(
`            const nameVal = row[mapping.firstName];
            if (!nameVal) {
              failedCount++;
              skippedDetails.push({ row: rowNum, motive: "Falta nombre del profesional" });
              return;
            }

            let firstName = nameVal.trim();
            let lastName = "";
            if (mapping.lastName && row[mapping.lastName]) {
              lastName = row[mapping.lastName].trim();
            } else {
              const parts = nameVal.trim().split(/\\s+/);
              if (parts.length > 1) {
                firstName = parts[0];
                lastName = parts.slice(1).join(" ");
              }
            }`,
`            const nameVal = mapping.firstName && row[mapping.firstName] ? row[mapping.firstName] : "";
            let firstName = nameVal ? nameVal.trim() : "Profesional";
            let lastName = nameVal ? "" : "Importado";
            if (nameVal) {
              if (mapping.lastName && row[mapping.lastName]) {
                lastName = row[mapping.lastName].trim();
              } else {
                const parts = nameVal.trim().split(/\\s+/);
                if (parts.length > 1) {
                  firstName = parts[0];
                  lastName = parts.slice(1).join(" ");
                }
              }
            }`
);

// For Appointments
content = content.replace(
`            const clientName = row[mapping.clientName];
            const serviceName = row[mapping.serviceName];
            const workerName = row[mapping.workerName];
            const dateVal = row[mapping.startsAt];

            if (!clientName || !serviceName || !workerName || !dateVal) {
              failedCount++;
              skippedDetails.push({ row: rowNum, motive: "Faltan datos obligatorios (cliente, servicio, profesional o fecha)" });
              return;
            }`,
`            const clientName = mapping.clientName && row[mapping.clientName] ? row[mapping.clientName] : "Cliente Anónimo";
            const serviceName = mapping.serviceName && row[mapping.serviceName] ? row[mapping.serviceName] : "Servicio General";
            const workerName = mapping.workerName && row[mapping.workerName] ? row[mapping.workerName] : "Profesional Asignado";
            let dateVal = mapping.startsAt && row[mapping.startsAt] ? row[mapping.startsAt] : null;
            if (!dateVal) {
              dateVal = new Date().toISOString();
            }`
);

fs.writeFileSync('backend/src/routes/google.routes.js', content);
