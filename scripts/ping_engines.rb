require 'net/http'
require 'uri'

# Configuração
SITEMAP_URL = "https://felip.com.br/sitemap.xml"

# Matriz de Alvos
engines = {
  bing: "http://www.bing.com/ping?sitemap=#{SITEMAP_URL}",
  google: "http://www.google.com/ping?sitemap=#{SITEMAP_URL}" # Tentativa legacy
}

puts ">>> [PING] Iniciando notificação aos motores de busca..."

engines.each do |service, url|
  begin
    uri = URI.parse(url)
    response = Net::HTTP.get_response(uri)
    
    if response.is_a?(Net::HTTPSuccess)
      puts "   [#{service.upcase}] Sucesso: #{response.code}"
    else
      puts "   [#{service.upcase}] Falha: #{response.code} - #{response.message}"
    end
  rescue => e
    puts "   [#{service.upcase}] Erro de conexão: #{e.message}"
  end
end