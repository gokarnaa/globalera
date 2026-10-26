import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
  IconButton,
  Alert,
  Paper,
  InputAdornment,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';

export const PAYMENT_METHODS = [
  'Cash (नगद)',
  'Fonepay / QR (फोनपे)',
  'eSewa (इसेवा)',
  'Khalti (खल्ती)',
  'Bank Transfer (बैंक दाखिला)',
  'Cheque (चेक)'
];

export default function RecordPaymentModal({
  open,
  onClose,
  onSavePayment,
  db,
  preselectedStudentId = null
}) {
  const { currentUser } = useAuth();

  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMonth, setPaymentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paymentMethod, setPaymentMethod] = useState('Fonepay / QR (फोनपे)');
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const students = db?.students || [];
  const courses = db?.courses || [];
  const groups = db?.trainingGroups || [];
  const payments = db?.payments || [];

  // Helper to calculate student balance
  const getStudentBalance = (sId) => {
    const st = students.find((s) => s.id === sId);
    if (!st) return { lockedFee: 0, paid: 0, due: 0, courseName: '', groupName: '', originalFee: 0, discountAmount: 0, discountPercent: 0, admissionFee: 0 };

    const grp = groups.find((g) => g.id === st.groupId);
    const crs = courses.find((c) => c.id === grp?.courseId);

    const originalFee = st.originalFee || crs?.price || 30000;
    const discountAmount = st.discountAmount || 0;
    const discountPercent = st.discountPercent || (discountAmount > 0 ? Math.round((discountAmount / originalFee) * 100) : 0);
    const admissionFee = st.admissionFee || 0;

    const lockedFee = st.lockedCourseFee || (originalFee - discountAmount + admissionFee) || 15000;
    const paid = payments
      .filter((p) => p.studentId === sId)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const due = Math.max(0, lockedFee - paid);

    return {
      lockedFee,
      paid,
      due,
      originalFee,
      discountAmount,
      discountPercent,
      admissionFee,
      courseName: crs?.title || 'Vocational Training',
      groupName: grp?.groupCode || st.groupId || 'Group'
    };
  };

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = today.slice(0, 7);
    setPaymentDate(today);
    setPaymentMonth(currentMonth);

    if (preselectedStudentId) {
      setStudentId(preselectedStudentId);
      const bal = getStudentBalance(preselectedStudentId);
      // If student has paid 0, suggest 50% installment!
      if (bal.paid === 0) {
        setAmount(Math.round(bal.lockedFee * 0.5));
        setRemarks('पहिलो किस्ता (५०% भर्ना शुल्क)');
      } else {
        setAmount(bal.due);
        setRemarks('दोस्रो किस्ता (बाँकी बक्यौता भुक्तानी)');
      }
    } else {
      setStudentId('');
      setAmount('');
      setRemarks('');
    }
  }, [open, preselectedStudentId]);

  const handleStudentSelect = (selectedId) => {
    setStudentId(selectedId);
    setErrorMsg('');
    const bal = getStudentBalance(selectedId);
    if (bal.paid === 0) {
      setAmount(Math.round(bal.lockedFee * 0.5));
      setRemarks('पहिलो किस्ता (५०% भर्ना शुल्क)');
    } else {
      setAmount(bal.due);
      setRemarks('दोस्रो किस्ता (बाँकी बक्यौता भुक्तानी)');
    }
  };

  const selectedBalance = studentId ? getStudentBalance(studentId) : null;
  const currentStudent = students.find((s) => s.id === studentId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId) {
      setErrorMsg('कृपया विद्यार्थी छान्नुहोस्।');
      return;
    }
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      setErrorMsg('कृपया मान्य भुक्तानी रकम लेख्नुहोस् (Amount must be > 0).');
      return;
    }
    if (selectedBalance && payNum > selectedBalance.due) {
      setErrorMsg(`भुक्तानी रकम बाँकी बक्यौता (Rs. ${selectedBalance.due.toLocaleString()}) भन्दा बढी हुन सक्दैन।`);
      return;
    }

    // Generate Next Sequential Receipt No: REC-2026-0001
    const yearStr = new Date().getFullYear();
    const existingRecNos = payments
      .map((p) => {
        const match = p.receiptNo && p.receiptNo.match(/REC-\d+-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextRecSeq = existingRecNos.length ? Math.max(...existingRecNos) + 1 : 1;
    const receiptNo = `REC-${yearStr}-${String(nextRecSeq).padStart(4, '0')}`;

    const newPayment = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      receiptNo,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      tgid: currentStudent.tgid,
      groupId: currentStudent.groupId,
      courseName: selectedBalance.courseName,
      originalFee: selectedBalance.originalFee,
      discountPercent: selectedBalance.discountPercent,
      discountAmount: selectedBalance.discountAmount,
      admissionFee: selectedBalance.admissionFee,
      lockedCourseFee: selectedBalance.lockedFee,
      amount: payNum,
      paymentDate,
      paymentMonth,
      paymentMethod: paymentMethod.split(' (')[0],
      remarks: remarks.trim() || 'शुल्क भुक्तानी',
      receivedBy: currentUser?.name || 'Admin / Cashier',
      createdAt: new Date().toISOString()
    };

    // If fully cleared, celebrate!
    if (selectedBalance.due - payNum <= 0) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (err) {}
    }

    onSavePayment(newPayment);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
        sx={{
          m: 0,
          p: 2.5,
          background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <PointOfSaleIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>
              शुल्क संकलन तथा रसिद (Collect Student Fee)
            </Typography>
            <Typography variant="caption" sx={{ color: '#A7F3D0', fontWeight: 500 }}>
              किस्ता भुक्तानी दर्ता र प्रिन्ट रसिद जारी
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#A7F3D0', '&:hover': { color: '#FFF' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {/* Student Selector */}
          <TextField
            select
            fullWidth
            required
            label="विद्यार्थी छान्नुहोस् (Select Student)"
            value={studentId}
            onChange={(e) => handleStudentSelect(e.target.value)}
            sx={{ mb: 2.5 }}
          >
            <MenuItem value="">
              <em>-- विद्यार्थी छान्नुहोस् --</em>
            </MenuItem>
            {students.map((st) => {
              const b = getStudentBalance(st.id);
              return (
                <MenuItem key={st.id} value={st.id} disabled={b.due <= 0}>
                  {st.name} ({st.tgid}) — बाँकी बक्यौता: Rs. {b.due.toLocaleString()} {b.due <= 0 ? '(सम्पन्न)' : ''}
                </MenuItem>
              );
            })}
          </TextField>

          {/* Live Student Account Balance Card */}
          {selectedBalance && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2.5,
                bgcolor: '#ECFDF5',
                border: '1.5px solid #A7F3D0'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065F46' }}>
                  {currentStudent?.name} ({currentStudent?.tgid})
                </Typography>
                <Chip
                  label={selectedBalance.due === 0 ? 'सम्पन्न (Paid)' : `बाँकी बक्यौता: Rs. ${selectedBalance.due.toLocaleString()}`}
                  size="small"
                  color={selectedBalance.due === 0 ? 'success' : 'warning'}
                  sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                />
              </Box>

              <Grid container spacing={1} sx={{ fontSize: '0.85rem' }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>कोर्स:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#064E3B' }}>{selectedBalance.courseName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>लक्ड कुल शुल्क:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#064E3B' }}>Rs. {selectedBalance.lockedFee.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>अहिलेसम्म बुझाएको:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>Rs. {selectedBalance.paid.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>बाँकी बक्यौता:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: '#DC2626' }}>Rs. {selectedBalance.due.toLocaleString()}</Typography>
                </Grid>
              </Grid>

              {/* Quick Installment Buttons */}
              {selectedBalance.due > 0 && (
                <Box sx={{ mt: 1.5, pt: 1.2, borderTop: '1px dashed #A7F3D0', display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setAmount(Math.round(selectedBalance.lockedFee * 0.5))}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderColor: '#10B981',
                      color: '#047857',
                      bgcolor: '#FFFFFF'
                    }}
                  >
                    ५०% किस्ता (Rs. {Math.round(selectedBalance.lockedFee * 0.5).toLocaleString()})
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setAmount(selectedBalance.due)}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderColor: '#059669',
                      color: '#065F46',
                      bgcolor: '#FFFFFF'
                    }}
                  >
                    बाँकी सबै (Rs. {selectedBalance.due.toLocaleString()})
                  </Button>
                </Box>
              )}
            </Paper>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="भुक्तानी रकम (Payment Amount Rs.)"
                placeholder="उदा: 6000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MonetizationOnIcon sx={{ color: '#059669' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="भुक्तानी माध्यम (Payment Method)"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <MenuItem key={pm} value={pm}>
                    {pm}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="भुक्तानी मिति (Payment Date)"
                InputLabelProps={{ shrink: true }}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="month"
                label="लेखा महिना (Month)"
                InputLabelProps={{ shrink: true }}
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="कैफियत / टिप्पणी (Remarks)"
                placeholder="उदा: पहिलो किस्ता ५०% भर्ना शुल्क बुझाएको..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NoteAltIcon sx={{ color: '#64748B' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
          <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: 700 }}>
            रद्द गर्नुहोस् (Cancel)
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!studentId || !amount || Number(amount) <= 0}
            startIcon={<PointOfSaleIcon />}
            sx={{
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              fontWeight: 800,
              px: 3.5,
              py: 1,
              borderRadius: 2.5,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            भुक्तानी दर्ता गर्नुहोस् (Record & Generate Receipt)
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
