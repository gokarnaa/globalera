import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import App from './App';

class GlobalRootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GlobalRootErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch (_) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F2C59',
          color: '#FFFFFF',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚙️</div>
            <h2 style={{ margin: '0 0 8px 0', fontWeight: 900, color: '#0F2C59' }}>
              Global Era TVET System
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px', margin: '0 0 20px 0' }}>
              System Rendering Recovery Screen
            </p>
            <div style={{
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              fontFamily: 'monospace',
              textAlign: 'left',
              marginBottom: '20px',
              wordBreak: 'break-word'
            }}>
              {this.state.error?.message || 'Application rendering interrupted'}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#0F2C59',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Reload Application
              </button>
              <button
                onClick={this.handleResetStorage}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#334155',
                  fontWeight: 700,
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear Cache &amp; Reset
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalRootErrorBoundary>
      <ThemeProvider theme={theme}>
        <DialogProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </DialogProvider>
      </ThemeProvider>
    </GlobalRootErrorBoundary>
  </React.StrictMode>
);
