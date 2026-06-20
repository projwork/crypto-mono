import PDFDocument from "pdfkit";
import { getReceipt } from "./transfers.service.js";

export const generateReceiptPdf = async (
  userId: string,
  transferId: string,
): Promise<Buffer> => {
  const receipt = await getReceipt(userId, transferId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const line = (label: string, value: string) => {
      doc.font("Helvetica-Bold").fontSize(10).text(`${label}: `, { continued: true });
      doc.font("Helvetica").text(value);
    };

    doc.font("Helvetica-Bold").fontSize(22).text("LagerPay Transfer Receipt", {
      align: "center",
    });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor("#555555").text("Cross-border crypto remittance", {
      align: "center",
    });
    doc.fillColor("#000000");
    doc.moveDown(1.5);

    doc.font("Helvetica-Bold").fontSize(14).text("Transfer Details");
    doc.moveDown(0.5);
    line("Reference", receipt.reference);
    line("Status", receipt.status);
    line("Created", new Date(receipt.createdAt).toLocaleString());
    if (receipt.completedAt) {
      line("Completed", new Date(receipt.completedAt).toLocaleString());
    }
    doc.moveDown(1);

    doc.font("Helvetica-Bold").fontSize(14).text("Amounts");
    doc.moveDown(0.5);
    line("Asset sent", `${receipt.sendAmount} ${receipt.asset}`);
    line("USD value", `$${receipt.usdValue}`);
    line("USD → ETB rate", receipt.usdToEtb);
    line("Gross ETB", `${receipt.grossEtb} ETB`);
    line("Fee ETB", `${receipt.feeEtb} ETB`);
    line("Payout ETB", `${receipt.payoutEtb} ETB`);
    doc.moveDown(1);

    doc.font("Helvetica-Bold").fontSize(14).text("Recipient");
    doc.moveDown(0.5);
    line("Name", receipt.beneficiary.fullName);
    line("Payout method", receipt.beneficiary.payoutMethod);
    if (receipt.beneficiary.bank) {
      line("Bank", receipt.beneficiary.bank);
    }
    if (receipt.beneficiary.accountNumber) {
      line("Account", receipt.beneficiary.accountNumber);
    }
    if (receipt.beneficiary.phoneNumber) {
      line("Phone", receipt.beneficiary.phoneNumber);
    }
    doc.moveDown(1);

    if (receipt.txHash || receipt.payoutReference) {
      doc.font("Helvetica-Bold").fontSize(14).text("Settlement References");
      doc.moveDown(0.5);
      if (receipt.txHash) {
        line("Blockchain TX", receipt.txHash);
      }
      if (receipt.payoutReference) {
        line("Payout reference", receipt.payoutReference);
      }
      doc.moveDown(1);
    }

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#888888")
      .text(
        "This receipt is generated electronically and serves as proof of your transfer request and settlement status.",
        { align: "center" },
      );

    doc.end();
  });
};
