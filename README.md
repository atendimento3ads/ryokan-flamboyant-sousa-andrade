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

O código de monitoramento do RD Station Marketing está instalado antes do fechamento de `</body>` e realiza a captura automática dos formulários válidos. Nenhuma credencial privada é exposta no navegador.

Após a validação, os formulários aguardam brevemente a captura automática e redirecionam para `/obrigado/`. A página de confirmação também carrega o monitoramento do RD Station, permitindo mensurar a conversão pelo caminho da URL.

## Eventos para Google Tag Manager

O código inicializa `window.dataLayer` e publica eventos sem dados pessoais. O ID do container GTM não foi incluído porque não foi fornecido.

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
- `obrigado/`: página de confirmação não indexável exibida após o envio válido dos formulários
- `.htaccess`: configuração da raiz e redirecionamento permanente de `/home/` para `/`
- `robots.txt`: permite o rastreamento e informa a localização do sitemap
- `sitemap.xml`: lista a URL pública principal
- `assets/`: imagens originais fornecidas pelo cliente

A imagem principal da hero usa `assets/hero-building.webp`, otimizada em WebP a partir do arquivo de alta resolução fornecido.
