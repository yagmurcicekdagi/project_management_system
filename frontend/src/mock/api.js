import { sampleProjects, sampleEmployees } from './data'

function paginate(list, page = 0, size = 10) {
  const start = page * size
  const content = list.slice(start, start + size)
  const totalElements = list.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  return { content, totalElements, totalPages, number: page, size }
}

export async function getProjects({ page = 0, size = 10 } = {}) {
  await delay(150)
  return paginate(sampleProjects, page, size)
}

export async function getEmployees({ page = 0, size = 10 } = {}) {
  await delay(150)
  return paginate(sampleEmployees, page, size)
}

export async function patchProjectStatus(id, status) {
  await delay(120)
  const idx = sampleProjects.findIndex((p) => p.id === id)
  if (idx >= 0) sampleProjects[idx] = { ...sampleProjects[idx], status }
  return sampleProjects[idx]
}

export async function updateProject(id, updates) {
  await delay(120)
  const idx = sampleProjects.findIndex((p) => p.id === id)
  if (idx >= 0) sampleProjects[idx] = { ...sampleProjects[idx], ...updates }
  return sampleProjects[idx]
}

export async function deleteProject(id) {
  await delay(120)
  const idx = sampleProjects.findIndex((p) => p.id === id)
  if (idx >= 0) sampleProjects.splice(idx, 1)
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms))
}

