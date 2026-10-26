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
  ToggleButtonGroup
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArticleIcon from '@mui/icons-material/Article';
import { QRCodeSVG } from 'qrcode.react';

// Convert number to simple words helper (for Rs.)
function numberToWordsNepali(num) {
  if (!num || isNaN(num)) return 'शून्य रुपैयाँ मात्र';
  return `रु. ${Number(num).toLocaleString('en-IN')} (अक्षरमा)`;
}

export default function ReceiptModal({
  open,
  onClose,
  payment,
  student,
  group,
  course,
  settings
}) {
  const [format, setFormat] = useState('a4'); // 'a4' or 'thermal'

  if (!payment) return null;

  const instituteName = settings?.instituteSub || 'ग्लोबल एरा प्राविधिक स्कुल';
  const instituteEnglish = settings?.instituteName || 'Global Era Multi Service Pvt. Ltd.';
  const address = settings?.location || 'MitraPark, Chabahil, Kathmandu, Nepal';
  const phone = settings?.contactPhone || '+977-1-4488990 / 9851000000';
  const email = settings?.email || 'info@globalera.edu.np';

  const originalFee = payment.originalFee || course?.price || 30000;
  const discountAmount = payment.discountAmount || 0;
  const discountPercent = payment.discountPercent || (discountAmount > 0 ? Math.round((discountAmount / originalFee) * 100) : 0);
  const admissionFee = payment.admissionFee || 0;
  const lockedFee = payment.lockedCourseFee || (originalFee - discountAmount + admissionFee);
  const paidThis = payment.amount || 0;

  // Calculate prior paid and remaining due
  const dueRemaining = Math.max(0, lockedFee - paidThis);

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
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }
      }}
    >
      <DialogTitle
        className="no-print"
        sx={{
          m: 0,
          p: 2,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptLongIcon sx={{ color: '#38BDF8' }} />
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
            शुल्क रसिद प्रिन्ट (Fee Receipt Preview) — {payment.receiptNo}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ToggleButtonGroup
            value={format}
            exclusive
            onChange={(e, next) => next && setFormat(next)}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              '& .MuiToggleButton-root': {
                color: '#94A3B8',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: 'none',
                px: 1.5,
                py: 0.5,
                '&.Mui-selected': { bgcolor: '#38BDF8', color: '#0F172A', fontWeight: 800 }
              }
            }}
          >
            <ToggleButton value="a4">
              <ArticleIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> A4 Official
            </ToggleButton>
            <ToggleButton value="thermal">
              <ReceiptLongIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> Thermal POS (80mm)
            </ToggleButton>
          </ToggleButtonGroup>

          <IconButton onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#FFF' } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#F1F5F9', display: 'flex', justifyContent: 'center' }}>
        {/* CSS for clean printing */}
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              .printable-receipt, .printable-receipt * {
                visibility: visible;
              }
              .printable-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                margin: 0 !important;
                padding: 15mm !important;
                background: #FFFFFF !important;
                box-shadow: none !important;
                border: none !important;
              }
              .thermal-view {
                width: 80mm !important;
                padding: 4mm !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>

        {/* ======================================================== */}
        {/* OPTION 1: A4 OFFICIAL RECEIPT INVOICE                     */}
        {/* ======================================================== */}
        {format === 'a4' && (
          <Paper
            className="printable-receipt"
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: '750px',
              bgcolor: '#FFFFFF',
              p: { xs: 2.5, sm: 4 },
              borderRadius: 2.5,
              border: '2px solid #CBD5E1',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
              color: '#0F172A'
            }}
          >
            {/* Header with CTEVT & Institute Info */}
            <Box sx={{ borderBottom: '2px solid #0F172A', pb: 2, mb: 2.5, textAlign: 'center', position: 'relative' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ textAlign: 'left' }}>
                  <Chip
                    label="CTEVT Affiliated"
                    size="small"
                    sx={{ bgcolor: '#FEF08A', color: '#854D0E', fontWeight: 900, fontSize: '0.68rem', mb: 0.5 }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 700 }}>
                    PAN: 609876543
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2C59', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {instituteName}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '0.88rem' }}>
                    {instituteEnglish}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mt: 0.2 }}>
                    {address} • फोन: {phone}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <QRCodeSVG
                    value={`GETS-REC:${payment.receiptNo}:${payment.studentId}:${payment.amount}`}
                    size={52}
                    level="M"
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label="आधिकारिक शुल्क रसिद (OFFICIAL FEE RECEIPT)"
                  sx={{
                    bgcolor: '#0F172A',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em'
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#1E40AF' }}>
                  रसिद नं: {payment.receiptNo}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                  मिति: {payment.paymentDate}
                </Typography>
              </Box>
            </Box>

            {/* Student Details Grid */}
            <Box
              sx={{
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 2,
                p: 2,
                mb: 2.5,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1.2
              }}
            >
              <Typography variant="body2">
                <strong>विद्यार्थीको नाम (Name):</strong> {payment.studentName}
              </Typography>
              <Typography variant="body2">
                <strong>विद्यार्थी कोड (TGID):</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{payment.tgid || student?.tgid}</span>
              </Typography>
              <Typography variant="body2">
                <strong>पाठ्यक्रम (Course):</strong> {payment.courseName || course?.title}
              </Typography>
              <Typography variant="body2">
                <strong>तालिम ब्याच (Batch/Shift):</strong> {group?.groupCode || payment.groupId || 'Shift A'}
              </Typography>
              <Typography variant="body2">
                <strong>सम्पर्क मोबाइल (Phone):</strong> {student?.phone || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>भुक्तानी माध्यम (Payment Mode):</strong> <span style={{ color: '#059669', fontWeight: 800 }}>{payment.paymentMethod || 'Cash'}</span>
              </Typography>
            </Box>

            {/* Fee Accounting Table */}
            <Box sx={{ border: '1px solid #0F172A', borderRadius: 1.5, overflow: 'hidden', mb: 2.5 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 1fr',
                  bgcolor: '#0F172A',
                  color: '#FFFFFF',
                  p: 1,
                  fontWeight: 800,
                  fontSize: '0.8rem'
                }}
              >
                <span>शुल्क विवरण (Particulars)</span>
                <span style={{ textAlign: 'right' }}>रकम (Rs.)</span>
              </Box>

              <Box sx={{ p: 1.2, borderBottom: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '3fr 1fr', fontSize: '0.85rem' }}>
                <span>पाठ्यक्रम आधारभूत शुल्क (Standard Course Fee)</span>
                <span style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {Number(originalFee).toLocaleString()}</span>
              </Box>

              {discountAmount > 0 && (
                <Box sx={{ p: 1.2, borderBottom: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '3fr 1fr', fontSize: '0.85rem', color: '#DC2626' }}>
                  <span>विशेष अफर छुट (Special Offer Discount {discountPercent > 0 ? `${discountPercent}%` : ''})</span>
                  <span style={{ textAlign: 'right', fontWeight: 700 }}>- Rs. {Number(discountAmount).toLocaleString()}</span>
                </Box>
              )}

              {admissionFee > 0 && (
                <Box sx={{ p: 1.2, borderBottom: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '3fr 1fr', fontSize: '0.85rem' }}>
                  <span>भर्ना तथा दर्ता शुल्क (Admission / Registration Fee)</span>
                  <span style={{ textAlign: 'right', fontWeight: 600 }}>+ Rs. {Number(admissionFee).toLocaleString()}</span>
                </Box>
              )}

              <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', borderBottom: '1.5px solid #0F172A', display: 'grid', gridTemplateColumns: '3fr 1fr', fontWeight: 800 }}>
                <span>कुल सम्झौता लक्ड शुल्क (Net Final Course Fee)</span>
                <span style={{ textAlign: 'right', color: '#1E40AF', fontSize: '0.95rem' }}>Rs. {Number(lockedFee).toLocaleString()}</span>
              </Box>

              <Box sx={{ p: 1.5, bgcolor: '#ECFDF5', borderBottom: '1px solid #D1FAE5', display: 'grid', gridTemplateColumns: '3fr 1fr', fontWeight: 900 }}>
                <span style={{ color: '#065F46', fontSize: '0.95rem' }}>यस रसिदमा बुझिलिएको रकम (Paid In This Receipt)</span>
                <span style={{ textAlign: 'right', color: '#047857', fontSize: '1.15rem' }}>Rs. {Number(paidThis).toLocaleString()}</span>
              </Box>

              <Box sx={{ p: 1.2, bgcolor: dueRemaining > 0 ? '#FFFBEB' : '#FFFFFF', display: 'grid', gridTemplateColumns: '3fr 1fr', fontWeight: 800 }}>
                <span style={{ color: dueRemaining > 0 ? '#B45309' : '#059669' }}>
                  बाँकी बक्यौता शुल्क (Remaining Balance Due)
                </span>
                <span style={{ textAlign: 'right', color: dueRemaining > 0 ? '#B45309' : '#059669', fontSize: '1rem' }}>
                  Rs. {Number(dueRemaining).toLocaleString()}
                </span>
              </Box>
            </Box>

            {/* Note & Remarks */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                <strong>कैफियत (Remarks):</strong> {payment.remarks || 'पहिलो किस्ता भर्ना शुल्क बुझाएको'}
              </Typography>
              {dueRemaining > 0 && (
                <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700, display: 'block', mt: 0.5 }}>
                  * दोस्रो किस्ता बुझाउने अन्तिम म्याद भर्ना भएको मितिले ३० दिन (१ महिना) भित्र रहनेछ।
                </Typography>
              )}
            </Box>

            {/* Signatures */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 4 }}>
              <Box sx={{ textAlign: 'center', width: 160 }}>
                <Box sx={{ borderBottom: '1px dashed #64748B', mb: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                  विद्यार्थीको हस्ताक्षर
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', width: 180 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', display: 'block', mb: 0.5 }}>
                  {payment.receivedBy || 'Authorized Cashier'}
                </Typography>
                <Box sx={{ borderBottom: '1.5px solid #0F172A', mb: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59' }}>
                  लेखा शाखा (Accounts Stamp)
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* ======================================================== */}
        {/* OPTION 2: THERMAL POS RECEIPT SLIP (80mm)                 */}
        {/* ======================================================== */}
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
                {instituteName}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.72rem' }}>
                {address}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.72rem' }}>
                फोन: {phone}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mt: 0.5 }}>
                *** शुल्क रसिद (FEE RECEIPT) ***
              </Typography>
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

            <Box sx={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
              <div>रसिद नं: <strong>{payment.receiptNo}</strong></div>
              <div>मिति: {payment.paymentDate}</div>
              <div>विद्यार्थी: <strong>{payment.studentName}</strong></div>
              <div>TGID: {payment.tgid || student?.tgid}</div>
              <div>कोर्स: {payment.courseName || course?.title}</div>
              <div>माध्यम: {payment.paymentMethod || 'Cash'}</div>
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

            <Box sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>लक्ड कुल शुल्क:</span>
                <span>Rs. {Number(lockedFee).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '0.95rem', margin: '4px 0' }}>
                <span>प्राप्त रकम:</span>
                <span>Rs. {Number(paidThis).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: dueRemaining > 0 ? '#000' : '#059669' }}>
                <span>बाँकी बक्यौता:</span>
                <span>Rs. {Number(dueRemaining).toLocaleString()}</span>
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

      <DialogActions className="no-print" sx={{ px: 3, py: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
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
            py: 1,
            borderRadius: 2.5,
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
          }}
        >
          {format === 'a4' ? 'A4 रसिद प्रिन्ट गर्नुहोस्' : 'थर्मल रसिद प्रिन्ट (POS 80mm)'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
