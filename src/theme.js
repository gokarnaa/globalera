import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a56b0',
      dark: '#0d3466',
      light: '#e8f0fd',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2f7de1',
      light: '#f0f5fc',
    },
    background: {
      default: '#f4f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#152238',
      secondary: '#647089',
    },
    success: {
      main: '#1a9c5c',
      light: '#e5f8ee',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d5372f',
      light: '#fdeceb',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#c9820a',
      light: '#fdf3e2',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0288d1',
      light: '#e1f5fe',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans Devanagari", system-ui, -apple-system, sans-serif',
    h5: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          padding: '8px 16px',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(26,86,176,0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1a56b0 0%, #2f7de1 100%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 10px rgba(15,30,60,0.05), 0 1px 3px rgba(15,30,60,0.03)',
          border: '1px solid #e5ebf4',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 14,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(10,25,50,0.2)',
        },
      },
    },
  },
});
