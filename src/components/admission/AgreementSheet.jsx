import React from 'react';
import { Box, Typography } from '@mui/material';

export const DEFAULT_AGREEMENT_TEMPLATE = {
  title: 'TRAINEE ADMISSION & VOCATIONAL TRAINING AGREEMENT',
  subtitle: 'TERMS OF ENROLLMENT, FEE SCHEDULE & TRAINING CODE OF CONDUCT',
  copyMode: 'dual', // 'dual' | 'single'
  accentColor: '#0f2e5a',
  borderStyle: 'solid', // 'solid' | 'double' | 'minimal'
  fontScale: 'standard', // 'compact' | 'standard' | 'large'
  showLogo: true,
  showStamp: true,
  showOjtSection: true,
  showFeeTable: true,
  showRulesSection: true,
  showGuardianSignature: false,
  ojtNote:
    'Upon successful completion of training with regular attendance and satisfactory practical evaluation, the institution shall coordinate and recommend the student for OJT internship and employment interviews at partner industries.',
  feePolicyNote:
    '* Policy: Remaining 50% course fee must be paid within 30 days of training start. Fees paid are non-refundable under all circumstances.',
  declarationText:
    '"I have thoroughly read and understood the course scope, fee schedule, 50% advance and 30-day payment term, code of conduct, and institute regulations, and hereby sign this agreement in full concurrence."',
  rules: [
    'Attendance: Minimum 80% attendance is mandatory to be eligible for certification and OJT recommendation.',
    'Safety & Equipment: Trainees must carefully handle all lab equipment, machines, and tools. Any intentional damage or negligence must be compensated by the trainee.',
    'Batch Transfer Policy: In case of unavoidable health or personal emergencies, a trainee may request 1 batch transfer upon prior written approval from the administration.',
    'Certification: Official course completion certificates and OJT letters are issued only after 100% fee clearance and passing internal skill assessments.'
  ]
};

export function mergeAgreementTemplate(saved) {
  return {
    ...DEFAULT_AGREEMENT_TEMPLATE,
    ...(saved || {}),
    rules:
      Array.isArray(saved?.rules) && saved.rules.length > 0
        ? saved.rules
        : DEFAULT_AGREEMENT_TEMPLATE.rules
  };
}

function interpolatePlaceholders(text, admission) {
  return String(text || '')
    .replace(/\{\{studentName\}\}/g, admission?.studentName || 'Trainee')
    .replace(/\{\{courseTitle\}\}/g, admission?.courseTitle || 'Vocational Course')
    .replace(/\{\{netFee\}\}/g, `Rs. ${(Number(admission?.netPayableFee) || 0).toLocaleString()}`)
    .replace(/\{\{dueDate\}\}/g, admission?.dueDate || 'Within 30 Days')
    .replace(/\{\{agreementNo\}\}/g, admission?.agreementNo || 'GE-AGR-001');
}

