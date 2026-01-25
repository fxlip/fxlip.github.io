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

# [SETUP] Identidades
UA_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
# A "Chave Mestra" que o WhatsApp usa:
UA_SOCIAL = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

puts "--- LINK PREVIEW GENERATOR V13 (VIP Pass Edition) ---"

# 1. Filtro Sanitário (Mantido)
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

# 2. Fetch Robusto com Retry Tático
def fetch_url(url, limit = 5, use_social_ua = false)
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
  
  # [TACTIC] Troca de identidade se for a segunda tentativa
  if use_social_ua
    request['User-Agent'] = UA_SOCIAL
  else
    request['User-Agent'] = UA_CHROME
  end

  # Headers padrões para parecer navegador
  request['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
  request['Accept-Language'] = 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
  request['Referer'] = 'https://www.google.com/'
  
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
      fetch_url(new_loc, limit - 1, use_social_ua)
    else 
      nil # Falha silenciosa para permitir retry
    end
  rescue => e
    puts "   [DEBUG] Exception: #{e.message} em #{url}"
    nil
  end
end

# 3. Especialista YouTube (Mantido)
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

# 4. Especialista X/Twitter (Mantido)
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
    slug = filename.sub(/^\d{4}-\d{2}-\d{2}-/, '').sub(/\.[^.]+$/, '')
    
    content = File.read(post_path)
    
    link = nil
    if content =~ /^link_url:\s*"?([^"\n]+)"?/
      link = $1
    elsif content =~ /https?:\/\/[^\s"']+/
      link = $&
    end

    next unless link

    # [FORCE REFRESH] Se o card atual é o fallback (sem imagem), tenta de novo
    current_data = previews[slug]
    
    is_youtube = link =~ /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
    video_id = $1 if is_youtube
    is_twitter = link =~ /https?:\/\/(www\.)?(twitter|x)\.com/

    # Se o título for genérico "Link: dominio.com", força re-fetch
    is_bad_card = current_data && current_data['title'].to_s.start_with?("Link: ")

    needs_fetch = !current_data || is_bad_card || (is_youtube && !current_data['video_id'])

    if !needs_fetch
      # Nada a fazer
    else
      puts " [FETCH] #{slug} -> #{link}"
      
      data = nil
      if is_youtube
        data = fetch_youtube_data(link, video_id)
      elsif is_twitter
        data = fetch_twitter_data(link)
      else
        # TENTATIVA 1: Modo Chrome Normal
        body = fetch_url(link, 5, false)
        
        # TENTATIVA 2: Modo WhatsApp (Se falhou)
        if !body
           puts "   [WAF] Bloqueio Chrome. Tentando modo VIP (FacebookBot)..."
           body = fetch_url(link, 5, true)
        end

        if body
           data = extract_og_data(body, link) 
        else
           puts "   [FAIL] Bloqueio Total. Gerando fallback."
           host = URI.parse(link).host rescue link
           data = {
             'title' => "Link: #{host}",
             'description' => "Clique para acessar o conteúdo original.",
             'url' => link,
             'image' => nil
           }
        end
      end

      if data
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