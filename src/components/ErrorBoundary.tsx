import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string };
      if (parsed && parsed.error) {
        readable = `Database access error (${parsed.operationType || 'operation'}): ${parsed.error}`;
      }
    } catch {
      // Non-JSON error message; display cleanly.
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ReNest Campus ErrorBoundary caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F7F2] text-[#242B29] flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl border border-[#DDD7C9] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#174C3C]">
              <AlertTriangle className="h-6 w-6 shrink-0" aria-hidden="true" />
              <h1 className="font-display text-2xl font-semibold text-[#242B29]">
                Something interrupted your session
              </h1>
            </div>
            <p className="mt-4 text-sm text-[#525C58] leading-relaxed">
              {this.state.message}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-lg bg-[#174C3C] px-4 py-2.5 text-sm font-medium text-[#F8F7F2] hover:bg-[#2F8065] transition-colors"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
