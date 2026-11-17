import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

/**
 * Standardized module header + search + horizontally scrollable mobile filter bar + optional mobile FAB.
 */
export default function PageToolbar({
  title,
  subtitle,
  icon,
  primaryAction,
  secondaryActions,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  extraRight,
  showMobileFab = false,
  sx
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          borderRadius: 2.5,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          ...sx
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            {icon && (
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  bgcolor: '#EFF6FF',
                  color: '#0F2C59',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {icon}
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.2 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'flex-start', sm: 'flex-end' }
            }}
          >
            {secondaryActions}
            {primaryAction && (!isMobile || !showMobileFab) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={primaryAction.icon || <AddIcon />}
                onClick={primaryAction.onClick}
                size={isMobile ? 'medium' : 'small'}
                sx={{ fontWeight: 800, px: 1.75, py: 0.85 }}
              >
                {primaryAction.label}
              </Button>
            )}
          </Box>
        </Box>

        {(onSearchChange || filters || extraRight) && (
          <Box
            sx={{
              mt: 1.5,
              pt: 1.5,
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
              gap: 1.25
            }}
          >
            {onSearchChange && (
              <TextField
                size="small"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                sx={{ minWidth: { xs: '100%', md: 260 }, maxWidth: { md: 340 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: '#64748B' }} />
                    </InputAdornment>
                  )
                }}
              />
            )}

            {filters && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  overflowX: 'auto',
                  pb: { xs: 0.5, md: 0 },
                  '&::-webkit-scrollbar': { display: 'none' },
                  scrollbarWidth: 'none',
                  flex: 1
                }}
              >
                {filters}
              </Box>
            )}

            {extraRight && <Box sx={{ flexShrink: 0 }}>{extraRight}</Box>}
          </Box>
        )}
      </Paper>

      {isMobile && showMobileFab && primaryAction && (
        <Fab
          color="primary"
          aria-label={primaryAction.label}
          onClick={primaryAction.onClick}
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 'calc(74px + env(safe-area-inset-bottom))',
            zIndex: 1050
          }}
        >
          {primaryAction.icon || <AddIcon />}
        </Fab>
      )}
    </>
  );
}
