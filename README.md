# Ryokan Flamboyant

Landing page estática em HTML5, CSS3 e JavaScript vanilla, construída a partir do layout fornecido para o Ryokan Flamboyant.

## Executar localmente

Sirva esta pasta por HTTP. Exemplo:

```bash
python3 -m http.server 4173
```

Abra `http://localhost:4173` para visualizar a landing page.

## Integração RD Station

Os formulários usam os nomes de campo `name`, `email`, `personal_phone`, `phone`, `communications_consent` e `conversion_identifier`. O campo oculto `phone` recebe o telefone em padrão E.164 (`+55...`) enquanto o campo visível preserva a máscara brasileira.

O carregador de captura do RD Station Marketing não é executado durante uma visita comum. Ele é carregado somente depois que o visitante preenche um formulário válido, autoriza o contato e envia seus dados. Nenhuma credencial privada é exposta no navegador.

Após a validação, os formulários aguardam brevemente a captura automática e redirecionam para `/obrigado/`. A confirmação da captura deve ser verificada no painel do RD Station.

## Google Tag Manager e eventos

O container `GTM-T6S2CN99` usa Google Consent Mode v2 em modo básico. `analytics_storage`, `ad_storage`, `ad_user_data` e `ad_personalization` começam como `denied`, e o GTM só é carregado após autorização de Analytics ou Marketing. Não existe fallback `noscript`, pois ele burlaria a decisão de consentimento. O código publica eventos sem dados pessoais somente quando Analytics está autorizado.

O estado é salvo em `localStorage` na chave `ryokan_privacy_consent`, com categorias, data, versão e modo de consentimento. O banner oferece ações equivalentes para aceitar ou rejeitar opcionais, além do painel para configurar Analytics e Marketing separadamente. O link “Configurações de privacidade” reabre o painel.

| Evento | Momento | Parâmetros principais |
| --- | --- | --- |
| `mobile_menu_toggle` | Abertura ou fechamento do menu | `menu_state` |
| `navigation_click` | Clique na navegação principal | `link_text`, `target_section` |
| `carousel_navigation` | Interação com as setas dos carrosséis de piscina ou lazer | `carousel_name`, `interaction_type`, `slide_index`, `slide_name`, `visible_from`, `visible_to` |
| `gallery_lightbox_open` | Abertura de uma imagem do carrossel de lazer | `carousel_name`, `slide_index`, `slide_name` |
| `gallery_lightbox_close` | Fechamento da imagem ampliada | `carousel_name`, `slide_index`, `close_method` |
| `unit_option_click` | Clique em uma opção de metragem | `unit_size`, `trigger_location` |
| `unit_modal_open` | Abertura do modal | `unit_size` |
| `unit_modal_close` | Fechamento por X, fundo, Esc ou CTA | `unit_size`, `close_method` |
| `unit_modal_cta_click` | Clique no CTA do modal | `unit_size`, `cta_target` |
| `lead_form_start` | Primeira interação com o formulário | `form_location` |
| `lead_form_validation_error` | Tentativa com campos inválidos | `form_location`, `invalid_fields` |
| `lead_form_capture_attempt` | Formulário validado e submetido para captura automática | `form_location` |

A confirmação da captura automática deve ser verificada no RD Station após a primeira conversão. O frontend não dispara um evento de conversão do GTM sem uma confirmação real de sucesso.

## Estrutura

- `index.html`: landing page pública e indexável
- `styles.css`: layout, responsividade e animações da landing
- `script.js`: menu, carrosséis, modais e validação
- `privacy-consent.js` e `privacy.css`: consentimento, bloqueio prévio do GTM e interface de preferências
- `privacidade/`: aviso complementar baseado na Política de Privacidade oficial da Sousa Andrade
- `politica-de-cookies/`: inventário técnico e controles de cookies/armazenamento
- `obrigado/`: página de confirmação não indexável exibida após o envio válido dos formulários
- `.htaccess`: configuração da raiz e redirecionamento permanente de `/home/` para `/`
- `robots.txt`: permite o rastreamento e informa a localização do sitemap
- `sitemap.xml`: lista a URL pública principal
- `assets/`: imagens originais fornecidas pelo cliente

A imagem principal da hero usa `assets/hero-building.webp`, otimizada em WebP a partir do arquivo de alta resolução fornecido.

Os Termos de Uso permanecem como pendência jurídica: nenhuma versão oficial foi localizada no site público da Sousa Andrade, portanto não foi publicado um texto definitivo sem aprovação da responsável.
