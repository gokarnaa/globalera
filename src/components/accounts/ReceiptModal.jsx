import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Divider,
  Paper,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArticleIcon from '@mui/icons-material/Article';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { QRCodeSVG } from 'qrcode.react';

// ============================================================================
// 1. NUMBER TO WORDS HELPERS (NEPALI & ENGLISH)
// ============================================================================
const nepaliDigits = [
  'शून्य', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ', 'दश',
  'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस', 'बीस',
  'एक्काइस', 'बाइस', 'तेइस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताइस', 'अठ्ठाइस', 'उनन्तिस', 'तीस',
  'एकत्तिस', 'बत्तिस', 'तेत्तिस', 'चौँतिस', 'पैँतिस', 'छत्तीस', 'सैँतिस', 'अड्तीस', 'उनन्चालीस', 'चालीस',
  'एकचालीस', 'बयालीस', 'त्रिचालीस', 'चौवालिस', 'पैँतालीस', 'छयालीस', 'सड्चालीस', 'अड्चालीस', 'उनन्चास', 'पचास',
  'एकाउन्न', 'बाउन्न', 'त्रिपन्न', 'चौवन्न', 'पचपन्न', 'छपन्न', 'सन्ताउन्न', 'अन्ठाउन्न', 'उनन्साठ्ठी', 'साठ्ठी',
  'एकसठ्ठी', 'बासठ्ठी', 'त्रिसठ्ठी', 'चौंसठ्ठी', 'पैंसठ्ठी', 'छैसठ्ठी', 'सड्सठ्ठी', 'अड्सठ्ठी', 'उनन्सत्तरी', 'सत्तरी',
  'एकहत्तर', 'बहत्तर', 'त्रिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्यासी', 'असी',
  'एकासी', 'बयासी', 'त्रियासी', 'चौरासी', 'पचासी', 'छयासी', 'सत्तासी', 'अठासी', 'उनन्नब्बे', 'नब्बे',
  'एकानब्बे', 'बयानब्बे', 'त्रियानब्बे', 'चौरानब्बे', 'पन्चानब्बे', 'छ्यानब्बे', 'सन्तानब्बे', 'अन्ठानब्बे', 'उनन्सय'
];

function toNepaliWords(n) {
  n = Math.floor(Number(n) || 0);
  if (!n || n <= 0) return 'शून्य रुपैयाँ मात्र';
  let str = '';
  const crore = Math.floor(n / 10000000);
  if (crore > 0) { str += nepaliDigits[crore] + ' करोड '; n %= 10000000; }
  const lakh = Math.floor(n / 100000);
  if (lakh > 0) { str += nepaliDigits[lakh] + ' लाख '; n %= 100000; }
  const thousand = Math.floor(n / 1000);
  if (thousand > 0) { str += nepaliDigits[thousand] + ' हजार '; n %= 1000; }
  const hundred = Math.floor(n / 100);
  if (hundred > 0) { str += nepaliDigits[hundred] + ' सय '; n %= 100; }
  if (n > 0) { str += nepaliDigits[n] + ' '; }
  return str.trim() + ' रुपैयाँ मात्र';
}

const engA = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const engB = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function toEnglishWords(num) {
  num = Math.floor(Number(num) || 0);
  if (!num || num <= 0) return 'Zero Rupees Only';
  function convert(n) {
    if (n < 20) return engA[n];
    if (n < 100) return engB[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + engA[n % 10] : '');
    if (n < 1000) return engA[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }
  return convert(num) + ' Rupees Only';
}

// ============================================================================
// 2. OFFICIAL SVG EMBLEMS & STAMPS
// ============================================================================
const OfficialCrest = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="47" stroke="#0F2E5A" strokeWidth="2.5" fill="#FFFFFF" />
    <circle cx="50" cy="50" r="43" stroke="#C59B27" strokeWidth="1.5" strokeDasharray="3 2" fill="#0F2E5A" />
    {/* Laurel Leaves left & right */}
    <path d="M22 62 C20 48, 25 35, 36 26 C33 34, 33 46, 28 58 Z" fill="#F59E0B" opacity="0.8" />
    <path d="M78 62 C80 48, 75 35, 64 26 C67 34, 67 46, 72 58 Z" fill="#F59E0B" opacity="0.8" />
    {/* Center Star & Gear */}
    <path
      d="M50 22 L53 32 L63 33 L55 41 L58 51 L50 45 L42 51 L45 41 L37 33 L47 32 Z"
      fill="#F59E0B"
      stroke="#FEF08A"
      strokeWidth="0.8"
    />
    {/* Open Book of Technical Vocational Learning */}
    <path
      d="M32 64 C40 59, 48 61, 50 67 C52 61, 60 59, 68 64 C68 64, 59 55, 50 59 C41 55, 32 64, 32 64 Z"
      fill="#FFFFFF"
    />
    <text x="50" y="83" textAnchor="middle" fill="#FEF08A" fontSize="7" fontWeight="900" letterSpacing="0.6">
      GLOBAL ERA
    </text>
    <text x="50" y="90" textAnchor="middle" fill="#CBD5E1" fontSize="4.5" fontWeight="700" letterSpacing="0.3">
      ESTD. 2081
    </text>
  </svg>
);

