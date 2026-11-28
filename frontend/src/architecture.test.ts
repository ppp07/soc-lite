// @vitest-environment node
/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const SRC = fileURLToPath(new URL('.', import.meta.url))

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

const importsSample = (code: string): boolean =>
  /from\s+['"][^'"]*\/sample(\/[^'"]*)?['"]/.test(code) ||
  /import\(\s*['"][^'"]*\/sample/.test(code)

const rel = (file: string): string => relative(SRC, file).split('\\').join('/')
const isTest = (f: string): boolean => /\.test\.(ts|tsx)$/.test(f) || f.startsWith('test/')

describe('architecture: simulated data stays out of production code', () => {
  const files = sourceFiles(SRC).map((f) => ({ path: rel(f), code: readFileSync(f, 'utf8') }))

  it('never lets src/api import src/sample', () => {
    const offenders = files.filter((f) => f.path.startsWith('api/') && importsSample(f.code))
    expect(offenders.map((f) => f.path)).toEqual([])
  })

  it('lets only the dashboard composition root (and tests) import src/sample', () => {
    const importers = files
      .filter((f) => !f.path.startsWith('sample/') && !isTest(f.path) && importsSample(f.code))
      .map((f) => f.path)
    expect(importers).toEqual(['features/dashboard/dataSource.ts'])
  })

  it('keeps src/sample free of UI and app code', () => {
    const offenders = files.filter(
      (f) =>
        f.path.startsWith('sample/') &&
        !isTest(f.path) &&
        /from\s+['"](react|react-router|\.\.\/(components|features|layouts|pages))/.test(f.code),
    )
    expect(offenders.map((f) => f.path)).toEqual([])
  })

  it('only reaches into src/api for types and the error class', () => {
    const allowed = /from\s+['"]\.\.\/api\/(dashboardSource|errors|schemas\/[\w]+)['"]/
    for (const f of files.filter((x) => x.path.startsWith('sample/') && !isTest(x.path))) {
      for (const line of f.code.split('\n').filter((l) => /from\s+['"]\.\.\/api/.test(l))) {
        expect(line).toMatch(allowed)
      }
    }
  })
})
