import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Fade,
  Slide
} from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

const DialogContext = createContext(null);

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    isAlertOnly: false,
    title: '',
    message: '',
    detail: '',
    confirmText: 'निश्चित गर्नुहोस् (Confirm)',
    cancelText: 'रद्द गर्नुहोस् (Cancel)',
    type: 'warning', // 'logout' | 'danger' | 'warning' | 'info' | 'success'
    confirmColor: '#DC2626'
  });

  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      
      const type = options?.type || 'warning';
      let defaultConfirmColor = '#DC2626';
      if (type === 'logout') defaultConfirmColor = '#EF4444';
      else if (type === 'danger') defaultConfirmColor = '#DC2626';
      else if (type === 'info') defaultConfirmColor = '#2563EB';
      else if (type === 'success') defaultConfirmColor = '#10B981';
      else if (type === 'warning') defaultConfirmColor = '#D97706';

      setDialogState({
        isOpen: true,
        isAlertOnly: false,
        title: options?.title || 'निश्चित गर्नुहोस् (Confirmation)',
        message: options?.message || 'के तपाईं यो कार्य गर्न निश्चित हुनुहुन्छ?',
        detail: options?.detail || '',
        confirmText: options?.confirmText || 'हो, निश्चित गर्नुहोस् (Confirm)',
        cancelText: options?.cancelText || 'रद्द गर्नुहोस् (Cancel)',
        type,
        confirmColor: options?.confirmColor || defaultConfirmColor
      });
    });
  }, []);

  const alert = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      const opts = typeof options === 'string' ? { message: options } : options;
      const type = opts?.type || 'info';
      
      let defaultConfirmColor = '#0F2E5A';
      if (type === 'error' || type === 'danger') defaultConfirmColor = '#DC2626';
      else if (type === 'success') defaultConfirmColor = '#10B981';
      else if (type === 'warning') defaultConfirmColor = '#D97706';

      setDialogState({
        isOpen: true,
        isAlertOnly: true,
        title: opts?.title || (type === 'error' ? 'सुझाव / त्रुटि (Notice)' : 'जानकारी (Notice)'),
        message: opts?.message || '',
        detail: opts?.detail || '',
        confirmText: opts?.confirmText || 'हुन्छ, बुझें (OK)',
        cancelText: '',
        type,
        confirmColor: opts?.confirmColor || defaultConfirmColor
      });
    });
  }, []);

  const handleConfirm = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  // Expose to window for seamless global caller: window.$confirm and window.$alert,
  // and override native window.alert globally so no ugly browser alert ever appears
  useEffect(() => {
    window.$confirm = confirm;
    window.$alert = alert;

    const originalAlert = window.alert;
    window.alert = (msg) => {
      alert({
        title: 'जानकारी तथा सूचना (Notice)',
        message: typeof msg === 'object' ? JSON.stringify(msg) : String(msg),
        type: 'info'
      });
    };

    return () => {
      delete window.$confirm;
      delete window.$alert;
      window.alert = originalAlert;
    };
  }, [confirm, alert]);

  // Determine icon & color scheme based on dialog type
  const getTypeConfig = () => {
    switch (dialogState.type) {
      case 'logout':
        return {
          icon: <LogoutRoundedIcon sx={{ fontSize: 34, color: '#EF4444' }} />,
          bg: '#FEE2E2',
          glow: 'rgba(239, 68, 68, 0.25)',
          border: 'rgba(239, 68, 68, 0.3)'
        };
      case 'danger':
      case 'error':
        return {
          icon: <DeleteForeverRoundedIcon sx={{ fontSize: 34, color: '#DC2626' }} />,
          bg: '#FEE2E2',
          glow: 'rgba(220, 38, 38, 0.25)',
          border: 'rgba(220, 38, 38, 0.3)'
        };
      case 'success':
        return {
          icon: <CheckCircleRoundedIcon sx={{ fontSize: 34, color: '#059669' }} />,
          bg: '#ECFDF5',
          glow: 'rgba(5, 150, 105, 0.25)',
          border: 'rgba(5, 150, 105, 0.3)'
        };
      case 'info':
        return {
          icon: <InfoRoundedIcon sx={{ fontSize: 34, color: '#2563EB' }} />,
          bg: '#EFF6FF',
          glow: 'rgba(37, 99, 235, 0.25)',
          border: 'rgba(37, 99, 235, 0.3)'
        };
      case 'warning':
      default:
        return {
          icon: <WarningAmberRoundedIcon sx={{ fontSize: 34, color: '#D97706' }} />,
          bg: '#FEF3C7',
          glow: 'rgba(217, 119, 6, 0.25)',
          border: 'rgba(217, 119, 6, 0.3)'
        };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}

      <Dialog
        open={dialogState.isOpen}
        onClose={handleCancel}
        TransitionComponent={Transition}
        keepMounted={false}
        maxWidth="xs"
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            bgcolor: 'rgba(15, 23, 42, 0.72)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 4.5,
            p: 1.5,
            bgcolor: '#FFFFFF',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 1px 1px rgba(255, 255, 255, 0.8)',
            overflow: 'hidden',
            position: 'relative'
          }
        }}
      >
        {/* Subtle Top Accent Bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background:
              dialogState.type === 'logout'
                ? 'linear-gradient(90deg, #EF4444 0%, #F59E0B 100%)'
                : dialogState.type === 'danger' || dialogState.type === 'error'
                ? 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)'
                : dialogState.type === 'success'
                ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #0F2E5A 0%, #F59E0B 100%)'
          }}
        />

        {/* Close Icon (Top Right) */}
        <IconButton
          size="small"
          onClick={handleCancel}
          sx={{
            position: 'absolute',
            top: 14,
            right: 14,
            color: '#94A3B8',
            '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' }
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>

        <DialogContent sx={{ pt: 3.5, pb: 2, px: 2.5, textAlign: 'center' }}>
          {/* Animated Glowing Icon Badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: typeConfig.bg,
              border: `2px solid ${typeConfig.border}`,
              boxShadow: `0 0 0 8px ${typeConfig.glow}`,
              mb: 2.2
            }}
          >
            {typeConfig.icon}
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: '#0F172A',
              fontSize: '1.2rem',
              letterSpacing: '-0.01em',
              mb: 1
            }}
          >
            {dialogState.title}
          </Typography>

          {/* Message */}
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              color: '#334155',
              fontSize: '0.98rem',
              lineHeight: 1.5,
              mb: dialogState.detail ? 1 : 0
            }}
          >
            {dialogState.message}
          </Typography>

          {/* Subtitle / Detail info */}
          {dialogState.detail && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 600,
                color: '#64748B',
                fontSize: '0.82rem',
                lineHeight: 1.45,
                bgcolor: '#F8FAFC',
                p: 1.2,
                borderRadius: 2,
                border: '1px dashed #CBD5E1',
                mt: 1.5
              }}
            >
              {dialogState.detail}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1, gap: 1.5 }}>
          {!dialogState.isAlertOnly && (
            <Button
              variant="outlined"
              fullWidth
              onClick={handleCancel}
              sx={{
                borderRadius: 2.8,
                py: 1.1,
                color: '#475569',
                borderColor: '#CBD5E1',
                fontWeight: 800,
                fontSize: '0.9rem',
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                '&:hover': {
                  bgcolor: '#F1F5F9',
                  borderColor: '#94A3B8'
                }
              }}
            >
              {dialogState.cancelText}
            </Button>
          )}

          <Button
            variant="contained"
            fullWidth
            onClick={handleConfirm}
            autoFocus
            sx={{
              borderRadius: 2.8,
              py: 1.1,
              bgcolor: dialogState.confirmColor,
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.92rem',
              textTransform: 'none',
              boxShadow: `0 4px 14px ${
                dialogState.type === 'logout' || dialogState.type === 'danger'
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(15, 46, 90, 0.3)'
              }`,
              '&:hover': {
                bgcolor: dialogState.confirmColor,
                filter: 'brightness(0.92)',
                boxShadow: `0 6px 18px ${
                  dialogState.type === 'logout' || dialogState.type === 'danger'
                    ? 'rgba(239, 68, 68, 0.5)'
                    : 'rgba(15, 46, 90, 0.4)'
                }`
              }
            }}
          >
            {dialogState.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
