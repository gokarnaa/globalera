import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';

/**
 * ResponsiveDataView:
 * - On Mobile (< md): defaults to clean native Card View (`renderCard(row, index)`).
 * - On Desktop (>= md): renders the crisp Table (`renderTable()`).
 * - Includes built-in skeleton loading and empty state.
 */
export default function ResponsiveDataView({
  rows = [],
  renderTable,
  renderCard,
  keyExtractor = (row, idx) => row?.id ?? idx,
  loading = false,
  emptyIcon,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your search or filter criteria.',
  emptyAction,
  showViewToggle = true,
  defaultMobileMode = 'card',
  cardSpacing = 1.25
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMode, setMobileMode] = useState(defaultMobileMode);

  if (loading) {
    return (
      <Stack spacing={1.25}>
        {[1, 2, 3, 4].map((i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0' }}
          >
            <Skeleton variant="text" width="45%" height={22} />
            <Skeleton variant="text" width="75%" height={18} sx={{ mt: 0.5 }} />
            <Skeleton variant="rectangular" height={34} sx={{ mt: 1.25, borderRadius: 1.5 }} />
          </Paper>
        ))}
      </Stack>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3.5, sm: 5 },
          textAlign: 'center',
          borderRadius: 3,
          border: '1px dashed #CBD5E1',
          bgcolor: '#FFFFFF'
        }}
      >
        {emptyIcon && (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: '#F1F5F9',
              color: '#64748B',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5
            }}
          >
            {emptyIcon}
          </Box>
        )}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
          {emptyTitle}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, maxWidth: 380, mx: 'auto' }}>
          {emptySubtitle}
        </Typography>
        {emptyAction && <Box sx={{ mt: 2 }}>{emptyAction}</Box>}
      </Paper>
    );
  }

  const shouldRenderCards = isMobile && renderCard && mobileMode === 'card';

  return (
    <Box>
      {isMobile && renderCard && renderTable && showViewToggle && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
            {rows.length} {rows.length === 1 ? 'record' : 'records'}
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mobileMode}
            onChange={(_, val) => val && setMobileMode(val)}
            aria-label="Switch mobile view mode"
          >
            <ToggleButton value="card" aria-label="Card View" sx={{ py: 0.35, px: 1 }}>
              <ViewAgendaOutlinedIcon sx={{ fontSize: 15, mr: 0.5 }} />
              Cards
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table View" sx={{ py: 0.35, px: 1 }}>
              <TableRowsOutlinedIcon sx={{ fontSize: 15, mr: 0.5 }} />
              Table
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {shouldRenderCards ? (
        <Stack spacing={cardSpacing}>
          {rows.map((row, idx) => (
            <React.Fragment key={keyExtractor(row, idx)}>
              {renderCard(row, idx)}
            </React.Fragment>
          ))}
        </Stack>
      ) : (
        renderTable()
      )}
    </Box>
  );
}
