import React from 'react';
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
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SchoolIcon from '@mui/icons-material/School';
import { QRCodeSVG } from 'qrcode.react';

// Official Global Era Technical Crest
const OfficialSeal = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" stroke="#c59b27" strokeWidth="3" fill="#0f2e5a" />
    <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
    <path
      d="M50 24 L55 35 L67 36 L58 45 L61 57 L50 50 L39 57 L42 45 L33 36 L45 35 Z"
      fill="#f59e0b"
    />
    <path
      d="M30 65 C40 60, 48 62, 50 68 C52 62, 60 60, 70 65 C70 65, 60 56, 50 61 C40 56, 30 65, 30 65 Z"
      fill="#ffffff"
    />
    <text x="50" y="86" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold" letterSpacing="0.5">
      GLOBAL ERA
    </text>
  </svg>
);

export default function FeeClearanceReceiptModal({ open, onClose, student, ledger, payments = [] }) {
  if (!student || !ledger) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const clearanceCertificateNo = `CLR-2081-${student.id.replace(/\D/g, '') || '01'}`;
  const verifyUrl = `${window.location.origin}/?verify=${student.id}&clearance=true`;

  // Student specific payments
  const studentPayments = payments.filter((p) => p.studentId === student.id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      {/* Top Action Toolbar */}
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
          <VerifiedIcon sx={{ color: '#f59e0b', fontSize: 30 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              शुल्क चुक्ता प्रमाणपत्र तथा रसिद (Fee Clearance Certificate & Receipt)
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              १००% पूर्ण शुल्क भुक्तानी भएको आधिकारिक प्रमाणित दस्तावेज
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ fontWeight: 800 }}
          >
            A4 चुक्ता प्रमाणपत्र प्रिन्ट (Print Certificate)
          </Button>
          <IconButton onClick={onClose} sx={{ color: '#cbd5e1' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3.5 }, bgcolor: '#e2e8f0' }}>
        {/* Printable A4 Canvas */}
        <Box
          id="printableFeeClearanceCanvas"
          sx={{
            width: '100%',
            maxWidth: '210mm',
            bgcolor: '#ffffff',
            mx: 'auto',
            p: { xs: 2.5, sm: 4.5 },
            boxSizing: 'border-box',
            fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif",
            color: '#0f172a',
            border: '2px solid #0f2e5a',
            outline: '3px solid #c59b27',
            outlineOffset: '-7px',
            borderRadius: 1.5,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            position: 'relative'
          }}
        >
          {/* Top Header */}
          <Box sx={{ borderBottom: '2.5px solid #0f2e5a', pb: 2, mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <OfficialSeal />
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: '#0f2e5a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      fontSize: { xs: '1.15rem', sm: '1.35rem' },
                      lineHeight: 1.2
                    }}
                  >
                    ग्लोबल एरा मल्टि सर्भिस प्रा.लि.
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 800, color: '#b45309', fontSize: { xs: '0.95rem', sm: '1.08rem' } }}
                  >
                    प्राविधिक स्कुल जोरपाटी (Prabidhik School Jorpati)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3 }}>
                    गोकर्णेश्वर नगरपालिका-०५, जोरपाटी, काठमाडौँ | फोन: ०१-४९१५५५५, ९८५१०००००० | पान नं: ६०९८७६५४३
                  </Typography>
                </Box>
              </Box>

              {/* Status Badge */}
              <Box sx={{ textAlign: 'right' }}>
                <Box
                  sx={{
                    display: 'inline-block',
                    border: '2px solid #059669',
                    bgcolor: '#ecfdf5',
                    color: '#065f46',
                    fontWeight: 900,
                    fontSize: '0.76rem',
                    letterSpacing: '0.05em',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    textTransform: 'uppercase'
                  }}
                >
                  ✓ पूर्ण शुल्क चुक्ता (CLEARED)
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748b' }}>
                  प्रमाणपत्र नं: <strong>{clearanceCertificateNo}</strong>
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                  मिति: <strong>{todayStr}</strong>
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Document Title */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                color: '#0f2e5a',
                textDecoration: 'underline',
                textUnderlineOffset: '5px',
                fontSize: { xs: '1.05rem', sm: '1.2rem' }
              }}
            >
              आधिकारिक शुल्क चुक्ता प्रमाणपत्र तथा रसिद
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
              OFFICIAL FULL FEE CLEARANCE CERTIFICATE & STATEMENT
            </Typography>
          </Box>

          {/* Trainee Details Card */}
          <Box
            sx={{
              bgcolor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 1.5,
              p: 2,
              mb: 2.5,
              fontSize: '0.86rem'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.5, mb: 1.2 }}>
              प्रशिक्षार्थीको विवरण (Trainee Dossier):
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.2 }}>
              <Box>विद्यार्थीको नाम: <strong>{student.name}</strong></Box>
              <Box>रोल नं / TGID: <strong>{student.id} ({student.tgid})</strong></Box>
              <Box>तालिम / कोर्स: <strong>{ledger.courseTitle}</strong></Box>
              <Box>ब्याच / समूह: <strong>{ledger.groupCode}</strong></Box>
              <Box>मोबाइल नम्बर: <strong>{student.phone}</strong></Box>
              <Box>नागरिकता / परिचयपत्र नं: <strong>{student.citizenshipNumber || 'N/A'}</strong></Box>
            </Box>
          </Box>

          {/* Financial Installment Timeline Table */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', mb: 1 }}>
              शुल्क विवरण तथा किस्ता भुक्तानी इतिहास (Payment Schedule & History):
            </Typography>
            <Box sx={{ border: '1px solid #cbd5e1', borderRadius: 1.5, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f2e5a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>किस्ता / विवरण</th>
                    <th style={{ padding: '8px 12px' }}>रसिद नं</th>
                    <th style={{ padding: '8px 12px' }}>मिति</th>
                    <th style={{ padding: '8px 12px' }}>भुक्तानी माध्यम</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>रकम (रु.)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px' }}>कुल सम्झौता गरिएको कोर्स शुल्क</td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>-</td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>-</td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>नियमित दर</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                      रु. {(Number(ledger?.lockedFee) || 0).toLocaleString()}
                    </td>
                  </tr>
                  {(Number(ledger?.discountAmount) || 0) > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fefce8' }}>
                      <td style={{ padding: '8px 12px', color: '#b45309' }}>स्वीकृत छुट / छात्रवृत्ति</td>
                      <td style={{ padding: '8px 12px', color: '#b45309' }}>-</td>
                      <td style={{ padding: '8px 12px', color: '#b45309' }}>-</td>
                      <td style={{ padding: '8px 12px', color: '#b45309' }}>संस्था स्वीकृति</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#b45309', fontWeight: 600 }}>
                        - रु. {(Number(ledger?.discountAmount) || 0).toLocaleString()}
                      </td>
                    </tr>
                  )}
                  {/* Payments list */}
                  {studentPayments.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ecfdf5' }}>
                      <td style={{ padding: '8px 12px', color: '#065f46', fontWeight: 700 }}>
                        किस्ता #{idx + 1} ({idx === 0 ? 'भर्ना अग्रिम' : 'बाँकी भुक्तानी'})
                      </td>
                      <td style={{ padding: '8px 12px', color: '#065f46' }}>{p.receiptNo || 'N/A'}</td>
                      <td style={{ padding: '8px 12px', color: '#065f46' }}>{p.paymentDate}</td>
                      <td style={{ padding: '8px 12px', color: '#065f46' }}>{p.paymentMethod}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#065f46', fontWeight: 800 }}>
                        रु. {(Number(p.amount) || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {/* Total Paid Row */}
                  <tr style={{ backgroundColor: '#f0fdf4', borderTop: '2px solid #059669' }}>
                    <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 800, color: '#065f46', fontSize: '0.9rem' }}>
                      कुल चुक्ता भुक्तानी रकम (Total Paid)
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#065f46', fontSize: '0.95rem' }}>
                      रु. {(Number(ledger?.totalPaid) || 0).toLocaleString()}
                    </td>
                  </tr>
                  {/* Remaining Due Row */}
                  <tr style={{ backgroundColor: '#ffffff', borderTop: '1.5px solid #cbd5e1' }}>
                    <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 900, color: '#0f2e5a', fontSize: '0.92rem' }}>
                      बाँकी बक्यौता रकम (OUTSTANDING DUE BALANCE)
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#059669', fontSize: '1.05rem' }}>
                      रु. ०.०० (शून्य / NIL)
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Box>

          {/* Official Clearance Declaration Paragraph */}
          <Box
            sx={{
              p: 2,
              mb: 4,
              bgcolor: '#eff6ff',
              border: '1.5px solid #93c5fd',
              borderRadius: 1.5,
              fontSize: '0.84rem',
              lineHeight: 1.6,
              color: '#1e3a8a'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <CheckCircleOutlineIcon sx={{ color: '#0284c7', mt: 0.2 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                <strong>आधिकारिक घोषणा तथा स्वीकृति (Clearance Declaration):</strong> प्रमाणित गरिन्छ कि माथि उल्लिखित प्रशिक्षार्थी <strong>श्री/सुश्री {student.name}</strong> ले यस संस्थामा सञ्चालन भएको <strong>{ledger.courseTitle}</strong> तालिमको सम्पूर्ण शुल्क पूर्ण रूपमा चुक्ता गरिसक्नुभएको छ। अब निजलाई आन्तरिक तथा CTEVT सीप परीक्षामा सहभागी हुन, आधिकारिक प्रमाणपत्र प्राप्त गर्न तथा उद्योग/कम्पनीमा अन-द-जब तालिम (OJT) र रोजगारी सिफारिसका लागि पूर्ण स्वीकृति (Fee Clearance) प्रदान गरिएको छ।
              </Typography>
            </Stack>
          </Box>

          {/* Signatures & Seal Section */}
          <Box sx={{ mt: 5, pt: 2, borderTop: '1.5px solid #cbd5e1' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', px: 3 }}>
              {/* Accountant Signature */}
              <Box sx={{ textAlign: 'center', width: '200px' }}>
                <Box sx={{ borderBottom: '1.5px dashed #475569', height: '35px', mb: 0.8 }}></Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '0.85rem' }}>
                  लेखा शाखा (Finance Officer)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  ग्लोबल एरा प्राविधिक स्कुल
                </Typography>
              </Box>

              {/* QR Code and Center Seal */}
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ bgcolor: '#ffffff', p: 0.5, border: '1px solid #cbd5e1', borderRadius: 1, display: 'inline-block', mb: 0.5 }}>
                  <QRCodeSVG value={verifyUrl} size={64} level="M" />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontSize: '0.68rem' }}>
                  डिजिटल प्रमाणीकरण QR
                </Typography>
              </Box>

              {/* Principal Signature */}
              <Box sx={{ textAlign: 'center', width: '200px' }}>
                <Box sx={{ borderBottom: '1.5px dashed #475569', height: '35px', mb: 0.8 }}></Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '0.85rem' }}>
                  संस्था प्रमुख (Principal / Director)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  आधिकारिक छाप सहित
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="no-print" sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          * यो प्रमाणपत्र विद्यार्थीलाई परीक्षा दिनुअघि र प्रमाणपत्र प्रदान गर्नुअघि दिनुपर्छ।
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button onClick={onClose} color="inherit">
            बन्द गर्नुहोस् (Close)
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ fontWeight: 800 }}
          >
            प्रिन्ट गर्नुहोस् (Print)
          </Button>
        </Stack>
      </DialogActions>

      {/* Embedded CSS for Exact A4 Portrait Print */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm 14mm;
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
          #printableFeeClearanceCanvas, #printableFeeClearanceCanvas * {
            visibility: visible !important;
          }
          #printableFeeClearanceCanvas {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            box-shadow: none !important;
            border: 2px solid #0f2e5a !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
