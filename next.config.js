const { execSync } = require('child_process')

const REPO = 'haiyaoxliu/tractor.games'

function git(cmd) {
  return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
}

// First-parent commit count of HEAD, plus the annotated tag name if HEAD has one.
function fromGit() {
  try {
    if (git('rev-parse --is-shallow-repository') === 'true') {
      try { git('fetch --unshallow --tags') } catch {}
    }
    const n = parseInt(git('rev-list --first-parent --count HEAD'), 10)
    if (!Number.isFinite(n)) return null
    let name = ''
    try {
      const tag = git('describe --exact-match --tags HEAD')
      if (git(`cat-file -t refs/tags/${tag}`) === 'tag') name = tag
    } catch {}
    return { n: String(n), name }
  } catch {
    return null
  }
}

// No usable .git (e.g. a tarball clone): count commits through the GitHub API.
async function fromGitHub() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA
  if (!sha) return null
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits?sha=${sha}&per_page=1`)
    const last = /[?&]page=(\d+)>; rel="last"/.exec(res.headers.get('link') || '')
    return last ? { n: last[1], name: '' } : null
  } catch {
    return null
  }
}

module.exports = async () => {
  const build = fromGit() || (await fromGitHub()) || { n: 'dev', name: '' }
  return {
    reactStrictMode: true,
    env: {
      NEXT_PUBLIC_BUILD: build.n,
      NEXT_PUBLIC_BUILD_NAME: build.name,
    },
  }
}
