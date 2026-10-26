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
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function StudentPaymentTimelineModal({
  open,
  onClose,
  student,
  ledger,
  payments = [],
  onCollectDue,
  onOpenClearanceCertificate
}) {
  if (!student || !ledger) return null;

  const studentPayments = payments.filter((p) => p.studentId === student.id);
  const firstPayment = studentPayments[0] || null;
  const isFullyPaid = ledger.due <= 0;

  // Calculate days remaining or overdue
  const dueDate = ledger.dueDateStr || '';
  let daysDiffText = '';
  let isDueCritical = false;
  if (dueDate && ledger.due > 0) {
    const dueTime = new Date(dueDate).getTime();
    const nowTime = new Date().getTime();
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      daysDiffText = `भाका नाघेको (${Math.abs(diffDays)} दिन बित्यो - Overdue)`;
      isDueCritical = true;
    } else {
      daysDiffText = `भुक्तानी गर्न ${diffDays} दिन बाँकी छ`;
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle
        sx={{
          bgcolor: '#0f2e5a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
          px: 3
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AccessTimeIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              किस्ता भुक्तानी टाइमलाइन (Fee Timeline)
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              {student.name} ({student.tgid}) — {ledger.courseTitle}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc' }}>
        {/* Top Summary Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            mb: 3,
            border: '1px solid #cbd5e1',
            borderRadius: 2,
            bgcolor: isFullyPaid ? '#ecfdf5' : '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                खुद सम्झौता शुल्क:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f2e5a' }}>
                रु. {(Number(ledger?.netFee ?? ledger?.lockedFee) || 0).toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                भुक्तानी भएको:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#059669' }}>
                रु. {(Number(ledger?.totalPaid) || 0).toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                बाँकी बक्यौता:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: (Number(ledger?.due) || 0) > 0 ? '#dc2626' : '#059669' }}>
                रु. {(Number(ledger?.due) || 0).toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                स्थिति: <strong>{ledger.paymentStatus}</strong>
              </Typography>
              {daysDiffText && (
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: isDueCritical ? '#dc2626' : '#b45309' }}>
                  ⏳ {daysDiffText}
                </Typography>
              )}
            </Box>

            {isFullyPaid ? (
              <Chip
                icon={<CheckCircleIcon />}
                label="पूर्ण चुक्ता (100% Cleared)"
                color="success"
                sx={{ fontWeight: 800 }}
              />
            ) : (
              <Chip
                label="दोस्रो किस्ता बाँकी (50% Due)"
                color={isDueCritical ? 'error' : 'warning'}
                sx={{ fontWeight: 800 }}
              />
            )}
          </Box>
        </Paper>

        {/* Visual Stepper Timeline */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', mb: 2 }}>
          किस्ता प्रगति तथा इतिहास (Milestone Steps):
        </Typography>

        <Stepper orientation="vertical" activeStep={isFullyPaid ? 3 : 1}>
          {/* Step 1: Admission & 50% Advance */}
          <Step active completed={firstPayment !== null}>
            <StepLabel
              StepIconProps={{ sx: { color: firstPayment ? '#059669 !important' : '#0f2e5a !important' } }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                पहिलो किस्ता: भर्नाको समयमा ५०% अग्रिम भुक्तानी
              </Typography>
            </StepLabel>
            <StepContent>
              {firstPayment ? (
                <Box sx={{ bgcolor: '#ffffff', p: 1.5, border: '1px solid #e2e8f0', borderRadius: 1.5, mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                    रु. {(Number(firstPayment.amount) || 0).toLocaleString()} भुक्तानी सम्पन्न ✓
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    रसिद नं: <strong>{firstPayment.receiptNo}</strong> | मिति: {firstPayment.paymentDate}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    माध्यम: {firstPayment.paymentMethod} | बुझ्ने: {firstPayment.collectedBy || 'Admission Desk'}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="caption" sx={{ color: '#dc2626' }}>
                  भर्ना अग्रिम भुक्तानी रेकर्ड छैन।
                </Typography>
              )}
            </StepContent>
          </Step>

          {/* Step 2: 2nd Installment within 30 days */}
          <Step active completed={isFullyPaid}>
            <StepLabel
              StepIconProps={{ sx: { color: isFullyPaid ? '#059669 !important' : (isDueCritical ? '#dc2626 !important' : '#f59e0b !important') } }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                दोस्रो किस्ता: बाँकी ५०% रकम (तालिम सुरु भएको ३० दिन भित्र)
              </Typography>
            </StepLabel>
            <StepContent>
              {isFullyPaid ? (
                <Box sx={{ bgcolor: '#ffffff', p: 1.5, border: '1px solid #e2e8f0', borderRadius: 1.5, mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                    बाँकी सम्पूर्ण किस्ता भुक्तानी सम्पन्न ✓
                  </Typography>
                  {studentPayments.slice(1).map((sp) => (
                    <Typography key={sp.id} variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
                      रु. {(Number(sp.amount) || 0).toLocaleString()} (रसिद: {sp.receiptNo}) — मिति: {sp.paymentDate}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Box sx={{ bgcolor: isDueCritical ? '#fef2f2' : '#fffbeb', p: 1.5, border: `1.5px solid ${isDueCritical ? '#f87171' : '#fde68a'}`, borderRadius: 1.5, mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: isDueCritical ? '#dc2626' : '#b45309' }}>
                    बाँकी रकम: रु. {(Number(ledger?.due) || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                    अन्तिम म्याद (Due Date): <strong>{dueDate}</strong>
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    startIcon={<PointOfSaleIcon />}
                    onClick={() => {
                      onClose();
                      if (onCollectDue) onCollectDue(student.id, ledger?.due);
                    }}
                    sx={{ mt: 1, fontWeight: 800 }}
                  >
                    बाँकी रु. {(Number(ledger?.due) || 0).toLocaleString()} अहिले बुझ्नुहोस् (Collect Due)
                  </Button>
                </Box>
              )}
            </StepContent>
          </Step>

          {/* Step 3: Full Fee Clearance Certificate */}
          <Step active={isFullyPaid} completed={isFullyPaid}>
            <StepLabel
              StepIconProps={{ sx: { color: isFullyPaid ? '#059669 !important' : '#cbd5e1 !important' } }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isFullyPaid ? '#059669' : '#64748b' }}>
                पूर्ण चुक्ता स्वीकृति (Official Fee Clearance & Certification)
              </Typography>
            </StepLabel>
            <StepContent>
              {isFullyPaid ? (
                <Box sx={{ bgcolor: '#ecfdf5', p: 1.5, border: '1px solid #a7f3d0', borderRadius: 1.5, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 700, mb: 1 }}>
                    विद्यार्थीको शुल्क पूर्ण चुक्ता भएको प्रमाणित गरिएको छ। अब परीक्षा र OJT सिफारिसका लागि योग्य छ।
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    color="warning"
                    startIcon={<VerifiedIcon />}
                    onClick={() => {
                      onClose();
                      if (onOpenClearanceCertificate) onOpenClearanceCertificate(student, ledger);
                    }}
                    sx={{ fontWeight: 800, bgcolor: '#f59e0b', color: '#0f2e5a', '&:hover': { bgcolor: '#d97706', color: '#ffffff' } }}
                  >
                    शुल्क चुक्ता प्रमाणपत्र प्रिन्ट गर्नुहोस् (Print Clearance)
                  </Button>
                </Box>
              ) : (
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  दोस्रो किस्ता भुक्तान भएपछि शुल्क चुक्ता प्रमाणपत्र जारी हुनेछ।
                </Typography>
              )}
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit">
          बन्द गर्नुहोस् (Close)
        </Button>
        {isFullyPaid && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<VerifiedIcon />}
            onClick={() => {
              onClose();
              if (onOpenClearanceCertificate) onOpenClearanceCertificate(student, ledger);
            }}
            sx={{ fontWeight: 800 }}
          >
            चुक्ता प्रमाणपत्र हेर्नुहोस्
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
