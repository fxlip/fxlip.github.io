#!/usr/bin/env ruby
require 'net/http'
require 'uri'
require 'nokogiri'
require 'yaml'
require 'cgi'
require 'openssl'

ROOT = File.expand_path(File.join(__dir__, '..'))
DATA_DIR = File.join(ROOT, '_data')
PREVIEWS_FILE = File.join(DATA_DIR, 'previews.yml')
TARGET_DIRS = ['_curadoria', '_posts']

# [SETUP] Identidades
UA_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
UA_SOCIAL = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

puts "--- LINK PREVIEW GENERATOR V15 (Text-Only / High Performance) ---"

# 1. Filtro Sanitário
def apply_domain_rules(data, url)
  return data unless data['title']
  if data['title'].respond_to?(:force_encoding)
    data['title'] = data['title'].force_encoding('UTF-8')
  end
  
  host = URI.parse(url).host.downcase rescue nil
  return data unless host

  # Limpeza de Sufixos de SEO
  case host
  when /g1\.globo\.com/
    data['title'] = data['title'].gsub(/\s*\|\s*G1.*$/, '').gsub(/\s*-\s*G1.*$/, '')
  when /uol\.com\.br/
    data['title'] = data['title'].gsub(/\s*-\s*UOL.*$/, '')
  when /(twitter|x)\.com/, /fixupx\.com/
    data['title'] = data['title'].gsub(/\s*on X$/, '').gsub(/\s*on Twitter$/, '')
  when /youtube\.com/, /youtu\.be/
    data['title'] = data['title'].gsub(/\s*-\s*YouTube$/, '')
  end
  data['title'] = data['title'].strip
  data
end

# 2. Fetch Robusto
def fetch_url(url, limit = 5, use_social_ua = false)
  return nil if limit == 0
  uri = URI.parse(url)
  return nil unless uri.kind_of?(URI::HTTP)
  
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = (uri.scheme == 'https')
  if http.use_ssl?
    http.verify_mode = OpenSSL::SSL::VERIFY_PEER
  end
  http.open_timeout = 10
  http.read_timeout = 10
  
  request = Net::HTTP::Get.new(uri.request_uri)
  request['User-Agent'] = use_social_ua ? UA_SOCIAL : UA_CHROME
  request['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  request['Accept-Language'] = 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
  
  begin
    response = http.request(request)
    case response
    when Net::HTTPSuccess then response.body
    when Net::HTTPRedirection 
      new_loc = response['location']
      if new_loc.start_with?('/')
        new_loc = uri.scheme + "://" + uri.host + new_loc
      end
      fetch_url(new_loc, limit - 1, use_social_ua)
    else nil end
  rescue => e
    nil
  end
end

# 3. Especialista YouTube (Apenas ID para Embed)
def fetch_youtube_data(url, vid_id)
  embed_url = "https://www.youtube-nocookie.com/embed/#{vid_id}"
  html = fetch_url(embed_url)
  
  title = nil
  if html && html =~ /<title>(.*?) - YouTube<\/title>/
    title = $1
  end
  title = CGI.unescapeHTML(title) if title
  title = "Vídeo do YouTube" if !title || title.strip.empty?

  return {
    'title' => title,
    'description' => "Assista diretamente no terminal.",
    'url' => url,
    'video_id' => vid_id,
    'image' => nil 
  }
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
  
  title = og['title'] || doc.at('title')&.text || URI.parse(url).host rescue url
  desc = og['description']
  
  
  { 'title' => title, 'description' => desc, 'image' => nil, 'url' => url }
end


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

    current_data = previews[slug]
    is_youtube = link =~ /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
    video_id = $1 if is_youtube
    
    # Se já tem dados e imagem existe (não é nil), vamos atualizar para REMOVER a imagem
    has_image_garbage = current_data && current_data['image'] != nil
    needs_fetch = !current_data || (is_youtube && !current_data['video_id'])

    if needs_fetch
      puts " [FETCH] #{slug} -> #{link}"
      
      data = nil
      if is_youtube
        data = fetch_youtube_data(link, video_id)
      elsif link =~ /https?:\/\/(www\.)?(twitter|x)\.com/
        # Twitter Text Only
        proxy = link.gsub(%r{https?://(www\.)?(twitter|x)\.com}, 'https://fixupx.com')
        html = fetch_url(proxy)
        data = extract_og_data(html, link) if html
      else
        body = fetch_url(link, 5, false)
        body = fetch_url(link, 5, true) unless body # Retry VIP
        
        if body
           data = extract_og_data(body, link) 
        else
           host = URI.parse(link).host rescue link
           data = { 'title' => "Link: #{host}", 'description' => "Conteúdo externo.", 'url' => link, 'image' => nil }
        end
      end

      if data
        data['url'] = link 
        data = apply_domain_rules(data, link)
        previews[slug] = data
        updated = true
        puts "   -> [NEW] #{data['title'][0..30]}..."
        sleep 1
      end
      
    elsif has_image_garbage
      # [CLEANUP] Remove a imagem do banco de dados existente
      puts " [CLEAN] Removendo imagem de #{slug}..."
      previews[slug]['image'] = nil
      updated = true
    end
  end
end

if updated
  File.open(PREVIEWS_FILE, 'w') { |f| f.write(previews.to_yaml) }
  puts "\n--- SUCESSO: previews.yml otimizado (Text-Only). ---"
else
  puts "\n--- NENHUMA ALTERAÇÃO ---"
end