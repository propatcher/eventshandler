import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Перехвачена ошибка интерфейса:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 geo-grid p-6 text-center">
        <div className="max-w-sm bg-white border border-neutral-200 rounded-2xl shadow-soft-lg p-8">
          <div className="mx-auto mb-4 grid place-items-center w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-neutral-900">Что-то пошло не так</h1>
          <p className="text-sm text-neutral-500 mt-1.5">Произошла непредвиденная ошибка. Попробуйте обновить страницу.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-accent mt-5 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }
}
