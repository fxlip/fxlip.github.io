#!/usr/bin/env ruby
# ==============================================================================
#  LINK PREVIEW GENERATOR V4.5 (TEXT-ONLY / HIGH PERFORMANCE)
#  - Purpose: Fetch metadata for external links & clean up internal refs
#  - Author: System Logic (Refactored)
# ==============================================================================

require 'net/http'
require 'uri'
require 'nokogiri'
require 'yaml'
require 'cgi'
require 'openssl'

# --- 1. CONFIGURATION & CONSTANTS ---
ROOT = File.expand_path(File.join(__dir__, '..'))
DATA_DIR = File.join(ROOT, '_data')
PREVIEWS_FILE = File.join(DATA_DIR, 'previews.yml')
TARGET_DIRS = ['_curadoria', '_posts']

# Personas de Navegação (Para evitar bloqueios 403)
UA_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
UA_SOCIAL = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

puts "--- INICIANDO PROTOCOLO DE PREVIEWS ---"

# ==============================================================================
#  2. NETWORK MODULE (Camada de Rede)
# ==============================================================================

# Realiza requisições HTTP seguras com suporte a redirect e troca de User-Agent
def fetch_url(url, limit = 5, use_social_ua = false)
  return nil if limit == 0
  
  begin
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

# ==============================================================================
#  3. EXTRACTION MODULE (Inteligência de Parsing)
# ==============================================================================

# Extrai dados básicos de Open Graph
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

# Tratamento especial para YouTube (Embed leve)
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

# ==============================================================================
#  4. SANITIZATION MODULE (Limpeza de Dados)
# ==============================================================================

def apply_domain_rules(data, url)
  return data unless data['title']
  
  if data['title'].respond_to?(:force_encoding)
    data['title'] = data['title'].force_encoding('UTF-8')
  end
  
  host = URI.parse(url).host.downcase rescue nil
  return data unless host

  # Limpeza de Sufixos de SEO (Cleaner UI)
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

# ==============================================================================
#  5. MAIN ENGINE (Execução)
# ==============================================================================

previews = File.exist?(PREVIEWS_FILE) ? YAML.load_file(PREVIEWS_FILE) : {}
previews ||= {}
updated = false

TARGET_DIRS.each do |dir_name|
  full_path = File.join(ROOT, dir_name)
  next unless Dir.exist?(full_path)

  puts "\n>>> Analisando diretório: #{dir_name}"
  
  Dir.glob(File.join(full_path, '*.{md,markdown,MD,MARKDOWN}')).each do |post_path|
    filename = File.basename(post_path)
    # Slug é a chave do post (ex: d82a66aa)
    slug = filename.sub(/^\d{4}-\d{2}-\d{2}-/, '').sub(/\.[^.]+$/, '')
    content = File.read(post_path)
    
    # [5.1] EXTRAÇÃO DE LINKS (Regex Blindada)
    # Procura link_url no frontmatter OU link solto no corpo
    link = nil
    if content =~ /^link_url:\s*"?([^"\n]+)"?/
      link = $1
    elsif content =~ /https?:\/\/[^\s"'>\])]+/
      link = $&
    end
    
    # Remove pontuação final arrastada pela regex (ex: ponto final da frase)
    link = link.gsub(/[>\]).,]+$/, '') if link

    next unless link

    # [5.2] CONTROLE DE JURISDIÇÃO (Internal vs External)
    # Se for link interno, o Ruby DEVE apagar do YAML para que o JS (autolink.js) assuma.
    if link.include?('felip.com.br') || link.include?('localhost') || link.include?('127.0.0.1')
      if previews[slug]
        puts " [CLEAN] Link interno detectado. Removendo cache para dar lugar ao JS: #{slug}"
        previews.delete(slug)
        updated = true
      end
      next # Pula para o próximo arquivo, não processa fetch
    end

    # [5.3] PROCESSAMENTO DE LINKS EXTERNOS
    current_data = previews[slug]
    is_youtube = link =~ /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
    video_id = $1 if is_youtube
    
    # Verifica se precisa de imagem ou se precisa baixar dados novos
    has_image_garbage = current_data && current_data['image'] != nil
    needs_fetch = !current_data || (is_youtube && !current_data['video_id'])

    if needs_fetch
      puts " [FETCH] #{slug} -> #{link}"
      
      data = nil
      if is_youtube
        data = fetch_youtube_data(link, video_id)
      elsif link =~ /https?:\/\/(www\.)?(twitter|x)\.com/
        # Twitter Text Only (Via Proxy FixupX para contornar bloqueio)
        proxy = link.gsub(%r{https?://(www\.)?(twitter|x)\.com}, 'https://fixupx.com')
        html = fetch_url(proxy)
        data = extract_og_data(html, link) if html
      else
        # Tenta fetch normal, se falhar tenta user-agent social
        body = fetch_url(link, 5, false)
        body = fetch_url(link, 5, true) unless body 
        
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
        puts "   -> [NEW] #{data['title'][0..40]}..."
        # Sleep gentil para não tomar Rate Limit
        sleep 1
      end
      
    elsif has_image_garbage
      # [5.4] POLÍTICA TEXT-ONLY
      # Se já existe mas tem imagem cacheada, remove a imagem para economizar bytes
      puts " [OPTIMIZE] Removendo imagem legada de #{slug}..."
      previews[slug]['image'] = nil
      updated = true
    end
  end
end

# ==============================================================================
#  6. PERSISTENCE (Salvar Estado)
# ==============================================================================

if updated
  File.open(PREVIEWS_FILE, 'w') { |f| f.write(previews.to_yaml) }
  puts "\n--- [SUCCESS] previews.yml atualizado e otimizado. ---"
else
  puts "\n--- [OK] Nenhuma alteração necessária. ---"
end