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

puts "--- LINK PREVIEW GENERATOR V8 (Embed Extractor) ---"

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
  end
  data['title'] = data['title'].strip
  data
end

# 2. Fetch Genérico (Para sites normais e tentativa de título YT)
def fetch_url(url, limit = 5)
  return nil if limit == 0
  uri = URI.parse(url)
  return nil unless uri.kind_of?(URI::HTTP)
  
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = (uri.scheme == 'https')
  http.open_timeout = 5
  http.read_timeout = 8
  
  request = Net::HTTP::Get.new(uri.request_uri)
  # User-Agent mobile as vezes passa melhor no YouTube
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

    # --- DETECÇÃO DE YOUTUBE (Prioridade Máxima) ---
    video_id = nil
    if link =~ /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
      video_id = $1
    end

    # Se já tem preview completo, verifica limpeza
    if previews[slug] && previews[slug]['title'] && !previews[slug]['title'].to_s.empty?
      # Se for vídeo e não tiver ID salvo, adiciona
      if video_id && !previews[slug]['video_id']
        previews[slug]['video_id'] = video_id
        puts " [UPGRADE] #{slug} -> Adicionado Video ID: #{video_id}"
        updated = true
      else
        # Limpeza de título
        old_title = previews[slug]['title']
        previews[slug] = apply_domain_rules(previews[slug], previews[slug]['url'])
        if old_title != previews[slug]['title']
          puts " [FIX] #{slug} (Título limpo)"
          updated = true
        end
      end
    else
      # --- DOWNLOAD NOVO ---
      puts " [FETCH] #{slug} -> #{link}"
      
      data = {}
      
      if video_id
        # Se tem ID, garantimos o embed mesmo sem título
        data['video_id'] = video_id
        data['image'] = "https://img.youtube.com/vi/#{video_id}/hqdefault.jpg"
        
        # Tenta pegar título via HTML simples (Embed URL)
        embed_url = "https://www.youtube.com/embed/#{video_id}"
        body = fetch_url(embed_url)
        if body && body =~ /<title>(.*?) - YouTube<\/title>/
          data['title'] = $1
        else
          data['title'] = "Assista no YouTube" # Fallback
        end
      else
        # Site normal
        body = fetch_url(link)
        data = extract_og_data(body, link) if body
      end

      if data
        data['url'] = link
        data = apply_domain_rules(data, link)
        previews[slug] = data
        updated = true
        puts "   -> Sucesso: #{data['title']} #{video_id ? '[VIDEO]' : ''}"
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