export default function AgreementSheet({
  admission,
  template,
  copyType = 'OFFICE',
  companyProfile = {}
}) {
  const tpl = mergeAgreementTemplate(template);
  const isOffice = copyType === 'OFFICE';
  const accent = tpl.accentColor || '#0f2e5a';

  const scale =
    tpl.fontScale === 'compact'
      ? { body: '0.74rem', heading: '0.78rem', title: '0.96rem', pad: { xs: 2, sm: 3 }, gap: 1.2 }
      : tpl.fontScale === 'large'
        ? { body: '0.88rem', heading: '0.92rem', title: '1.16rem', pad: { xs: 2.5, sm: 4 }, gap: 2 }
        : { body: '0.81rem', heading: '0.85rem', title: '1.08rem', pad: { xs: 2.5, sm: 3.5 }, gap: 1.6 };

  const borderCss =
    tpl.borderStyle === 'double'
      ? `3px double ${accent}`
      : tpl.borderStyle === 'minimal'
        ? '1px solid #cbd5e1'
        : `1.5px solid ${accent}`;

  const orgName = companyProfile.companyNameEnglish || 'Global Era Multi Service Pvt. Ltd.';
  const schoolName = companyProfile.companyNameNepali || 'Prabidhik School, Jorpati';
  const address = companyProfile.address || 'Gokarneshwor Municipality-05, Jorpati, Kathmandu';
  const phone = companyProfile.contactPhone || '01-4910715';
  const whatsapp = companyProfile.whatsappPhone || '9705147147';
  const panNo = companyProfile.panNo || '609876543';
  const directorName = companyProfile.directorName || '';
  const directorTitle = companyProfile.directorTitle || 'Authorized Signatory / Principal';

  return (
    <Box
      className={`agreement-sheet ${isOffice && tpl.copyMode === 'dual' ? 'page-break' : ''}`}
      sx={{
        bgcolor: '#ffffff',
        color: '#1e293b',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        p: scale.pad,
        mb: { xs: 3, print: 0 },
        border: borderCss,
        borderRadius: { xs: 1.5, print: 0 },
        boxShadow: { xs: '0 4px 14px rgba(0,0,0,0.06)', print: 'none' },
        maxWidth: '210mm',
        mx: 'auto',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header */}
      <Box sx={{ borderBottom: `2.5px solid ${accent}`, pb: 1.3, mb: scale.gap }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {tpl.showLogo && companyProfile.logoUrl && (
              <Box
                component="img"
                src={companyProfile.logoUrl}
                alt="Logo"
                sx={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }}
              />
            )}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontSize: { xs: '1rem', sm: '1.18rem' },
                  lineHeight: 1.2
                }}
              >
                {orgName}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: '#b45309', fontSize: { xs: '0.88rem', sm: '0.96rem' }, mt: 0.2 }}
              >
                {schoolName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3, fontSize: '0.75rem' }}>
                {address} | Phone: {phone} | WhatsApp: {whatsapp} | PAN: {panNo}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Box
              sx={{
                display: 'inline-block',
                border: isOffice ? '2px solid #b91c1c' : '2px solid #0284c7',
                bgcolor: isOffice ? '#fef2f2' : '#f0f9ff',
                color: isOffice ? '#991b1b' : '#0369a1',
                fontWeight: 900,
                fontSize: '0.72rem',
                letterSpacing: '0.05em',
                px: 1.4,
                py: 0.45,
                borderRadius: 1,
                textTransform: 'uppercase'
              }}
            >
              {isOffice ? 'OFFICE COPY' : 'STUDENT COPY'}
            </Box>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748b', fontSize: '0.7rem' }}>
              Agreement No: <strong>{admission.agreementNo || 'GE-AGR-001'}</strong>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Title */}
      <Box sx={{ textAlign: 'center', mb: scale.gap }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            color: accent,
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
            fontSize: scale.title
          }}
        >
          {tpl.title}
        </Typography>
        {tpl.subtitle && (
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: '0.03em' }}>
            {tpl.subtitle}
          </Typography>
        )}
      </Box>

      {/* Metadata Row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          bgcolor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 1,
          px: 1.5,
          py: 0.75,
          mb: scale.gap,
          fontSize: scale.body
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
      <Box sx={{ mb: scale.gap }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accent, borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.7, fontSize: scale.heading }}>
          1. Parties to the Agreement:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: scale.body, lineHeight: 1.5, color: '#334155' }}>
          <strong>First Party (Institution):</strong> {orgName} ({schoolName}), {address}.
          <br />
          <strong>Second Party (Trainee):</strong> Mr./Ms. <strong>{admission.studentName}</strong>, Gender: <strong>{admission.gender || 'Female'}</strong>, Phone: <strong>{admission.phone}</strong> {admission.secondaryPhone ? `(${admission.secondaryPhone})` : ''}, Current Address: <strong>{admission.currentAddress || 'Kathmandu'}</strong>, Permanent Address: <strong>{admission.permanentAddress || 'Kathmandu'}</strong>, Citizenship/ID No: <strong>{admission.citizenshipNumber || 'N/A'}</strong>.
        </Typography>
      </Box>

      {/* Section 2: Course & Training Scope */}
      <Box sx={{ mb: scale.gap }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accent, borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.7, fontSize: scale.heading }}>
          2. Course & Training Scope:
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.8, bgcolor: '#f8fafc', p: 1.1, borderRadius: 1, border: '1px solid #e2e8f0', fontSize: scale.body }}>
          <Box>Course Title: <strong>{admission.courseTitle}</strong></Box>
          <Box>Training Batch: <strong>{admission.groupName || 'GRP-01'}</strong></Box>
          <Box>Daily Shift & Time: <strong>{admission.shift || 'Morning'} ({admission.timing || '07:00 - 10:00'})</strong></Box>
          <Box>Total Duration: <strong>{admission.duration || '3 Months'}</strong></Box>
        </Box>
        <Box sx={{ mt: 0.7, fontSize: scale.body, color: '#475569' }}>
          <strong>Curriculum & Key Skills:</strong> {admission.keySkills || 'Theoretical and practical skills according to approved curriculum, machinery and tool operations, occupational safety, and professional finishing.'}
        </Box>
      </Box>

      {/* Section 3: OJT & Placement */}
      {tpl.showOjtSection && (
        <Box sx={{ mb: scale.gap }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accent, borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.7, fontSize: scale.heading }}>
            3. On-the-Job Training (OJT) & Industry Facilitation:
          </Typography>
          <Box sx={{ bgcolor: '#f1f5f9', p: 1.1, borderRadius: 1, fontSize: scale.body, lineHeight: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 3, mb: 0.4, flexWrap: 'wrap' }}>
              <span>OJT Facility: <strong>{admission.ojtPreference === 'REQUIRED' ? '✓ Required (Coordinated by Institution)' : '✗ Not Required (Self Arranged)'}</strong></span>
              <span>OJT Fee: <strong style={{ color: '#059669' }}>Complimentary (Included in Course Fee)</strong></span>
            </Box>
            <Typography variant="body2" sx={{ fontSize: scale.body, color: '#475569' }}>
              • {interpolatePlaceholders(tpl.ojtNote, admission)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Section 4: Fee Structure */}
      {tpl.showFeeTable && (
        <Box sx={{ mb: scale.gap }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accent, borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.7, fontSize: scale.heading }}>
            4. Fee Structure & Payment Terms:
          </Typography>
          <Box sx={{ border: '1px solid #cbd5e1', borderRadius: 1, overflow: 'hidden', mb: 0.8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: scale.body, textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: accent, color: '#ffffff' }}>
                  <th style={{ padding: '5px 10px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Particulars</th>
                  <th style={{ padding: '5px 10px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'right' }}>Amount (Rs.)</th>
                  <th style={{ padding: '5px 10px' }}>Payment Status / Due Date</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 10px' }}>Standard Course Fee</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600 }}>Rs. {(Number(admission.totalCourseFee) || 0).toLocaleString()}</td>
                  <td style={{ padding: '5px 10px', color: '#64748b' }}>Standard Fee</td>
                </tr>
                {Number(admission.discountAmount) > 0 && (
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fefce8' }}>
                    <td style={{ padding: '5px 10px', color: '#b45309' }}>Approved Special Scholarship / Discount</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', color: '#b45309', fontWeight: 600 }}>- Rs. {(Number(admission.discountAmount) || 0).toLocaleString()}</td>
                    <td style={{ padding: '5px 10px', color: '#b45309' }}>Discount Approved</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 700 }}>
                  <td style={{ padding: '5px 10px' }}>Net Payable Fee</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', color: accent }}>Rs. {(Number(admission.netPayableFee) || 0).toLocaleString()}</td>
                  <td style={{ padding: '5px 10px', color: accent }}>Agreed Fee</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ecfdf5' }}>
                  <td style={{ padding: '5px 10px', color: '#065f46', fontWeight: 700 }}>1st Installment (Advance at Admission)</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', color: '#065f46', fontWeight: 800 }}>Rs. {(Number(admission.advancePaid50) || 0).toLocaleString()}</td>
                  <td style={{ padding: '5px 10px', color: '#065f46' }}>
                    <strong>Paid (Receipt: {admission.receiptNo || '-'})</strong> | {admission.paymentMethod || 'Cash'}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#fff1f2' }}>
                  <td style={{ padding: '5px 10px', color: '#991b1b', fontWeight: 700 }}>2nd Installment (Remaining Balance)</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', color: '#991b1b', fontWeight: 800 }}>Rs. {(Number(admission.dueAmount50) || 0).toLocaleString()}</td>
                  <td style={{ padding: '5px 10px', color: '#991b1b', fontWeight: 700 }}>
                    Due Date: {admission.dueDate || 'Within 30 Days'}
                  </td>
                </tr>
              </tbody>
            </table>
          </Box>
          {tpl.feePolicyNote && (
            <Box sx={{ fontSize: scale.body, color: '#b91c1c', fontWeight: 600, pl: 0.5 }}>
              {interpolatePlaceholders(tpl.feePolicyNote, admission)}
            </Box>
          )}
        </Box>
      )}

      {/* Section 5: Rules & Code of Conduct */}
      {tpl.showRulesSection && tpl.rules.length > 0 && (
        <Box sx={{ mb: scale.gap }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accent, borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.7, fontSize: scale.heading }}>
            5. Rules, Code of Conduct & Batch Transfer Policy:
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: scale.body, color: '#334155', lineHeight: 1.5 }}>
            {tpl.rules.map((rule, idx) => (
              <li key={idx}>{interpolatePlaceholders(rule, admission)}</li>
            ))}
          </Box>
        </Box>
      )}

      {/* Section 6: Declaration & Signatures */}
      <Box sx={{ mt: 2, pt: 1.3, borderTop: '1.5px solid #cbd5e1' }}>
        <Typography variant="body2" sx={{ fontSize: scale.body, fontStyle: 'italic', color: '#475569', mb: 2.5 }}>
          {interpolatePlaceholders(tpl.declarationText, admission)}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', px: 1.5, gap: 2 }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Box sx={{ borderBottom: '1.5px dashed #475569', height: '38px', mb: 0.5 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accent, fontSize: scale.body }}>
              Trainee's Signature
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>
              Name: <strong>{admission.studentName}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>
              Phone: {admission.phone}
            </Typography>
          </Box>

          {tpl.showGuardianSignature && (
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Box sx={{ borderBottom: '1.5px dashed #475569', height: '38px', mb: 0.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accent, fontSize: scale.body }}>
                Guardian / Witness
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>
                Name & Relation
              </Typography>
            </Box>
          )}

          {tpl.showStamp && (
            <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
              {companyProfile.stampUrl ? (
                <Box
                  component="img"
                  src={companyProfile.stampUrl}
                  alt="Official Stamp"
                  sx={{ width: 82, height: 82, objectFit: 'contain', mx: 'auto' }}
                />
              ) : (
                <Box
                  sx={{
                    width: '82px',
                    height: '82px',
                    borderRadius: '50%',
                    border: '1.5px dashed #94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    mx: 'auto'
                  }}
                >
                  Official Seal
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Box sx={{ borderBottom: '1.5px dashed #475569', height: '38px', mb: 0.5 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accent, fontSize: scale.body }}>
              {directorName || directorTitle}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>
              {directorName ? directorTitle : orgName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>
              Date: {admission.admissionDateBS || admission.admissionDate}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
