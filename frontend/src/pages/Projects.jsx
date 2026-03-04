import React from 'react'
import api from '../api/client'
import { USE_MOCK } from '../mock/useMock'
import * as mock from '../mock/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/table'

export default function Projects() {
  const [page, setPage] = React.useState(0)
  const [size, setSize] = React.useState(10)
  const [data, setData] = React.useState({ content: [], totalPages: 0, number: 0 })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      if (USE_MOCK) {
        const res = await mock.getProjects({ page, size })
        setData(res)
      } else {
        const { data } = await api.get(`/v1/projects`, { params: { page, size } })
        setData(data)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [page, size])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">Projects</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Search (client-side)" className="h-9 w-56" onChange={() => {}} />
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</div>
          )}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>Status</TH>
                    <TH>Description</TH>
                  </TR>
                </THead>
                <TBody>
                  {(data.content ?? []).map((p) => (
                    <TR key={p.id}>
                      <TD className="font-medium">{p.name}</TD>
                      <TD><Badge variant={p.status === 'COMPLETED' ? 'success' : p.status === 'IN_PROGRESS' ? 'warning' : 'secondary'}>{p.status}</Badge></TD>
                      <TD className="text-gray-600 dark:text-zinc-300">{p.description || '-'}</TD>
                    </TR>
                  ))}
                  {(data.content ?? []).length === 0 && (
                    <TR>
                      <TD colSpan={3} className="text-center text-muted-foreground py-6">No projects found</TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Button variant="secondary" onClick={() => setPage((n) => Math.max(0, n - 1))} disabled={page <= 0}>
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {data.number + 1} of {data.totalPages || 1}
            </span>
            <Button
              onClick={() => setPage((n) => (data.totalPages ? Math.min(data.totalPages - 1, n + 1) : n + 1))}
              disabled={data.totalPages ? page >= data.totalPages - 1 : false}
            >
              Next
            </Button>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Size</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-2"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              >
                {[5, 10, 20, 50].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

