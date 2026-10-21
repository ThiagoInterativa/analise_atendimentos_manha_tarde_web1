import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache for recent PABX queries to make navigation and re-filtering instant
const queryCache = new Map<string, { timestamp: number; dados: any[] }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Session cookie cache
let cachedSession: {
  email: string;
  cookies: string[];
  expiresAt: number;
} | null = null;

interface CallRecordParsed {
  dataHora: string;
  data: string;
  hora: string;
  horaInt: number;
  origem: string;
  destino: string;
  fila: string;
  duracao: string;
  segundos: number;
  status: string;
  tipo: string;
}

/**
 * Perform login to PABX Evence and obtain session cookies
 */
async function getPabxSession(loginUrl: string, email: string, senha: string): Promise<string[]> {
  const now = Date.now();
  if (cachedSession && cachedSession.email === email && cachedSession.expiresAt > now) {
    return cachedSession.cookies;
  }

  let cookies: string[] = [];
  const parseSetCookie = (setCookieHeaders: string | string[] | undefined) => {
    if (!setCookieHeaders) return;
    const headersArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    for (const header of headersArray) {
      const cookiePair = header.split(';')[0];
      if (cookiePair) {
        const [name] = cookiePair.split('=');
        cookies = cookies.filter((c) => !c.startsWith(`${name}=`));
        cookies.push(cookiePair);
      }
    }
  };

  console.log(`[PABX] Autenticando em ${loginUrl} com email ${email}...`);
  const loginPageRes = await fetch(loginUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(30000),
  });

  parseSetCookie(loginPageRes.headers.getSetCookie?.() || loginPageRes.headers.get('set-cookie') || undefined);
  const loginHtml = await loginPageRes.text();
  const $login = cheerio.load(loginHtml);
  const csrfToken = $login('input[name="_token"]').val() || '';

  const loginBody = new URLSearchParams();
  loginBody.append('login', email);
  loginBody.append('senha', senha);
  loginBody.append('_token', csrfToken.toString());

  const authRes = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookies.join('; '),
      Referer: loginUrl,
    },
    body: loginBody.toString(),
    redirect: 'manual',
    signal: AbortSignal.timeout(30000),
  });

  parseSetCookie(authRes.headers.getSetCookie?.() || authRes.headers.get('set-cookie') || undefined);

  if (cookies.length === 0) {
    throw new Error('Falha ao autenticar no PABX: Nenhum cookie retornado.');
  }

  // Cache session for 30 minutes
  cachedSession = {
    email,
    cookies,
    expiresAt: now + 30 * 60 * 1000,
  };

  return cookies;
}

/**
 * Parse HTML table rows into CallRecordParsed items
 */
function parseCdrTable(html: string): { rowsCount: number; records: CallRecordParsed[]; totalPagesFromHtml?: number } {
  const $cdr = cheerio.load(html);
  const rows = $cdr('table tbody tr');
  const records: CallRecordParsed[] = [];

  // Parse total pages from pagination links if available
  let totalPagesFromHtml: number | undefined;
  const pageNumbers: number[] = [];
  $cdr('ul.pagination li, .pagination a, .pagination span').each((_, el) => {
    const text = $cdr(el).text().trim();
    const num = parseInt(text, 10);
    if (!isNaN(num)) {
      pageNumbers.push(num);
    }
  });
  if (pageNumbers.length > 0) {
    totalPagesFromHtml = Math.max(...pageNumbers);
  }

  rows.each((_, row) => {
    const cols = $cdr(row).find('td');
    if (cols.length >= 7) {
      const dataHora = $cdr(cols[0]).text().trim();
      const origem = cols.length >= 8 ? $cdr(cols[1]).text().trim() : '';
      const destino = cols.length >= 8 ? $cdr(cols[2]).text().trim() : '';
      const fila = cols.length >= 8 ? $cdr(cols[4]).text().trim() : $cdr(cols[3]).text().trim();
      const duracao = cols.length >= 8 ? $cdr(cols[5]).text().trim() : $cdr(cols[4]).text().trim();
      const status = cols.length >= 8 ? $cdr(cols[6]).text().trim() : $cdr(cols[5]).text().trim();
      const tipo = cols.length >= 8 ? $cdr(cols[7]).text().trim() : $cdr(cols[6]).text().trim();

      // Format check: "DD-MM-YYYY HH:mm:ss"
      const parts = dataHora.split(' ');
      if (parts.length === 2) {
        const [d, m, y] = parts[0].split('-');
        const isoData = `${y}-${m}-${d}`;
        const hora = parts[1];
        const horaInt = parseInt(hora.split(':')[0], 10) || 0;

        const durParts = duracao.split(':');
        let segundos = 0;
        if (durParts.length === 3) {
          segundos = parseInt(durParts[0], 10) * 3600 + parseInt(durParts[1], 10) * 60 + parseInt(durParts[2], 10);
        } else if (durParts.length === 2) {
          segundos = parseInt(durParts[0], 10) * 60 + parseInt(durParts[1], 10);
        }

        records.push({
          dataHora,
          data: isoData,
          hora,
          horaInt,
          origem,
          destino,
          fila: fila || 'Geral',
          duracao,
          segundos: isNaN(segundos) ? 0 : segundos,
          status: status || 'Desconhecido',
          tipo: tipo || 'IN',
        });
      }
    }
  });

  return { rowsCount: rows.length, records, totalPagesFromHtml };
}

