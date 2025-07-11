// Rate Limiter para Mockups - GLOBAL (canecas, capas, cadernos, posters)
class GlobalMockupRateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number = 8; // ✅ Aumentado para permitir mais experimentação de posições
  private readonly timeWindow: number = 60000; // Por minuto (60 segundos)

  // ✅ VERIFICAR SE PODE FAZER REQUEST
  checkRequestLimit(): { allowed: boolean; message: string } {
    const now = Date.now();
    
    // Limpar requests antigos (fora da janela de tempo)
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);
    
    // Verificar se atingiu o limite
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const remainingTime = Math.ceil((this.timeWindow - (now - oldestRequest)) / 1000);
      
      return {
        allowed: false,
        message: `Muitos ajustes de posição. Aguarde ${remainingTime} segundos.`
      };
    }
    
    return { allowed: true, message: '' };
  }

  // ✅ REGISTAR NOVO REQUEST
  recordRequest(): void {
    this.requests.push(Date.now());
  }

  // ✅ OBTER INFORMAÇÕES DO RATE LIMITER (para debug)
  getStatus(): { requestCount: number; maxRequests: number; timeWindow: number } {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);
    
    return {
      requestCount: this.requests.length,
      maxRequests: this.maxRequests,
      timeWindow: this.timeWindow
    };
  }

  // ✅ RESET (para testes ou casos especiais)
  reset(): void {
    this.requests = [];
  }
}

// ✅ INSTÂNCIA SINGLETON GLOBAL
export const GlobalRateLimiter = new GlobalMockupRateLimiter();

// ✅ MANTER COMPATIBILIDADE COM CÓDIGO EXISTENTE (posters)
export const RateLimiter = GlobalRateLimiter; 