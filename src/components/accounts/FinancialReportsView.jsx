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
  Divider,
  Paper,
  Grid,
  Button
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
    <Box>
      {/* Report Header & Subtabs */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              📈 आधिकारिक वित्तीय विवरणहरू (Financial Statements & Audit Engine)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              नेपाल लेखा मापदण्ड अनुसार स्वचालित सन्तुलन परीक्षण, नाफा-नोक्सान हिसाब तथा वासलात
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
          >
            प्रिन्ट / PDF (Print Statement)
          </Button>
        </Box>

        <Tabs
          value={reportTab}
          onChange={(e, val) => setReportTab(val)}
          sx={{
            borderTop: '1px solid #E2E8F0',
            pt: 1,
            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none' }
          }}
        >
          <Tab icon={<BalanceIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="सन्तुलन परीक्षण (Trial Balance)" />
          <Tab icon={<TrendingUpIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="नाफा-नोक्सान हिसाब (Profit & Loss)" />
          <Tab icon={<AccountBalanceIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="वासलात (Balance Sheet)" />
        </Tabs>
      </Card>

      {/* TAB 0: TRIAL BALANCE */}
      {reportTab === 0 && (
        <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
              ⚖️ गणितीय सन्तुलन परीक्षण (Mathematical Trial Balance as of {tb.asOfDate})
            </Typography>
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '1rem !important' }} />}
              label={tb.isBalanced ? '✓ पूर्ण सन्तुलित (Balanced: Dr == Cr)' : '⚠️ असन्तुलित'}
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
              <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, width: 140 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Account Title (खाताको नाम)</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 140 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right', width: 180 }}>Debit (Dr)</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right', width: 180 }}>Credit (Cr)</TableCell>
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
                    कुल योग (Grand Total)
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
                1. कुल सञ्चालन आम्दानी (Operating Revenue)
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
                    <TableCell sx={{ fontWeight: 900, color: '#166534' }}>कुल आम्दानी (Total Revenue)</TableCell>
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
                2. सञ्चालन तथा पारिश्रमिक खर्च (Operating Expenses)
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
                    <TableCell sx={{ fontWeight: 900, color: '#DC2626' }}>कुल खर्च (Total Expenses)</TableCell>
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
                  संस्थाको खुद सञ्चालन नाफा / घाटा (Net Profit / Operating Margin)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: netProfit >= 0 ? '#059669' : '#DC2626' }}>
                  Rs. {netProfit.toLocaleString()}
                </Typography>
              </Box>
              <Chip
                label={`नाफा मार्जिन: ${profitMargin}%`}
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
                सम्पत्तिहरू (Assets)
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
                    <TableCell sx={{ fontWeight: 900, color: '#1E40AF' }}>कुल सम्पत्ति (Total Assets)</TableCell>
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
                दायित्व तथा पुँजी (Liabilities & Equity)
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#64748B' }}>क. दायित्वहरू (Liabilities)</TableCell>
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
                    <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#64748B' }}>ख. स्वपुँजी (Owner's Equity)</TableCell>
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
                    <TableCell sx={{ fontWeight: 700, pl: 3, color: '#166534' }}>यस अवधिको खुद नाफा (Current Period Net Margin)</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: '#166534' }}>
                      Rs. {netProfit.toLocaleString()}
                    </TableCell>
                  </TableRow>

                  <TableRow sx={{ bgcolor: '#FEF3C7' }}>
                    <TableCell sx={{ fontWeight: 900, color: '#B45309' }}>कुल दायित्व तथा पुँजी (Liabilities + Equity)</TableCell>
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
