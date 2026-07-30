import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in SAGE React App:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#0a0e1a',
            color: '#e2e8f0',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: '#161f33',
              border: '1px solid #2a3b5c',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(248, 113, 113, 0.1)',
                color: '#f87171',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '16px',
              }}
            >
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
              Ocurrió un error en la aplicación
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              {this.state.error?.message || 'Error inesperado al cargar SAGE Frontend.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#4f7df3',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
