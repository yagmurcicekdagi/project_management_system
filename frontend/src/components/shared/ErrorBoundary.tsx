import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = Readonly<{
  children: ReactNode
}>

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-7xl p-6">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold">Something went wrong.</p>
            {this.state.message && (
              <p className="mt-1 text-xs opacity-75">{this.state.message}</p>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
