import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Paper,
  Grid,
  Button,
  Stack
} from '@mui/material';
import BalanceIcon from '@mui/icons-material/Balance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';

import { getTrialBalanceReport } from '../../services/storage';

export default function FinancialReportsView({ db }) {
  const [reportTab, setReportTab] = useState(0); // 0: Trial Balance, 1: Profit & Loss, 2: Balance Sheet

  const coa = db.chartOfAccounts || [];
  const tb = getTrialBalanceReport(db);

  // Compute P&L
  const revenueAccounts = coa.filter((a) => a.type === 'REVENUE');
  const expenseAccounts = coa.filter((a) => a.type === 'EXPENSE');
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Compute Balance Sheet
  const assetAccounts = coa.filter((a) => a.type === 'ASSET');
  const liabilityAccounts = coa.filter((a) => a.type === 'LIABILITY');
  const equityAccounts = coa.filter((a) => a.type === 'EQUITY');

  const totalAssets = assetAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const totalEquity = equityAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) + netProfit;
  const isBalanceSheetBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.2 } }}>
      {/* Slim 1-Row Executive Header Bar */}
      <Card
        elevation={0}
        sx={{
          py: { xs: 1.25, sm: 1.5 },
          px: { xs: 1.75, sm: 2.25 },
          mb: 1.75,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, #0f2e5a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(15, 46, 90, 0.16)'
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.8,
                  bgcolor: 'rgba(245, 158, 11, 0.16)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <BalanceIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Financial Statements &amp; Audit Engine
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Automated Trial Balance, Profit &amp; Loss Statement &amp; Balance Sheet per NAS
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PrintIcon sx={{ fontSize: '15px !important' }} />}
                onClick={() => window.print()}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  px: 1.4,
                  py: 0.65,
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', borderColor: '#ffffff' }
                }}
              >
                Print Statement / PDF
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Compact Subtabs Bar */}
      <Card elevation={0} sx={{ p: 0.75, mb: 1.75, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Tabs
          value={reportTab}
          onChange={(e, val) => setReportTab(val)}
          sx={{
            minHeight: 38,
            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', minHeight: 38, py: 0.5, fontSize: '0.78rem' }
          }}
        >
          <Tab icon={<BalanceIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Trial Balance" />
          <Tab icon={<TrendingUpIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Profit & Loss" />
          <Tab icon={<AccountBalanceIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="Balance Sheet" />
        </Tabs>
      </Card>

      {/* TAB 0: TRIAL BALANCE */}
      {reportTab === 0 && (
        <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
          <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
              ⚖️ Mathematical Trial Balance as of {tb.asOfDate}
            </Typography>
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '1rem !important' }} />}
              label={tb.isBalanced ? '✓ Balanced (Dr == Cr)' : '⚠️ Imbalanced'}
              size="small"
              sx={{
                fontWeight: 800,
                bgcolor: tb.isBalanced ? '#DCFCE7' : '#FEE2E2',
                color: tb.isBalanced ? '#166534' : '#DC2626'
              }}
            />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead
                sx={{
                  bgcolor: '#0F2E5A',
                  '& .MuiTableCell-head': {
                    bgcolor: '#0F2E5A !important',
                    color: '#FFFFFF !important',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    py: 1,
                    px: 1.25,
                    borderBottom: '2px solid #F59E0B',
                    whiteSpace: 'nowrap'
                  }
                }}
              >
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, width: 130, color: '#FFFFFF !important' }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#FFFFFF !important' }}>Account Title</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 130, color: '#FFFFFF !important' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right', width: 160, color: '#FFFFFF !important' }}>Debit (Dr)</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right', width: 160, color: '#FFFFFF !important' }}>Credit (Cr)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tb.lines.map((l) => (
                  <TableRow key={l.code} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#1E40AF', fontFamily: 'monospace' }}>{l.code}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{l.name}</TableCell>
                    <TableCell>
                      <Chip label={l.type} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: l.debit > 0 ? '#0F172A' : '#94A3B8' }}>
                      {l.debit > 0 ? `Rs. ${l.debit.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: l.credit > 0 ? '#0F172A' : '#94A3B8' }}>
                      {l.credit > 0 ? `Rs. ${l.credit.toLocaleString()}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: '#E2E8F0' }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 900, fontSize: '0.95rem' }}>
                    Grand Total
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#166534', fontSize: '0.95rem' }}>
                    Rs. {tb.totalDebit.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#166534', fontSize: '0.95rem' }}>
                    Rs. {tb.totalCredit.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 1: PROFIT & LOSS */}
      {reportTab === 1 && (
        <Grid container spacing={3}>
          {/* Revenue */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#166534', mb: 2 }}>
                1. Operating Revenue
              </Typography>
              <Table size="small">
                <TableBody>
                  {revenueAccounts.map((a) => (
                    <TableRow key={a.code}>
                      <TableCell sx={{ fontWeight: 700 }}>{a.name}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>
                        Rs. {(Number(a.balance) || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#DCFCE7' }}>
                    <TableCell sx={{ fontWeight: 900, color: '#166534' }}>Total Revenue</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#166534' }}>
                      Rs. {totalRevenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </Grid>

          {/* Expenses */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#DC2626', mb: 2 }}>
                2. Operating Expenses
              </Typography>
              <Table size="small">
                <TableBody>
                  {expenseAccounts.map((a) => (
                    <TableRow key={a.code}>
                      <TableCell sx={{ fontWeight: 700 }}>{a.name}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>
                        Rs. {(Number(a.balance) || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#FEE2E2' }}>
                    <TableCell sx={{ fontWeight: 900, color: '#DC2626' }}>Total Expenses</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#DC2626' }}>
                      Rs. {totalExpenses.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </Grid>

          {/* Net Margin Card */}
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: netProfit >= 0 ? '#ECFDF5' : '#FEF2F2',
                border: netProfit >= 0 ? '1px solid #A7F3D0' : '1px solid #FECACA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Net Profit / Operating Margin
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: netProfit >= 0 ? '#059669' : '#DC2626' }}>
                  Rs. {netProfit.toLocaleString()}
                </Typography>
              </Box>
              <Chip
                label={`Profit Margin: ${profitMargin}%`}
                size="medium"
                sx={{
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  bgcolor: netProfit >= 0 ? '#10B981' : '#EF4444',
                  color: '#FFFFFF'
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 2: BALANCE SHEET */}
      {reportTab === 2 && (
        <Grid container spacing={3}>
          {/* Assets */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E40AF', mb: 2 }}>
                Assets
              </Typography>
              <Table size="small">
                <TableBody>
                  {assetAccounts.map((a) => (
                    <TableRow key={a.code}>
                      <TableCell sx={{ fontWeight: 700 }}>{a.name}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>
                        Rs. {(Number(a.balance) || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#DBEAFE' }}>
                    <TableCell sx={{ fontWeight: 900, color: '#1E40AF' }}>Total Assets</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#1E40AF' }}>
                      Rs. {totalAssets.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </Grid>

          {/* Liabilities & Equity */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#B45309', mb: 2 }}>
                Liabilities & Equity
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#64748B' }}>A. Liabilities</TableCell>
                  </TableRow>
                  {liabilityAccounts.map((a) => (
                    <TableRow key={a.code}>
                      <TableCell sx={{ fontWeight: 700, pl: 3 }}>{a.name}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>
                        Rs. {(Number(a.balance) || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#64748B' }}>B. Owner's Equity</TableCell>
                  </TableRow>
                  {equityAccounts.map((a) => (
                    <TableRow key={a.code}>
                      <TableCell sx={{ fontWeight: 700, pl: 3 }}>{a.name}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>
                        Rs. {(Number(a.balance) || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, pl: 3, color: '#166534' }}>Current Period Net Margin</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: '#166534' }}>
                      Rs. {netProfit.toLocaleString()}
                    </TableCell>
                  </TableRow>

                  <TableRow sx={{ bgcolor: '#FEF3C7' }}>
                    <TableCell sx={{ fontWeight: 900, color: '#B45309' }}>Total Liabilities + Equity</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#B45309' }}>
                      Rs. {(totalLiabilities + totalEquity).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
