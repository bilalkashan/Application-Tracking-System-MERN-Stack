import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-red-600 bg-red-100 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2">⚠ Something went wrong</h2>
          <p className="text-sm">Unexpected error occurred</p>
        </div>
      );
    }

    return this.props.children;
  }
}
