#!/usr/bin/env ruby
# scripts/htmlproofer.rb — Valida o HTML gerado pelo Jekyll
# Uso: bundle exec ruby scripts/htmlproofer.rb [caminho_do_site]
#
# O que verifica:
#   - Links internos quebrados
#   - Imagens com src inválido
#   - Atributos href vazios
#   - HTML malformado
#
# O que ignora intencionalmente:
#   - Links externos (instável em CI — sem rede confiável)
#   - URLs localhost e 127.0.0.1 (ambiente local)
#   - Âncoras geradas dinamicamente por JS

require 'html-proofer'

site_dir = ARGV[0] || './_site'

unless Dir.exist?(site_dir)
  warn "Diretório '#{site_dir}' não encontrado. Rode 'bundle exec jekyll build' primeiro."
  exit 1
end

HTMLProofer.check_directory(site_dir, {
  disable_external:    true,
  ignore_missing_alt:  true,
  no_enforce_https:    true,
  ignore_urls:         [
    /localhost/,
    /127\.0\.0\.1/,
    /fxlip-visitor-api\.fxlip\.workers\.dev/,
  ],
  ignore_files:        [
    /feed\.xml/,
    /sitemap\.xml/,
  ],
  checks: ['Links', 'Images', 'Scripts'],
}).run
