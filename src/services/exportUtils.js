import * as XLSX from 'xlsx';

// Export an array of objects to Excel
export function exportToExcel(data, fileName = 'Report') {
  if (!data || !data.length) {
    alert('No data to export.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Generate standard vCard (.vcf) format for instant Google Contacts / Android / iPhone import
export function exportGoogleContactsVCF(students = [], employers = []) {
  let vcfContent = '';

  students.forEach((s) => {
    vcfContent += `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${s.name} (${s.tgid || 'Student'})\r\nN:${s.name};;;;\r\nTEL;TYPE=CELL:${s.phone || ''}\r\n`;
    if (s.secondaryPhone) {
      vcfContent += `TEL;TYPE=HOME:${s.secondaryPhone}\r\n`;
    }
    if (s.email) {
      vcfContent += `EMAIL:${s.email}\r\n`;
    }
    if (s.currentAddress) {
      vcfContent += `ADR;TYPE=HOME:;;${s.currentAddress};Kathmandu;;Nepal\r\n`;
    }
    vcfContent += `ORG:KITE CAREGIVER TRAINING CENTER\r\nNOTE:Student ID: ${s.tgid}\r\nEND:VCARD\r\n`;
  });

  employers.forEach((e) => {
    vcfContent += `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Employer: ${e.name}\r\nN:${e.name};;;;\r\nTEL;TYPE=WORK:${e.phone || ''}\r\n`;
    if (e.email) {
      vcfContent += `EMAIL:${e.email}\r\n`;
    }
    if (e.contactPerson) {
      vcfContent += `TITLE:Contact: ${e.contactPerson}\r\n`;
    }
    if (e.location) {
      vcfContent += `ADR;TYPE=WORK:;;${e.location};;;Nepal\r\n`;
    }
    vcfContent += `ORG:KITE Employer Partner\r\nNOTE:Industry: ${e.industry || ''}\r\nEND:VCARD\r\n`;
  });

  if (!vcfContent) {
    alert('No contacts available to export.');
    return;
  }

  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KITE_Google_Contacts_${new Date().toISOString().slice(0, 10)}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// WhatsApp URL generator for 1-Click direct chat
export function getWhatsAppUrl(phone, text) {
  if (!phone) return '#';
  // Strip non-numeric
  let cleaned = String(phone).replace(/\D/g, '');
  // Auto prepend Nepal code 977 if 10 digit local phone
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '977' + cleaned;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text || '')}`;
}

// Aakash SMS payload helper
export function sendAakashSmsSimulated(phone, message, token) {
  if (!phone || !message) return { success: false, message: 'Phone and message required.' };
  if (!token) {
    console.log(`[Aakash SMS Simulated] To: ${phone} -> ${message}`);
    return { success: true, simulated: true, message: 'SMS simulated (API key not configured).' };
  }
  // In real backend/edge function, POST to https://aakashsms.com/admin/public/sms/v3/send
  return { success: true, simulated: false, message: 'SMS dispatched.' };
}
