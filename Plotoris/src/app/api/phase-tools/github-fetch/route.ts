import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { url } = await request.json();
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
  }
  const [, owner, repo] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(apiUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch repo tree' }, { status: res.status });
  }
  const data = await res.json();
  const entries = data.tree as { path: string; type: string }[];
  const buildTree = (paths: string[]) => {
    const root: any[] = [];
    const map = new Map<string, any>();
    for (const p of paths) {
      const parts = p.split('/');
      let current = root;
      let curPath = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        curPath = curPath ? `${curPath}/${part}` : part;
        const isFile = i === parts.length - 1;
        if (isFile) {
          current.push({ name: part, type: 'file', selected: true, path: curPath });
        } else {
          let node = map.get(curPath);
          if (!node) {
            node = { name: part, type: 'folder', selected: true, children: [], path: curPath };
            map.set(curPath, node);
            current.push(node);
          }
          current = node.children;
        }
      }
    }
    return root;
  };
  const tree = buildTree(
    entries.filter((e) => e.type === 'blob').map((e) => e.path)
  );
  return NextResponse.json({ tree });
}
