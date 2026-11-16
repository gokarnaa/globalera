import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function AdmissionAgreementPrintModal({ open, onClose, admission }) {
  if (!admission) return null;

  const handlePrint = () => {
    window.print();
  };

  // Render a single copy (either Office Copy or Student Copy)
  const renderAgreementDocument = (copyType) => {
    const isOffice = copyType === 'OFFICE';
    return (
      <Box
        className={`agreement-sheet ${isOffice ? 'page-break' : ''}`}
        sx={{
          bgcolor: '#ffffff',
          color: '#1e293b',
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
          p: { xs: 2.5, sm: 4 },
          mb: { xs: 3, print: 0 },
          border: '1px solid #cbd5e1',
          borderRadius: { xs: 1.5, print: 0 },
          boxShadow: { xs: '0 4px 14px rgba(0,0,0,0.06)', print: 'none' },
          maxWidth: '210mm',
          mx: 'auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Header with Copy Badge */}
        <Box sx={{ borderBottom: '2.5px solid #0f2e5a', pb: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: '#0f2e5a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontSize: { xs: '1.05rem', sm: '1.22rem' },
                  lineHeight: 1.2
                }}
              >
                Global Era Multi Service Pvt. Ltd.
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: '#b45309', fontSize: { xs: '0.9rem', sm: '1rem' }, mt: 0.2 }}
              >
                Technical School Jorpati
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3, fontSize: '0.78rem' }}>
                Gokarneshwor Municipality-05, Jorpati, Kathmandu | Phone: 01-4915555, 9851000000 | PAN No: 609876543
              </Typography>
            </Box>

            {/* Badge for Copy Type */}
            <Box sx={{ textAlign: 'right' }}>
              <Box
                sx={{
                  display: 'inline-block',
                  border: isOffice ? '2px solid #b91c1c' : '2px solid #0284c7',
                  bgcolor: isOffice ? '#fef2f2' : '#f0f9ff',
                  color: isOffice ? '#991b1b' : '#0369a1',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  textTransform: 'uppercase'
                }}
              >
                {isOffice ? 'OFFICE COPY' : 'STUDENT COPY'}
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748b', fontSize: '0.72rem' }}>
                Agreement No: <strong>{admission.agreementNo || 'GE-AGR-001'}</strong>
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Title */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: '#0f2e5a',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              fontSize: { xs: '1rem', sm: '1.1rem' }
            }}
          >
            TRAINEE ADMISSION & VOCATIONAL TRAINING AGREEMENT
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: '0.03em' }}>
            TERMS OF ENROLLMENT, FEE SCHEDULE & TRAINING CODE OF CONDUCT
          </Typography>
        </Box>

        {/* Basic Metadata Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 1,
            px: 1.5,
            py: 0.8,
            mb: 2,
            fontSize: '0.82rem'
          }}
        >
          <Box>
            Registration / Roll No: <strong>{admission.studentId || 'STD-01'} ({admission.tgid || 'TGID-101'})</strong>
          </Box>
          <Box>
            Admission Date: <strong>{admission.admissionDateBS || admission.admissionDate}</strong>
          </Box>
          <Box>
            Status: <strong style={{ color: '#059669' }}>ENROLLED</strong>
          </Box>
        </Box>

        {/* Section 1: Parties */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.8, fontSize: '0.85rem' }}>
            1. Parties to the Agreement:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#334155' }}>
            <strong>First Party (Institution):</strong> Global Era Multi Service Pvt. Ltd. (Technical School Jorpati), Gokarneshwor-05, Kathmandu.
            <br />
            <strong>Second Party (Trainee):</strong> Mr./Ms. <strong>{admission.studentName}</strong>, Gender: <strong>{admission.gender || 'Female'}</strong>, Phone: <strong>{admission.phone}</strong> {admission.secondaryPhone ? `(${admission.secondaryPhone})` : ''}, Current Address: <strong>{admission.currentAddress || 'Kathmandu'}</strong>, Permanent Address: <strong>{admission.permanentAddress || 'Kathmandu'}</strong>, Citizenship/ID No: <strong>{admission.citizenshipNumber || 'N/A'}</strong>.
          </Typography>
        </Box>

        {/* Section 2: Training Details */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.8, fontSize: '0.85rem' }}>
            2. Course & Training Scope:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, bgcolor: '#f8fafc', p: 1.2, borderRadius: 1, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
            <Box>Course Title: <strong>{admission.courseTitle}</strong></Box>
            <Box>Training Batch: <strong>{admission.groupName || 'GRP-01'}</strong></Box>
            <Box>Daily Shift & Time: <strong>{admission.shift} ({admission.timing})</strong></Box>
            <Box>Total Duration: <strong>{admission.duration}</strong></Box>
          </Box>
          <Box sx={{ mt: 0.8, fontSize: '0.8rem', color: '#475569' }}>
            <strong>Curriculum & Key Skills:</strong> {admission.keySkills || 'Theoretical and practical skills according to approved curriculum, machinery and tool operations, occupational safety, and professional finishing.'}
          </Box>
        </Box>

        {/* Section 3: OJT & Placement */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.8, fontSize: '0.85rem' }}>
            3. On-the-Job Training (OJT) & Industry Facilitation:
          </Typography>
          <Box sx={{ bgcolor: '#f1f5f9', p: 1.2, borderRadius: 1, fontSize: '0.82rem', lineHeight: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 3, mb: 0.5 }}>
              <span>OJT Facility: <strong>{admission.ojtPreference === 'REQUIRED' ? '✓ Required (Coordinated by Institution)' : '✗ Not Required (Self Arranged)'}</strong></span>
              <span>OJT Fee: <strong style={{ color: '#059669' }}>Complimentary (Included in Course Fee)</strong></span>
            </Box>
            <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#475569' }}>
              • Upon successful completion of training with regular attendance and satisfactory practical evaluation, the institution shall coordinate and recommend the student for OJT internship and employment interviews at partner industries.
            </Typography>
          </Box>
        </Box>

        {/* Section 4: Fee Structure & 50% Rule */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.8, fontSize: '0.85rem' }}>
            4. Fee Structure & Payment Terms:
          </Typography>
          <Box sx={{ border: '1px solid #cbd5e1', borderRadius: 1, overflow: 'hidden', mb: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f2e5a', color: '#ffffff' }}>
                  <th style={{ padding: '6px 10px', borderRight: '1px solid #334155' }}>Particulars</th>
                  <th style={{ padding: '6px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>Amount (Rs.)</th>
                  <th style={{ padding: '6px 10px' }}>Payment Status / Due Date</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 10px' }}>Standard Course Fee</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>Rs. {(Number(admission.totalCourseFee) || 0).toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', color: '#64748b' }}>Standard Fee</td>
                </tr>
                {admission.discountAmount > 0 && (
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fefce8' }}>
                    <td style={{ padding: '6px 10px', color: '#b45309' }}>Approved Special Scholarship / Discount</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#b45309', fontWeight: 600 }}>- Rs. {(Number(admission.discountAmount) || 0).toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', color: '#b45309' }}>Discount Approved</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 700 }}>
                  <td style={{ padding: '6px 10px' }}>Net Payable Fee</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: '#0f2e5a' }}>Rs. {(Number(admission.netPayableFee) || 0).toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', color: '#0f2e5a' }}>Agreed Fee</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ecfdf5' }}>
                  <td style={{ padding: '6px 10px', color: '#065f46', fontWeight: 700 }}>1st Installment (50% Advance at Admission)</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: '#065f46', fontWeight: 800 }}>Rs. {(Number(admission.advancePaid50) || 0).toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', color: '#065f46' }}>
                    <strong>Paid (Receipt: {admission.receiptNo})</strong> | {admission.paymentMethod}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#fff1f2' }}>
                  <td style={{ padding: '6px 10px', color: '#991b1b', fontWeight: 700 }}>2nd Installment (Remaining 50%)</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: '#991b1b', fontWeight: 800 }}>Rs. {(Number(admission.dueAmount50) || 0).toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', color: '#991b1b', fontWeight: 700 }}>
                    Due Date: {admission.dueDate} (Within 30 Days)
                  </td>
                </tr>
              </tbody>
            </table>
          </Box>
          <Box sx={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: 600, pl: 0.5 }}>
            * Policy: Remaining 50% course fee must be paid within 30 days of training start. Fees paid are non-refundable under all circumstances.
          </Box>
        </Box>

        {/* Section 5: Rules & Regulations */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.8, fontSize: '0.85rem' }}>
            5. Rules, Code of Conduct & Batch Transfer Policy:
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
            <li><strong>Attendance:</strong> Minimum <strong>80% attendance</strong> is mandatory to be eligible for certification and OJT recommendation.</li>
            <li><strong>Safety & Equipment:</strong> Trainees must carefully handle all lab equipment, machines, and tools. Any intentional damage or negligence must be compensated by the trainee.</li>
            <li><strong>Batch Transfer Policy:</strong> In case of unavoidable health or personal emergencies, a trainee may request <strong>1 batch transfer</strong> upon prior written approval from the administration.</li>
            <li><strong>Certification:</strong> Official course completion certificates and OJT letters are issued only after 100% fee clearance and passing internal skill assessments.</li>
          </Box>
        </Box>

        {/* Section 6: Declaration & Signatures */}
        <Box sx={{ mt: 2.5, pt: 1.5, borderTop: '1.5px solid #cbd5e1' }}>
          <Typography variant="body2" sx={{ fontSize: '0.78rem', fontStyle: 'italic', color: '#475569', mb: 3 }}>
            "I have thoroughly read and understood the course scope, fee schedule, 50% advance and 30-day payment term, code of conduct, and institute regulations, and hereby sign this agreement in full concurrence."
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', px: 2 }}>
            {/* Student Signature */}
            <Box sx={{ textAlign: 'center', width: '220px' }}>
              <Box sx={{ borderBottom: '1.5px dashed #475569', height: '40px', mb: 0.5 }}></Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '0.84rem' }}>
                Trainee's Signature
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.74rem' }}>
                Name: <strong>{admission.studentName}</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>
                Phone: {admission.phone}
              </Typography>
            </Box>

            {/* Official Seal / Stamp */}
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  border: '1.5px dashed #94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  mx: 'auto'
                }}
              >
                Official Seal
              </Box>
            </Box>

            {/* Authorized Signatory */}
            <Box sx={{ textAlign: 'center', width: '220px' }}>
              <Box sx={{ borderBottom: '1.5px dashed #475569', height: '40px', mb: 0.5 }}></Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '0.84rem' }}>
                Authorized Signatory / Principal
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.74rem' }}>
                Global Era Multi Service Pvt. Ltd.
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>
                Date: {admission.admissionDateBS || admission.admissionDate}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      {/* Top Action Toolbar (Hidden in Print) */}
      <DialogTitle
        className="no-print"
        sx={{
          bgcolor: '#0f2e5a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5,
          px: 3
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SchoolIcon sx={{ color: '#f59e0b' }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Trainee Admission Agreement
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              Print dual copies (Office Copy and Student Copy) on standard A4 paper
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ fontWeight: 800, px: 2.5 }}
          >
            Print Dual Copy (A4)
          </Button>
          <IconButton onClick={onClose} sx={{ color: '#cbd5e1' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#f1f5f9' }}>
        <Box id="printableAdmissionAgreement">
          {/* Page 1: Office Copy */}
          {renderAgreementDocument('OFFICE')}

          {/* Page 2: Student Copy */}
          {renderAgreementDocument('STUDENT')}
        </Box>
      </DialogContent>

      <DialogActions className="no-print" sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          * Select A4 size in your print dialogue. Both copies will print automatically across 2 pages.
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ fontWeight: 800 }}
          >
            Print
          </Button>
        </Stack>
      </DialogActions>

      {/* Embedded CSS for Exact A4 Portrait 2-Page Print */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printableAdmissionAgreement, #printableAdmissionAgreement * {
            visibility: visible !important;
          }
          #printableAdmissionAgreement {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .agreement-sheet {
            border: 1.5px solid #0f2e5a !important;
            padding: 16mm 14mm !important;
            box-sizing: border-box !important;
            height: 275mm !important;
            max-height: 275mm !important;
            display: flex !important;
            flex-direction: column !important;
            justifyContent: space-between !important;
            page-break-inside: avoid !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
