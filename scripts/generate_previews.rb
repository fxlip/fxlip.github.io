#!/usr/bin/env ruby
require 'net/http'
require 'uri'
require 'nokogiri'
require 'yaml'
require 'fileutils'
require 'cgi'
require 'openssl'

ROOT = File.expand_path(File.join(__dir__, '..'))
DATA_DIR = File.join(ROOT, '_data')
PREVIEWS_FILE = File.join(DATA_DIR, 'previews.yml')
TARGET_DIRS = ['_curadoria', '_posts']

# [SETUP] Identidade "Stealth 2.0" (Imitando Chrome Windows)
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

puts "--- LINK PREVIEW GENERATOR V12 (WAF Bypass Edition) ---"

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
    data['title'] = data['title'].gsub(/\s*on X$/, '').gsub(/\s*on Twitter$/, '')
  when /youtube\.com/, /youtu\.be/
    data['title'] = data['title'].gsub(/\s*-\s*YouTube$/, '')
  end
  data['title'] = data['title'].strip
  data
end

# 2. Fetch Robusto com Headers de Navegador
def fetch_url(url, limit = 5)
  return nil if limit == 0
  uri = URI.parse(url)
  return nil unless uri.kind_of?(URI::HTTP)
  
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = (uri.scheme == 'https')
  
  if http.use_ssl?
    http.verify_mode = OpenSSL::SSL::VERIFY_PEER
  end

  http.open_timeout = 15
  http.read_timeout = 15
  
  request = Net::HTTP::Get.new(uri.request_uri)
  
  # [BYPASS] Headers completos de navegador
  request['User-Agent'] = USER_AGENT
  request['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
  request['Accept-Language'] = 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
  request['Referer'] = 'https://www.google.com/'
  request['Upgrade-Insecure-Requests'] = '1'
  request['Sec-Fetch-Dest'] = 'document'
  request['Sec-Fetch-Mode'] = 'navigate'
  request['Sec-Fetch-Site'] = 'cross-site'
  request['Sec-Fetch-User'] = '?1'
  request['Cache-Control'] = 'max-age=0'
  
  begin
    response = http.request(request)
    case response
    when Net::HTTPSuccess 
      response.body
    when Net::HTTPRedirection 
      new_loc = response['location']
      if new_loc.start_with?('/')
        new_loc = uri.scheme + "://" + uri.host + new_loc
      end
      fetch_url(new_loc, limit - 1)
    else 
      puts "   [DEBUG] Erro HTTP #{response.code} para #{url}"
      nil
    end
  rescue => e
    puts "   [DEBUG] Exception: #{e.message} em #{url}"
    nil
  end
end

# 3. Especialista YouTube
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

# 4. Especialista X/Twitter
def fetch_twitter_data(original_url)
  proxy_url = original_url.gsub(%r{https?://(www\.)?(twitter|x)\.com}, 'https://fixupx.com')
  html = fetch_url(proxy_url)
  return nil unless html

  data = extract_og_data(html, original_url)
  if data
    data['url'] = original_url 
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
  
  title = og['title']
  if title.nil? || title.empty?
    title = doc.at('title')&.text
  end

  # Fallback de Título se tudo falhar, usa o domínio
  if title.nil? || title.strip.empty?
     title = URI.parse(url).host rescue url
  end

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
    # Remove data YYYY-MM-DD para o slug
    slug = filename.sub(/^\d{4}-\d{2}-\d{2}-/, '').sub(/\.[^.]+$/, '')
    
    content = File.read(post_path)
    
    link = nil
    if content =~ /^link_url:\s*"?([^"\n]+)"?/
      link = $1
    elsif content =~ /https?:\/\/[^\s"']+/
      link = $&
    end

    next unless link

    current_data = previews[slug]
    url_changed = current_data && current_data['url'] != link
    
    # Verifica se é YouTube
    is_youtube = link =~ /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
    video_id = $1 if is_youtube
    is_twitter = link =~ /https?:\/\/(www\.)?(twitter|x)\.com/

    needs_fetch = !current_data || 
                  url_changed || 
                  current_data['title'].to_s.strip.empty? ||
                  (is_youtube && !current_data['video_id'])

    if !needs_fetch
      # Sanitização apenas
      old_title = previews[slug]['title']
      previews[slug] = apply_domain_rules(previews[slug], previews[slug]['url'])
      if old_title != previews[slug]['title']
        puts " [FIX] #{slug} (Clean)"
        updated = true
      end
    else
      # Fetch Real
      puts " [FETCH] #{slug} -> #{link}"
      
      data = nil
      if is_youtube
        data = fetch_youtube_data(link, video_id)
      elsif is_twitter
        data = fetch_twitter_data(link)
      else
        body = fetch_url(link)
        if body
           data = extract_og_data(body, link) 
        else
           # [FALLBACK] Se falhar o acesso (403), cria card manual apenas com domínio
           puts "   [WAF] Bloqueio detectado. Criando card básico."
           host = URI.parse(link).host rescue link
           data = {
             'title' => "Link: #{host}",
             'description' => "Clique para acessar o conteúdo original.",
             'url' => link,
             'image' => nil # Sem imagem, o CSS trata com classe .no-image
           }
        end
      end

      if data && data['title']
        data['url'] = link 
        data = apply_domain_rules(data, link)
        previews[slug] = data
        updated = true
        puts "   -> Sucesso: #{data['title'][0..50]}..."
        sleep 2 
      end
    end
  end
end

if updated
  File.open(PREVIEWS_FILE, 'w') { |f| f.write(previews.to_yaml) }
  puts "\n--- SUCESSO: previews.yml atualizado. ---"
else
  puts "\n--- NENHUMA ALTERAÇÃO FEITA ---"
end