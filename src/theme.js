import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F2C59',      // Deep Executive Navy
      dark: '#071A36',
      light: '#E8F1FC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2563EB',      // Enterprise Royal Blue
      dark: '#1D4ED8',
      light: '#EFF6FF',
    },
    accent: {
      main: '#0D9488',      // TVET Teal
      light: '#F0FDFA',
    },
    background: {
      default: '#F8FAFC',   // Crisp Modern Slate 50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',   // Slate 900 (High contrast)
      secondary: '#475569', // Slate 600
    },
    success: {
      main: '#059669',      // Emerald 600
      dark: '#047857',
      light: '#ECFDF5',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',      // Red 600
      dark: '#B91C1C',
      light: '#FEF2F2',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#D97706',      // Amber 600
      dark: '#B45309',
      light: '#FFFBEB',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#0284C7',      // Sky 600
      light: '#F0F9FF',
    },
    divider: '#E2E8F0',     // Slate 200
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans Devanagari", system-ui, -apple-system, sans-serif',
    h4: {
      fontWeight: 800,
      fontSize: 'clamp(1.15rem, 1.7vw, 1.4rem)',
      lineHeight: 1.25,
      textWrap: 'balance',
    },
    h5: {
      fontWeight: 800,
      fontSize: 'clamp(1.02rem, 1.4vw, 1.2rem)',
      lineHeight: 1.25,
      textWrap: 'balance',
    },
    h6: {
      fontWeight: 700,
      fontSize: 'clamp(0.92rem, 1.15vw, 1.04rem)',
      lineHeight: 1.3,
      textWrap: 'balance',
    },
    subtitle1: {
      fontWeight: 700,
      fontSize: '0.88rem',
      lineHeight: 1.35,
    },
    subtitle2: {
      fontWeight: 700,
      fontSize: '0.8125rem',
      lineHeight: 1.35,
    },
    body1: {
      color: '#0F172A',
      fontSize: '0.875rem',
      lineHeight: 1.5,
      textWrap: 'pretty',
    },
    body2: {
      color: '#475569',
      fontSize: '0.8125rem',
      lineHeight: 1.45,
      textWrap: 'pretty',
    },
    caption: {
      fontSize: '0.72rem',
      lineHeight: 1.35,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      fontSize: '0.79rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: '2px solid #2563EB',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.8125rem',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
          transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#CBD5E1',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#64748B',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(15, 44, 89, 0.12)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0F2C59',
              borderWidth: '1.5px',
            },
          },
        },
        input: {
          padding: '8px 12px',
        },
        inputSizeSmall: {
          padding: '7px 11px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#475569',
          '&.Mui-focused': {
            color: '#0F2C59',
            fontWeight: 700,
          },
          '& .MuiFormLabel-asterisk': {
            color: '#DC2626',
            fontWeight: 800,
          },
        },
        outlined: {
          lineHeight: '1.2em',
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.72rem',
          color: '#64748B',
          marginTop: 4,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          overflow: 'hidden',
          '@media (max-width:599.95px)': {
            margin: '8px',
            width: 'calc(100% - 16px)',
            maxWidth: 'calc(100% - 16px) !important',
            maxHeight: '92dvh',
            '&.MuiDialog-paperFullScreen': {
              margin: 0,
              width: '100%',
              maxWidth: '100% !important',
              maxHeight: '100dvh',
              borderRadius: 0,
            },
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F2C59',
          color: '#FFFFFF',
          padding: '14px 20px',
          borderBottom: '2px solid #F59E0B',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 #F1F5F9',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          padding: '12px 20px',
          gap: 10,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          overflowX: 'clip',
          overflowY: 'auto',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          backgroundColor: '#F4F7FB',
          color: '#0F172A',
          overflowX: 'clip',
          fontVariantNumeric: 'tabular-nums',
          scrollbarColor: '#CBD5E1 #F1F5F9',
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: '#F1F5F9',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E1',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#94A3B8',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          boxShadow: 'none',
          padding: '5px 12px',
          fontSize: '0.78rem',
          lineHeight: 1.35,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          transition: 'background-color 0.15s ease-out, border-color 0.15s ease-out, transform 0.15s ease-out',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(15, 44, 89, 0.1)',
          },
          '&:active': {
            transform: 'scale(0.99)',
          },
        },
        sizeSmall: {
          padding: '3.5px 9px',
          fontSize: '0.73rem',
          borderRadius: 6,
        },
        sizeLarge: {
          padding: '6.5px 14px',
          fontSize: '0.81rem',
          borderRadius: 8,
        },
        containedPrimary: {
          backgroundColor: '#0F2C59',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#0A1F40',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 2px 8px rgba(15, 23, 42, 0.02)',
          border: '1px solid #E2E8F0',
          transition: 'border-color 0.15s ease-out, box-shadow 0.15s ease-out',
          '&:hover': {
            boxShadow: '0 3px 12px rgba(15, 23, 42, 0.05)',
            borderColor: '#CBD5E1',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 #F8FAFC',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 10,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#E2E8F0',
          padding: '7.5px 11px',
          fontSize: '0.79rem',
          lineHeight: 1.35,
          fontVariantNumeric: 'tabular-nums',
          color: '#0F172A',
        },
        sizeSmall: {
          padding: '6px 9px',
          fontSize: '0.76rem',
        },
        head: {
          fontWeight: 800,
          backgroundColor: '#F8FAFC',
          color: '#334155',
          padding: '8.5px 11px',
          fontSize: '0.72rem',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 6,
        },
        sizeSmall: {
          height: 21,
          fontSize: '0.69rem',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.14)',
          marginTop: 4,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          fontWeight: 500,
          borderRadius: 6,
          margin: '2px 6px',
          padding: '7px 10px',
          '&.Mui-selected': {
            backgroundColor: '#EFF6FF',
            color: '#0F2C59',
            fontWeight: 700,
            '&:hover': {
              backgroundColor: '#DBEAFE',
            },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: '#F1F5F9',
          padding: 3,
          borderRadius: 9,
          border: '1px solid #E2E8F0',
          gap: 3,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: '7px !important',
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.77rem',
          color: '#475569',
          padding: '5px 12px',
          transition: 'all 0.15s ease',
          '&.Mui-selected': {
            backgroundColor: '#FFFFFF',
            color: '#0F2C59',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.12)',
            '&:hover': {
              backgroundColor: '#FFFFFF',
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          backgroundColor: '#0F2C59',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.8rem',
          minHeight: 42,
          color: '#64748B',
          '&.Mui-selected': {
            color: '#0F2C59',
            fontWeight: 800,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0F172A',
          fontSize: '0.73rem',
          fontWeight: 600,
          borderRadius: 7,
          padding: '6px 10px',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        primary: {
          backgroundColor: '#0F2C59',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(15, 44, 89, 0.35)',
          '&:hover': {
            backgroundColor: '#0A1F40',
          },
        },
      },
    },
  },
});
