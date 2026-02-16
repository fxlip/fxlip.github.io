require 'net/http'
require 'uri'
require 'json'

# --- CONFIGURAÇÃO ---
HOST = "fxlip.com"
if ENV['INDEXNOW_KEY'].nil? || ENV['INDEXNOW_KEY'].empty?
  puts "   [AVISO] Sem INDEXNOW_KEY. Ignorando ping, mas mantendo deploy verde."
  exit 0 
end
KEY = ENV['INDEXNOW_KEY']

KEY_LOCATION = "https://fxlip.com/#{KEY}.txt"

# Endpoint oficial do IndexNow (O Bing replica para os outros)
ENDPOINT = "https://api.indexnow.org/indexnow"

urls_to_index = [
  "https://#{HOST}/"
]

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
  http.open_timeout = 10
  http.read_timeout = 10

  request = Net::HTTP::Post.new(uri.path, {'Content-Type' => 'application/json; charset=utf-8'})
  request.body = payload.to_json

  response = http.request(request)

  if response.code == "200" || response.code == "202"
    puts "   [SUCESSO] IndexNow notificado. Código: #{response.code}"
  else
    puts "   [FALHA] IndexNow rejeitou. Código: #{response.code} - #{response.body}"
  end
rescue Net::OpenTimeout, Net::ReadTimeout => e
  puts "   [ERRO] Timeout na conexão: #{e.message}"
rescue => e
  puts "   [ERRO] Falha na conexão: #{e.class} - #{e.message}"
rescue => e
  puts "   [ERRO NÃO-FATAL] IndexNow falhou: #{e.message}"
  exit 0
end
