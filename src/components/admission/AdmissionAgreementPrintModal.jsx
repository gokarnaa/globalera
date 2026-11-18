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
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import SchoolIcon from '@mui/icons-material/School';
import { loadDB } from '../../services/storage';
import AgreementSheet, { mergeAgreementTemplate } from './AgreementSheet';

export default function AdmissionAgreementPrintModal({ open, onClose, admission }) {
  if (!admission) return null;

  const db = loadDB();
  const tpl = mergeAgreementTemplate(db.settings?.agreementTemplate);
  const companyProfile = db.settings?.companyProfile || {};
  const isDual = tpl.copyMode !== 'single';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper" className="agreement-print-dialog">
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
              {isDual
                ? 'Print dual copies (Office Copy and Student Copy) on standard A4 paper'
                : 'Print single Student Copy on standard A4 paper'}
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
            {isDual ? 'Print Dual Copy (A4)' : 'Print Agreement (A4)'}
          </Button>
          <IconButton onClick={onClose} sx={{ color: '#cbd5e1' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#f1f5f9' }}>
        <Box id="printableAdmissionAgreement">
          {isDual && (
            <AgreementSheet
              admission={admission}
              template={tpl}
              copyType="OFFICE"
              companyProfile={companyProfile}
            />
          )}
          <AgreementSheet
            admission={admission}
            template={tpl}
            copyType="STUDENT"
            companyProfile={companyProfile}
          />
        </Box>
      </DialogContent>

      <DialogActions className="no-print" sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          * Select A4 size in your print dialogue. {isDual ? 'Both copies will print automatically across 2 pages.' : 'Single copy A4 layout.'}
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

      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #root,
          .MuiBackdrop-root,
          .no-print {
            display: none !important;
          }
          .agreement-print-dialog,
          .agreement-print-dialog .MuiDialog-container,
          .agreement-print-dialog .MuiDialog-paper,
          .agreement-print-dialog .MuiDialogContent-root {
            position: static !important;
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          #printableAdmissionAgreement {
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .agreement-sheet {
            padding: 14mm 12mm !important;
            box-sizing: border-box !important;
            min-height: 268mm !important;
            max-height: 274mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