/**
 * Fetch a single page from PABX CDR with retry and 120s timeout
 */
async function fetchCdrPage(
  cdrUrl: string,
  cookies: string[],
  dataInicioStr: string,
  dataFimStr: string,
  tipoChamada: string,
  page: number
): Promise<string> {
  const params = new URLSearchParams({
    ramal_origem: '',
    numero_origem: '',
    ramal_destino: '',
    numero_destino: '',
    did: '',
    status_chamada: '',
    centrocusto_id: '',
    tipo_chamada: tipoChamada,
    gravacao: '',
    discador: '0',
    data_inicial: dataInicioStr,
    data_final: dataFimStr,
    page: page.toString(),
  });

  const targetUrl = `${cdrUrl}?${params.toString()}`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Cookie: cookies.join('; '),
          Referer: 'https://pabx.evence.com.br/cdr',
        },
        signal: AbortSignal.timeout(120000), // 120s matching user's python script
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ao consultar página ${page}`);
      }

      return await res.text();
    } catch (err: any) {
      console.warn(`[PABX] Tentativa ${attempt}/4 falhou para página ${page}:`, err.message);
      if (attempt === 4) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  throw new Error(`Falha definitiva ao obter página ${page}`);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // STREAMING ENDPOINT for multi-page CDR fetching (Prevents browser timeouts on whole-month queries!)
  app.get('/api/pabx/consultar-stream', async (req, res) => {
    const {
      loginUrl = 'https://pabx.evence.com.br/login',
      cdrUrl = 'https://pabx.evence.com.br/cdr/pesquisar',
      email = 'suporte@interativanet.com.br',
      senha = 'smk03657',
      dataInicio, // YYYY-MM-DD
      dataFim,    // YYYY-MM-DD
      tipoChamada = 'IN',
    } = req.query as Record<string, string>;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'dataInicio e dataFim são obrigatórios' });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Heartbeat to prevent intermediate proxies from dropping idle connection
    const heartbeatInterval = setInterval(() => {
      res.write(': ping\n\n');
    }, 10000);

    req.on('close', () => {
      clearInterval(heartbeatInterval);
    });

    try {
      // 1. Format dates from YYYY-MM-DD to DD-MM-YYYY
      const [anoI, mesI, diaI] = dataInicio.split('-');
      const [anoF, mesF, diaF] = dataFim.split('-');
      const dataInicioStr = `${diaI}-${mesI}-${anoI}`;
      const dataFimStr = `${diaF}-${mesF}-${anoF}`;

      const cacheKey = `${email}_${dataInicioStr}_${dataFimStr}_${tipoChamada}`;
      const cached = queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log(`[PABX Cache] Retornando ${cached.dados.length} registros em cache para ${cacheKey}`);
        sendEvent('progress', {
          page: 1,
          totalPages: 1,
          totalLoaded: cached.dados.length,
          message: 'Dados recuperados do cache rápido!',
        });
        sendEvent('complete', {
          totalRegistros: cached.dados.length,
          dados: cached.dados,
          source: 'cache',
        });
        clearInterval(heartbeatInterval);
        return res.end();
      }

      sendEvent('status', { message: 'Autenticando no PABX Evence...' });
      const cookies = await getPabxSession(loginUrl, email, senha);

      sendEvent('status', { message: 'Conectado! Buscando página 1 do relatório...' });

      // Fetch page 1
      const page1Html = await fetchCdrPage(cdrUrl, cookies, dataInicioStr, dataFimStr, tipoChamada, 1);
      const { records: page1Records, totalPagesFromHtml } = parseCdrTable(page1Html);

      let totalPages = totalPagesFromHtml || 1;
      const allRecords: CallRecordParsed[] = [...page1Records];

      sendEvent('page', {
        page: 1,
        totalPages,
        newRecords: page1Records,
        totalCallsSoFar: allRecords.length,
        message: `Página 1 de ${totalPages} carregada (${allRecords.length} ligações)`,
      });

      // If more pages exist, fetch in 2-page batches to accelerate while keeping stable
      let currentPage = 2;
      while (currentPage <= totalPages) {
        const pagesToFetch: number[] = [];
        pagesToFetch.push(currentPage);
        if (currentPage + 1 <= totalPages) {
          pagesToFetch.push(currentPage + 1);
        }

        sendEvent('status', {
          message: `Carregando páginas ${pagesToFetch.join(' e ')} de ${totalPages}...`,
        });

        const batchResults = await Promise.all(
          pagesToFetch.map(async (p) => {
            const html = await fetchCdrPage(cdrUrl, cookies, dataInicioStr, dataFimStr, tipoChamada, p);
            return { page: p, ...parseCdrTable(html) };
          })
        );

        let hasNewRows = false;
        for (const resItem of batchResults) {
          if (resItem.records.length > 0) {
            hasNewRows = true;
            allRecords.push(...resItem.records);
            sendEvent('page', {
              page: resItem.page,
              totalPages,
              newRecords: resItem.records,
              totalCallsSoFar: allRecords.length,
              message: `Página ${resItem.page} de ${totalPages} carregada (${allRecords.length} ligações no período)`,
            });
          }
          if (resItem.totalPagesFromHtml && resItem.totalPagesFromHtml > totalPages) {
            totalPages = resItem.totalPagesFromHtml;
          }
        }

        if (!hasNewRows) {
          console.log('[PABX] Fim dos registros da paginação.');
          break;
        }

        currentPage += pagesToFetch.length;
        // Small breathing delay
        await new Promise((r) => setTimeout(r, 150));
      }

      // Save to cache
      queryCache.set(cacheKey, { timestamp: Date.now(), dados: allRecords });

      sendEvent('complete', {
        totalRegistros: allRecords.length,
        totalPages,
        dados: allRecords,
        source: 'live',
      });

      clearInterval(heartbeatInterval);
      res.end();
    } catch (err: any) {
      console.error('[PABX Stream Error]', err);
      clearInterval(heartbeatInterval);
      sendEvent('error', {
        message: err.message || 'Erro durante a consulta das páginas do PABX.',
      });
      res.end();
    }
  });

  // Standard POST endpoint (uses cache and returns full month)
  app.post('/api/pabx/consultar', async (req, res) => {
    const {
      loginUrl = 'https://pabx.evence.com.br/login',
      cdrUrl = 'https://pabx.evence.com.br/cdr/pesquisar',
      email = 'suporte@interativanet.com.br',
      senha = 'smk03657',
      dataInicio,
      dataFim,
      tipoChamada = 'IN',
      maxPaginas = 100, // allow full month (up to 100 pages)
    } = req.body;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'dataInicio e dataFim são obrigatórios' });
    }

    try {
      const [anoI, mesI, diaI] = dataInicio.split('-');
      const [anoF, mesF, diaF] = dataFim.split('-');
      const dataInicioStr = `${diaI}-${mesI}-${anoI}`;
      const dataFimStr = `${diaF}-${mesF}-${anoF}`;

      const cacheKey = `${email}_${dataInicioStr}_${dataFimStr}_${tipoChamada}`;
      const cached = queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return res.json({
          success: true,
          source: 'cache',
          totalRegistros: cached.dados.length,
          dados: cached.dados,
        });
      }

      const cookies = await getPabxSession(loginUrl, email, senha);
      const page1Html = await fetchCdrPage(cdrUrl, cookies, dataInicioStr, dataFimStr, tipoChamada, 1);
      const { records: page1Records, totalPagesFromHtml } = parseCdrTable(page1Html);

      const totalPages = Math.min(totalPagesFromHtml || 1, maxPaginas);
      const allRecords: CallRecordParsed[] = [...page1Records];

      let currentPage = 2;
      while (currentPage <= totalPages) {
        const pagesToFetch = [currentPage];
        if (currentPage + 1 <= totalPages) pagesToFetch.push(currentPage + 1);

        const batchResults = await Promise.all(
          pagesToFetch.map(async (p) => {
            const html = await fetchCdrPage(cdrUrl, cookies, dataInicioStr, dataFimStr, tipoChamada, p);
            return parseCdrTable(html);
          })
        );

        let hasNewRows = false;
        for (const resItem of batchResults) {
          if (resItem.records.length > 0) {
            hasNewRows = true;
            allRecords.push(...resItem.records);
          }
        }
        if (!hasNewRows) break;
        currentPage += pagesToFetch.length;
        await new Promise((r) => setTimeout(r, 150));
      }

      queryCache.set(cacheKey, { timestamp: Date.now(), dados: allRecords });

      return res.json({
        success: true,
        source: 'live',
        totalRegistros: allRecords.length,
        paginasConsultadas: currentPage - 1,
        dados: allRecords,
      });
    } catch (error: any) {
      console.error('[PABX] Erro ao consultar PABX:', error);
      return res.status(502).json({
        success: false,
        source: 'failed',
        error: error.message || 'Falha ao conectar com o PABX Evence',
      });
    }
  });

  // Serve static files or Vite dev middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PABX Server] Pronto em http://0.0.0.0:${PORT}`);
  });
}

startServer();
