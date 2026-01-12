#!/usr/bin/env ruby
require 'net/http'
require 'uri'
require 'nokogiri'
require 'yaml'
require 'fileutils'

ROOT = File.expand_path(File.join(__dir__, '..'))
POSTS_DIR = File.join(ROOT, '_curadoria') # Atualizado para ler da pasta certa
DATA_DIR = File.join(ROOT, '_data')
PREVIEWS_FILE = File.join(DATA_DIR, 'previews.yml')

# 1. Método para limpar títulos baseado no domínio (AQUI ESTÁ A MÁGICA)
def apply_domain_rules(data, url)
  return data unless data['title']
  
  begin
    host = URI.parse(url).host.downcase
  rescue
    return data
  end

  case host
  # REGRAS PARA O G1
  when /g1\.globo\.com/
    # Remove "| G1" ou "- G1" do final
    data['title'] = data['title'].gsub(/\s*\|\s*G1\s*$/, '').gsub(/\s*-\s*G1\s*$/, '')
  
  # REGRAS PARA O YOUTUBE (Exemplo futuro)
  when /youtube\.com/, /youtu\.be/
    data['title'] = data['title'].gsub(/\s*-\s*YouTube$/, '')

  # REGRAS PARA O UOL (Exemplo futuro)
  when /uol\.com\.br/
    data['title'] = data['title'].gsub(/\s*-\s*UOL.*$/, '')
  
  # ADICIONE NOVOS SITES AQUI SEGUINDO O PADRÃO:
  # when /site\.com/
  #   data['title'] = ...
  end

  # Limpeza geral (espaços extras)
  data['title'] = data['title'].strip
  data
end

def find_first_link(text)
  return nil unless text
  # Encontra links http(s)
  m = text.match(/https?:\/\/[^)\s"'>]+/i)
  m && m[0]
end

def fetch_url(url, limit = 5)
  raise ArgumentError, 'too many redirects' if limit == 0
  uri = URI.parse(url)
  return nil unless uri.kind_of?(URI::HTTP)

  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = (uri.scheme == 'https')
  http.open_timeout = 8
  http.read_timeout = 10
  
  request = Net::HTTP::Get.new(uri.request_uri)
  # User-Agent genérico para evitar bloqueios
  request['User-Agent'] = 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0; +http://felip.com.br)'

  begin
    response = http.request(request)
    case response
    when Net::HTTPSuccess
      response.body
    when Net::HTTPRedirection
      location = response['location']
      fetch_url(location, limit - 1)
    else
      nil
    end
  rescue
    nil
  end
end

def extract_og_data(html, url)
  doc = Nokogiri::HTML(html)
  og = {}
  
  # Estratégia de fallback: OG Tags -> Meta Tags -> Title Tag
  doc.css('meta').each do |m|
    prop = m['property'] || m['name']
    content = m['content'] || m['value']
    next unless prop && content
    
    if prop.start_with?('og:')
      key = prop.sub('og:', '')
      og[key] = content
    elsif prop == 'twitter:title' && !og['title']
      og['title'] = content
    elsif prop == 'description' && !og['description']
      og['description'] = content
    end
  end

  title = og['title'] || (doc.at('title') && doc.at('title').text)
  desc = og['description'] || (doc.at('meta[name="description"]') && doc.at('meta[name="description"]')['content'])
  img = og['image']

  # Corrige URLs relativas de imagem
  if img && !img.start_with?('http')
    begin
      img = URI.join(url, img).to_s
    rescue
    end
  end

  { 'title' => title, 'description' => desc, 'image' => img, 'url' => url }
end

# Carrega previews existentes
previews = File.exist?(PREVIEWS_FILE) ? YAML.load_file(PREVIEWS_FILE) : {}
previews ||= {} # Garante que não é nil

updated = false

# Varre a pasta de curadoria
Dir.glob(File.join(POSTS_DIR, '*.{md,markdown}')) do |post_path|
  filename = File.basename(post_path)
  # Slug é o nome do arquivo sem data e extensão
  slug = filename.sub(/^\d{4}-\d{2}-\d{2}-/, '').sub(/\.[^.]+$/, '')
  
  # Se já tem preview e título, pula (Economia de recurso)
  next if previews[slug] && previews[slug]['title']

  content = File.read(post_path)
  
  # Verifica se tem link no Front Matter (novo padrão) ou no corpo
  # Tenta extrair do front matter primeiro (mais seguro)
  if content =~ /^link_url:\s*"?([^"\n]+)"?/
    link = $1
  else
    link = find_first_link(content)
  end

  next unless link
  
  puts "[PROCESSING] #{slug} -> #{link}"
  
  body = fetch_url(link)
  next unless body

  preview = extract_og_data(body, link)
  
  # APLICA A LIMPEZA DE TÍTULO AQUI
  preview = apply_domain_rules(preview, link)

  previews[slug] = preview
  updated = true
  
  # Delay anti-block
  sleep 1
end

if updated
  File.open(PREVIEWS_FILE, 'w') { |f| f.write(previews.to_yaml) }
  puts "[SUCCESS] Previews database updated."
else
  puts "[INFO] No new links to process."
end