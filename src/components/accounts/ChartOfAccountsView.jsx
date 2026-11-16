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
  TextField,
  MenuItem,
  Stack,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

export default function ChartOfAccountsView({ db }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const coa = db.chartOfAccounts || [];

  const filtered = coa.filter((a) => {
    const matchesSearch =
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case 'ASSET': return { bg: '#DBEAFE', color: '#1E40AF' };
      case 'LIABILITY': return { bg: '#FEE2E2', color: '#991B1B' };
      case 'EQUITY': return { bg: '#E0E7FF', color: '#3730A3' };
      case 'REVENUE': return { bg: '#DCFCE7', color: '#166534' };
      case 'EXPENSE': return { bg: '#FEF3C7', color: '#92400E' };
      default: return { bg: '#F1F5F9', color: '#334155' };
    }
  };

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
                <AccountTreeIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Standard Chart of Accounts (COA)
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Assets, Liabilities, Equity, Revenue &amp; Expense accounts per Nepal Accounting Standards
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Chip
              label={`${filtered.length} Accounts`}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.74rem',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Compact Filter & Search Bar */}
      <Card elevation={0} sx={{ p: 1.25, mb: 1.75, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by Code or Account Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94A3B8', mr: 1, fontSize: 18 }} /> }}
            sx={{ minWidth: { xs: '100%', sm: 320 } }}
          />
          <TextField
            select
            size="small"
            label="Account Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 180 } }}
          >
            <MenuItem value="ALL">All Types</MenuItem>
            <MenuItem value="ASSET">ASSET</MenuItem>
            <MenuItem value="LIABILITY">LIABILITY</MenuItem>
            <MenuItem value="EQUITY">EQUITY</MenuItem>
            <MenuItem value="REVENUE">REVENUE</MenuItem>
            <MenuItem value="EXPENSE">EXPENSE</MenuItem>
          </TextField>
        </Stack>
      </Card>

      <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
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
                <TableCell sx={{ fontWeight: 800, width: 120, color: '#FFFFFF !important' }}>Account Code</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#FFFFFF !important' }}>Account Title</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 150, color: '#FFFFFF !important' }}>Account Type</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 140, color: '#FFFFFF !important' }}>Normal Balance</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right', width: 170, color: '#FFFFFF !important' }}>Current Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((acc) => {
                const colors = getTypeColor(acc.type);
                return (
                  <TableRow key={acc.code} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#1E40AF', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                      {acc.code}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1E293B' }}>
                      {acc.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={acc.type}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor: colors.bg,
                          color: colors.color,
                          fontSize: '0.72rem'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                      {acc.normalBalance}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#0F172A', fontSize: '0.95rem' }}>
                      Rs. {(Number(acc.balance) || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
