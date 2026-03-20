const ALPHA_VANTAGE_KEY = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_KEY || '';
const MARKET_PROXY_BASE = process.env.EXPO_PUBLIC_MARKET_PROXY_BASE || '';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const BINANCE_BASE = 'https://api.binance.com/api/v3';

export type AssetType = 'stock' | 'crypto' | 'commodity' | 'index';

export type PriceResult = {
  ticker: string;
  price: number;
  currency: string;
};

export type SearchResult = {
  ticker: string;
  name: string;
  type: AssetType;
  exchange?: string;
};

export type HistoricalPrice = {
  date: string;
  price: number;
};

/* ═══════════════════════════════════════════════════════════════════
   POPULAR ASSETS — quick selection grid
   ═══════════════════════════════════════════════════════════════════ */

const POPULAR_STOCKS: SearchResult[] = [
  { ticker: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', type: 'stock', exchange: 'NASDAQ' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ' },
  { ticker: 'TSLA', name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', exchange: 'NASDAQ' },
  { ticker: 'META', name: 'Meta Platforms', type: 'stock', exchange: 'NASDAQ' },
  { ticker: 'JPM', name: 'JPMorgan Chase', type: 'stock', exchange: 'NYSE' },
  { ticker: 'V', name: 'Visa Inc.', type: 'stock', exchange: 'NYSE' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', type: 'stock', exchange: 'NYSE' },
  { ticker: 'WMT', name: 'Walmart Inc.', type: 'stock', exchange: 'NYSE' },
  { ticker: 'DIS', name: 'Walt Disney Co.', type: 'stock', exchange: 'NYSE' },
  { ticker: 'NFLX', name: 'Netflix Inc.', type: 'stock', exchange: 'NASDAQ' },
  { ticker: 'AMD', name: 'AMD Inc.', type: 'stock', exchange: 'NASDAQ' },
  { ticker: 'BA', name: 'Boeing Co.', type: 'stock', exchange: 'NYSE' },
  { ticker: 'KO', name: 'Coca-Cola Co.', type: 'stock', exchange: 'NYSE' },
];

const POPULAR_INDICES: SearchResult[] = [
  { ticker: 'SPY', name: 'S&P 500 (ETF)', type: 'index', exchange: 'NYSE' },
  { ticker: 'QQQ', name: 'Nasdaq 100 (ETF)', type: 'index', exchange: 'NASDAQ' },
  { ticker: 'DIA', name: 'Dow Jones (ETF)', type: 'index', exchange: 'NYSE' },
  { ticker: 'IWM', name: 'Russell 2000 (ETF)', type: 'index', exchange: 'NYSE' },
  { ticker: 'VTI', name: 'Total Stock Market (ETF)', type: 'index', exchange: 'NYSE' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 (ETF)', type: 'index', exchange: 'NYSE' },
  { ticker: 'EWZ', name: 'MSCI Brazil (ETF)', type: 'index', exchange: 'NYSE' },
  { ticker: 'VEA', name: 'FTSE Developed Markets', type: 'index', exchange: 'NYSE' },
  { ticker: 'VWO', name: 'FTSE Emerging Markets', type: 'index', exchange: 'NYSE' },
  { ticker: 'GLD', name: 'Gold ETF (SPDR)', type: 'index', exchange: 'NYSE' },
];

const POPULAR_CRYPTO: SearchResult[] = [
  { ticker: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { ticker: 'ETH', name: 'Ethereum', type: 'crypto' },
  { ticker: 'SOL', name: 'Solana', type: 'crypto' },
  { ticker: 'ADA', name: 'Cardano', type: 'crypto' },
  { ticker: 'XRP', name: 'Ripple', type: 'crypto' },
  { ticker: 'DOGE', name: 'Dogecoin', type: 'crypto' },
  { ticker: 'DOT', name: 'Polkadot', type: 'crypto' },
  { ticker: 'AVAX', name: 'Avalanche', type: 'crypto' },
  { ticker: 'LINK', name: 'Chainlink', type: 'crypto' },
  { ticker: 'UNI', name: 'Uniswap', type: 'crypto' },
];

const POPULAR_COMMODITIES: SearchResult[] = [
  { ticker: 'GOLD', name: 'Gold (XAU)', type: 'commodity' },
  { ticker: 'SILVER', name: 'Silver (XAG)', type: 'commodity' },
  { ticker: 'OIL', name: 'Crude Oil WTI', type: 'commodity' },
  { ticker: 'BRENT', name: 'Brent Crude Oil', type: 'commodity' },
];

export const POPULAR_ASSETS: SearchResult[] = [
  ...POPULAR_STOCKS,
  ...POPULAR_INDICES,
  ...POPULAR_CRYPTO,
  ...POPULAR_COMMODITIES,
];

/* ═══════════════════════════════════════════════════════════════════
   SYMBOL / ID MAPS
   ═══════════════════════════════════════════════════════════════════ */

// Yahoo Finance symbols for commodities
const COMMODITY_YAHOO_MAP: Record<string, string> = {
  GOLD: 'GC=F',
  SILVER: 'SI=F',
  OIL: 'CL=F',
  BRENT: 'BZ=F',
};

// ETF proxies as fallback for commodities
const COMMODITY_ETF_PROXY: Record<string, string> = {
  GOLD: 'GLD',
  SILVER: 'SLV',
  OIL: 'USO',
  BRENT: 'BNO',
  NATGAS: 'UNG',
  COPPER: 'CPER',
};

const COMMODITY_ALIASES: Record<string, string> = {
  GOLD: 'GOLD',
  XAU: 'GOLD',
  XAUUSD: 'GOLD',
  GC: 'GOLD',
  'GC=F': 'GOLD',
  SILVER: 'SILVER',
  XAG: 'SILVER',
  XAGUSD: 'SILVER',
  SI: 'SILVER',
  'SI=F': 'SILVER',
  OIL: 'OIL',
  WTI: 'OIL',
  CRUDE: 'OIL',
  CL: 'OIL',
  'CL=F': 'OIL',
  BRENT: 'BRENT',
  BRN: 'BRENT',
  BZ: 'BRENT',
  'BZ=F': 'BRENT',
  NATGAS: 'NATGAS',
  'NATURAL GAS': 'NATGAS',
  NATURALGAS: 'NATGAS',
  NG: 'NATGAS',
  'NG=F': 'NATGAS',
  COPPER: 'COPPER',
  HG: 'COPPER',
  'HG=F': 'COPPER',
};

const CRYPTO_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  XRP: 'ripple',
  DOT: 'polkadot',
  LINK: 'chainlink',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  POL: 'matic-network',
  UNI: 'uniswap',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
  BNB: 'binancecoin',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  NEAR: 'near',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  SUI: 'sui',
  FTM: 'fantom',
  AAVE: 'aave',
  CRV: 'curve-dao-token',
  PEPE: 'pepe',
  RENDER: 'render-token',
};

// Binance USDT pair symbols (for live price fallback — no API key, very reliable)
const BINANCE_SYMBOL_MAP: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  BNB: 'BNBUSDT',
  SOL: 'SOLUSDT',
  XRP: 'XRPUSDT',
  ADA: 'ADAUSDT',
  DOGE: 'DOGEUSDT',
  DOT: 'DOTUSDT',
  AVAX: 'AVAXUSDT',
  LINK: 'LINKUSDT',
  UNI: 'UNIUSDT',
  MATIC: 'MATICUSDT',
  POL: 'POLUSDT',
  LTC: 'LTCUSDT',
  ATOM: 'ATOMUSDT',
  NEAR: 'NEARUSDT',
  APT: 'APTUSDT',
  ARB: 'ARBUSDT',
  OP: 'OPUSDT',
  SUI: 'SUIUSDT',
  PEPE: 'PEPEUSDT',
  SHIB: 'SHIBUSDT',
};

/* ═══════════════════════════════════════════════════════════════════
   PRICE CACHE
   ═══════════════════════════════════════════════════════════════════ */

const priceCache: Record<string, { price: number; ts: number }> = {};
const CACHE_TTL_MS = 90_000; // 90s

function getCached(key: string): number | null {
  const now = Date.now();
  const entry = priceCache[key];
  if (entry && now - entry.ts < CACHE_TTL_MS) return entry.price;
  // Clean expired entries to prevent memory leak
  if (entry) delete priceCache[key];
  const keys = Object.keys(priceCache);
  if (keys.length > 200) {
    for (const k of keys) {
      if (now - priceCache[k].ts >= CACHE_TTL_MS) delete priceCache[k];
    }
  }
  return null;
}

function setCache(key: string, price: number) {
  priceCache[key] = { price, ts: Date.now() };
}

/* ═══════════════════════════════════════════════════════════════════
   FETCH WITH TIMEOUT — prevents hanging requests in React Native
   ═══════════════════════════════════════════════════════════════════ */

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, opts?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } catch (e: any) {
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   YAHOO FINANCE — query1 + query2 with fast fallback (no crumb)
   ═══════════════════════════════════════════════════════════════════ */

const YAHOO_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

function parseJinaWrappedJson(text: string): any | null {
  const marker = 'Markdown Content:';
  const idx = text.indexOf(marker);
  const payload = idx >= 0 ? text.slice(idx + marker.length).trim() : text.trim();
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

async function fetchFromOwnProxy(path: string): Promise<any | null> {
  if (!MARKET_PROXY_BASE) return null;
  try {
    const base = MARKET_PROXY_BASE.replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    const res = await fetchWithTimeout(`${base}${p}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchYahooChart(base: string, symbol: string): Promise<number | null> {
  // Preferred fallback: first-party market proxy
  const proxyJson = await fetchFromOwnProxy(`/yahoo/chart?symbol=${encodeURIComponent(symbol)}&interval=1d&range=1d`);
  const proxyPrice = proxyJson?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (typeof proxyPrice === 'number' && proxyPrice > 0) return proxyPrice;

  try {
    const url = `${base}/${encodeURIComponent(symbol)}?interval=1d&range=1d&region=US&lang=en-US`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': YAHOO_UA } });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const price = result?.meta?.regularMarketPrice;
    if (typeof price === 'number' && price > 0) return price;
  } catch {
    // Web CORS fallback through read-only proxy
    try {
      const proxyUrl = `https://r.jina.ai/http://${base.replace('https://', '')}/${encodeURIComponent(symbol)}?interval=1d&range=1d&region=US&lang=en-US`;
      const proxyRes = await fetchWithTimeout(proxyUrl, { headers: { 'User-Agent': YAHOO_UA } });
      if (!proxyRes.ok) return null;
      const text = await proxyRes.text();
      const json = parseJinaWrappedJson(text);
      const result = json?.chart?.result?.[0];
      const price = result?.meta?.regularMarketPrice;
      if (typeof price === 'number' && price > 0) return price;
    } catch { /* next */ }
  }
  return null;
}

async function fetchViaYahoo(symbol: string): Promise<number | null> {
  // Try query2 first (more stable), then query1 as fallback
  return (
    (await fetchYahooChart('https://query2.finance.yahoo.com/v8/finance/chart', symbol)) ??
    (await fetchYahooChart('https://query1.finance.yahoo.com/v8/finance/chart', symbol))
  );
}

function buildYahooSymbolCandidates(rawTicker: string): string[] {
  const t = String(rawTicker || '').trim();
  if (!t) return [];
  const set = new Set<string>();
  const add = (s: string) => {
    const v = s.trim();
    if (v) set.add(v);
  };
  add(t);
  add(t.toUpperCase());
  // Some brokers/APIs use dot while Yahoo expects dash (e.g. BRK.B -> BRK-B)
  if (t.includes('.')) add(t.replace(/\./g, '-'));
  // Keep inverse variant too for symbols coming from other providers
  if (t.includes('-')) add(t.replace(/-/g, '.'));
  return Array.from(set);
}

function normalizeCommodityTicker(rawTicker: string): string {
  const raw = String(rawTicker || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  return COMMODITY_ALIASES[raw] || raw;
}

type CommodityResolution = {
  canonical: string;
  yahooCandidates: string[];
  etfCandidates: string[];
};

function resolveCommodityCandidates(rawTicker: string): CommodityResolution {
  const canonical = normalizeCommodityTicker(rawTicker);
  const rawUpper = String(rawTicker || '').trim().toUpperCase();
  const yahoo = new Set<string>();
  const etfs = new Set<string>();
  const addYahoo = (v?: string) => {
    if (v) yahoo.add(v);
  };
  const addEtf = (v?: string) => {
    if (v) etfs.add(v);
  };

  addYahoo(COMMODITY_YAHOO_MAP[canonical]);
  addEtf(COMMODITY_ETF_PROXY[canonical]);
  addYahoo(COMMODITY_YAHOO_MAP[rawUpper]);
  addEtf(COMMODITY_ETF_PROXY[rawUpper]);

  for (const candidate of buildYahooSymbolCandidates(rawUpper)) {
    addYahoo(candidate);
  }

  return {
    canonical,
    yahooCandidates: Array.from(yahoo),
    etfCandidates: Array.from(etfs),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   STOOQ — Free CSV price data, no API key, works globally
   ═══════════════════════════════════════════════════════════════════ */

async function fetchViaStooq(ticker: string): Promise<number | null> {
  try {
    // Stooq uses .us suffix for US stocks
    const symbol = `${ticker.toLowerCase()}.us`;
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;
    const values = lines[1].split(',');
    // CSV format: Symbol,Date,Time,Open,High,Low,Close,Volume
    const close = parseFloat(values[6]);
    if (Number.isFinite(close) && close > 0) return close;
  } catch { /* next */ }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   ALPHA VANTAGE — fallback with API key
   ═══════════════════════════════════════════════════════════════════ */

async function fetchViaAlphaVantage(ticker: string): Promise<number | null> {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${ALPHA_VANTAGE_KEY}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const json = await res.json();
    const quote = json['Global Quote'];
    if (quote && quote['05. price']) {
      const price = parseFloat(quote['05. price']);
      if (Number.isFinite(price) && price > 0) return price;
    }
  } catch { /* exhausted */ }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   STOCK / INDEX PRICES
   ═══════════════════════════════════════════════════════════════════ */

export async function fetchStockPrice(ticker: string): Promise<number> {
  const key = `stock:${ticker}`;
  const cached = getCached(key);
  if (cached !== null) return cached;

  let yahooPrice: number | null = null;
  for (const symbol of buildYahooSymbolCandidates(ticker)) {
    yahooPrice = await fetchViaYahoo(symbol);
    if (yahooPrice !== null && yahooPrice > 0) break;
  }

  const price =
    yahooPrice ??
    (await fetchViaStooq(ticker)) ??
    (await fetchViaAlphaVantage(ticker));

  if (price !== null && price > 0) {
    setCache(key, price);
    return price;
  }
  throw new Error(`No price data for ${ticker}`);
}

export async function fetchIndexPrice(ticker: string): Promise<number> {
  return fetchStockPrice(ticker);
}

/* ═══════════════════════════════════════════════════════════════════
   COMMODITY PRICES — Yahoo Finance futures (GC=F, SI=F, CL=F, BZ=F)
   ═══════════════════════════════════════════════════════════════════ */

export async function fetchCommodityPrice(ticker: string): Promise<number> {
  const resolved = resolveCommodityCandidates(ticker);
  const key = `commodity:${resolved.canonical}`;
  const cached = getCached(key);
  if (cached !== null) return cached;

  // 1) Futures / direct symbols first
  for (const yahooSymbol of resolved.yahooCandidates) {
    const price = await fetchViaYahoo(yahooSymbol);
    if (price !== null && price > 0) {
      setCache(key, price);
      return price;
    }
  }

  // 2) ETF proxy fallback
  for (const etfTicker of resolved.etfCandidates) {
    const price = await fetchViaYahoo(etfTicker);
    if (price !== null && price > 0) {
      setCache(key, price);
      return price;
    }
  }

  // 3) Final fallback for commodity aliases that map to ETF-like symbols
  for (const etfTicker of resolved.etfCandidates) {
    const avPrice = await fetchViaAlphaVantage(etfTicker);
    if (avPrice !== null && avPrice > 0) {
      setCache(key, avPrice);
      return avPrice;
    }
  }

  throw new Error(`No price data for commodity ${ticker}`);
}

/* ═══════════════════════════════════════════════════════════════════
   CRYPTO PRICES — CoinGecko (free, reliable)
   ═══════════════════════════════════════════════════════════════════ */

export async function fetchCryptoPrice(ticker: string, vsCurrency = 'usd'): Promise<number> {
  const normalized = ticker.toUpperCase();
  const coinId = CRYPTO_ID_MAP[normalized] || normalized.toLowerCase();
  const key = `crypto:${coinId}:${vsCurrency}`;
  const cached = getCached(key);
  if (cached !== null) return cached;

  try {
    const url = `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}`;
    const res = await fetchWithTimeout(url);
    const json = await res.json();
    const price = json[coinId]?.[vsCurrency];
    if (typeof price === 'number') {
      setCache(key, price);
      return price;
    }
  } catch { /* try Binance below */ }

  // Fallback: Binance (USD ≈ USDT for display), ensures Bitcoin etc. get updated price
  if (vsCurrency === 'usd') {
    const binancePrice = await fetchCryptoPriceBinance(ticker);
    if (binancePrice !== null && binancePrice > 0) {
      setCache(key, binancePrice);
      return binancePrice;
    }
  }
  throw new Error(`No price data for crypto ${ticker}`);
}

/* ═══════════════════════════════════════════════════════════════════
   BINANCE — live crypto prices (no API key, ideal for Bitcoin)
   ═══════════════════════════════════════════════════════════════════ */

async function fetchCryptoPriceBinance(ticker: string): Promise<number | null> {
  const symbol = BINANCE_SYMBOL_MAP[ticker.toUpperCase()];
  if (!symbol) return null;
  const key = `crypto_binance:${ticker.toUpperCase()}:usd`;
  const cached = getCached(key);
  if (cached !== null) return cached;

  try {
    const url = `${BINANCE_BASE}/ticker/price?symbol=${symbol}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const json = await res.json();
    const price = parseFloat(json?.price);
    if (Number.isFinite(price) && price > 0) {
      setCache(key, price);
      return price;
    }
  } catch { /* ignore */ }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   EXCHANGE RATES
   ═══════════════════════════════════════════════════════════════════ */

export async function fetchUsdBrlRate(): Promise<number> {
  const key = 'fx:USDBRL';
  const cached = getCached(key);
  if (cached !== null) return cached;

  // Primary: AwesomeAPI (free, reliable, no key)
  try {
    const res = await fetchWithTimeout('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    const json = await res.json();
    const rate = parseFloat(json['USDBRL']?.['bid']);
    if (Number.isFinite(rate) && rate > 0) {
      setCache(key, rate);
      return rate;
    }
  } catch { /* next */ }

  // Fallback: Yahoo Finance
  try {
    const price = await fetchViaYahoo('USDBRL=X');
    if (price !== null && price > 0) {
      setCache(key, price);
      return price;
    }
  } catch { /* fallback */ }

  throw new Error('USD/BRL rate unavailable');
}

export async function fetchEurUsdRate(): Promise<number> {
  const key = 'fx:EURUSD';
  const cached = getCached(key);
  if (cached !== null) return cached;

  // Primary: AwesomeAPI
  try {
    const res = await fetchWithTimeout('https://economia.awesomeapi.com.br/json/last/EUR-USD');
    const json = await res.json();
    const rate = parseFloat(json['EURUSD']?.['bid']);
    if (Number.isFinite(rate) && rate > 0) {
      setCache(key, rate);
      return rate;
    }
  } catch { /* next */ }

  // Fallback: Yahoo Finance
  try {
    const price = await fetchViaYahoo('EURUSD=X');
    if (price !== null && price > 0) {
      setCache(key, price);
      return price;
    }
  } catch { /* fallback */ }

  throw new Error('EUR/USD rate unavailable');
}

/* ═══════════════════════════════════════════════════════════════════
   GENERIC FETCH
   ═══════════════════════════════════════════════════════════════════ */

export async function fetchAssetPrice(ticker: string, assetType: AssetType): Promise<number> {
  switch (assetType) {
    case 'crypto':
      return fetchCryptoPrice(ticker);
    case 'commodity':
      return fetchCommodityPrice(ticker);
    case 'index':
      return fetchIndexPrice(ticker);
    case 'stock':
    default:
      return fetchStockPrice(ticker);
  }
}

export async function fetchAllPrices(
  assets: { ticker: string; type: AssetType }[]
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  // Crypto: try Binance first (no rate limit, very reliable), then CoinGecko for any missing
  const cryptoTickers = assets.filter((a) => String(a.type).toLowerCase() === 'crypto');
  if (cryptoTickers.length > 0) {
    // 1) Binance first — ensures Bitcoin and major crypto get live price
    for (const a of cryptoTickers) {
      const price = await fetchCryptoPriceBinance(a.ticker);
      if (price !== null && price > 0) {
        results[a.ticker] = price;
        const coinId = CRYPTO_ID_MAP[a.ticker.toUpperCase()] || a.ticker.toLowerCase();
        setCache(`crypto:${coinId}:usd`, price);
      }
    }
    // 2) CoinGecko for any still missing
    const missing = cryptoTickers.filter((a) => !(a.ticker in results));
    if (missing.length > 0) {
      try {
        const coinIds = missing
          .map((a) => CRYPTO_ID_MAP[a.ticker.toUpperCase()] || a.ticker.toLowerCase())
          .join(',');
        const url = `${COINGECKO_BASE}/simple/price?ids=${coinIds}&vs_currencies=usd`;
        const res = await fetchWithTimeout(url);
        const json = await res.json();
        for (const a of missing) {
          const coinId = CRYPTO_ID_MAP[a.ticker.toUpperCase()] || a.ticker.toLowerCase();
          const price = json[coinId]?.usd;
          if (typeof price === 'number' && price > 0) {
            results[a.ticker] = price;
            setCache(`crypto:${coinId}:usd`, price);
          }
        }
      } catch { /* keep zeros for missing */ }
    }
  }

  // Fetch stock/index/commodity prices with capped concurrency
  const nonCrypto = assets.filter((a) => !(a.ticker in results));
  const CONCURRENCY_LIMIT = 5;
  for (let i = 0; i < nonCrypto.length; i += CONCURRENCY_LIMIT) {
    const chunk = nonCrypto.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(
      chunk.map(async ({ ticker, type }) => {
        try {
          if (type === 'commodity') {
            const price = await fetchCommodityPrice(ticker);
            results[ticker] = Number.isFinite(price) && price > 0 ? price : 0;
            return;
          }

          const key = `stock:${ticker}`;
          const cached = getCached(key);
          if (cached !== null) {
            results[ticker] = cached;
            return;
          }

          let yahooPrice: number | null = null;
          for (const symbol of buildYahooSymbolCandidates(ticker)) {
            yahooPrice = await fetchViaYahoo(symbol);
            if (yahooPrice !== null && yahooPrice > 0) break;
          }

          const price =
            yahooPrice ??
            (await fetchViaStooq(ticker)) ??
            (await fetchViaAlphaVantage(ticker));
          if (price !== null && price > 0) {
            results[ticker] = price;
            setCache(key, price);
          } else {
            results[ticker] = 0;
          }
        } catch {
          results[ticker] = 0;
        }
      })
    );
  }
  return results;
}

/* ═══════════════════════════════════════════════════════════════════
   SEARCH ASSETS
   ═══════════════════════════════════════════════════════════════════ */

export async function searchAssets(query: string): Promise<SearchResult[]> {
  const q = query.trim().toUpperCase();
  if (q.length < 1) return [];

  // Local matches from popular assets
  const localMatches = POPULAR_ASSETS.filter(
    (a) => a.ticker.includes(q) || a.name.toUpperCase().includes(q)
  );
  const seen = new Set(localMatches.map((a) => `${a.ticker}:${a.type}`));

  // Yahoo Finance search for stocks/indices
  try {
    const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
    const res = await fetchWithTimeout(searchUrl, { headers: { 'User-Agent': YAHOO_UA } });
    const json = await res.json();
    const quotes = json.quotes || [];
    for (const m of quotes) {
      const t = m.symbol;
      if (!t) continue;
      const quoteType = (m.quoteType || '').toUpperCase();
      if (quoteType === 'CRYPTOCURRENCY') continue; // handled by CoinGecko
      const key = `${t}:stock`;
      if (!seen.has(key)) {
        localMatches.push({
          ticker: t,
          name: m.shortname || m.longname || t,
          type: quoteType === 'ETF' ? 'index' : 'stock',
          exchange: m.exchange,
        });
        seen.add(key);
      }
    }
  } catch { /* use local matches only */ }

  // CoinGecko search for crypto
  try {
    const url = `${COINGECKO_BASE}/search?query=${encodeURIComponent(q)}`;
    const res = await fetchWithTimeout(url);
    const json = await res.json();
    const coins = json.coins || [];
    for (const c of coins.slice(0, 4)) {
      const t = (c.symbol || '').toUpperCase();
      const key = `${t}:crypto`;
      if (!seen.has(key)) {
        localMatches.push({ ticker: t, name: c.name, type: 'crypto' });
        seen.add(key);
      }
    }
  } catch { /* use what we have */ }

  return localMatches.slice(0, 15);
}

/* ═══════════════════════════════════════════════════════════════════
   HISTORICAL PRICES
   ═══════════════════════════════════════════════════════════════════ */

export async function fetchHistoricalPrices(
  ticker: string,
  assetType: AssetType,
  days: number = 30
): Promise<HistoricalPrice[]> {
  switch (assetType) {
    case 'crypto':
      return fetchCryptoHistory(ticker, days);
    case 'commodity':
      return fetchCommodityHistory(ticker, days);
    case 'index':
    case 'stock':
    default:
      return fetchStockHistory(ticker, days);
  }
}

async function parseYahooChartJson(json: any): Promise<HistoricalPrice[]> {
  const result = json?.chart?.result?.[0];
  if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) return [];

  const timestamps: number[] = result.timestamp;
  const closes: (number | null)[] = result.indicators.quote[0].close;

  const history: HistoricalPrice[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close !== null && close !== undefined && Number.isFinite(close)) {
      history.push({
        date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
        price: close,
      });
    }
  }
  return history;
}

async function fetchYahooHistory(symbol: string, days: number): Promise<HistoricalPrice[]> {
  const interval = days <= 90 ? '1d' : days <= 365 ? '1d' : '1wk';
  const bases = ['https://query2.finance.yahoo.com/v8/finance/chart', 'https://query1.finance.yahoo.com/v8/finance/chart'];

  // Strategy 1: period1/period2 timestamps (more reliable, avoids some blocks)
  const now = Math.floor(Date.now() / 1000);
  const period1 = now - days * 86400;

  // Preferred fallback: first-party market proxy
  const ownProxyPeriodJson = await fetchFromOwnProxy(
    `/yahoo/history?symbol=${encodeURIComponent(symbol)}&period1=${period1}&period2=${now}&interval=${interval}`
  );
  if (ownProxyPeriodJson) {
    const ownHistory = await parseYahooChartJson(ownProxyPeriodJson);
    if (ownHistory.length > 0) return ownHistory;
  }

  for (const base of bases) {
    try {
      const url = `${base}/${encodeURIComponent(symbol)}?period1=${period1}&period2=${now}&interval=${interval}&region=US&lang=en-US`;
      const res = await fetchWithTimeout(url, { headers: { 'User-Agent': YAHOO_UA } });
      if (!res.ok) continue;
      const json = await res.json();
      const history = await parseYahooChartJson(json);
      if (history.length > 0) return history;
    } catch {
      // Web CORS fallback through read-only proxy
      try {
        const proxyUrl = `https://r.jina.ai/http://${base.replace('https://', '')}/${encodeURIComponent(symbol)}?period1=${period1}&period2=${now}&interval=${interval}&region=US&lang=en-US`;
        const proxyRes = await fetchWithTimeout(proxyUrl, { headers: { 'User-Agent': YAHOO_UA } });
        if (!proxyRes.ok) continue;
        const text = await proxyRes.text();
        const proxyJson = parseJinaWrappedJson(text);
        const history = await parseYahooChartJson(proxyJson);
        if (history.length > 0) return history;
      } catch { /* try next */ }
    }
  }

  // Strategy 2: range parameter (fallback for edge cases)
  const range = days <= 7 ? '5d' : days <= 30 ? '1mo' : days <= 90 ? '3mo' : days <= 365 ? '1y' : days <= 1825 ? '5y' : 'max';
  for (const base of bases) {
    try {
      const url = `${base}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&region=US&lang=en-US`;
      const res = await fetchWithTimeout(url, { headers: { 'User-Agent': YAHOO_UA } });
      if (!res.ok) continue;
      const json = await res.json();
      const history = await parseYahooChartJson(json);
      if (history.length > 0) return history;
    } catch {
      // Web CORS fallback through read-only proxy
      try {
        const proxyUrl = `https://r.jina.ai/http://${base.replace('https://', '')}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&region=US&lang=en-US`;
        const proxyRes = await fetchWithTimeout(proxyUrl, { headers: { 'User-Agent': YAHOO_UA } });
        if (!proxyRes.ok) continue;
        const text = await proxyRes.text();
        const proxyJson = parseJinaWrappedJson(text);
        const history = await parseYahooChartJson(proxyJson);
        if (history.length > 0) return history;
      } catch { /* try next base */ }
    }
  }
  return [];
}

async function fetchBinanceHistory(symbol: string, days: number): Promise<HistoricalPrice[]> {
  // Binance: daily candles for short/medium range, weekly for long range
  const interval = days > 365 ? '1w' : '1d';
  const limit = Math.max(2, Math.min(1000, interval === '1w' ? Math.ceil(days / 7) : days));
  try {
    const url = `${BINANCE_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    const history: HistoricalPrice[] = rows
      .map((r: any[]) => {
        const ts = Number(r?.[0]);
        const close = parseFloat(r?.[4]);
        if (!Number.isFinite(ts) || !Number.isFinite(close) || close <= 0) return null;
        return { date: new Date(ts).toISOString().split('T')[0], price: close };
      })
      .filter(Boolean) as HistoricalPrice[];
    return history;
  } catch {
    return [];
  }
}

async function fetchStooqHistory(ticker: string, days: number): Promise<HistoricalPrice[]> {
  try {
    const symbol = `${ticker.toLowerCase()}.us`;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}${m}${dd}`;
    };

    const interval = days > 365 ? 'w' : 'd';
    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&d1=${fmt(start)}&d2=${fmt(end)}&i=${interval}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];

    const text = await res.text();
    const lines = text.trim().split('\n');
    if (lines.length < 3) return []; // header + at least 2 data points

    const history: HistoricalPrice[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length < 5) continue;
      const date = cols[0].trim();
      const close = parseFloat(cols[4]);
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(close) && close > 0) {
        history.push({ date, price: close });
      }
    }

    // Stooq returns data newest-first; chart needs oldest-first
    if (history.length > 1 && history[0].date > history[1].date) {
      history.reverse();
    }

    return history;
  } catch {
    return [];
  }
}

async function fetchCryptoHistory(ticker: string, days: number): Promise<HistoricalPrice[]> {
  const normalized = ticker.toUpperCase();
  const coinId = CRYPTO_ID_MAP[normalized] || normalized.toLowerCase();

  // Try CoinGecko first (works for 1Y and often for longer with days=max)
  try {
    const cgDays = days > 365 ? 'max' : String(days);
    const url = `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${cgDays}`;
    const res = await fetchWithTimeout(url);
    const json = await res.json();
    const prices = json.prices || [];
    if (Array.isArray(prices) && prices.length > 0) {
      const step = Math.max(1, Math.floor(prices.length / 400));
      const all = prices
        .filter((_: any, i: number) => i % step === 0 || i === prices.length - 1)
        .map((p: [number, number]) => ({
          date: new Date(p[0]).toISOString().split('T')[0],
          price: p[1],
        }));
      if (all.length > 1) {
        const maxPoints = days > 365 ? Math.ceil(days / 7) : days;
        return all.slice(-Math.max(2, maxPoints));
      }
    }
  } catch { /* next fallback */ }

  // Fallback: Binance klines (mapped symbol first, then generic TICKERUSDT)
  const mappedSymbol = BINANCE_SYMBOL_MAP[normalized];
  if (mappedSymbol) {
    const bHistory = await fetchBinanceHistory(mappedSymbol, days);
    if (bHistory.length > 1) return bHistory;
  }
  const genericHistory = await fetchBinanceHistory(`${normalized}USDT`, days);
  if (genericHistory.length > 1) return genericHistory;

  // Last fallback: Yahoo Finance (BTC -> BTC-USD etc)
  const yahooSymbol = `${normalized}-USD`;
  const yahooHistory = await fetchYahooHistory(yahooSymbol, days);
  if (yahooHistory.length > 1) return yahooHistory;

  // No source available
  return [];
}

async function fetchAlphaVantageHistoryForCommodityProxy(symbol: string, days: number): Promise<HistoricalPrice[]> {
  try {
    const fn = days > 100 ? 'TIME_SERIES_WEEKLY' : 'TIME_SERIES_DAILY';
    const seriesKey = days > 100 ? 'Weekly Time Series' : 'Time Series (Daily)';
    const url = `https://www.alphavantage.co/query?function=${fn}&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_KEY}`;
    const res = await fetchWithTimeout(url);
    const json = await res.json();
    const series = json[seriesKey] || {};
    const allEntries = Object.entries(series);
    const targetPoints = fn === 'TIME_SERIES_WEEKLY' ? Math.ceil(days / 7) : days;
    const entries = allEntries.slice(0, Math.min(allEntries.length, Math.max(2, targetPoints)));
    if (entries.length > 0) {
      return entries.reverse().map(([date, vals]: [string, any]) => ({
        date,
        price: parseFloat(vals['4. close']),
      }));
    }
  } catch { /* exhausted */ }
  return [];
}

async function fetchStockHistory(ticker: string, days: number): Promise<HistoricalPrice[]> {
  // Primary: Yahoo Finance with symbol variants
  const yahooCandidates = buildYahooSymbolCandidates(ticker);
  for (const symbol of yahooCandidates) {
    const history = await fetchYahooHistory(symbol, days);
    if (history.length > 0) return history;
  }

  // Fallback 2: Stooq historical CSV (free, no API key, reliable for US stocks/ETFs)
  const stooqHistory = await fetchStooqHistory(ticker, days);
  if (stooqHistory.length > 1) return stooqHistory;

  // Fallback 3: Alpha Vantage
  try {
    const fn = days > 100 ? 'TIME_SERIES_WEEKLY' : 'TIME_SERIES_DAILY';
    const seriesKey = days > 100 ? 'Weekly Time Series' : 'Time Series (Daily)';
    const url = `https://www.alphavantage.co/query?function=${fn}&symbol=${encodeURIComponent(ticker)}&apikey=${ALPHA_VANTAGE_KEY}`;
    const res = await fetchWithTimeout(url);
    const json = await res.json();
    const series = json[seriesKey] || {};
    const allEntries = Object.entries(series);
    // Alpha Vantage devolve o histórico completo; recortar ao período pedido
    // Daily: ~1 ponto por dia; Weekly: ~1 ponto por semana
    const targetPoints = fn === 'TIME_SERIES_WEEKLY' ? Math.ceil(days / 7) : days;
    const entries = allEntries.slice(0, Math.min(allEntries.length, Math.max(2, targetPoints)));
    if (entries.length > 0) {
      return entries.reverse().map(([date, vals]: [string, any]) => ({
        date,
        price: parseFloat(vals['4. close']),
      }));
    }
  } catch { /* exhausted */ }
  return [];
}

async function fetchCommodityHistory(ticker: string, days: number): Promise<HistoricalPrice[]> {
  const normalized = ticker.toUpperCase();

  // Primary: Yahoo Finance futures
  const yahooSymbol = COMMODITY_YAHOO_MAP[normalized];
  if (yahooSymbol) {
    const history = await fetchYahooHistory(yahooSymbol, days);
    if (history.length > 0) return history;
  }

  // Fallback: ETF proxy history
  const etfProxy = COMMODITY_ETF_PROXY[normalized];
  if (etfProxy) {
    const etfHistory = await fetchYahooHistory(etfProxy, days);
    if (etfHistory.length > 0) return etfHistory;
    // Final fallback for commodities via Alpha Vantage on ETF proxy
    const avHistory = await fetchAlphaVantageHistoryForCommodityProxy(etfProxy, days);
    if (avHistory.length > 0) return avHistory;
  }
  return [];
}

/* ═══════════════════════════════════════════════════════════════════
   CACHE MANAGEMENT
   ═══════════════════════════════════════════════════════════════════ */

export function clearPriceCache() {
  Object.keys(priceCache).forEach((k) => delete priceCache[k]);
}
