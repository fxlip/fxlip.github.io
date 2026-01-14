#!/usr/bin/env ruby
require 'net/http'
require 'uri'
require 'nokogiri'
require 'yaml'
require 'fileutils'
require 'cgi'

ROOT = File.expand_path(File.join(__dir__, '..'))
DATA_DIR = File.join(ROOT, '_data')
PREVIEWS_FILE = File.join(DATA_DIR, 'previews.yml')
TARGET_DIRS = ['_curadoria', '_posts']

puts "--- LINK PREVIEW GENERATOR V10 (Smart Diff + Twitter Fix) ---"

# 1. Filtro Sanitário
def apply_domain_rules(data, url)
  return data unless data['title']
  if data['title'].respond_to?(:force_encoding)
    data['title'] = data['title'].force_encoding('UTF-8')
  end
  
  host = URI.parse(url).host.downcase rescue nil
  return data unless host

  case host
  when /g1\.globo\.com/
    data['title'] = data['title'].gsub(/\s*\|\s*G1.*$/, '').gsub(/\s*-\s*G1.*$/, '')
  when /uol\.com\.br/
    data['title'] = data['title'].gsub(/\s*-\s*UOL.*$/, '')
  when /cnnbrasil\.com\.br/
    data['title'] = data['title'].gsub(/\s*\|\s*CNN\s*Brasil.*$/, '')
  when /(twitter|x)\.com/, /fixupx\.com/
    # Limpa sufixos comuns do X
    data['title'] = data['title'].gsub(/\s*on X$/, '').gsub(/\s*on Twitter$/, '')
  when /youtube\.com/, /youtu\.be/
    data['title'] = data['title'].gsub(/\s*-\s*YouTube$/, '')
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
  request['User-Agent'] = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' # User-Agent de Bot ajuda com FixupX
  
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

# 3. Especialista YouTube (Embed + ID)
def fetch_youtube_data(url, vid_id)
  embed_url = "https://www.youtube-nocookie.com/embed/#{vid_id}"
  html = fetch_url(embed_url)
  return nil unless html

  title = nil
  if html =~ /<title>(.*?) - YouTube<\/title>/
    title = $1
  elsif html =~ /<title>(.*?)<\/title>/
    title = $1
  end
  
  title = CGI.unescapeHTML(title) if title
  title = "Assista no YouTube" if !title || title.strip.empty?

  return {
    'title' => title,
    'description' => "Assista no YouTube",
    'image' => "https://img.youtube.com/vi/#{vid_id}/hqdefault.jpg",
    'url' => url,
    'video_id' => vid_id
  }
end

# 4. Especialista X/Twitter (Via FixupX)
def fetch_twitter_data(original_url)
  # Substitui o domínio original pelo proxy de metadados
  proxy_url = original_url.gsub(%r{https?://(www\.)?(twitter|x)\.com}, 'https://fixupx.com')
  
  html = fetch_url(proxy_url)
  return nil unless html

  # Usa o parser padrão para extrair as tags que o FixupX gerou
  data = extract_og_data(html, original_url)
  
  if data
    data['url'] = original_url # Garante que o link final aponte para o X real
    
    # Se a descrição for vazia, tenta pegar o título como descrição (comum em tweets curtos)
    if data['description'].nil? || data['description'].empty?
      data['description'] = data['title']
    end
  end
  
  data
end

def extract_og_data(html, url)
  return nil unless html
  doc = Nokogiri::HTML(html)
  og = {}
  doc.css('meta').each do |m|
    prop = m['property'] || m['name']
    content = m['content'] || m['value']
    next unless prop && content
    if prop.start_with?('og:')
      og[prop.sub('og:', '')] = content
    elsif prop == 'description'
      og['description'] = content
    end
  end
  
  title = og['title'] || (doc.at('title') ? doc.at('title').text : nil)
  desc = og['description']
  img = og['image']
  
  if img && !img.start_with?('http')
    img = URI.join(url, img).to_s rescue nil
  end
  
  { 'title' => title, 'description' => desc, 'image' => img, 'url' => url }
end

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

    # --- VERIFICAÇÃO DE MUDANÇA (SMART DIFF) ---
    current_data = previews[slug]
    url_changed = current_data && current_data['url'] != link
    
    if url_changed
      puts " [UPDATE] Link alterado em #{slug}. Reprocessando..."
    end

    # --- DETECÇÃO DE PLATAFORMA ---
    is_youtube = link =~ /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
    video_id = $1 if is_youtube
    
    is_twitter = link =~ /https?:\/\/(www\.)?(twitter|x)\.com/

    needs_fetch = !current_data || 
                  url_changed || 
                  current_data['title'].to_s.strip.empty? ||
                  (is_youtube && !current_data['video_id'])

    if !needs_fetch
      # Cache Hit: Sanitização
      old_title = previews[slug]['title']
      previews[slug] = apply_domain_rules(previews[slug], previews[slug]['url'])
      if old_title != previews[slug]['title']
        puts " [FIX] #{slug} (Título limpo)"
        updated = true
      end
    else
      # Cache Miss: Fetch
      puts " [FETCH] #{slug} -> #{link}"
      
      data = nil
      if is_youtube
        data = fetch_youtube_data(link, video_id)
      elsif is_twitter
        # Rota especial para o X
        data = fetch_twitter_data(link)
      else
        body = fetch_url(link)
        data = extract_og_data(body, link) if body
      end

      if data && (data['title'] || data['image'])
        data['url'] = link 
        data = apply_domain_rules(data, link)
        previews[slug] = data
        updated = true
        puts "   -> Sucesso: #{data['title']}"
        sleep 2
      else
        puts "   -> Falha."
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