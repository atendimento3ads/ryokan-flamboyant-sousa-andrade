# Ryokan Flamboyant

Landing page estática em HTML5, CSS3 e JavaScript vanilla, construída a partir do layout fornecido para o Ryokan Flamboyant.

## Executar localmente

Sirva esta pasta por HTTP. Exemplo:

```bash
python3 -m http.server 4173
```

Abra `http://localhost:4173` para a página “Em breve” e `http://localhost:4173/home/` para a landing em desenvolvimento.

## Integração RD Station

Os formulários usam os nomes de campo `name`, `email`, `personal_phone`, `communications_consent` e `conversion_identifier`. O JavaScript valida os dados, mas não envia leads enquanto não existir um destino confirmado.

O contrato preparado espera um endpoint próprio `POST /api/leads/rd-station`. Esse endpoint server-side deve guardar as credenciais, encaminhar o payload para a API de Conversões do RD Station e devolver estados claros de sucesso ou erro. Tokens nunca devem ser expostos no navegador.

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
| `lead_form_demo_validated` | Validação local concluída | `form_location` |

O evento de conversão real deve ser disparado somente após a confirmação de sucesso do endpoint do RD Station.

## Estrutura

- `index.html`: página pública “Em breve”
- `coming-soon.css`: estilos da página pública
- `home/index.html`: landing em desenvolvimento com `noindex`
- `home/styles.css`: layout, responsividade e animações da landing
- `home/script.js`: menu, carrossel, modal e validação
- `home/.htaccess`: cabeçalho `X-Robots-Tag` para impedir indexação
- `robots.txt`: permite o rastreamento necessário para os buscadores lerem o `noindex`
- `assets/`: imagens originais fornecidas pelo cliente

A imagem principal da hero usa `assets/hero-building.webp`, otimizada em WebP a partir do arquivo de alta resolução fornecido.
