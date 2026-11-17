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
  Paper,
  InputAdornment,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentIcon from '@mui/icons-material/Payment';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import confetti from 'canvas-confetti';
import { saveDB, postDoubleEntryJournal } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useDialog } from '../../context/DialogContext';

export default function ConnectIpsPayoutModal({
  open,
  onClose,
  party,
  db,
  setDb,
  onSuccess
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { alert } = useDialog();
  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CONNECT_IPS');
  const [fromBank, setFromBank] = useState('Nabil Bank (A/C: 0123456789)');
  const [toBankName, setToBankName] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [toAccountHolder, setToAccountHolder] = useState('');
  const [txnReference, setTxnReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [monthTarget, setMonthTarget] = useState('Baisakh');
  const [tdsDeducted, setTdsDeducted] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [completedVoucher, setCompletedVoucher] = useState(null);

  useEffect(() => {
    if (open) {
      setCompletedVoucher(null);
    }
    if (party) {
      setToBankName(party.bankName || 'Global IME Bank');
      setToAccountNumber(party.accountNumber || '01201010049281');
      setToAccountHolder(party.accountHolderName || party.contactPerson || party.name);
      
      const defaultAmt = party.currentDue > 0 ? party.currentDue : (party.monthlyRent || '');
      setAmount(defaultAmt ? String(defaultAmt) : '');

      if (party.category === 'LANDLORD') {
        const tds = party.monthlyRent ? Math.round(party.monthlyRent * ((party.tdsPercent || 10) / 100)) : 0;
        setTdsDeducted(tds);
        setRemarks(`${party.name} - Monthly building rent payment (with TDS deduction)`);
      } else {
        setTdsDeducted(0);
        setRemarks(`${party.name} - Material purchase / service bill payment`);
      }
    }
  }, [open, party]);

  const handleCalculateTds = (val) => {
    const num = Number(val) || 0;
    if (party?.category === 'LANDLORD') {
      const rate = party.tdsPercent || 10;
      setTdsDeducted(Math.round(num * (rate / 100)));
    }
  };

  const handleProcessPayment = async () => {
    if (!party) return;
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      await alert({
        type: 'warning',
        title: 'Amount Required',
        message: 'Please enter a valid payment amount.'
      });
      return;
    }

    if (payMethod === 'CONNECT_IPS' && !txnReference.trim()) {
      await alert({
        type: 'warning',
        title: 'Txn Reference Required',
        message: 'Please enter the ConnectIPS Transaction ID (Txn ID / UTR No.).'
      });
      return;
    }

    const voucherNo = `PAY-${Date.now().toString().slice(-6)}`;
    const newTxn = {
      id: `TXN-${Date.now()}`,
      refNo: voucherNo,
      voucherNo,
      date: paymentDate,
      partyId: party.id,
      partyName: party.name,
      partyCategory: party.category,
      type: 'OUTFLOW',
      isInflow: false,
      amount: payNum,
      tdsAmount: tdsDeducted,
      netDisbursed: payNum - tdsDeducted,
      paymentMethod: payMethod,
      fromBank,
      toBank: `${toBankName} (A/C: ${toAccountNumber})`,
      toAccountHolder,
      txnReference: txnReference.trim() || 'N/A',
      remarks: remarks.trim() || 'Party Payment',
      monthTarget: party.category === 'LANDLORD' ? monthTarget : null,
      createdAt: new Date().toISOString()
    };

    // Update Party Balance
    const updatedParties = (db.parties || []).map((p) => {
      if (p.id === party.id) {
        const prevPaid = Number(p.totalPaid) || 0;
        const prevDue = Number(p.currentDue) || 0;
        const newDue = Math.max(0, prevDue - payNum);
        return {
          ...p,
          totalPaid: prevPaid + payNum,
          currentDue: newDue,
          bankName: toBankName,
          accountNumber: toAccountNumber,
          accountHolderName: toAccountHolder
        };
      }
      return p;
    });

    // Update Expenses
    const newExpense = {
      id: `EXP-${Date.now()}`,
      voucherNo,
      date: paymentDate,
      category: party.category === 'LANDLORD' ? 'Rent & Facilities' : 'Practical Raw Materials',
      payee: party.name,
      amount: payNum,
      paymentMethod: payMethod === 'CONNECT_IPS' ? 'Bank Transfer' : payMethod,
      accountCode: party.category === 'LANDLORD' ? '5400' : '5300',
      description: `${remarks} [Ref: ${txnReference}]`,
      status: 'Paid',
      recordedBy: 'Admin (ConnectIPS)'
    };

    let nextDb = {
      ...db,
      parties: updatedParties,
      expenses: [newExpense, ...(db.expenses || [])],
      transactions: [newTxn, ...(db.transactions || [])]
    };

    // Post Double Entry Journal Entry
    try {
      const creditAcc = payMethod === 'CASH' ? '1010' : '1020';
      const debitAcc = party.category === 'LANDLORD' ? '5400' : '2010';
      const journalRes = postDoubleEntryJournal(nextDb, {
        entryDate: paymentDate,
        narration: `Payment to Party ${party.name} via ${payMethod} (Voucher: ${voucherNo}, Ref: ${txnReference})`,
        sourceModule: 'PARTY_PAYOUT',
        sourceId: voucherNo,
        lines: [
          { accountCode: debitAcc, debit: payNum, credit: 0, lineNarration: remarks },
          { accountCode: creditAcc, debit: 0, credit: payNum, lineNarration: `Paid via ${payMethod}` }
        ]
      });
      nextDb = journalRes.nextDb;
    } catch (_) {}

    saveDB(nextDb);
    setDb(nextDb);
    setCompletedVoucher(newTxn);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}

    if (onSuccess) onSuccess(newTxn);
  };

  const handleResetAndClose = () => {
    setCompletedVoucher(null);
    setAmount('');
    setTxnReference('');
    onClose();
  };

  if (!party) return null;

  return (
    <Dialog
      open={open}
      onClose={handleResetAndClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3.5,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)',
          border: isMobile ? 'none' : '1px solid rgba(226, 232, 240, 0.8)'
        }
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          px: { xs: 2, sm: 2.5 },
          py: 2,
          background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #F59E0B'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: 'rgba(245, 158, 11, 0.18)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              flexShrink: 0
            }}
          >
            <AccountBalanceIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.15rem' }, color: '#FFFFFF', lineHeight: 1.2 }}>
              {completedVoucher ? 'Payment Completed (Receipt Voucher)' : 'ConnectIPS / Bank Payout Terminal'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#CBD5E1', fontWeight: 500, display: 'block' }}>
              Party: {party.name} ({party.category})
            </Typography>
          </Box>
        </Box>
        <IconButton
          aria-label="Close ConnectIPS payout modal"
          onClick={handleResetAndClose}
          sx={{ color: '#CBD5E1', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: '#F8FAFC', overflowY: 'auto' }}>
        {completedVoucher ? (
          /* =========================================================
             VOUCHER SUCCESS CONFIRMATION SLIP
             ========================================================= */
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: '#ECFDF5',
                color: '#059669',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 0 0 8px rgba(5, 150, 105, 0.15)'
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 38 }} />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', mb: 0.5 }}>
              Payment Processed Successfully!
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
              Voucher No: <strong>{completedVoucher.voucherNo}</strong> • Date: {completedVoucher.date}
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                textAlign: 'left',
                mb: 2.5
              }}
            >
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Beneficiary Party</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2C59' }}>{party.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Payment Amount</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 900, color: '#059669' }}>
                    Rs. {completedVoucher.amount.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Method &amp; Account</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {completedVoucher.paymentMethod} • {completedVoucher.toBank}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>ConnectIPS Txn ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#1E3A8A' }}>
                    {completedVoucher.txnReference}
                  </Typography>
                </Grid>
                {completedVoucher.tdsAmount > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700 }}>
                      * TDS Deducted: Rs. {completedVoucher.tdsAmount.toLocaleString()} (Net Disbursed: Rs. {completedVoucher.netDisbursed.toLocaleString()})
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
                sx={{ borderRadius: 2, fontWeight: 800, py: 1, textTransform: 'none' }}
              >
                Print Voucher
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
                component="a"
                href={getWhatsAppUrl(
                  party.phone,
                  `Dear ${party.name},\n\nPayment of Rs. ${completedVoucher.amount.toLocaleString()} has been processed via ConnectIPS from Prabidhik School, Jorpati (Global Era Multi Service Pvt. Ltd.).\n\nVoucher No: ${completedVoucher.voucherNo}\nConnectIPS Ref ID: ${completedVoucher.txnReference}\nDate: ${completedVoucher.date}\nRemarks: ${completedVoucher.remarks}\n\nThank you!`
                )}
                target="_blank"
                sx={{ borderRadius: 2, fontWeight: 900, py: 1, textTransform: 'none', bgcolor: '#25D366' }}
              >
                Send Slip via WhatsApp
              </Button>
            </Stack>
          </Box>
        ) : (
          /* =========================================================
             PAYMENT INPUT FORM
             ========================================================= */
          <Box>
            {/* Section 1: Beneficiary & Liability Summary */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                mb: 2,
                borderRadius: 2,
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0'
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  mb: 1.2
                }}
              >
                Beneficiary &amp; Liability Summary
              </Typography>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} sm={7}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                    Saved Beneficiary Bank Details
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2C59' }}>
                    {toBankName} • A/C: {toAccountNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    Account Holder: {toAccountHolder}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={5} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                    Current Payable Liability
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: party.currentDue > 0 ? '#DC2626' : '#059669', lineHeight: 1.2 }}>
                    Rs. {(party.currentDue || 0).toLocaleString()}
                  </Typography>
                  {party.monthlyRent && (
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                      Monthly Rent: Rs. {party.monthlyRent.toLocaleString()}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Section 2: Payment & Banking Details */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                mb: 2,
                borderRadius: 2,
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0'
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  mb: 1.5
                }}
              >
                Payment &amp; Banking Details
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Payment Method"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                  >
                    <MenuItem value="CONNECT_IPS">ConnectIPS (Immediate)</MenuItem>
                    <MenuItem value="BANK_TRANSFER">Bank Account Transfer</MenuItem>
                    <MenuItem value="ACCOUNT_DEPOSIT">Direct Bank Deposit</MenuItem>
                    <MenuItem value="ESEWA">eSewa / Khalti</MenuItem>
                    <MenuItem value="CASH">Counter Cash</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="From Institution Account"
                    value={fromBank}
                    onChange={(e) => setFromBank(e.target.value)}
                  >
                    <MenuItem value="Nabil Bank (A/C: 0123456789)">Nabil Bank Ltd. (Main Operation)</MenuItem>
                    <MenuItem value="Global IME Bank (A/C: 0987654321)">Global IME Bank Ltd.</MenuItem>
                    <MenuItem value="Counter Cash Balance (Counter Cash)">Counter Cash Balance (Cash Box)</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label="Payment Amount (Rs.)"
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      handleCalculateTds(e.target.value);
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs.</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Payment Date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required={payMethod === 'CONNECT_IPS'}
                    size="small"
                    label="ConnectIPS Trx ID / UTR / Voucher Ref No."
                    placeholder="e.g. CIP-90812894129"
                    value={txnReference}
                    onChange={(e) => setTxnReference(e.target.value)}
                    helperText="Enter the ConnectIPS transaction ID for audit and verification."
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Section 3: Tax, Rent & Remarks */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0'
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  mb: 1.5
                }}
              >
                {party.category === 'LANDLORD' ? 'Rent, TDS & Remarks' : 'Narration & Remarks'}
              </Typography>

              <Grid container spacing={2}>
                {party.category === 'LANDLORD' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Target Rent Month"
                        value={monthTarget}
                        onChange={(e) => setMonthTarget(e.target.value)}
                      >
                        {['Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra', 'Baisakh', 'Jestha', 'Ashad'].map((m) => (
                          <MenuItem key={m} value={m}>{m} Rent</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="TDS Deduction Amount (10%)"
                        type="number"
                        value={tdsDeducted}
                        onChange={(e) => setTdsDeducted(Number(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">Rs.</InputAdornment>
                        }}
                        helperText={`Net Payable to Landlord: Rs. ${(Math.max(0, (Number(amount) || 0) - tdsDeducted)).toLocaleString()}`}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Building rent for Baisakh paid via ConnectIPS"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          justifyContent: completedVoucher ? 'flex-end' : 'space-between'
        }}
      >
        {completedVoucher ? (
          <Button
            variant="contained"
            onClick={handleResetAndClose}
            sx={{
              background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
              borderRadius: 2,
              px: 3,
              fontWeight: 800,
              textTransform: 'none'
            }}
          >
            Close
          </Button>
        ) : (
          <>
            <Button onClick={handleResetAndClose} sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleProcessPayment}
              startIcon={<PaymentIcon />}
              sx={{
                background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(15, 44, 89, 0.3)'
              }}
            >
              Confirm Payout
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
