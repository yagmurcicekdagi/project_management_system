type ApiErrorAlertProps = Readonly<{
  message: string | string[]
}>

export default function ApiErrorAlert({ message }: ApiErrorAlertProps) {
  const messages = Array.isArray(message) ? message : [message]
  if (!messages.length || !messages[0]) return null
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {messages.length === 1 ? (
        messages[0]
      ) : (
        <ul className="list-disc pl-4 space-y-0.5">
          {messages.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
    </div>
  )
}
