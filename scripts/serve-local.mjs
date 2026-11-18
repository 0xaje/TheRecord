import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import worker from '../dist/server/index.js';
import { openLocalDatabase } from './local-db.mjs';

// Development only. Uses the actual built Worker with a separate local SQLite DB.
export async function startLocal({ filename = '.record-local/drafts.sqlite', port = 8788 } = {}) {
  const db = openLocalDatabase(filename);
  const server = createServer(async (incoming, outgoing) => {
    try {
      const expected = '127.0.0.1:' + server.address().port;
      if (incoming.headers.host !== expected && incoming.headers.host !== 'localhost:' + server.address().port) {
        outgoing.writeHead(403); outgoing.end('Unexpected host'); return;
      }
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (value !== undefined && name !== 'oai-authenticated-user-id') headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
      const request = new Request('http://' + incoming.headers.host + incoming.url, {
        method: incoming.method, headers,
        ...(['GET','HEAD'].includes(incoming.method) ? {} : { body: Readable.toWeb(incoming), duplex: 'half' }),
      });
      const response = await worker.fetch(request, { DB: db });
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      if (incoming.method === 'HEAD' || !response.body) outgoing.end();
      else Readable.fromWeb(response.body).pipe(outgoing);
    } catch { if (!outgoing.headersSent) outgoing.writeHead(500); outgoing.end('Local service failed'); }
  });
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', accept); });
  return { url: 'http://127.0.0.1:' + server.address().port,
    async close() { await new Promise((accept, reject) => server.close(error => error ? reject(error) : accept())); db.sqlite.close(); } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const running = await startLocal();
  console.log('Local The Record: ' + running.url + ' (development only)');
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal, async () => { await running.close(); process.exit(0); });
}
