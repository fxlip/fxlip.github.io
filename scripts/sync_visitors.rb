require 'net/http'
require 'json'
require 'yaml'
require 'uri'
require 'fileutils'

WORKER_URL = ENV['WORKER_URL'] || "https://fxlip-visitor-api.fxlip.workers.dev"
ADMIN_TOKEN = ENV['ADMIN_TOKEN']
OUTPUT_FILE = "_data/visitors.yml"

if !ADMIN_TOKEN || ADMIN_TOKEN.empty?
  puts "!! ERRO: ADMIN_TOKEN não definido."
  exit 1
end

puts "[ SYNC ] Buscando relatório de visitantes..."

uri = URI("#{WORKER_URL}/api/report")
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = (uri.scheme == 'https')
http.open_timeout = 10
http.read_timeout = 10

request = Net::HTTP::Get.new(uri.path)
request['Authorization'] = "Bearer #{ADMIN_TOKEN}"

response = http.request(request)

if response.code != "200"
  puts "!! ERRO: Worker retornou HTTP #{response.code}"
  exit 1
end

begin
  data = JSON.parse(response.body)
rescue JSON::ParserError => e
  puts "!! ERRO: Resposta inválida do Worker: #{e.message}"
  exit 1
end

report = {
  "generated" => data["generated"],
  "total_visitors" => data["total_visitors"],
  "total_pages" => data["total_pages"],
  "visitors" => data["visitors"],
  "views" => data["views"]
}

FileUtils.mkdir_p(File.dirname(OUTPUT_FILE))
File.write(OUTPUT_FILE, YAML.dump(report))
puts "[ OK ] #{OUTPUT_FILE} atualizado: #{data['total_visitors']} visitantes, #{data['total_pages']} páginas."
