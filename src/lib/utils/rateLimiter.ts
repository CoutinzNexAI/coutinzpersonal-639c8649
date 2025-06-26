const MOCKUP_REQUEST_LIMIT = 3; // Máximo de 3 pedidos...
const MOCKUP_REQUEST_WINDOW_MS = 60 * 1000; // ...por minuto (60,000 ms)
const STORAGE_KEY = 'mockup_request_timestamps';

export const RateLimiter = {
  checkRequestLimit: (): { allowed: boolean; message: string } => {
    const now = Date.now();
    const timestamps: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    // Filtra os timestamps que ainda estão dentro da janela de 1 minuto
    const recentTimestamps = timestamps.filter(ts => now - ts < MOCKUP_REQUEST_WINDOW_MS);

    if (recentTimestamps.length >= MOCKUP_REQUEST_LIMIT) {
      const oldestRequest = recentTimestamps[0];
      const secondsToWait = Math.ceil((MOCKUP_REQUEST_WINDOW_MS - (now - oldestRequest)) / 1000);
      return {
        allowed: false,
        message: `Demasiadas tentativas. Por favor, aguarde ${secondsToWait} segundos.`,
      };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentTimestamps)); // Limpa os antigos
    return { allowed: true, message: 'OK' };
  },

  recordRequest: (): void => {
    const now = Date.now();
    const timestamps: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    timestamps.push(now);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
  },
}; 