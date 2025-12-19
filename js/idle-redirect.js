(() => {
  const IDLE_LIMIT_MS = 10 * 60 * 1000;
  let idleTimer = null;

  const isIndexPage = () => {
    const path = (window.location.pathname || '').toLowerCase();
    return path === '/' || path.endsWith('/index.html');
  };

  const redirectToIndex = () => {
    if (isIndexPage()) {
      return;
    }
    window.location.href = '/index.html';
  };

  const resetIdleTimer = () => {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
    }
    idleTimer = window.setTimeout(redirectToIndex, IDLE_LIMIT_MS);
  };

  const activityEvents = [
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart',
    'touchmove',
    'wheel',
    'scroll'
  ];

  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, resetIdleTimer, { passive: true });
  });

  resetIdleTimer();
})();
