import PDFDocument from "pdfkit";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

const PURPLE = "#6d4ae8";
const DARK = "#111827";
const MUTED = "#6b7280";

/**
 * Genera el PDF del recibo de sueldo y lo devuelve como Buffer.
 */
export function buildPayslipPdf({ payment, worker, business }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 48 });
      const chunks = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const businessName = business?.name || "Aura Studio";
      const workerName = worker ? `${worker.firstName || ""} ${worker.lastName || ""}`.trim() : "Colaborador";
      const role = worker?.roleTitle || "Estilista";
      const paymentDate = payment?.paymentDate ? new Date(payment.paymentDate) : new Date();
      const period = payment?.period || `${paymentDate.getMonth() + 1}/${paymentDate.getFullYear()}`;

      // Encabezado / membrete
      doc.fillColor(PURPLE).fontSize(20).font("Helvetica-Bold").text(businessName.toUpperCase());
      doc.moveDown(0.2);
      doc.fillColor(MUTED).fontSize(9).font("Helvetica").text("Recibo de Haberes y Liquidación de Sueldo");
      doc.moveUp(2);
      doc.fillColor(DARK).fontSize(12).font("Helvetica-Bold").text("RECIBO DE HABERES", { align: "right" });
      doc.fillColor(MUTED).fontSize(9).font("Helvetica").text(`Fecha de liquidación: ${paymentDate.toLocaleDateString("es-AR")}`, { align: "right" });
      doc.text(`Período liquidado: ${period}`, { align: "right" });

      doc.moveDown(1);
      doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#e5e7eb").stroke();
      doc.moveDown(0.8);

      // Datos del colaborador
      const infoY = doc.y;
      doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text("Colaborador:", 48, infoY, { continued: true }).font("Helvetica").text(` ${workerName}`);
      doc.font("Helvetica-Bold").text("Rol / Categoría:", { continued: true }).font("Helvetica").text(` ${role}`);
      if (worker?.email) {
        doc.font("Helvetica-Bold").text("Email:", { continued: true }).font("Helvetica").text(` ${worker.email}`);
      }
      doc.moveDown(1);

      // Tabla de conceptos
      const drawRow = (concepto, haber, descuento) => {
        const y = doc.y;
        doc.fontSize(9.5).fillColor("#374151").font("Helvetica");
        doc.text(concepto, 48, y, { width: 300 });
        doc.text(haber || "—", 350, y, { width: 95, align: "right" });
        doc.text(descuento || "—", 452, y, { width: 95, align: "right" });
        doc.moveDown(0.5);
      };

      doc.rect(48, doc.y - 2, 499, 20).fill("#f3f2fa");
      doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold");

      const hy = doc.y + 3;
      doc.text("Concepto / Descripción", 54, hy, { width: 290 });
      doc.text("Haberes", 350, hy, { width: 95, align: "right" });
      doc.text("Descuentos", 452, hy, { width: 95, align: "right" });
      doc.moveDown(1.4);

      drawRow("Sueldo básico", currency(payment.baseSalary), null);
      drawRow("Comisión por servicios realizados", currency(payment.commissionPaid), null);
      if (payment.bonuses > 0) drawRow("Bonos / Incentivos", currency(payment.bonuses), null);
      if (payment.advances > 0) drawRow("Adelanto quincenal", null, `(${currency(payment.advances)})`);
      if (payment.deductions > 0) drawRow("Descuentos / Faltas", null, `(${currency(payment.deductions)})`);
      if (payment.taxes > 0) drawRow("Retenciones / Aportes", null, `(${currency(payment.taxes)})`);

      doc.moveDown(0.3);
      doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#e5e7eb").stroke();
      doc.moveDown(0.5);

      // Total neto
      doc.rect(320, doc.y, 227, 40).fill("#f3f2fa");
      const ty = doc.y + 8;
      doc.fillColor(PURPLE).fontSize(9).font("Helvetica-Bold").text("TOTAL NETO A COBRAR", 330, ty, { width: 207, align: "right" });
      doc.fillColor(DARK).fontSize(16).font("Helvetica-Bold").text(currency(payment.netPaid), 330, ty + 12, { width: 207, align: "right" });

      doc.moveDown(3.2);

      // Desglose de comisiones por servicio
      const detail = Array.isArray(payment.commissionDetail) ? payment.commissionDetail : [];
      if (detail.length > 0) {
        doc.fillColor(DARK).fontSize(11).font("Helvetica-Bold").text("Detalle de comisiones por servicio");
        doc.moveDown(0.4);
        doc.rect(48, doc.y - 2, 499, 18).fill("#faf5ff");
        const dy = doc.y + 2;
        doc.fillColor(PURPLE).fontSize(8.5).font("Helvetica-Bold");
        doc.text("Servicio", 54, dy, { width: 250 });
        doc.text("Citas", 310, dy, { width: 60, align: "right" });
        doc.text("Comisión", 452, dy, { width: 95, align: "right" });
        doc.moveDown(1.2);

        detail.forEach((d) => {
          const y = doc.y;
          doc.fillColor("#374151").fontSize(9).font("Helvetica");
          doc.text(d.serviceName || "Servicio", 54, y, { width: 250 });
          doc.text(String(d.count ?? "—"), 310, y, { width: 60, align: "right" });
          doc.text(currency(d.commission), 452, y, { width: 95, align: "right" });
          doc.moveDown(0.45);
        });

        doc.moveDown(0.2);
        doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#e5e7eb").stroke();
        doc.moveDown(0.4);
        const ttl = detail.reduce((s, d) => s + (Number(d.commission) || 0), 0);
        doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold").text(`Total comisiones: ${currency(ttl)}`, 48, doc.y, { width: 499, align: "right" });
      }

      if (payment.notes) {
        doc.moveDown(1);
        doc.fillColor(MUTED).fontSize(8.5).font("Helvetica-Oblique").text(`Observaciones: ${payment.notes}`, { width: 499 });
      }

      // Firmas
      const signY = Math.max(doc.y + 60, 720);
      doc.strokeColor("#9ca3af");
      doc.moveTo(70, signY).lineTo(250, signY).stroke();
      doc.moveTo(320, signY).lineTo(500, signY).stroke();
      doc.fillColor(MUTED).fontSize(8.5).font("Helvetica");
      doc.text("Firma Empleador", 70, signY + 4, { width: 180, align: "center" });
      doc.text("Firma Colaborador", 320, signY + 4, { width: 180, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/** HTML del cuerpo del email que acompaña el PDF. */
export function buildPayslipEmailHtml({ payment, worker, business }) {
  const businessName = business?.name || "Aura Studio";
  const workerName = worker ? `${worker.firstName || ""} ${worker.lastName || ""}`.trim() : "Colaborador";
  const paymentDate = payment?.paymentDate ? new Date(payment.paymentDate) : new Date();
  const period = payment?.period || `${paymentDate.getMonth() + 1}/${paymentDate.getFullYear()}`;
  const net = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(payment.netPaid);

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#1e1b2e">
  <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;padding:22px 24px;border-radius:14px 14px 0 0">
    <h2 style="margin:0;font-size:18px">${businessName}</h2>
    <p style="margin:4px 0 0;opacity:.85;font-size:13px">Recibo de sueldo — período ${period}</p>
  </div>
  <div style="border:1px solid #eee;border-top:0;border-radius:0 0 14px 14px;padding:24px">
    <p style="font-size:14px">Hola <strong>${workerName}</strong>,</p>
    <p style="font-size:14px;line-height:1.6">Adjuntamos tu recibo de sueldo del período <strong>${period}</strong>. El total neto liquidado es <strong>${net}</strong>.</p>
    <p style="font-size:13px;color:#6b7280;line-height:1.6">Encontrarás el detalle de haberes, descuentos y comisiones en el PDF adjunto. Ante cualquier consulta, respondé este correo.</p>
    <p style="font-size:13px;margin-top:20px">Saludos,<br/>${businessName}</p>
  </div>
</div>`;
}
