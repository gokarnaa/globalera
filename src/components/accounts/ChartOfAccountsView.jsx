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
  Divider,
  Paper
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
    <Box>
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              🏛️ Standard Chart of Accounts
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Assets, Liabilities, Equity, Revenue, and Expense accounts classified according to Nepal Accounting Standards
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by Code or Account Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94A3B8', mr: 1, fontSize: '1.2rem' }} /> }}
            sx={{ minWidth: 320 }}
          />
          <TextField
            select
            size="small"
            label="Account Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 180 }}
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

      <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 120 }}>Account Code</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Account Title</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 160 }}>Account Type</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 140 }}>Normal Balance</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right', width: 180 }}>Current Balance</TableCell>
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
