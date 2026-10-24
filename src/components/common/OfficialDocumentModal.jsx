import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function OfficialDocumentModal({
  open,
  onClose,
  docType = 'WORK_PLAN', // 'WORK_PLAN' | 'LESSON_PLAN' | 'LOG_BOOK' | 'EVALUATION'
  title = 'OFFICIAL DOCUMENT',
  nepaliTitle = 'आधिकारिक शैक्षिक कागजात',
  group = null,
  course = null,
  trainer = null,
  metadata = {},
  shareText = '',
  sharePhone = '',
  children
}) {
  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  const fullShareText =
    shareText ||
    `*KITE TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n*${title} (${nepaliTitle})*\nGroup: ${group?.groupCode || '—'} | Course: ${course?.title || '—'}\nTrainer: ${trainer?.name || '—'}\nDate: ${new Date().toISOString().slice(0, 10)}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& @media print': {
          '& .MuiDialog-container': {
            display: 'block',
            p: 0
          }
        }
      }}
    >
      {/* Top Action Toolbar (Hidden in Print) */}
      <Box
        className="no-print"
        sx={{
          p: 2,
          bgcolor: '#f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label="A4 Official Format" color="primary" size="small" sx={{ fontWeight: 800 }} />
          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
            CTEVT Standard Institutional Document
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ fontWeight: 800, px: 2 }}
          >
            Print / Save PDF
          </Button>

          <Button
            variant="outlined"
            color="success"
            size="small"
            startIcon={<WhatsAppIcon />}
            component="a"
            href={getWhatsAppUrl(sharePhone, fullShareText)}
            target="_blank"
            sx={{ fontWeight: 800, bgcolor: '#fff' }}
          >
            WhatsApp Share
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={onClose}
            sx={{ fontWeight: 700, minWidth: 40, px: 1, bgcolor: '#fff' }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </Box>
      </Box>

      {/* Printable A4 Document Body */}
      <DialogContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: '#ffffff' }}>
        <Box
          id="printableOfficialDoc"
          sx={{
            fontFamily: "'Noto Sans Devanagari', 'Inter', sans-serif",
            color: '#111827',
            maxWidth: 800,
            mx: 'auto',
            border: '1.5px solid #0f172a',
            p: { xs: 2, sm: 3.5 },
            bgcolor: '#ffffff'
          }}
        >
          {/* 1. Official Institutional Letterhead */}
          <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2px double #0f172a' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <SchoolIcon sx={{ fontSize: 36, color: '#1a56b0' }} />
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '0.04em', color: '#1a56b0' }}>
                KITE CAREGIVER TRAINING CENTER
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#152238', fontSize: '1.15rem' }}>
              ग्लोबल एरा प्राविधिक स्कुल (GLOBAL ERA TECHNICAL SCHOOL)
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.8rem', mt: 0.3 }}>
              CTEVT Accredited Technical Training Institute • Regd No: 184920/078/079
            </Typography>
            <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontSize: '0.78rem' }}>
              MitraPark, Chabahil-07, Kathmandu, Nepal | Tel: +977-1-4481234 | info@globalera.edu.np
            </Typography>
          </Box>

          {/* 2. Document Title Banner */}
          <Box sx={{ my: 2, textAlign: 'center', bgcolor: '#f8fafc', py: 1.2, border: '1px solid #cbd5e1' }}>
            <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f172a' }}>
              {title}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
              ({nepaliTitle})
            </Typography>
          </Box>

          {/* 3. Metadata Grid (Batch, Course, Trainer, Timing) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.2,
              p: 1.5,
              mb: 2.5,
              border: '1px solid #e2e8f0',
              bgcolor: '#fbfcfe',
              fontSize: '0.85rem'
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                COURSE / CURRICULUM (पाठ्यक्रम):
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {course?.title || 'Vocational Training'} ({course?.durationHours || 160} Hours)
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                TRAINING GROUP (समूह) & SHIFT:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                Batch: <b>{group?.groupCode || '—'}</b> | Shift: {group?.shift || 'A'} ({group?.startTime || '07:00'} - {group?.endTime || '09:00'})
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                PRIMARY INSTRUCTOR / TRAINER (प्रशिक्षक):
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                {trainer?.name || 'Assigned Instructor'} {trainer?.phone ? `(${trainer.phone})` : ''}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                TRAINING PERIOD / DATE (मिति):
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {metadata.dateRange || `${group?.admissionDate || '2026-09-01'} → ${group?.expectedEndDate || '2026-10-31'}`}
              </Typography>
            </Box>
          </Box>

          {/* 4. Structured Document Content */}
          <Box sx={{ mb: 3 }}>
            {children}
          </Box>

          {/* 5. Official Verification & Dual Signature Block */}
          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: '1.5px solid #0f172a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 2
            }}
          >
            {/* Trainer Signature */}
            <Box sx={{ width: '45%', textAlign: 'center' }}>
              <Box sx={{ height: 40, borderBottom: '1px dashed #647089', mb: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {trainer?.name || 'Instructor Name'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                Prepared By (प्रशिक्षक)
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                Date: {new Date().toISOString().slice(0, 10)}
              </Typography>
            </Box>

            {/* Coordinator / Principal Seal & Signature */}
            <Box sx={{ width: '45%', textAlign: 'center' }}>
              <Box sx={{ height: 40, borderBottom: '1px dashed #647089', mb: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Chip icon={<VerifiedIcon />} label="VERIFIED CTEVT" size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Training Coordinator / Principal
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                Approved By (प्रमाणित / स्वीकृत)
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                Institutional Seal (संस्थाको छाप)
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      {/* Printable CSS Helper injected into head */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 8mm;
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
          #printableOfficialDoc, #printableOfficialDoc * {
            visibility: visible !important;
          }
          #printableOfficialDoc {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            border: 1.5px solid #0f172a !important;
            padding: 10mm !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>
    </Dialog>
  );
}
