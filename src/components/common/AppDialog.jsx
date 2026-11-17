import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Slide,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const SlideUp = React.forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Unified enterprise Dialog:
 * - Desktop: centered Navy/Gold executive modal with crisp #F8FAFC body & sticky footer.
 * - Mobile: native full-screen form OR rounded bottom-sheet with safe-area footer.
 */
export default function AppDialog({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'sm',
  fullScreenOnMobile = true,
  bottomSheetOnMobile = false,
  headerExtra,
  actions,
  children,
  contentSx,
  headerBg = '#0F2C59'
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const useFullScreen = isMobile && fullScreenOnMobile && !bottomSheetOnMobile;
  const useBottomSheet = isMobile && bottomSheetOnMobile;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={useFullScreen}
      TransitionComponent={isMobile ? SlideUp : undefined}
      PaperProps={{
        sx: useBottomSheet
          ? {
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              m: 0,
              width: '100% !important',
              maxWidth: '100% !important',
              maxHeight: '90dvh',
              borderRadius: '20px 20px 0 0',
              borderBottom: 'none'
            }
          : undefined
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: headerBg,
          color: '#FFFFFF',
          px: { xs: 2, sm: 2.5 },
          py: { xs: 1.5, sm: 1.75 },
          borderBottom: '2px solid #F59E0B',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75
        }}
      >
        {useBottomSheet && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.25 }}>
            <Box
              sx={{
                width: 36,
                height: 4,
                borderRadius: 99,
                bgcolor: 'rgba(255,255,255,0.35)'
              }}
            />
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            {useFullScreen ? (
              <IconButton
                onClick={onClose}
                aria-label="Back"
                size="small"
                sx={{
                  color: '#FFFFFF',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' }
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            ) : (
              icon && (
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {icon}
                </Box>
              )
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  fontSize: { xs: '0.95rem', sm: '1.02rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.78)',
                    display: 'block',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {headerExtra}
            {!useFullScreen && (
              <IconButton
                onClick={onClose}
                aria-label="Close dialog"
                size="small"
                sx={{
                  color: 'rgba(255,255,255,0.85)',
                  bgcolor: 'rgba(255,255,255,0.10)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.22)', color: '#FFFFFF' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          bgcolor: '#F8FAFC',
          p: { xs: 1.75, sm: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          ...contentSx
        }}
      >
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            px: { xs: 2, sm: 2.5 },
            py: 1.5,
            pb: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 1.5,
            justifyContent: 'flex-end',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
