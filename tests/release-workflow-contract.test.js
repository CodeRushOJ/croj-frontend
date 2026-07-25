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
  const container = yamlBlock(workflow, 'container')
  const publish = yamlBlock(workflow, 'publish')

  it('runs quality and container for pull requests, main, and release tags', () => {
    expect(workflow).toContain('pull_request:')
    expect(workflow).toMatch(/branches:\s*\[main\]/)
    expect(workflow).toMatch(/tags:\s*\['v\*\.\*\.\*'\]/)
    expect(quality).not.toMatch(/^\s+if:/m)
    expect(container).toContain('needs: quality')
    expect(container).not.toMatch(/^\s+if:/m)
  })

  it('publishes only the latest main commit through an exact annotated SemVer tag', () => {
    expect(publish).toContain("if: startsWith(github.ref, 'refs/tags/')")
    expect(publish).toContain('needs: [quality, container]')
    expect(publish).toContain('packages: write')
    expect(publish).toContain('id-token: write')
    expect(publish).toContain('contents: read')
    expect(publish).toContain('Verify annotated SemVer release tag')
    expect(publish).toContain(
      '[[ "$GITHUB_REF_NAME" =~ ^v[0-9]+\\.[0-9]+\\.[0-9]+$ ]]',
    )
    expect(publish).toContain("object.type == \"tag\"")
    expect(publish).toContain("object.type == \"commit\"")
    expect(publish).toContain("object.sha == env.GITHUB_SHA")
    expect(publish).toContain(
      'git fetch --no-tags origin main:refs/remotes/origin/main',
    )
    expect(publish).toContain('main_sha="$(git rev-parse origin/main)"')
    expect(publish).toContain('[[ "$GITHUB_SHA" == "$main_sha" ]]')
    expect(publish).not.toContain('verification.verified')
    expect(publish).not.toContain('signed')
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

  it('attests the pushed digest to GHCR with GitHub OIDC provenance', () => {
    const pushStep = publish.indexOf('id: push')
    const attestStep = publish.indexOf(
      'actions/attest-build-provenance@0f67c3f4856b2e3261c31976d6725780e5e4c373 # v4',
    )

    expect(pushStep).toBeGreaterThan(-1)
    expect(attestStep).toBeGreaterThan(pushStep)
    expect(publish).toContain(
      'subject-name: ghcr.io/coderushoj/croj-frontend',
    )
    expect(publish).toContain(
      'subject-digest: ${{ steps.push.outputs.digest }}',
    )
    expect(publish).toContain('push-to-registry: true')
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
