import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Chip
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';
import { QRCodeSVG } from 'qrcode.react';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function A4LandscapeCertificateModal({
  open,
  onClose,
  certificate,
  student,
  course,
  group,
  trainer
}) {
  if (!open || !certificate || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const verificationUrl = `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(
    certificate.certificateNo
  )}`;

  const shareText =
    `*KITE CAREGIVER TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n` +
    `🎓 *VOCATIONAL TRAINING COMPLETION CERTIFICATE (तालिम समापन प्रमाणपत्र)*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• *प्रशिक्षार्थी (Trainee):* ${student.name} (${student.tgid})\n` +
    `• *पाठ्यक्रम (Course):* ${course?.title || 'Vocational Training'} (${course?.totalHours || 390} Hours)\n` +
    `• *प्रमाणपत्र नं (Cert No):* ${certificate.certificateNo}\n` +
    `• *जारी मिति (Issue Date):* ${certificate.issueDate}\n` +
    `• *स्थिति:* ✅ Successfully Completed (CTEVT Standards)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔗 *अनलाइन प्रमाणीकरण लिंक (Online Verification):*\n${verificationUrl}\n\n` +
    `_CTEVT सम्बन्धन प्राप्त संस्थाबाट जारी आधिकारिक सीप प्रमाणपत्र।_`;

  const isFemale = (student.gender || '').toLowerCase() === 'female';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxWidth: '1150px',
          bgcolor: '#f8fafc'
        }
      }}
    >
      {/* Top Action Toolbar (Hidden in Print) */}
      <Box
        className="no-print"
        sx={{
          p: 2,
          bgcolor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label="A4 Landscape Official CTEVT Format"
            sx={{ bgcolor: '#c59b27', color: '#0f172a', fontWeight: 900, fontSize: '0.78rem' }}
          />
          <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
            Certificate No: <b>{certificate.certificateNo}</b>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{
              bgcolor: '#1a56b0',
              fontWeight: 800,
              px: 2.5,
              '&:hover': { bgcolor: '#123e80' }
            }}
          >
            Print / Save PDF (A4 Landscape)
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<WhatsAppIcon />}
            component="a"
            href={getWhatsAppUrl(student.phone || '', shareText)}
            target="_blank"
            sx={{
              borderColor: '#25D366',
              color: '#25D366',
              fontWeight: 800,
              bgcolor: 'rgba(37, 211, 102, 0.1)',
              '&:hover': { borderColor: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.2)' }
            }}
          >
            WhatsApp Dispatch
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={onClose}
            sx={{ color: '#ffffff', borderColor: '#475569', minWidth: 40, px: 1 }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </Box>
      </Box>

      {/* Printable A4 Landscape Certificate Canvas */}
      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
        <Box
          id="printableLandscapeCertificate"
          sx={{
            width: '1060px',
            minHeight: '740px',
            bgcolor: '#ffffff',
            p: '28px 36px',
            boxSizing: 'border-box',
            fontFamily: "'Noto Sans Devanagari', 'Cinzel', 'Times New Roman', serif",
            color: '#111827',
            position: 'relative',
            border: '6px double #0b2545',
            outline: '3px solid #c59b27',
            outlineOffset: '-12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Subtle Background Watermark */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.04,
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            <SchoolIcon sx={{ fontSize: 360, color: '#0b2545' }} />
          </Box>

          {/* 1. Institutional Letterhead Header */}
          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', pb: 1, borderBottom: '1.5px solid #c59b27' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
              {/* Left Logo / Emblem */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon sx={{ fontSize: 44, color: '#0b2545' }} />
              </Box>

              {/* Center Institutional Name */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'Times New Roman', serif",
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    color: '#0b2545',
                    fontSize: '1.45rem',
                    textTransform: 'uppercase'
                  }}
                >
                  KITE CAREGIVER TRAINING CENTER
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: '#1e3a8a',
                    fontSize: '1.1rem',
                    letterSpacing: '0.02em',
                    mt: 0.2
                  }}
                >
                  ग्लोबल एरा प्राविधिक स्कुल (GLOBAL ERA TECHNICAL SCHOOL)
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#475569',
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    mt: 0.3
                  }}
                >
                  Accredited Technical Training Provider under Council for Technical Education and Vocational Training (CTEVT)
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    display: 'block',
                    fontSize: '0.74rem'
                  }}
                >
                  Government Regd. No: 184920/078/079 • CTEVT Affiliation Code: 4208 • MitraPark, Chabahil-07, Kathmandu, Nepal
                </Typography>
              </Box>

              {/* Right CTEVT Emblem */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedIcon sx={{ fontSize: 44, color: '#c59b27' }} />
              </Box>
            </Box>
          </Box>

          {/* 2. Certificate Title Banner */}
          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', my: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: "'Times New Roman', serif",
                fontWeight: 900,
                color: '#0b2545',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '1.25rem',
                mb: 0.2
              }}
            >
              CERTIFICATE OF VOCATIONAL TRAINING COMPLETION
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: '#c59b27',
                fontSize: '1rem',
                letterSpacing: '0.04em'
              }}
            >
              (व्यावसायिक तालिम समापन प्रमाणपत्र)
            </Typography>
          </Box>

          {/* 3. Reference Tracking Bar */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              px: 3,
              py: 0.5,
              bgcolor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#334155'
            }}
          >
            <Box>
              Certificate No: <b style={{ color: '#0b2545' }}>{certificate.certificateNo}</b>
            </Box>
            <Box>
              Registration / TGID: <b style={{ color: '#0b2545' }}>{student.tgid}</b>
            </Box>
            <Box>
              Issue Date: <b>{certificate.issueDate}</b>
            </Box>
          </Box>

          {/* 4. Student & Course Centerpiece Highlight with PP Size Photo */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              my: 1.2
            }}
          >
            {/* Left Symmetry Spacer / Institutional Credential Stamp */}
            <Box
              sx={{
                width: '92px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.85
              }}
            >
              <Box
                sx={{
                  border: '1.5px dashed #c59b27',
                  borderRadius: '4px',
                  p: '5px 8px',
                  textAlign: 'center',
                  bgcolor: '#fffbf0'
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.64rem', fontWeight: 900, color: '#0b2545', display: 'block' }}>
                  CTEVT
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.58rem', fontWeight: 800, color: '#854d0e', display: 'block' }}>
                  STANDARDS
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.56rem', color: '#64748b', display: 'block' }}>
                  {course?.totalHours || 390} HRS
                </Typography>
              </Box>
            </Box>

            {/* Centerpiece: Trainee Full Name & Course */}
            <Box sx={{ textAlign: 'center', flexGrow: 1, px: 2 }}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "'Times New Roman', serif",
                  fontWeight: 900,
                  color: '#0b2545',
                  letterSpacing: '0.05em',
                  fontSize: '1.65rem',
                  textTransform: 'uppercase'
                }}
              >
                {student.name}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: '#1a56b0',
                  fontSize: '0.98rem',
                  letterSpacing: '0.04em',
                  mt: 0.3
                }}
              >
                COURSE: {course?.title ? course.title.toUpperCase() : 'VOCATIONAL TRAINING'} ({course?.totalHours || 390} HOURS / {course?.durationValue || 3} {course?.durationUnit || 'MONTHS'})
              </Typography>
            </Box>

            {/* Right: Trainee Passport Size Photo (35mm x 45mm official frame) */}
            <Box
              sx={{
                width: '88px',
                height: '110px',
                border: '2px solid #c59b27',
                borderRadius: '4px',
                p: '2px',
                bgcolor: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              {student.photoUrl ? (
                <Box
                  component="img"
                  src={student.photoUrl}
                  alt={student.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '2px',
                    display: 'block'
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 0.5
                  }}
                >
                  <PersonIcon sx={{ fontSize: 38, color: '#94a3b8' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.56rem',
                      fontWeight: 800,
                      color: '#64748b',
                      textAlign: 'center',
                      lineHeight: 1.1,
                      mt: 0.3
                    }}
                  >
                    PP PHOTO<br />(35×45mm)
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* 5. Pure English Content Paragraph (No meta label) */}
          <Box sx={{ position: 'relative', zIndex: 1, px: 3, textAlign: 'justify' }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Times New Roman', serif",
                fontSize: '0.92rem',
                lineHeight: 1.45,
                color: '#1e293b'
              }}
            >
              This is to certify that Mr./Ms. <b>{student.name}</b>, {isFemale ? 'Daughter' : 'Son'} of Mr./Mrs. <b>{student.fatherName || student.guardianName || 'Guardian'}</b>, permanent resident of <b>{student.permanentAddress || 'Kathmandu, Nepal'}</b>, has successfully completed the <b>{course?.totalHours || 390} Hours</b> vocational competency training course in <b>{course?.title || 'Vocational Training'}</b> conducted at this institute from <b>{group?.admissionDate || '2026-07-15'}</b> to <b>{group?.expectedEndDate || '2026-10-15'}</b> in accordance with the curriculum standards prescribed by the Council for Technical Education and Vocational Training (CTEVT), Nepal.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Times New Roman', serif",
                fontSize: '0.92rem',
                lineHeight: 1.4,
                color: '#1e293b',
                mt: 0.4
              }}
            >
              During the training period, {isFemale ? 'her' : 'his'} attendance, practical workshop performance, and conduct were found satisfactory.
            </Typography>
          </Box>

          {/* Delicate Ornate Gold Divider */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              my: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5
            }}
          >
            <Box sx={{ flexGrow: 1, height: '1px', bgcolor: '#e2e8f0' }} />
            <Box sx={{ color: '#c59b27', fontSize: '0.85rem' }}>❖</Box>
            <Box sx={{ flexGrow: 1, height: '1px', bgcolor: '#e2e8f0' }} />
          </Box>

          {/* 6. Pure Nepali Content Paragraph (No meta label) */}
          <Box sx={{ position: 'relative', zIndex: 1, px: 3, textAlign: 'justify' }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Noto Sans Devanagari', sans-serif",
                fontSize: '0.92rem',
                lineHeight: 1.5,
                color: '#1e293b'
              }}
            >
              श्री/सुश्री <b>{student.name}</b>, बुबा/आमा श्री <b>{student.fatherName || student.guardianName || 'अभिभावक'}</b>, स्थायी ठेगाना <b>{student.permanentAddress || 'नेपाल'}</b>, ले यस शिक्षालयद्वारा प्राविधिक शिक्षा तथा व्यावसायिक तालिम परिषद् (CTEVT) को स्वीकृत पाठ्यक्रम मापदण्ड बमोजिम मिति <b>{group?.admissionDate || '२०८३/०४/०१'}</b> देखि <b>{group?.expectedEndDate || '२०८३/०७/०१'}</b> सम्म सञ्चालित <b>{course?.totalHours || 390} घन्टे</b> <b>{course?.title || 'व्यावसायिक'}</b> तालिम सफलतापूर्वक सम्पन्न गर्नुभएकोले यो <b>व्यावसायिक तालिम समापन प्रमाणपत्र</b> प्रदान गरिएको छ।
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Noto Sans Devanagari', sans-serif",
                fontSize: '0.92rem',
                lineHeight: 1.45,
                color: '#1e293b',
                mt: 0.4
              }}
            >
              तालिम अवधिभर निजको उपस्थिति, प्रयोगात्मक सीप सिकाइ र आचरण सन्तोषजनक रहेको व्यहोरा प्रमाणित गरिन्छ।
            </Typography>
          </Box>

          {/* 7. Footer: QR Code + Golden Seal + Dual Signatures */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              mt: 1.5,
              pt: 1.2,
              borderTop: '1px solid #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              px: 2
            }}
          >
            {/* Left: Dynamic QR Code for Instant Verification */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '28%' }}>
              <Box sx={{ p: 0.6, bgcolor: '#ffffff', border: '1.5px solid #0b2545', borderRadius: 1 }}>
                <QRCodeSVG value={verificationUrl} size={76} level="M" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0b2545', display: 'block', fontSize: '0.72rem' }}>
                  SCAN TO VERIFY
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem', lineHeight: 1.2 }}>
                  Official CTEVT Record Verification
                </Typography>
                <Typography variant="caption" sx={{ color: '#1a56b0', fontWeight: 700, fontSize: '0.66rem' }}>
                  {certificate.certificateNo}
                </Typography>
              </Box>
            </Box>

            {/* Center: Golden Institutional Seal Rosette */}
            <Box sx={{ textAlign: 'center', width: '32%' }}>
              <Box
                sx={{
                  display: 'inline-block',
                  p: '6px 14px',
                  border: '1.5px solid #c59b27',
                  borderRadius: 2,
                  bgcolor: '#fdfbf7',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#0b2545', display: 'block', letterSpacing: '0.06em', fontSize: '0.72rem' }}>
                  ★ OFFICIAL SEAL ★
                </Typography>
                <Typography variant="caption" sx={{ color: '#c59b27', fontWeight: 800, fontSize: '0.68rem', display: 'block' }}>
                  GLOBAL ERA TECHNICAL SCHOOL
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem', display: 'block' }}>
                  CTEVT ACCREDITED • KATHMANDU
                </Typography>
              </Box>
            </Box>

            {/* Right: Dual Official Signatures */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, width: '38%' }}>
              <Box sx={{ textAlign: 'center', width: '130px' }}>
                <Box sx={{ height: 34, borderBottom: '1px dashed #64748b', mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0b2545', fontSize: '0.8rem' }}>
                  {trainer?.name || 'Lead Trainer'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>
                  प्रशिक्षक (Instructor)
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', width: '140px' }}>
                <Box sx={{ height: 34, borderBottom: '1px dashed #64748b', mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0b2545', fontSize: '0.8rem' }}>
                  Principal / Director
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>
                  क्याम्पस प्रमुख (Principal)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      {/* Printable CSS Helper injected for exact A4 Landscape Output */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 6mm 6mm;
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
          #printableLandscapeCertificate, #printableLandscapeCertificate * {
            visibility: visible !important;
          }
          #printableLandscapeCertificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 98vh !important;
            margin: 0 !important;
            border: 5px double #0b2545 !important;
            outline: 2px solid #c59b27 !important;
            outline-offset: -8px !important;
            padding: 20px 28px !important;
            box-shadow: none !important;
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
