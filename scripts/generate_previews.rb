#!/usr/bin/env ruby
require 'net/http'
require 'uri'
require 'nokogiri'
require 'yaml'
require 'fileutils'

# Configuração de Caminhos
ROOT = File.expand_path(File.join(__dir__, '..'))
POSTS_DIR = File.join(ROOT, '_curadoria') 
DATA_DIR = File.join(ROOT, '_data')
PREVIEWS_FILE = File.join(DATA_DIR, 'previews.yml')

puts "--- INICIANDO DIAGNÓSTICO ---"
puts "Pasta de posts: #{POSTS_DIR}"
puts "Arquivo de dados: #{PREVIEWS_FILE}"

# 1. Filtro Sanitário (G1, YouTube, etc)
def apply_domain_rules(data, url)
  return data unless data['title']
  
  begin
    host = URI.parse(url).host.downcase
  rescue
    return data
  end

  original_title = data['title'].dup

  case host
  when /g1\.globo\.com/
    # Remove sufixos comuns do G1
    data['title'] = data['title'].gsub(/\s*\|\s*G1.*$/, '').gsub(/\s*-\s*G1.*$/, '')
  when /youtube\.com/, /youtu\.be/
    data['title'] = data['title'].gsub(/\s*-\s*YouTube$/, '')
  when /uol\.com\.br/
    data['title'] = data['title'].gsub(/\s*-\s*UOL.*$/, '')
  when /folha\.uol\.com\.br/
    data['title'] = data['title'].gsub(/\s*-\s*Folha.*$/, '')
  end

  data['title'] = data['title'].strip
  
  # Loga se houve mudança (para sabermos que funcionou)
  if original_title != data['title']
    puts "   [CLEANER] Título limpo: '#{original_title}' -> '#{data['title']}'"
  end
  
  data
end

def fetch_url(url, limit = 5)
  return nil if limit == 0
  uri = URI.parse(url)
  return nil unless uri.kind_of?(URI::HTTP)

  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = (uri.scheme == 'https')
  http.open_timeout = 5
  http.read_timeout = 8
  
  request = Net::HTTP::Get.new(uri.request_uri)
  request['User-Agent'] = 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0; +http://felip.com.br)'

  begin
    response = http.request(request)
    case response
    when Net::HTTPSuccess then response.body
    when Net::HTTPRedirection then fetch_url(response['location'], limit - 1)
    else nil
    end
  rescue => e
    puts "   [ERRO] Falha ao baixar #{url}: #{e.message}"
    nil
  end
end

def extract_og_data(html, url)
  doc = Nokogiri::HTML(html)
  og = {}
  
  doc.css('meta').each do |m|
    prop = m['property'] || m['name']
    content = m['content'] || m['value']
    next unless prop && content
    
    if prop.start_with?('og:')
      og[prop.sub('og:', '')] = content
    elsif prop == 'twitter:title' && !og['title']
      og['title'] = content
    elsif prop == 'description' && !og['description']
      og['description'] = content
    end
  end

  title = og['title'] || (doc.at('title') ? doc.at('title').text : nil)
  desc = og['description'] || (doc.at('meta[name="description"]') ? doc.at('meta[name="description"]')['content'] : nil)
  img = og['image']

  if img && !img.start_with?('http')
    img = URI.join(url, img).to_s rescue nil
  end

  { 'title' => title, 'description' => desc, 'image' => img, 'url' => url }
end

# Carrega DB atual
previews = File.exist?(PREVIEWS_FILE) ? YAML.load_file(PREVIEWS_FILE) : {}
previews ||= {}
initial_count = previews.keys.size
updated = false

puts "Posts encontrados na pasta:"
Dir.glob(File.join(POSTS_DIR, '*.{md,markdown}')).each do |post_path|
  filename = File.basename(post_path)
  slug = filename.sub(/^\d{4}-\d{2}-\d{2}-/, '').sub(/\.[^.]+$/, '')
  
  content = File.read(post_path)
  
  # Regex mais flexível para achar o link
  link = nil
  if content =~ /^link_url:\s*"?([^"\n]+)"?/
    link = $1
  elsif content =~ /https?:\/\/[^\s"']+/
    # Fallback: procura o primeiro link no texto se não achar no front matter
    link = $&
  end

  unless link
    puts " [SKIP] #{slug} (Sem link detectado)"
    next
  end

  # ESTRATÉGIA HÍBRIDA:
  # 1. Se já existe: Apenas aplica o filtro de limpeza (sem baixar da net)
  # 2. Se não existe: Baixa da net e aplica filtro
  
  if previews[slug] && previews[slug]['title']
    # Já temos os dados, vamos apenas checar se o título precisa ser limpo
    old_title = previews[slug]['title']
    previews[slug] = apply_domain_rules(previews[slug], previews[slug]['url'])
    
    if old_title != previews[slug]['title']
      puts " [FIX] #{slug} (Título corrigido via regras)"
      updated = true
    end
  else
    # Link Novo
    puts " [NEW] #{slug} -> Baixando metadata..."
    body = fetch_url(link)
    
    if body
      data = extract_og_data(body, link)
      data = apply_domain_rules(data, link) # Aplica filtro
      previews[slug] = data
      updated = true
      puts "   -> Sucesso: #{data['title']}"
      sleep 1 # Calma com a API dos outros
    else
      puts "   -> Falha no download."
    end
  end
end

if updated
  File.open(PREVIEWS_FILE, 'w') { |f| f.write(previews.to_yaml) }
  puts "--- SUCESSO: Banco de dados atualizado. ---"
else
  puts "--- NENHUMA ALTERAÇÃO NECESSÁRIA ---"
end