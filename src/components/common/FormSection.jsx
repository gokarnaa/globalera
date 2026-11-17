import React from 'react';
import { Paper, Box, Typography, Grid } from '@mui/material';

/**
 * Numbered white section card inside form dialogs for clean visual grouping.
 */
export default function FormSection({
  step,
  title,
  subtitle,
  accentColor = '#0F2C59',
  headerRight,
  children,
  spacing = 1.75,
  sx
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2.25 },
        borderRadius: 2.5,
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
        ...sx
      }}
    >
      {(title || step) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mb: 1.75,
            pb: 1.1,
            borderBottom: '1px solid #F1F5F9'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, minWidth: 0 }}>
            {step !== undefined && step !== null && (
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: accentColor,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  flexShrink: 0
                }}
              >
                {step}
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.25 }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          {headerRight && <Box sx={{ flexShrink: 0 }}>{headerRight}</Box>}
        </Box>
      )}
      <Grid container spacing={spacing}>
        {children}
      </Grid>
    </Paper>
  );
}
