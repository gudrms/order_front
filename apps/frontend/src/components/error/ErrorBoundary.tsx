'use client';

import { Component, ReactNode } from 'react';
import { useErrorStore } from '@/stores/errorStore';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // ErrorStore에 Critical 에러로 저장
    useErrorStore.getState().addError({
      message: error.message,
      severity: 'critical',
      code: 'REACT_ERROR_BOUNDARY',
      meta: {
        componentStack: errorInfo.componentStack,
        errorInfo,
      },
    });

    console.error('[ErrorBoundary]', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            문제가 발생했습니다
          </h1>
          <p className="mb-6 text-center text-gray-600">
            {this.state.error.message}
          </p>
          <button
            onClick={this.reset}
            className="rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-dark"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
