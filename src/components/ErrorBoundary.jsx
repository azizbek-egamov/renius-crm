import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state to render the fallback UI on the next render
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleClearStorage = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '20px',
                    textAlign: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    backgroundColor: '#f8fafc',
                    color: '#1e293b'
                }}>
                    <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>
                        Something went wrong
                    </h1>
                    <p style={{ marginBottom: '24px', color: '#64748b', maxWidth: '500px' }}>
                        The application encountered an unexpected error.
                        Please try reloading the page.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={this.handleReload}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Reload Page
                        </button>
                        <button
                            onClick={this.handleClearStorage}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#fff',
                                color: '#64748b',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Reset App Crm
                        </button>
                    </div>
                    {/* Optional: Display error details in development */}
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre style={{
                            marginTop: '40px',
                            padding: '20px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '8px',
                            textAlign: 'left',
                            maxWidth: '800px',
                            overflow: 'auto',
                            fontSize: '12px',
                            color: '#ef4444'
                        }}>
                            {this.state.error.toString()}
                            <br />
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
