require 'net/http'
require 'json'
require 'yaml'
require 'uri'

WORKER_URL = ENV['WORKER_URL'] || "https://fxlip-visitor-api.fxlip.workers.dev"
ADMIN_TOKEN = ENV['ADMIN_TOKEN']
OUTPUT_FILE = "_data/visitors.yml"

if !ADMIN_TOKEN || ADMIN_TOKEN.empty?
  puts "!! ERRO: ADMIN_TOKEN não definido."
  exit 1
end

puts "[ SYNC ] Buscando relatório de visitantes..."

uri = URI("#{WORKER_URL}/api/report?token=#{ADMIN_TOKEN}")
response = Net::HTTP.get_response(uri)

if response.code != "200"
  puts "!! ERRO: Worker retornou HTTP #{response.code}"
  exit 1
end

data = JSON.parse(response.body)

report = {
  "generated" => data["generated"],
  "total_visitors" => data["total_visitors"],
  "total_pages" => data["total_pages"],
  "visitors" => data["visitors"],
  "views" => data["views"]
}

File.write(OUTPUT_FILE, YAML.dump(report))
puts "[ OK ] #{OUTPUT_FILE} atualizado: #{data['total_visitors']} visitantes, #{data['total_pages']} páginas."
