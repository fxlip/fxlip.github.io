#!/usr/bin/env ruby
require 'net/http'
require 'uri'
require 'nokogiri'
require 'yaml'
require 'fileutils'

ROOT = File.expand_path(File.join(__dir__, '..'))
DATA_DIR = File.join(ROOT, '_data')
PREVIEWS_FILE = File.join(DATA_DIR, 'previews.yml')
TARGET_DIRS = ['_curadoria', '_posts']

puts "--- LINK PREVIEW GENERATOR V7 (Embed Protocol) ---"

# 1. Filtro Sanitário
def apply_domain_rules(data, url)
  return data unless data['title']
  
  if data['title'].respond_to?(:force_encoding)
    data['title'] = data['title'].force_encoding('UTF-8')
  end

  begin
    host = URI.parse(url).host.downcase
  rescue
    return data
  end
  
  case host
  when /g1\.globo\.com/
    data['title'] = data['title'].gsub(/\s*\|\s*G1.*$/, '').gsub(/\s*-\s*G1.*$/, '')
  when /youtube\.com/, /youtu\.be/
    data['title'] = data['title'].gsub(/\s*-\s*YouTube$/, '')
  when /uol\.com\.br/
    data['title'] = data['title'].gsub(/\s*-\s*UOL.*$/, '')
  end

  data['title'] = data['title'].strip
  data
end

# 2. Fetch Genérico
def fetch_url(url, limit = 5)
  return nil if limit == 0
  uri = URI.parse(url)
  return nil unless uri.kind_of?(URI::HTTP)
  
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = (uri.scheme == 'https')
  http.open_timeout = 5
  http.read_timeout = 8
  
  request = Net::HTTP::Get.new(uri.request_uri)
  request['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  
  begin
    response = http.request(request)
    case response
    when Net::HTTPSuccess then response.body
    when Net::HTTPRedirection then fetch_url(response['location'], limit - 1)
    else nil
    end
  rescue
    nil
  end
end

# 3. Especialista YouTube (Via Embed)
def fetch_youtube_data(url)
  # Extrai ID do vídeo
  vid_id = nil
  if url =~ /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/
    vid_id = $1
  end

  return nil unless vid_id

  # A Mágica: Acessa a página de Embed (menos bloqueada)
  embed_url = "https://www.youtube-nocookie.com/embed/#{vid_id}"
  html = fetch_url(embed_url)
  
  return nil unless html

  # Extrai Título direto do código fonte (Regex rápido)
  title = nil
  if html =~ /<title>(.*?) - YouTube<\/title>/
    title = $1
  elsif html =~ /<title>(.*?)<\/title>/
    title = $1
  end

  # Limpa entidades HTML no título (ex: &#39; -> ')
  title = CGI.unescapeHTML(title) if title

  # Monta imagem manualmente (Alta Qualidade)
  image = "https://img.youtube.com/vi/#{vid_id}/hqdefault.jpg"

  return {
    'title' => title,
    'description' => "Assista no YouTube", # Embed não tem descrição completa
    'image' => image,
    'url' => url
  }
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

require 'cgi' # Necessário para limpar títulos

# --- LÓGICA PRINCIPAL ---

previews = File.exist?(PREVIEWS_FILE) ? YAML.load_file(PREVIEWS_FILE) : {}
previews ||= {}
updated = false

TARGET_DIRS.each do |dir_name|
  full_path = File.join(ROOT, dir_name)
  next unless Dir.exist?(full_path)

  puts "\nProcessando pasta: #{dir_name}"
  
  Dir.glob(File.join(full_path, '*.{md,markdown,MD,MARKDOWN}')).each do |post_path|
    filename = File.basename(post_path)
    slug = filename.sub(/^\d{4}-\d{2}-\d{2}-/, '').sub(/\.[^.]+$/, '')
    content = File.read(post_path)
    
    link = nil
    if content =~ /^link_url:\s*"?([^"\n]+)"?/
      link = $1
    elsif content =~ /https?:\/\/[^\s"']+/
      link = $&
    end

    next unless link

    # Força atualização se o título estiver vazio ou for genérico "YouTube"
    needs_update = !previews[slug] || 
                   previews[slug]['title'].to_s.strip.empty? || 
                   previews[slug]['title'] == "YouTube"

    if !needs_update
      # Apenas aplica filtros de limpeza
      old_title = previews[slug]['title']
      previews[slug] = apply_domain_rules(previews[slug], previews[slug]['url'])
      if old_title != previews[slug]['title']
        puts " [FIX] #{slug} (Título limpo)"
        updated = true
      end
    else
      puts " [FETCH] #{slug} -> #{link}"
      
      data = nil
      if link =~ /youtube\.com|youtu\.be/
        data = fetch_youtube_data(link)
      else
        body = fetch_url(link)
        data = extract_og_data(body, link) if body
      end

      if data && data['title'] && !data['title'].empty?
        data = apply_domain_rules(data, link)
        previews[slug] = data
        updated = true
        puts "   -> Sucesso: #{data['title']}"
        sleep 2
      else
        puts "   -> Falha: Dados insuficientes."
      end
    end
  end
end

if updated
  File.open(PREVIEWS_FILE, 'w') { |f| f.write(previews.to_yaml) }
  puts "\n--- SUCESSO: Banco de dados salvo. ---"
else
  puts "\n--- NENHUMA ALTERAÇÃO FEITA ---"
end