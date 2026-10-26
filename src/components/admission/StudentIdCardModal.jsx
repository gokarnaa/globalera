import React, { useRef, useState } from 'react';
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
  Divider,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import BadgeIcon from '@mui/icons-material/Badge';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import { QRCodeSVG } from 'qrcode.react';

// Official Global Era Technical Emblem / Crest
const GlobalEraEmblem = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" stroke="#c59b27" strokeWidth="3" fill="#0f2e5a" />
    <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
    {/* Open Book / Flame / Technical Cog */}
    <path
      d="M50 26 L55 37 L66 38 L58 46 L60 57 L50 51 L40 57 L42 46 L34 38 L45 37 Z"
      fill="#f59e0b"
    />
    <path
      d="M32 64 C40 60, 47 62, 50 67 C53 62, 60 60, 68 64 C68 64, 60 56, 50 61 C40 56, 32 64, 32 64 Z"
      fill="#ffffff"
    />
    <path
      d="M50 62 L50 78"
      stroke="#c59b27"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <text x="50" y="86" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold" letterSpacing="0.5">
      GLOBAL ERA
    </text>
  </svg>
);

export default function StudentIdCardModal({ open, onClose, student, admission }) {
  const [printMode, setPrintMode] = useState('PVC'); // 'PVC' (CR80) or 'A4' (Paper sheet)

  if (!student && !admission) return null;

  // Resolve fields from either student or admission record
  const studentName = student?.name || admission?.studentName || 'सुनिता शर्मा';
  const studentId = student?.id || admission?.studentId || 'STD-01';
  const tgid = student?.tgid || admission?.tgid || 'TGID-101';
  const phone = student?.phone || admission?.phone || '98XXXXXXXX';
  const bloodGroup = student?.bloodGroup || admission?.bloodGroup || 'O+ve';
  const courseTitle = admission?.courseTitle || student?.courseTitle || 'व्यावसायिक सीप तालिम';
  const groupName = admission?.groupName || student?.groupName || 'Batch 1';
  const shift = admission?.shift || 'Shift A';
  const timing = admission?.timing || '07:00 AM – 09:00 AM';
  const validTill = admission?.expectedEndDate || student?.expectedEndDate || '२०८१/०९/३०';
  const photoUrl = student?.photoUrl || admission?.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80';

  // Verification URL for QR Code
  const verifyUrl = `${window.location.origin}/?verify=${studentId}&name=${encodeURIComponent(studentName)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
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
          <BadgeIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              विद्यार्थी परिचयपत्र (Trainee ID Card)
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              Epson L8050 PVC Card Tray (CR-80 Standard: 54mm × 85.6mm)
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
            ID कार्ड प्रिन्ट (Print)
          </Button>
          <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#e2e8f0', textAlign: 'center' }}>
        {/* Mode Selector for printing */}
        <Box className="no-print" sx={{ mb: 2.5 }}>
          <Tabs
            value={printMode}
            onChange={(e, val) => setPrintMode(val)}
            centered
            sx={{ bgcolor: '#ffffff', borderRadius: 2, p: 0.5, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Tab
              value="PVC"
              label="Epson L8050 PVC Card (५४ × ८५.६ मिमी)"
              sx={{ fontWeight: 800, textTransform: 'none' }}
            />
            <Tab
              value="A4"
              label="A4 फोटो पेपर (Cut & Laminate Sheet)"
              sx={{ fontWeight: 800, textTransform: 'none' }}
            />
          </Tabs>

          <Paper
            elevation={0}
            sx={{
              mt: 1.5,
              p: 1.2,
              bgcolor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 1.5,
              textAlign: 'left'
            }}
          >
            <Typography variant="caption" sx={{ color: '#1e40af', display: 'block', fontWeight: 600 }}>
              💡 <strong>Epson L8050 निर्देशन:</strong> प्रिन्टरको PVC Tray मा खाली कार्ड राख्नुहोस्। प्रिन्ट डायलगमा <strong>Paper Size: CR80 / PVC Card</strong> वा <strong>Scale: 100%</strong> छनोट गरी प्रिन्ट गर्नुहोस्।
            </Typography>
          </Paper>
        </Box>

        {/* Printable Card Area */}
        <Box
          id="printableIdCardArea"
          sx={{
            display: 'inline-block',
            textAlign: 'center',
            p: printMode === 'A4' ? 3 : 0,
            bgcolor: printMode === 'A4' ? '#ffffff' : 'transparent',
            borderRadius: printMode === 'A4' ? 2 : 0,
            boxShadow: printMode === 'A4' ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          {/* CR80 Standard Vertical ID Card (54mm x 85.6mm) */}
          <Box
            className="id-card-portrait"
            sx={{
              width: '54mm',
              height: '85.6mm',
              bgcolor: '#ffffff',
              borderRadius: '3.18mm', // Standard CR80 corner radius
              boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
              position: 'relative',
              boxSizing: 'border-box',
              mx: 'auto',
              fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif"
            }}
          >
            {/* Top Header Wave / Curve Background */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #0b2545 0%, #0f2e5a 70%, #1e3a8a 100%)',
                color: '#ffffff',
                pt: '2.5mm',
                pb: '2mm',
                px: '2mm',
                textAlign: 'center',
                position: 'relative',
                borderBottom: '2px solid #f59e0b'
              }}
            >
              {/* Emblem and Institute Name */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5mm', mb: '0.8mm' }}>
                <GlobalEraEmblem />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    sx={{
                      fontSize: '7.8pt',
                      fontWeight: 900,
                      color: '#ffffff',
                      lineHeight: 1.1,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase'
                    }}
                  >
                    ग्लोबल एरा मल्टि सर्भिस
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '6.5pt',
                      fontWeight: 800,
                      color: '#fef08a',
                      lineHeight: 1.1
                    }}
                  >
                    प्राविधिक स्कुल जोरपाटी
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '4.8pt',
                      color: '#cbd5e1',
                      lineHeight: 1.1,
                      mt: '0.2mm'
                    }}
                  >
                    गोकर्णेश्वर-०५, जोरपाटी, काठमाडौँ
                  </Typography>
                </Box>
              </Box>

              {/* Trainee ID Ribbon Badge */}
              <Box
                sx={{
                  bgcolor: '#f59e0b',
                  color: '#0f2e5a',
                  fontWeight: 900,
                  fontSize: '5.8pt',
                  letterSpacing: '0.08em',
                  py: '0.6mm',
                  borderRadius: '1mm',
                  textTransform: 'uppercase',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                विद्यार्थी परिचयपत्र (TRAINEE ID)
              </Box>
            </Box>

            {/* Middle Section: Photo & Trainee Core Details */}
            <Box sx={{ px: '2.5mm', py: '1.5mm', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Photo Box with Gold Border */}
              <Box
                sx={{
                  width: '21mm',
                  height: '24mm',
                  borderRadius: '1.8mm',
                  border: '1.5px solid #0f2e5a',
                  outline: '1.5px solid #f59e0b',
                  outlineOffset: '0.8px',
                  overflow: 'hidden',
                  bgcolor: '#f1f5f9',
                  mb: '1.2mm',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}
              >
                <img
                  src={photoUrl}
                  alt={studentName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80';
                  }}
                />
              </Box>

              {/* Student Name */}
              <Typography
                sx={{
                  fontSize: '9pt',
                  fontWeight: 900,
                  color: '#0f2e5a',
                  lineHeight: 1.15,
                  textAlign: 'center',
                  letterSpacing: '0.01em',
                  mb: '0.6mm'
                }}
              >
                {studentName}
              </Typography>

              {/* Roll / TGID Badge */}
              <Box
                sx={{
                  bgcolor: '#f1f5f9',
                  border: '0.8px solid #cbd5e1',
                  borderRadius: '1mm',
                  px: '2mm',
                  py: '0.3mm',
                  fontSize: '6pt',
                  fontWeight: 800,
                  color: '#334155',
                  mb: '1.2mm'
                }}
              >
                रोल / ID: <strong style={{ color: '#0f2e5a' }}>{studentId}</strong> | {tgid}
              </Box>

              {/* Key Details Grid */}
              <Box
                sx={{
                  width: '100%',
                  bgcolor: '#f8fafc',
                  border: '0.8px solid #e2e8f0',
                  borderRadius: '1.2mm',
                  p: '1.2mm',
                  fontSize: '5.6pt',
                  textAlign: 'left',
                  lineHeight: 1.35
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '0.4mm' }}>
                  <span style={{ color: '#64748b' }}>तालिम (Course):</span>
                  <strong style={{ color: '#0f2e5a', maxWidth: '30mm', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {courseTitle}
                  </strong>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '0.4mm' }}>
                  <span style={{ color: '#64748b' }}>ब्याच / समय:</span>
                  <strong style={{ color: '#334155' }}>
                    {groupName} ({shift})
                  </strong>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '0.4mm' }}>
                  <span style={{ color: '#64748b' }}>सम्पर्क (Mobile):</span>
                  <strong style={{ color: '#334155' }}>{phone}</strong>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>रक्त समूह (Blood):</span>
                  <Box
                    sx={{
                      bgcolor: '#fee2e2',
                      color: '#b91c1c',
                      fontWeight: 900,
                      px: '1.2mm',
                      py: '0.1mm',
                      borderRadius: '0.8mm',
                      fontSize: '5.8pt'
                    }}
                  >
                    🩸 {bloodGroup}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Bottom Footer: QR Code, Validity & Signature */}
            <Box
              sx={{
                bgcolor: '#0f2e5a',
                color: '#ffffff',
                px: '2.5mm',
                py: '1.2mm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1.5px solid #f59e0b'
              }}
            >
              {/* Left: Scannable Live QR Code */}
              <Box
                sx={{
                  bgcolor: '#ffffff',
                  p: '0.6mm',
                  borderRadius: '0.8mm',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }}
              >
                <QRCodeSVG value={verifyUrl} size={38} level="M" />
              </Box>

              {/* Center: Validity Info */}
              <Box sx={{ textAlign: 'center', flexGrow: 1, px: '1mm' }}>
                <Typography sx={{ fontSize: '4.8pt', color: '#93c5fd', lineHeight: 1 }}>
                  मान्यता अवधि (VALID TILL)
                </Typography>
                <Typography sx={{ fontSize: '6.2pt', fontWeight: 900, color: '#fef08a', mt: '0.3mm' }}>
                  {validTill}
                </Typography>
              </Box>

              {/* Right: Authorized Signature Stamp */}
              <Box sx={{ textAlign: 'center', width: '16mm' }}>
                <Box sx={{ borderBottom: '1px dashed #cbd5e1', height: '3.5mm', mb: '0.3mm' }}></Box>
                <Typography sx={{ fontSize: '4.4pt', color: '#cbd5e1', lineHeight: 1 }}>
                  अधिकृत हस्ताक्षर
                </Typography>
                <Typography sx={{ fontSize: '4.2pt', color: '#94a3b8', lineHeight: 1 }}>
                  (Principal)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="no-print" sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          * Epson L8050 PVC Card Tray मा सिधै ५४ × ८५.६ मिमी (CR80) मा प्रिन्ट हुन्छ।
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
            प्रिन्ट गर्नुहोस् (Print Card)
          </Button>
        </Stack>
      </DialogActions>

      {/* Embedded CSS for Exact Epson L8050 CR80 Card Print Output */}
      <style>{`
        @page {
          size: 54mm 85.6mm portrait;
          margin: 0mm;
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
          #printableIdCardArea, #printableIdCardArea * {
            visibility: visible !important;
          }
          #printableIdCardArea {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 54mm !important;
            height: 85.6mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .id-card-portrait {
            width: 54mm !important;
            height: 85.6mm !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
