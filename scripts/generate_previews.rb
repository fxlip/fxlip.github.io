#!/usr/bin/env ruby
require 'net/http'
require 'uri'
require 'nokogiri'
require 'yaml'
require 'fileutils'

ROOT = File.expand_path(File.join(__dir__, '..'))
DATA_DIR = File.join(ROOT, '_data')
PREVIEWS_FILE = File.join(DATA_DIR, 'previews.yml')

# Configuração de busca (Procura em ambos os lugares)
TARGET_DIRS = ['_curadoria', '_posts']

puts "--- INICIANDO DIAGNÓSTICO AVANÇADO ---"
puts "Raiz do projeto: #{ROOT}"
puts "Conteúdo da raiz (O que o GitHub vê):"
puts Dir.glob(File.join(ROOT, '*')).map { |f| File.basename(f) }.join(', ')

# 1. Filtro Sanitário
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
    data['title'] = data['title'].gsub(/\s*\|\s*G1.*$/, '').gsub(/\s*-\s*G1.*$/, '')
  when /youtube\.com/, /youtu\.be/
    data['title'] = data['title'].gsub(/\s*-\s*YouTube$/, '')
  when /uol\.com\.br/
    data['title'] = data['title'].gsub(/\s*-\s*UOL.*$/, '')
  when /folha\.uol\.com\.br/
    data['title'] = data['title'].gsub(/\s*-\s*Folha.*$/, '')
  end

  data['title'] = data['title'].strip
  if original_title != data['title']
    puts "   [CLEANER] Limpo: '#{original_title}' -> '#{data['title']}'"
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

previews = File.exist?(PREVIEWS_FILE) ? YAML.load_file(PREVIEWS_FILE) : {}
previews ||= {}
updated = false

TARGET_DIRS.each do |dir_name|
  full_path = File.join(ROOT, dir_name)
  
  unless Dir.exist?(full_path)
    puts "\n[AVISO] Pasta não encontrada: #{dir_name} (Pulando)"
    next
  end

  puts "\nProcessando pasta: #{dir_name}"
  
  # Busca Case Insensitive para .md e .markdown
  files = Dir.glob(File.join(full_path, '*.{md,markdown,MD,MARKDOWN}'))
  
  if files.empty?
    puts " -> Pasta existe mas está vazia de arquivos Markdown."
  end

  files.each do |post_path|
    filename = File.basename(post_path)
    slug = filename.sub(/^\d{4}-\d{2}-\d{2}-/, '').sub(/\.[^.]+$/, '')
    content = File.read(post_path)
    
    link = nil
    if content =~ /^link_url:\s*"?([^"\n]+)"?/
      link = $1
    elsif content =~ /https?:\/\/[^\s"']+/
      link = $&
    end

    unless link
      puts " [SKIP] #{slug} (Sem link)"
      next
    end

    if previews[slug] && previews[slug]['title']
      # Modo Correção (aplica regras G1 mesmo se já existe)
      old_title = previews[slug]['title']
      previews[slug] = apply_domain_rules(previews[slug], previews[slug]['url'])
      if old_title != previews[slug]['title']
        puts " [FIX] #{slug} (Regra aplicada)"
        updated = true
      end
    else
      # Modo Download
      puts " [NEW] #{slug} -> Baixando..."
      body = fetch_url(link)
      if body
        data = extract_og_data(body, link)
        data = apply_domain_rules(data, link)
        previews[slug] = data
        updated = true
        puts "   -> Sucesso: #{data['title']}"
        sleep 1
      else
        puts "   -> Falha no download"
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