const ENDPOINT = 'https://analytics.blasat.com/api/track';

let _project = '';
let _tab = '';
let _batch: object[] = [];
let _timer: ReturnType<typeof setInterval> | null = null;

function flush() {
  if (!_batch.length) return;
  const payload = JSON.stringify(_batch);
  _batch = [];
  navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }));
}

function push(event: object) {
  _batch.push(event);
  if (_batch.length >= 10) flush();
}

export function initTracker(project: string) {
  _project = project;
  push({ project, event: 'pageview', tab: document.title, timestamp: Date.now() });
  _timer = setInterval(flush, 15_000);
  window.addEventListener('pagehide', flush);
}

export function setTab(tab: string) {
  if (tab === _tab) return;
  _tab = tab;
  push({ project: _project, event: 'pageview', tab, timestamp: Date.now() });
}

export function trackClick(label: string) {
  push({ project: _project, event: 'click', label, timestamp: Date.now() });
}

export function destroyTracker() {
  if (_timer) clearInterval(_timer);
  flush();
}
