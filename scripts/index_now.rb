require 'net/http'
require 'uri'
require 'json'

# --- CONFIGURAÇÃO ---
HOST = "fxlip.com"
KEY = ENV['INDEXNOW_KEY'] || "k8s9xL4zT0pQ2m1"
KEY_LOCATION = "https://fxlip.com/#{KEY}.txt"

# Endpoint oficial do IndexNow (O Bing replica para os outros)
ENDPOINT = "https://api.indexnow.org/indexnow"

# Lista de URLs para indexar (Pegamos a Home e o último post do sitemap ou hardcoded)
# Como seu site é estático, vamos forçar a HOME e tentar deduzir o último post se possível,
# ou simplificar mandando apenas a Home (o crawler acha o resto).
urls_to_index = [
  "https://#{HOST}/"
]

# Tenta ler o último arquivo criado em _posts para adicionar à lista
last_post = Dir.glob("_posts/*.md").max_by {|f| File.mtime(f)}
if last_post
  # Extrai a data e o slug do nome do arquivo (assumindo YYYY-MM-DD-slug.md)
  filename = File.basename(last_post, ".md")
  parts = filename.match(/(\d{4}-\d{2}-\d{2})-(.*)/)
  if parts
    date_path = parts[1].gsub('-', '/')
    slug = parts[2]
    # Ajuste este padrão conforme seu permalink no _config.yml
    # Se for /:categories/:title, a lógica muda. 
    # Assumindo padrão simples por enquanto ou ajustando para o seu sitemap.
    # No seu email_to_post.rb vi: permalink: /#{collection}/#{category}/#{tag}/#{slug}/
    # Isso é complexo de reconstruir sem o Jekyll context. 
    # ESTRATÉGIA: Vamos mandar apenas a HOME. O Bing vai ler o sitemap novo lá.
  end
end

puts ">>> [INDEXNOW] Preparando payload para #{HOST}..."

payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls_to_index
}

begin
  uri = URI.parse(ENDPOINT)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri.path, {'Content-Type' => 'application/json; charset=utf-8'})
  request.body = payload.to_json

  response = http.request(request)

  if response.code == "200" || response.code == "202"
    puts "   [SUCESSO] IndexNow notificado. Código: #{response.code}"
  else
    puts "   [FALHA] IndexNow rejeitou. Código: #{response.code} - #{response.body}"
  end
rescue => e
  puts "   [ERRO] Falha na conexão: #{e.message}"
end