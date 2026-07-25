import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const workflow = readFileSync(
  `${process.cwd()}/.github/workflows/ci.yml`,
  'utf8',
)

function yamlBlock(source, key, indent = 2) {
  const prefix = `${' '.repeat(indent)}${key}:`
  const start = source.indexOf(prefix)
  if (start === -1) {
    return ''
  }

  const lines = source.slice(start).split('\n')
  const block = [lines[0]]
  for (const line of lines.slice(1)) {
    if (line && !line.startsWith(' '.repeat(indent + 1))) {
      break
    }
    block.push(line)
  }
  return block.join('\n')
}

describe('release image workflow contract', () => {
  const quality = yamlBlock(workflow, 'quality')
  const publish = yamlBlock(workflow, 'publish')

  it('keeps pull requests and main on quality/container while adding release tags', () => {
    expect(workflow).toContain('pull_request:')
    expect(workflow).toMatch(/branches:\s*\[main\]/)
    expect(workflow).toMatch(/tags:\s*\['v\*\.\*\.\*'\]/)
    expect(quality).toContain(
      "if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'",
    )
    expect(workflow).toContain('  container:')
    expect(workflow).toContain('    needs: quality')
  })

  it('publishes only verified signed annotated SemVer tags with package write access', () => {
    expect(publish).toContain("if: startsWith(github.ref, 'refs/tags/')")
    expect(publish).toContain('packages: write')
    expect(publish).toContain('contents: read')
    expect(publish).toContain('Verify signed annotated SemVer release tag')
    expect(publish).toContain(
      '[[ "$GITHUB_REF_NAME" =~ ^v[0-9]+\\.[0-9]+\\.[0-9]+$ ]]',
    )
    expect(publish).toContain("object.type == \"tag\"")
    expect(publish).toContain("verification.verified == true")
    expect(publish).toContain("object.type == \"commit\"")
    expect(publish).toContain("object.sha == env.GITHUB_SHA")
  })

  it('pushes the required multi-architecture GHCR tags with attestations', () => {
    expect(publish).toContain('docker/setup-qemu-action@')
    expect(publish).toContain('docker/setup-buildx-action@')
    expect(publish).toContain('docker/login-action@')
    expect(publish).toContain('registry: ghcr.io')
    expect(publish).toContain('id: push')
    expect(publish).toContain('platforms: linux/amd64,linux/arm64')
    expect(publish).toContain('push: true')
    expect(publish).toContain(
      'ghcr.io/coderushoj/croj-frontend:${{ github.ref_name }}',
    )
    expect(publish).toContain(
      'ghcr.io/coderushoj/croj-frontend:sha-${{ github.sha }}',
    )
    expect(publish).toContain('provenance: mode=max')
    expect(publish).toContain('sbom: true')
  })

  it('uploads secret-free digest metadata for release automation', () => {
    expect(publish).toContain('steps.push.outputs.digest')
    expect(publish).toContain('--arg repository')
    expect(publish).toContain('--arg tag')
    expect(publish).toContain('--arg revision')
    expect(publish).toContain('--arg digest')
    expect(publish).toContain(
      "'{repository:$repository,tag:$tag,revision:$revision,digest:$digest,platforms:[\"linux/amd64\",\"linux/arm64\"]}'",
    )
    expect(publish).toContain('actions/upload-artifact@')
    expect(publish).toContain('name: image-artifact-${{ github.ref_name }}')
    expect(publish).toContain('path: image-artifact.json')
  })
})
