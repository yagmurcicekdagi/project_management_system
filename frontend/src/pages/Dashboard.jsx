import React from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/table'
import api from '../api/client'
import { USE_MOCK } from '../mock/useMock'
import * as mock from '../mock/api'
import { ArrowRight, RefreshCcw } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = React.useState({ projects: 0, employees: 0 })
  const [recent, setRecent] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      if (USE_MOCK) {
        const [proj, emp, recentProj] = await Promise.all([
          mock.getProjects({ page: 0, size: 1 }),
          mock.getEmployees({ page: 0, size: 1 }),
          mock.getProjects({ page: 0, size: 5 }),
        ])
        setStats({ projects: proj.totalElements, employees: emp.totalElements })
        setRecent(recentProj.content)
      } else {
        const [proj, emp, recentProj] = await Promise.all([
          api.get('/v1/projects', { params: { page: 0, size: 1 } }),
          api.get('/v1/employees', { params: { page: 0, size: 1 } }),
          api.get('/v1/projects', { params: { page: 0, size: 5 } }),
        ])
        setStats({
          projects: proj.data?.totalElements ?? 0,
          employees: emp.data?.totalElements ?? 0,
        })
        setRecent(recentProj.data?.content ?? [])
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={load} disabled={loading} className="gap-2" variant="secondary">
          <RefreshCcw size={16} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Projects" value={stats.projects} description="Total projects in the system" />
        <StatCard title="Employees" value={stats.employees} description="Total registered employees" />
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild><a href="/projects" className="inline-flex items-center gap-2">View Projects <ArrowRight size={16} /></a></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Latest created projects</CardDescription>
        </CardHeader>
        <CardContent>
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
                {recent.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-medium">{p.name}</TD>
                    <TD>
                      <StatusBadge status={p.status} />
                    </TD>
                    <TD className="text-gray-600 dark:text-zinc-300">{p.description || '-'}</TD>
                  </TR>
                ))}
                {!loading && recent.length === 0 && (
                  <TR>
                    <TD colSpan={3} className="text-center text-gray-500 dark:text-zinc-400 py-6">No projects found</TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, description }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }) {
  const variant = status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'warning' : 'secondary'
  return <Badge variant={variant}>{status}</Badge>
}
