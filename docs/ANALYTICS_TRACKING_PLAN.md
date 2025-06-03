# 📊 PLANO DE TRACKING ANALYTICS - PICTUZ

## **OBJETIVOS PRINCIPAIS**
- Entender o User Journey completo
- Identificar pontos de conversão/abandono  
- Medir engajamento por feature
- Tracking de retenção e return users
- Funnel analysis detalhado

---

## **STACK DE ANALYTICS**

### **PostHog** (Eventos Comportamentais)
- ✅ **Grátis**: 1M eventos/mês
- ✅ **User Journey Tracking**
- ✅ **Session Replay**
- ✅ **Funnels e Cohorts**
- ✅ **API excelente** para extrair dados

### **Google Analytics 4** (Backup + SEO)
- ✅ **Grátis**: Ilimitado
- ✅ **Page Views + Demographics**
- ✅ **Backup histórico**
- ✅ **Google Search Console integration**

### **Supabase** (Dados de Negócio)
- ✅ **Business metrics**
- ✅ **Revenue tracking**
- ✅ **User management**

---

## **EVENTOS PRINCIPAIS - POSTHOG**

### **🎯 CONVERSION FUNNEL**
```javascript
// 1. Landing Page
'landing_page_view' - { page: 'home' }

// 2. Interesse/Engagement
'cta_button_click' - { button_type: 'transform_photo', location: 'hero' }
'examples_modal_open' - { trigger: 'button_click' }
'community_button_click' - {}

// 3. Intent to Use
'transformation_studio_enter' - { method: 'hero_button' | 'examples_modal' }
'login_prompt_shown' - { trigger: 'studio_enter' | 'like_attempt' }

// 4. Registration/Login
'login_attempt' - { method: 'google' }
'login_success' - { method: 'google', is_new_user: boolean }
'login_failure' - { method: 'google', error: string }

// 5. First Use
'image_upload_start' - {}
'image_upload_success' - { file_size: number, file_type: string }
'style_selection_open' - {}
'style_selected' - { style_id: string, style_name: string }
'transformation_start' - { style_id: string, credits_spent: number }

// 6. Conversion
'transformation_complete' - { 
  style_id: string, 
  processing_time: number,
  credits_spent: number,
  quality_rating?: number 
}
```

### **📱 USER BEHAVIOR**
```javascript
// Navigation
'page_view' - { page: string, referrer?: string }
'modal_open' - { modal_type: string, trigger: string }
'modal_close' - { modal_type: string, duration: number }

// Engagement
'style_preview_hover' - { style_id: string }
'gallery_image_click' - { image_id: string, position: number }
'session_duration' - { duration: number, pages_visited: number }

// Feature Usage
'community_visit' - {}
'transformation_rating' - { rating: number, transformation_id: string }
'image_download' - { transformation_id: string }
'community_submit' - { transformation_id: string }
'community_like' - { transformation_id: string, target_user: string }
```

### **💰 BUSINESS METRICS**
```javascript
// Credits & Revenue
'credits_purchased' - { amount: number, package_type: string, price: number }
'credits_spent' - { amount: number, feature: string }
'credits_refunded' - { amount: number, reason: string }

// Retention
'user_return' - { days_since_last_visit: number, total_visits: number }
'weekly_active_user' - {}
'monthly_active_user' - {}
```

### **⚠️ ERROR TRACKING**
```javascript
// Technical Issues
'transformation_error' - { 
  error_type: string, 
  error_message: string, 
  user_agent: string,
  credits_refunded: boolean 
}
'upload_error' - { error_type: string, file_size: number }
'payment_error' - { error_type: string, amount: number }

// User Experience Issues
'rage_click' - { element: string, click_count: number }
'dead_link_click' - { url: string }
```

---

## **SEGMENTAÇÃO & PROPERTIES**

### **User Properties**
- `user_id` - ID do Supabase
- `email` - Email (hashed para GDPR)
- `signup_date` - Data de registo
- `total_transformations` - Número total
- `total_credits_spent` - Total gasto
- `preferred_styles` - Array de estilos favoritos
- `device_type` - mobile/desktop
- `browser` - Chrome/Safari/etc
- `country` - PT/BR/etc

### **Session Properties**
- `session_id` - ID da sessão
- `utm_source` - Origem do tráfego
- `utm_medium` - Meio
- `utm_campaign` - Campanha
- `referrer` - Site de origem
- `landing_page` - Primeira página visitada

---

## **DASHBOARDS & REPORTS**

### **📊 DASHBOARD PRINCIPAL**
1. **KPIs Principais**
   - DAU/MAU
   - Conversion Rate (Visitor → User → Transformation)
   - Revenue per User
   - Churn Rate

2. **User Journey**
   - Funil completo
   - Drop-off points
   - Time to first transformation
   - Session recordings dos drop-offs

3. **Feature Usage**
   - Styles mais populares
   - Community engagement
   - Upload success rates

### **📈 WEEKLY REPORTS**
- Top performing pages
- Most clicked CTAs
- Error frequency
- User feedback sentiment

---

## **IMPLEMENTAÇÃO FASEADA**

### **FASE 1 - CORE TRACKING** ✅
- [x] PostHog setup
- [x] Basic page views
- [ ] Main CTA clicks
- [ ] Login flow
- [ ] Transformation start/complete

### **FASE 2 - DETAILED BEHAVIOR**
- [ ] Modal interactions
- [ ] Style selection patterns
- [ ] Error tracking
- [ ] Session replay para problemas

### **FASE 3 - BUSINESS INTELLIGENCE**
- [ ] Revenue tracking
- [ ] Cohort analysis
- [ ] Retention funnels
- [ ] Automated alerts

### **FASE 4 - ADVANCED ANALYTICS**
- [ ] A/B testing setup
- [ ] Predictive analytics
- [ ] Custom dashboards
- [ ] API integration para reports

---

## **COMPLIANCE & PRIVACY**

### **GDPR Compliant**
- ✅ User consent antes do tracking
- ✅ Hashing de emails
- ✅ Data retention policies
- ✅ Right to deletion

### **Data Retention**
- **PostHog**: 1 ano (free tier)
- **GA4**: 2 anos (configurable)
- **Supabase**: Indefinido (controlado por nós)

---

## **NEXT STEPS**

1. **AGORA**: Configurar PostHog API keys
2. **HOJE**: Implementar eventos core (Fase 1)
3. **ESTA SEMANA**: Setup dashboards
4. **PRÓXIMA SEMANA**: Detailed behavior tracking

**After 1 month**: Review data e otimizar based nos insights! 