const OfficialAccountsStamp = ({ size = 78 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{ transform: 'rotate(-7deg)', opacity: 0.88 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="46" stroke="#DC2626" strokeWidth="2.5" fill="none" strokeDasharray="6 2" />
    <circle cx="50" cy="50" r="39" stroke="#DC2626" strokeWidth="1.2" fill="#FEF2F2" fillOpacity="0.35" />
    <path id="curveTop" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
    <text fill="#DC2626" fontSize="6.5" fontWeight="900" letterSpacing="0.8">
      <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
        GLOBAL ERA MULTI SERVICE
      </textPath>
    </text>
    <path id="curveBottom" d="M 82,50 A 32,32 0 0,1 18,50" fill="none" />
    <text fill="#DC2626" fontSize="6.2" fontWeight="800" letterSpacing="0.8">
      <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
        JORPATI, KATHMANDU
      </textPath>
    </text>
    {/* Center Paid Seal Box */}
    <rect x="22" y="42" width="56" height="17" rx="3" fill="#DC2626" />
    <text x="50" y="53.5" textAnchor="middle" fill="#FFFFFF" fontSize="7.8" fontWeight="900" letterSpacing="0.6">
      PAID & VERIFIED
    </text>
    <text x="50" y="67" textAnchor="middle" fill="#991B1B" fontSize="5.5" fontWeight="800">
      ★ लेखा शाखा ★
    </text>
  </svg>
);

const WatermarkCrest = () => (
  <svg
    width="280"
    height="280"
    viewBox="0 0 100 100"
    fill="none"
    style={{
      position: 'absolute',
      top: '52%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: 0.038,
      pointerEvents: 'none',
      zIndex: 0
    }}
  >
    <circle cx="50" cy="50" r="48" stroke="#0F2E5A" strokeWidth="3" />
    <circle cx="50" cy="50" r="42" stroke="#C59B27" strokeWidth="2" strokeDasharray="4 2" />
    <path d="M50 18 L54 33 L69 35 L57 46 L61 60 L50 52 L39 60 L43 46 L31 35 L46 33 Z" fill="#0F2E5A" />
    <text x="50" y="80" textAnchor="middle" fill="#0F2E5A" fontSize="9" fontWeight="900" letterSpacing="1">
      GLOBAL ERA
    </text>
  </svg>
);

// ============================================================================
// 3. SINGLE RECEIPT SLIP COMPONENT (Used for both Student & Office Copy)
// ============================================================================
function ReceiptSlip({
  copyType = 'STUDENT',
  copyTitleNepali = 'विद्यार्थी प्रति',
  payment,
  student,
  group,
  course,
  settings,
  isCompact = false
}) {
  const instituteName = settings?.instituteSub || 'ग्लोबल एरा प्राविधिक स्कुल';
  const instituteEnglish = settings?.instituteName || 'Global Era Multi Service Pvt. Ltd.';
  const address = settings?.location || 'गोकर्णेश्वर-०५, जोरपाटी, काठमाडौँ';
  const phone = settings?.contactPhone || '०१-४९१५५५५ / ९८५१००००००';
  const email = settings?.email || 'info@globalera.edu.np';

  const originalFee = Number(payment.originalFee || course?.price || 30000);
  const discountAmount = Number(payment.discountAmount || 0);
  const discountPercent = Number(payment.discountPercent || (discountAmount > 0 ? Math.round((discountAmount / originalFee) * 100) : 0));
  const admissionFee = Number(payment.admissionFee || 0);
  const lockedFee = Number(payment.lockedCourseFee || (originalFee - discountAmount + admissionFee));
  const paidThis = Number(payment.amount || 0);
  const dueRemaining = Math.max(0, lockedFee - paidThis);

  const nepWords = toNepaliWords(paidThis);
  const engWords = toEnglishWords(paidThis);

  const isStudentCopy = copyType === 'STUDENT';

  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: '#FFFFFF',
        p: isCompact ? { xs: 1.5, sm: 2 } : { xs: 2.5, sm: 3.5 },
        border: '2px solid #0F2E5A',
        outline: '1.5px solid #C59B27',
        outlineOffset: isCompact ? '-4px' : '-6px',
        borderRadius: 1.5,
        boxShadow: isCompact ? 'none' : '0 10px 30px rgba(15, 23, 42, 0.08)',
        color: '#0F172A',
        overflow: 'hidden'
      }}
    >
      {/* Background Watermark Crest */}
      <WatermarkCrest />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* ============================================================== */}
        {/* HEADER: Institute Title, Accreditation, Contacts & QR           */}
        {/* ============================================================== */}
        <Box sx={{ borderBottom: '2px solid #0F2E5A', pb: isCompact ? 1 : 1.5, mb: isCompact ? 1 : 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            {/* Left: Official Crest */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <OfficialCrest size={isCompact ? 48 : 58} />
              <Box>
                <Chip
                  label="CTEVT Affiliated"
                  size="small"
                  sx={{
                    bgcolor: '#FEF08A',
                    color: '#854D0E',
                    fontWeight: 900,
                    fontSize: isCompact ? '0.62rem' : '0.68rem',
                    height: isCompact ? 18 : 22,
                    mb: 0.3
                  }}
                />
                <Typography variant="caption" sx={{ display: 'block', color: '#475569', fontWeight: 700, fontSize: isCompact ? '0.65rem' : '0.72rem' }}>
                  दर्ता नं: २०७८/०७९ • प्यान: ६०९८७६५४३
                </Typography>
              </Box>
            </Box>

            {/* Center: Organization & Training School Titles */}
            <Box sx={{ textAlign: 'center', flexGrow: 1, px: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: '#0F2E5A',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.15,
                  fontSize: isCompact ? { xs: '1rem', sm: '1.15rem' } : { xs: '1.2rem', sm: '1.42rem' }
                }}
              >
                {instituteName}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: '#1E40AF',
                  lineHeight: 1.2,
                  fontSize: isCompact ? '0.75rem' : '0.88rem'
                }}
              >
                {instituteEnglish}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#475569',
                  fontWeight: 600,
                  display: 'block',
                  mt: 0.2,
                  fontSize: isCompact ? '0.62rem' : '0.72rem'
                }}
              >
                {address} • फोन: {phone} • इमेल: {email}
              </Typography>
            </Box>

            {/* Right: Security QR Code */}
            <Box sx={{ textAlign: 'center', pl: 1 }}>
              <QRCodeSVG
                value={`GETS-REC:${payment.receiptNo}:${payment.studentId || student?.id}:${paidThis}`}
                size={isCompact ? 44 : 52}
                level="M"
              />
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: '#059669',
                  fontWeight: 800,
                  fontSize: isCompact ? '0.55rem' : '0.6rem',
                  lineHeight: 1,
                  mt: 0.3
                }}
              >
                स्क्यान प्रमाणीकरण
              </Typography>
            </Box>
          </Box>

          {/* ============================================================== */}
          {/* META BAR: Receipt No, Date, Fiscal Year, Copy Badge            */}
          {/* ============================================================== */}
          <Box
            sx={{
              mt: isCompact ? 0.8 : 1.2,
              pt: isCompact ? 0.6 : 0.8,
              borderTop: '1px dashed #CBD5E1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.8
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label="आधिकारिक शुल्क रसिद (OFFICIAL FEE RECEIPT)"
                size="small"
                sx={{
                  bgcolor: '#0F2E5A',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: isCompact ? '0.64rem' : '0.72rem',
                  letterSpacing: '0.04em',
                  height: isCompact ? 22 : 26
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: '#1E40AF',
                  bgcolor: '#EFF6FF',
                  px: 1,
                  py: 0.2,
                  borderRadius: 1,
                  border: '1px solid #BFDBFE',
                  fontSize: isCompact ? '0.75rem' : '0.85rem'
                }}
              >
                रसिद नं: {payment.receiptNo}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: isCompact ? '0.68rem' : '0.78rem' }}>
                मिति: <strong>{payment.paymentDate}</strong> | आ.व.: <strong>२०८१/०८२</strong>
              </Typography>
              <Chip
                label={isStudentCopy ? 'विद्यार्थी प्रति (STUDENT COPY)' : 'कार्यालय प्रति (OFFICE COPY)'}
                size="small"
                sx={{
                  bgcolor: isStudentCopy ? '#ECFDF5' : '#FEF3C7',
                  color: isStudentCopy ? '#065F46' : '#92400E',
                  border: `1.5px solid ${isStudentCopy ? '#10B981' : '#F59E0B'}`,
                  fontWeight: 900,
                  fontSize: isCompact ? '0.62rem' : '0.7rem',
                  letterSpacing: '0.02em',
                  height: isCompact ? 20 : 24
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* ============================================================== */}
        {/* STUDENT & ENROLLMENT PARTICULARS CARD                         */}
        {/* ============================================================== */}
        <Box
          sx={{
            bgcolor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 1.5,
            p: isCompact ? 1 : 1.5,
            mb: isCompact ? 1 : 1.5,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: isCompact ? 0.6 : 1,
            fontSize: isCompact ? '0.75rem' : '0.84rem'
          }}
        >
          <Box>
            <span style={{ color: '#64748B', fontWeight: 600 }}>विद्यार्थीको पूरा नाम:</span>{' '}
            <strong style={{ color: '#0F2E5A', fontSize: isCompact ? '0.82rem' : '0.92rem' }}>
              {payment.studentName || student?.name}
            </strong>
          </Box>
          <Box>
            <span style={{ color: '#64748B', fontWeight: 600 }}>विद्यार्थी कोड (TGID):</span>{' '}
            <strong style={{ fontFamily: 'monospace', color: '#1E40AF' }}>
              {payment.tgid || student?.tgid || 'TGID-101'}
            </strong>
          </Box>
          <Box>
            <span style={{ color: '#64748B', fontWeight: 600 }}>पाठ्यक्रम (Course):</span>{' '}
            <strong style={{ color: '#0F172A' }}>
              {payment.courseName || course?.title || 'व्यावसायिक तालिम'}
            </strong>
          </Box>
          <Box>
            <span style={{ color: '#64748B', fontWeight: 600 }}>तालिम ब्याच (Batch / Shift):</span>{' '}
            <strong>{group?.groupCode || payment.groupId || 'BT-01 (Regular)'}</strong>
          </Box>
          <Box>
            <span style={{ color: '#64748B', fontWeight: 600 }}>सम्पर्क मोबाइल:</span>{' '}
            <span>{student?.phone || 'N/A'}</span>
          </Box>
          <Box>
            <span style={{ color: '#64748B', fontWeight: 600 }}>भुक्तानी माध्यम:</span>{' '}
            <strong style={{ color: '#059669', bgcolor: '#ECFDF5', padding: '1px 6px', borderRadius: 4 }}>
              {payment.paymentMethod || 'Cash'} {payment.transactionId ? `(Txn: ${payment.transactionId})` : ''}
            </strong>
          </Box>
        </Box>

        {/* ============================================================== */}
        {/* FINANCIAL ACCOUNTING PARTICULARS TABLE                         */}
        {/* ============================================================== */}
        <Box sx={{ border: '1.5px solid #0F2E5A', borderRadius: 1.2, overflow: 'hidden', mb: isCompact ? 1 : 1.5 }}>
          {/* Table Header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 140px',
              bgcolor: '#0F2E5A',
              color: '#FFFFFF',
              py: isCompact ? 0.6 : 0.8,
              px: 1.2,
              fontWeight: 800,
              fontSize: isCompact ? '0.72rem' : '0.8rem'
            }}
          >
            <span>क्र.सं.</span>
            <span>शुल्क विवरण (Particulars / Accounting Heads)</span>
            <span style={{ textAlign: 'right' }}>रकम (Amount Rs.)</span>
          </Box>

          {/* Row 1: Course Standard Fee */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 140px',
              py: isCompact ? 0.5 : 0.7,
              px: 1.2,
              borderBottom: '1px solid #E2E8F0',
              fontSize: isCompact ? '0.75rem' : '0.84rem'
            }}
          >
            <span style={{ color: '#64748B' }}>१.</span>
            <span>पाठ्यक्रम आधारभूत नियमित शुल्क (Standard Course Fee)</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>
              रु. {originalFee.toLocaleString()}
            </span>
          </Box>

          {/* Row 2: Scholarship / Discount */}
          {discountAmount > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 140px',
                py: isCompact ? 0.5 : 0.7,
                px: 1.2,
                borderBottom: '1px solid #E2E8F0',
                bgcolor: '#FEF2F2',
                color: '#DC2626',
                fontSize: isCompact ? '0.75rem' : '0.84rem'
              }}
            >
              <span>२.</span>
              <span>
                विशेष अफर / छात्रवृत्ति छुट (Special Scholarship Discount {discountPercent > 0 ? `${discountPercent}%` : ''})
              </span>
              <span style={{ textAlign: 'right', fontWeight: 700 }}>
                - रु. {discountAmount.toLocaleString()}
              </span>
            </Box>
          )}

          {/* Row 3: Admission Fee (if any) */}
          {admissionFee > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 140px',
                py: isCompact ? 0.5 : 0.7,
                px: 1.2,
                borderBottom: '1px solid #E2E8F0',
                fontSize: isCompact ? '0.75rem' : '0.84rem'
              }}
            >
              <span>३.</span>
              <span>भर्ना तथा रजिस्ट्रेसन शुल्क (Admission & Registration Fee)</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                + रु. {admissionFee.toLocaleString()}
              </span>
            </Box>
          )}

          {/* Row 4: Net Final Agreed Course Fee */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 140px',
              py: isCompact ? 0.6 : 0.8,
              px: 1.2,
              bgcolor: '#F1F5F9',
              borderBottom: '1.5px solid #0F2E5A',
              fontWeight: 800,
              fontSize: isCompact ? '0.76rem' : '0.88rem'
            }}
          >
            <span>-</span>
            <span style={{ color: '#0F2E5A' }}>कुल सम्झौता लक्ड शुल्क (Net Agreed Course Fee)</span>
            <span style={{ textAlign: 'right', color: '#1E40AF', fontSize: isCompact ? '0.85rem' : '0.98rem' }}>
              रु. {lockedFee.toLocaleString()}
            </span>
          </Box>

          {/* Row 5: HERO ROW - Amount Paid in This Receipt */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 140px',
              py: isCompact ? 0.8 : 1.1,
              px: 1.2,
              background: 'linear-gradient(90deg, #065F46 0%, #047857 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              borderBottom: '1.5px solid #064E3B',
              fontSize: isCompact ? '0.82rem' : '0.95rem',
              alignItems: 'center'
            }}
          >
            <span>✓</span>
            <span style={{ letterSpacing: '0.02em' }}>
              यस रसिदमा बुझिलिएको जम्मा रकम (PAID IN THIS RECEIPT)
            </span>
            <span style={{ textAlign: 'right', fontSize: isCompact ? '1.05rem' : '1.25rem', color: '#FCD34D' }}>
              रु. {paidThis.toLocaleString()}
            </span>
          </Box>

          {/* Row 6: Outstanding Due or Full Cleared Status */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 140px',
              py: isCompact ? 0.6 : 0.8,
              px: 1.2,
              bgcolor: dueRemaining > 0 ? '#FFFBEB' : '#ECFDF5',
              fontWeight: 800,
              fontSize: isCompact ? '0.76rem' : '0.88rem'
            }}
          >
            <span>{dueRemaining > 0 ? '⏳' : '✓'}</span>
            <span style={{ color: dueRemaining > 0 ? '#B45309' : '#065F46' }}>
              {dueRemaining > 0
                ? 'बाँकी बक्यौता रकम (Outstanding Due Balance)'
                : 'शुल्क स्थिति: पूर्ण चुक्ता (FULL FEES CLEARED - NO OUTSTANDING DUE)'}
            </span>
            <span style={{ textAlign: 'right', color: dueRemaining > 0 ? '#DC2626' : '#059669', fontSize: isCompact ? '0.85rem' : '1rem' }}>
              रु. {dueRemaining.toLocaleString()}
            </span>
          </Box>
        </Box>

        {/* ============================================================== */}
        {/* AMOUNT IN WORDS (अक्षरमा रकम) BANNER                          */}
        {/* ============================================================== */}
        <Box
          sx={{
            p: isCompact ? 0.8 : 1,
            bgcolor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 1,
            mb: isCompact ? 1 : 1.2,
            fontSize: isCompact ? '0.72rem' : '0.82rem'
          }}
        >
          <span style={{ fontWeight: 800, color: '#0F2E5A' }}>अक्षरमा (In Words):</span>{' '}
          <strong style={{ color: '#059669' }}>{nepWords}</strong>{' '}
          <span style={{ color: '#64748B', fontStyle: 'italic' }}>({engWords})</span>
        </Box>

        {/* Remarks & Installment Notice */}
        <Box sx={{ mb: isCompact ? 1.5 : 2.2 }}>
          <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, display: 'block', fontSize: isCompact ? '0.68rem' : '0.75rem' }}>
            <strong>कैफियत (Remarks):</strong> {payment.remarks || 'तालिम पहिलो किस्ता भर्ना शुल्क बुझाएको'}
          </Typography>
          {dueRemaining > 0 && (
            <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 700, display: 'block', mt: 0.3, fontSize: isCompact ? '0.65rem' : '0.72rem' }}>
              * सूचना: दोस्रो किस्ता बुझाउने अन्तिम म्याद तालिम सुरु भएको ३० दिन (१ महिना) भित्र रहनेछ।
            </Typography>
          )}
        </Box>

        {/* ============================================================== */}
        {/* DUAL SIGNATURES & INSTITUTIONAL ACCOUNTS STAMP                */}
        {/* ============================================================== */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: isCompact ? 1 : 2.5 }}>
          {/* Depositor / Student Signature */}
          <Box sx={{ textAlign: 'center', width: isCompact ? 130 : 160 }}>
            <Box sx={{ borderBottom: '1px dashed #64748B', mb: 0.5, height: isCompact ? 24 : 32 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', fontSize: isCompact ? '0.65rem' : '0.74rem' }}>
              विद्यार्थी / बुझाउनेको दस्तखत
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#94A3B8', fontSize: '0.6rem' }}>
              (Depositor's Signature)
            </Typography>
          </Box>

          {/* Center: System Verification Badge */}
          <Box sx={{ textAlign: 'center', display: { xs: 'none', sm: 'block' } }}>
            <Chip
              icon={<VerifiedUserIcon sx={{ fontSize: '0.85rem !important', color: '#059669 !important' }} />}
              label="कम्प्युटर बिलिङ प्रणाली प्रमाणित"
              size="small"
              sx={{
                bgcolor: '#ECFDF5',
                color: '#065F46',
                fontWeight: 800,
                fontSize: isCompact ? '0.58rem' : '0.65rem',
                border: '1px solid #A7F3D0',
                height: 22
              }}
            />
          </Box>

          {/* Right: Cashier / Accounts Stamp & Signature */}
          <Box sx={{ textAlign: 'center', width: isCompact ? 140 : 180, position: 'relative' }}>
            {/* Realistically Positioned Circular Stamp */}
            <Box sx={{ position: 'absolute', top: isCompact ? -46 : -56, left: isCompact ? 2 : 10, pointerEvents: 'none' }}>
              <OfficialAccountsStamp size={isCompact ? 64 : 76} />
            </Box>

            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.3, fontSize: isCompact ? '0.68rem' : '0.76rem' }}>
              {payment.receivedBy || 'Authorized Cashier'}
            </Typography>
            <Box sx={{ borderBottom: '1.5px solid #0F2E5A', mb: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: isCompact ? '0.68rem' : '0.78rem' }}>
              अख्तियारप्राप्त लेखा शाखा (Accounts)
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#94A3B8', fontSize: '0.6rem' }}>
              (Authorized Cashier & Seal)
            </Typography>
          </Box>
        </Box>

        {/* Legal Disclaimer Footer */}
        <Box sx={{ mt: isCompact ? 1 : 1.5, pt: 0.5, borderTop: '1px dashed #E2E8F0', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: isCompact ? '0.58rem' : '0.65rem' }}>
            * बुझाइसकेको शुल्क कुनै पनि अवस्थामा फिर्ता वा नामसारी हुने छैन (Fees once paid are non-refundable) • यो कम्प्युटर प्रणालीद्वारा जारी आधिकारिक रसिद हो।
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================================
// 4. MAIN RECEIPT MODAL COMPONENT
// ============================================================================
export default function ReceiptModal({
  open,
  onClose,
  payment,
  student,
  group,
  course,
  settings
}) {
  // Available formats: 'a4-dual' (default), 'a4-single', 'thermal'
  const [format, setFormat] = useState('a4-dual');

  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          boxShadow: '0 25px 65px rgba(15, 23, 42, 0.28)',
          border: '1px solid rgba(226, 232, 240, 0.9)'
        }
      }}
    >
      {/* ============================================================== */}
      {/* MODAL HEADER & FORMAT TOGGLES                                  */}
      {/* ============================================================== */}
      <DialogTitle
        className="no-print"
        sx={{
          m: 0,
          p: 2,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptLongIcon sx={{ color: '#38BDF8', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.12rem', lineHeight: 1.2 }}>
              शुल्क रसिद प्रिन्ट (Fee Receipt Preview)
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              रसिद नं: {payment.receiptNo} • विद्यार्थी: {payment.studentName || student?.name}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ToggleButtonGroup
            value={format}
            exclusive
            onChange={(e, next) => next && setFormat(next)}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.08)',
              p: 0.3,
              borderRadius: 2,
              '& .MuiToggleButton-root': {
                color: '#CBD5E1',
                fontWeight: 700,
                fontSize: '0.74rem',
                border: 'none',
                px: 1.5,
                py: 0.5,
                '&.Mui-selected': { bgcolor: '#38BDF8', color: '#0F172A', fontWeight: 900 }
              }
            }}
          >
            <ToggleButton value="a4-dual">
              <ContentCutIcon sx={{ fontSize: '0.95rem', mr: 0.5 }} /> A4 दुवै प्रति (2-in-1)
            </ToggleButton>
            <ToggleButton value="a4-single">
              <ArticleIcon sx={{ fontSize: '0.95rem', mr: 0.5 }} /> A4 एकल प्रति
            </ToggleButton>
            <ToggleButton value="thermal">
              <ReceiptLongIcon sx={{ fontSize: '0.95rem', mr: 0.5 }} /> POS थर्मल (80mm)
            </ToggleButton>
          </ToggleButtonGroup>

          <IconButton onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF' } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ============================================================== */}
      {/* MODAL CONTENT: PREVIEW & PRINTABLE CANVAS                      */}
      {/* ============================================================== */}
      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#F1F5F9', display: 'flex', justifyContent: 'center' }}>
        {/* Dedicated Print Media Stylesheet */}
        <style>
          {`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .printable-receipt, .printable-receipt * {
                visibility: visible !important;
              }
              .printable-receipt {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 6mm 10mm !important;
                background: #FFFFFF !important;
                box-shadow: none !important;
                border: none !important;
              }
              .thermal-view {
                width: 80mm !important;
                padding: 3mm !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>

        {/* ------------------------------------------------------------ */}
        {/* FORMAT 1: A4 DUAL COPY (Office Copy + Student Copy on 1 Page)*/}
        {/* ------------------------------------------------------------ */}
        {format === 'a4-dual' && (
          <Paper
            className="printable-receipt"
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: '780px',
              bgcolor: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {/* Top Slip: STUDENT COPY */}
            <ReceiptSlip
              copyType="STUDENT"
              copyTitleNepali="विद्यार्थी प्रति"
              payment={payment}
              student={student}
              group={group}
              course={course}
              settings={settings}
              isCompact={true}
            />

            {/* Perforation / Scissor Dividing Line */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                my: 0.5,
                position: 'relative'
              }}
            >
              <Box sx={{ flexGrow: 1, borderTop: '2px dashed #94A3B8' }} />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  bgcolor: '#F1F5F9',
                  px: 2,
                  py: 0.3,
                  borderRadius: 2,
                  border: '1px solid #CBD5E1',
                  color: '#64748B'
                }}
              >
                <ContentCutIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                  यहाँबाट च्यात्नुहोस् / काट्ने रेखा (PERFORATION / CUTTING LINE)
                </Typography>
                <ContentCutIcon sx={{ fontSize: 16, transform: 'scaleX(-1)' }} />
              </Box>
              <Box sx={{ flexGrow: 1, borderTop: '2px dashed #94A3B8' }} />
            </Box>

            {/* Bottom Slip: OFFICE COPY */}
            <ReceiptSlip
              copyType="OFFICE"
              copyTitleNepali="कार्यालय प्रति"
              payment={payment}
              student={student}
              group={group}
              course={course}
              settings={settings}
              isCompact={true}
            />
          </Paper>
        )}

        {/* ------------------------------------------------------------ */}
        {/* FORMAT 2: A4 SINGLE COPY (Spacious Single Full Page)          */}
        {/* ------------------------------------------------------------ */}
        {format === 'a4-single' && (
          <Paper
            className="printable-receipt"
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: '780px',
              bgcolor: 'transparent'
            }}
          >
            <ReceiptSlip
              copyType="STUDENT"
              copyTitleNepali="विद्यार्थी प्रति"
              payment={payment}
              student={student}
              group={group}
              course={course}
              settings={settings}
              isCompact={false}
            />
          </Paper>
        )}

        {/* ------------------------------------------------------------ */}
        {/* FORMAT 3: THERMAL POS SLIP (80mm)                            */}
        {/* ------------------------------------------------------------ */}
        {format === 'thermal' && (
          <Paper
            className="printable-receipt thermal-view"
            elevation={0}
            sx={{
              width: '320px',
              bgcolor: '#FFFFFF',
              p: 2.5,
              borderRadius: 2,
              border: '1px dashed #94A3B8',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              fontFamily: 'monospace',
              color: '#000000'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                {settings?.instituteSub || 'ग्लोबल एरा प्राविधिक स्कुल'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.72rem' }}>
                {settings?.location || 'गोकर्णेश्वर-०५, जोरपाटी, काठमाडौँ'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.72rem' }}>
                फोन: {settings?.contactPhone || '०१-४९१५५५५ / ९८५१००००००'}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mt: 0.5, letterSpacing: '0.04em' }}>
                *** शुल्क रसिद (FEE RECEIPT) ***
              </Typography>
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

            <Box sx={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
              <div>रसिद नं: <strong>{payment.receiptNo}</strong></div>
              <div>मिति: {payment.paymentDate}</div>
              <div>विद्यार्थी: <strong>{payment.studentName || student?.name}</strong></div>
              <div>TGID: {payment.tgid || student?.tgid}</div>
              <div>कोर्स: {payment.courseName || course?.title}</div>
              <div>माध्यम: {payment.paymentMethod || 'Cash'}</div>
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

            <Box sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>लक्ड कुल शुल्क:</span>
                <span>Rs. {(Number(payment.lockedCourseFee) || Number(course?.price) || 30000).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '0.98rem', margin: '4px 0' }}>
                <span>प्राप्त रकम:</span>
                <span>Rs. {(Number(payment.amount) || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>बाँकी बक्यौता:</span>
                <span>
                  Rs. {Math.max(0, (Number(payment.lockedCourseFee) || Number(course?.price) || 30000) - (Number(payment.amount) || 0)).toLocaleString()}
                </span>
              </div>
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 1.5 }} />

            <Box sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
              <div style={{ marginBottom: 4 }}>धन्यवाद! (Thank You)</div>
              <div>ग्लोबल एरामा स्वागत छ!</div>
            </Box>
          </Paper>
        )}
      </DialogContent>

      {/* ============================================================== */}
      {/* MODAL FOOTER ACTIONS                                           */}
      {/* ============================================================== */}
      <DialogActions
        className="no-print"
        sx={{
          px: 3,
          py: 2,
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          justifyContent: 'space-between'
        }}
      >
        <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: 700 }}>
          बन्द गर्नुहोस् (Close)
        </Button>

        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          sx={{
            background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
            fontWeight: 800,
            px: 3.5,
            py: 1.1,
            borderRadius: 2.5,
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)'
            }
          }}
        >
          {format === 'a4-dual'
            ? 'A4 दुवै प्रति (2-in-1) प्रिन्ट गर्नुहोस्'
            : format === 'a4-single'
            ? 'A4 एकल प्रति प्रिन्ट गर्नुहोस्'
            : 'थर्मल रसिद प्रिन्ट (POS 80mm)'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
