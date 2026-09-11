import http from 'node:http';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { paths } from './pipeline.mjs';
import { listRuns, inspectRun, saveDecisions, readSource, exportReview, requireApproval, runDir, currentData } from './console-model.mjs';

export async function createConsole({ port = 3318 } = {}) {
  const token = randomBytes(32).toString('hex');
  const jobsDir = path.join(paths.tool, 'output/console-jobs'); await fs.mkdir(jobsDir, { recursive: true });
  const jobs = new Map(); let busy = false; let address;
  const staticFiles = new Map([['/', ['index.html', 'text/html']], ['/app.js', ['app.js', 'text/javascript']], ['/data-view.js', ['data-view.js', 'text/javascript']], ['/shared.js', ['shared.js', 'text/javascript']], ['/fonts/typography.css', ['../../../public/fonts/typography.css', 'text/css']], ['/fonts/inter-latin-variable.woff2', ['../../../public/fonts/inter-latin-variable.woff2', 'font/woff2']], ['/style.css', ['style.css', 'text/css']]]);
  const persist = async (job) => {
    const file = path.join(jobsDir, `${job.id}.json`);
    await fs.writeFile(`${file}.tmp`, `${JSON.stringify(job, null, 2)}\n`);
    await fs.rename(`${file}.tmp`, file);
  };
  const command = (job, executable, args) => new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: paths.root, stdio: ['ignore', 'pipe', 'pipe'] });
    const capture = (chunk) => {
      job.log = `${job.log}${chunk.toString()}`.slice(-100000);
      const match = job.log.match(/批次 ([\w-]+)/);
      if (match) job.run = match[1];
    };
    child.stdout.on('data', capture); child.stderr.on('data', capture);
    child.on('error', reject); child.on('close', (code, signal) => code === 0 ? resolve() : reject(new Error(`${executable} ${args.join(' ')} 失败 (${signal ?? code})`)));
  });
  async function startJob(body) {
    assert(!busy, '已有操作正在运行');
    assert(['generate', 'review', 'apply', 'check'].includes(body.action), '操作无效');
    if (body.action === 'generate') assert(['live', 'from', 'resume'].includes(body.mode), '生成模式无效');
    if (body.action === 'review' || body.action === 'apply' || (body.action === 'generate' && body.mode !== 'live')) runDir(body.run);
    busy = true;
    try { if (body.action === 'apply') await requireApproval(body.run, body.report_hash); }
    catch (error) { busy = false; throw error; }
    const job = { id: `${Date.now()}-${randomBytes(4).toString('hex')}`, action: body.action, run: body.run ?? null, status: 'running', started_at: new Date().toISOString(), log: '' };
    jobs.set(job.id, job);
    try { await persist(job); } catch (error) { busy = false; throw error; }
    void (async () => {
      try {
        if (body.action === 'generate') {
          const args = [path.join(paths.tool, 'pipeline.mjs'), 'generate'];
          if (body.mode !== 'live') args.push(`--${body.mode}`, body.run);
          // A newly generated batch owns its own ID; do not mistake its parent for the result.
          job.run = null;
          await command(job, process.execPath, args);
          assert(job.run, '生成器未返回批次编号');
          await command(job, process.execPath, [path.join(paths.tool, 'pipeline.mjs'), 'review', job.run]);
        } else if (body.action === 'review') {
          await command(job, process.execPath, [path.join(paths.tool, 'pipeline.mjs'), 'review', body.run]);
        } else if (body.action === 'apply') {
          await command(job, process.execPath, [path.join(paths.tool, 'pipeline.mjs'), 'apply', body.run, '--review', body.report_hash]);
          job.applied = true; await persist(job);
          await command(job, 'mise', ['run', 'check']);
          await command(job, 'mise', ['run', 'e2e']);
        } else {
          await command(job, 'mise', ['run', 'data:check']);
        }
        job.status = 'passed';
      } catch (error) { job.status = 'failed'; job.error = error.message; }
      finally {
        job.finished_at = new Date().toISOString();
        try { await persist(job); } catch (error) { job.status = 'failed'; job.error = `任务记录保存失败：${error.message}`; }
        busy = false;
      }
    })();
    return { id: job.id };
  }
  async function allJobs() {
    const names = (await fs.readdir(jobsDir)).filter((name) => /^[\w-]+\.json$/.test(name)).sort().reverse().slice(0, 20);
    const result = [];
    for (const name of names) {
      const id = name.slice(0, -5);
      if (jobs.has(id)) result.push(jobs.get(id));
      else {
        const job = JSON.parse(await fs.readFile(path.join(jobsDir, name), 'utf8'));
        if (job.status === 'running') { job.status = 'interrupted'; job.error = '控制台已重启。先确认之前的生成或检查进程是否仍在运行。'; }
        result.push(job);
      }
    }
    return { busy, jobs: result };
  }
  const server = http.createServer(async (request, response) => {
    const send = (status, value, headers = {}) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
      response.end(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value));
    };
    try {
      const allowedHosts = [`127.0.0.1:${address.port}`, `localhost:${address.port}`];
      if (!allowedHosts.includes(request.headers.host)) return send(403, { error: '仅允许本地控制台访问' });
      const origin = request.headers.origin;
      if (origin && !allowedHosts.some((host) => origin === `http://${host}`)) return send(403, { error: '来源不匹配' });
      if (request.headers['sec-fetch-site'] === 'cross-site') return send(403, { error: '不允许跨站访问' });
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (request.method === 'GET' && staticFiles.has(url.pathname)) {
        const [file, type] = staticFiles.get(url.pathname);
        return send(200, await fs.readFile(path.join(paths.tool, 'console', file)), {
          'Content-Type': type.startsWith('font/') ? type : `${type}; charset=utf-8`,
          'Cache-Control': type.startsWith('font/') ? 'private, max-age=3600' : 'no-store',
          'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://raw.githubusercontent.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
          'Referrer-Policy': 'no-referrer',
        });
      }
      if (request.method === 'GET' && url.pathname === '/api/session') return send(200, { token });
      if (request.method === 'GET' && url.pathname === '/api/current') return send(200, await currentData());
      if (request.method === 'GET' && url.pathname === '/api/current/export') return send(200, (await currentData()).data, { 'Content-Disposition': 'attachment; filename="published-data.json"' });
      if (request.method === 'GET' && url.pathname === '/api/runs') return send(200, await listRuns());
      if (request.method === 'GET' && url.pathname === '/api/jobs') return send(200, await allJobs());
      const route = url.pathname.match(/^\/api\/runs\/([\w-]+)(?:\/(source|export|decisions))?$/);
      if (request.method === 'GET' && route) {
        if (route[2] === 'source') return send(200, await readSource(route[1], url.searchParams.get('file')));
        if (route[2] === 'export') return send(200, await exportReview(route[1]), { 'Content-Disposition': `attachment; filename="${route[1]}-review.json"` });
        if (!route[2]) return send(200, await inspectRun(route[1]));
      }
      if (request.method !== 'POST') return send(404, { error: '页面不存在' });
      if (request.headers['x-console-token'] !== token) return send(403, { error: '会话已失效，请刷新页面' });
      if (!request.headers['content-type']?.startsWith('application/json')) return send(415, { error: '需要 JSON 请求' });
      let bytes = 0; const chunks = [];
      for await (const chunk of request) { bytes += chunk.length; assert(bytes <= 128000, '请求过大'); chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString());
      if (url.pathname === '/api/jobs') return send(202, await startJob(body));
      if (route?.[2] === 'decisions') {
        assert(!busy, '已有操作正在运行'); busy = true;
        try { return send(200, await saveDecisions(route[1], body)); } finally { busy = false; }
      }
      return send(404, { error: '操作不存在' });
    } catch (error) { return send(409, { error: error.message }); }
  });
  server.requestTimeout = 30000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  address = server.address();
  return { server, url: `http://127.0.0.1:${address.port}` };
}

if (process.argv[1] && await fs.realpath(process.argv[1]) === import.meta.filename) {
  const args = process.argv.slice(2);
  assert(args.length === 0 || (args.length === 2 && args[0] === '--port'), 'console [--port <端口>]');
  const port = args.length ? Number(args[1]) : 3318;
  assert(Number.isInteger(port) && port >= 0 && port <= 65535, '端口无效');
  const app = await createConsole({ port });
  console.log(`数据校对控制台：${app.url}`);
}
