#!/usr/bin/env ruby
require 'net/http'
require 'uri'
require 'nokogiri'
require 'yaml'
require 'fileutils'
require 'json'

ROOT = File.expand_path(File.join(__dir__, '..'))
DATA_DIR = File.join(ROOT, '_data')
PREVIEWS_FILE = File.join(DATA_DIR, 'previews.yml')
TARGET_DIRS = ['_curadoria', '_posts']

puts "--- LINK PREVIEW GENERATOR V5 (NoEmbed Proxy) ---"

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

# 2. Módulo Especial para YouTube (Via NoEmbed)
def fetch_youtube_data(url)
  # Usamos o noembed.com como proxy para evitar bloqueio de IP do GitHub (Erro 401)
  proxy_endpoint = "https://noembed.com/embed?url=#{url}"
  
  begin
    uri = URI.parse(proxy_endpoint)
    response = Net::HTTP.get_response(uri)
    
    if response.is_a?(Net::HTTPSuccess)
      json = JSON.parse(response.body)
      
      if json['error']
        puts "   [YOUTUBE] Erro do Proxy: #{json['error']}"
        return nil
      end

      # NoEmbed retorna 'thumbnail_url' e 'title'
      return {
        'title' => json['title'],
        'description' => nil, 
        'image' => json['thumbnail_url'],
        'url' => url
      }
    else
      puts "   [YOUTUBE] Falha no Proxy: #{response.code}"
      return nil
    end
  rescue => e
    puts "   [YOUTUBE] Erro: #{e.message}"
    return nil
  end
end

# 3. Fetch Genérico
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
  rescue
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

    # Se já existe e tem título válido, verifica se precisa de limpeza
    if previews[slug] && previews[slug]['title'] && !previews[slug]['title'].to_s.strip.empty?
      old_title = previews[slug]['title']
      previews[slug] = apply_domain_rules(previews[slug], previews[slug]['url'])
      if old_title != previews[slug]['title']
        puts " [FIX] #{slug} (Título limpo)"
        updated = true
      end
    else
      # Modo Download (Novo ou Reparo de Erro)
      puts " [FETCH] #{slug} -> #{link}"
      
      data = nil
      
      # SE FOR YOUTUBE, USA O PROXY NOEMBED
      if link =~ /youtube\.com|youtu\.be/
        data = fetch_youtube_data(link)
      else
        body = fetch_url(link)
        data = extract_og_data(body, link) if body
      end

      if data && data['title']
        data = apply_domain_rules(data, link)
        previews[slug] = data
        updated = true
        puts "   -> Sucesso: #{data['title']}"
        sleep 1
      else
        puts "   -> Falha ao obter dados"
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