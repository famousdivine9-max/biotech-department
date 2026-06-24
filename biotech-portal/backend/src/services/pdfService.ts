import PDFDocument from 'pdfkit';

interface ReceiptData {
  receipt_number: string;
  full_name: string;
  matric_number: string;
  email: string;
  phone: string;
  level: string;
  academic_session: string;
  amount_paid: string | number;
  dues_amount?: string | number;
  processing_fee?: string | number;
  payment_reference: string;
  transaction_id: string;
  payment_channel?: string;
  issued_at: string | Date;
  payment_date?: string | Date;
}

interface SiteSettings {
  department_name?: string;
  faculty_name?: string;
  university_name?: string;
  department_logo?: string;
}

export const generateReceiptPDF = async (
  receipt: ReceiptData,
  settings: SiteSettings = {}
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const deptName = settings.department_name || 'Department of Biotechnology';
    const facultyName = settings.faculty_name || 'Faculty of Life Sciences';
    const uniName = settings.university_name || 'Federal University Lokoja';

    const PRIMARY = '#006400';
    const SECONDARY = '#0F766E';
    const ACCENT = '#F59E0B';
    const LIGHT_BG = '#F0FFF0';

    // ── HEADER BACKGROUND ──────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 130).fill(PRIMARY);

    // Header text
    doc.fillColor('white');
    doc.fontSize(20).font('Helvetica-Bold').text(uniName, 50, 25, { align: 'center' });
    doc.fontSize(13).font('Helvetica').text(deptName, 50, 52, { align: 'center' });
    doc.fontSize(11).text(facultyName, 50, 70, { align: 'center' });

    // OFFICIAL RECEIPT label
    doc.rect(0, 100, doc.page.width, 30).fill(SECONDARY);
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
      .text('OFFICIAL PAYMENT RECEIPT', 50, 108, { align: 'center' });

    // ── RECEIPT NUMBER BOX ────────────────────────────────────
    doc.rect(50, 148, doc.page.width - 100, 40).fill(LIGHT_BG).stroke(PRIMARY);
    doc.fillColor(PRIMARY).fontSize(16).font('Helvetica-Bold')
      .text(`Receipt No: ${receipt.receipt_number}`, 60, 158, { align: 'center' });

    // ── STUDENT DETAILS TABLE ─────────────────────────────────
    let yPos = 210;
    const leftCol = 70;
    const rightCol = 280;
    const rowHeight = 28;

    doc.fillColor(PRIMARY).fontSize(13).font('Helvetica-Bold')
      .text('STUDENT INFORMATION', leftCol, yPos);
    yPos += 20;
    doc.moveTo(leftCol, yPos).lineTo(doc.page.width - 50, yPos).strokeColor(PRIMARY).stroke();
    yPos += 10;

    const studentFields = [
      ['Full Name', receipt.full_name],
      ['Matric Number', receipt.matric_number],
      ['Email Address', receipt.email],
      ['Phone Number', receipt.phone],
      ['Level', receipt.level],
      ['Academic Session', receipt.academic_session],
    ];

    studentFields.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        doc.rect(leftCol - 5, yPos - 5, doc.page.width - 100, rowHeight).fill('#F8FAFC');
      }
      doc.fillColor('#666666').fontSize(10).font('Helvetica').text(label, leftCol, yPos);
      doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text(value || '—', rightCol, yPos);
      yPos += rowHeight;
    });

    yPos += 15;

    // ── PAYMENT DETAILS TABLE ─────────────────────────────────
    doc.fillColor(PRIMARY).fontSize(13).font('Helvetica-Bold').text('PAYMENT DETAILS', leftCol, yPos);
    yPos += 20;
    doc.moveTo(leftCol, yPos).lineTo(doc.page.width - 50, yPos).strokeColor(PRIMARY).stroke();
    yPos += 10;

    const formatNaira = (amount: string | number) =>
      `₦${parseFloat(String(amount)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

    const paymentFields = [
      ['Departmental Dues', formatNaira(receipt.dues_amount || 2000)],
      ['Processing Fee', formatNaira(receipt.processing_fee || 100)],
      ['Total Amount Paid', formatNaira(receipt.amount_paid)],
      ['Payment Reference', receipt.payment_reference],
      ['Transaction ID', receipt.transaction_id || '—'],
      ['Payment Channel', receipt.payment_channel ? receipt.payment_channel.toUpperCase() : '—'],
      ['Date Issued', new Date(receipt.issued_at).toLocaleString('en-NG', {
        dateStyle: 'full', timeStyle: 'short'
      })],
    ];

    paymentFields.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        doc.rect(leftCol - 5, yPos - 5, doc.page.width - 100, rowHeight).fill('#F8FAFC');
      }
      doc.fillColor('#666666').fontSize(10).font('Helvetica').text(label, leftCol, yPos);

      // Highlight total
      if (label === 'Total Amount Paid') {
        doc.fillColor(PRIMARY).fontSize(13).font('Helvetica-Bold').text(value, rightCol, yPos);
      } else {
        doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text(value, rightCol, yPos);
      }
      yPos += rowHeight;
    });

    yPos += 20;

    // ── NOTICE BOX ────────────────────────────────────────────
    doc.rect(leftCol - 5, yPos, doc.page.width - 95, 55)
      .fill('#FFFBEB').strokeColor(ACCENT).stroke();
    doc.fillColor('#92400E').fontSize(10).font('Helvetica-Bold')
      .text('IMPORTANT:', leftCol + 5, yPos + 8);
    doc.font('Helvetica').fillColor('#78350F')
      .text(
        'Keep this receipt as proof of payment. You can re-download this receipt anytime from the portal using your Matric Number or Receipt Number.',
        leftCol + 5, yPos + 22,
        { width: doc.page.width - 115 }
      );

    yPos += 75;

    // ── AUTHENTICITY STAMP ────────────────────────────────────
    doc.rect(leftCol - 5, yPos, doc.page.width - 95, 40)
      .fill('#F0FFF4').strokeColor(PRIMARY).stroke();
    doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold').text(
      '✓ AUTHENTIC RECEIPT — Verified by Paystack Payment Gateway',
      leftCol + 5,
      yPos + 14,
      { align: 'center', width: doc.page.width - 110 }
    );

    // ── FOOTER ────────────────────────────────────────────────
    const footerY = doc.page.height - 60;
    doc.rect(0, footerY, doc.page.width, 60).fill(PRIMARY);
    doc.fillColor('white').fontSize(9).font('Helvetica')
      .text(
        `${deptName} | ${facultyName} | ${uniName}`,
        50, footerY + 12,
        { align: 'center' }
      )
      .text(
        `Generated on ${new Date().toLocaleString('en-NG')} | This is a computer-generated receipt`,
        50, footerY + 28,
        { align: 'center' }
      )
      .text(
        'Biotechnology Departmental Portal — biotech.fulokoja.edu.ng',
        50, footerY + 44,
        { align: 'center' }
      );

    doc.end();
  });
};
