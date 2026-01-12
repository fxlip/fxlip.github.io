#!/usr/bin/env ruby
require 'net/imap'
require 'mail'
require 'date'
require 'fileutils'
require 'securerandom'

# Configurações
IMAP_SERVER = 'imap.gmail.com' # Ajuste se não for Gmail
IMAP_PORT = 993
USERNAME = ENV['EMAIL_USERNAME']
PASSWORD = ENV['EMAIL_PASSWORD']
ALLOWED_SENDER = ENV['ALLOWED_SENDER']

ROOT = File.expand_path(File.join(__dir__, '..'))
POSTS_DIR = File.join(ROOT, '_posts')

def slugify(text)
  text.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
end

puts "--- INICIANDO PROTOCOLO EMAIL-TO-GIT ---"

begin
  imap = Net::IMAP.new(IMAP_SERVER, port: IMAP_PORT, ssl: true)
  imap.login(USERNAME, PASSWORD)
  imap.select('INBOX')

  # Busca apenas e-mails NÃO LIDOS vindos do REMETENTE PERMITIDO
  search_criteria = ['UNSEEN', 'FROM', ALLOWED_SENDER]
  email_ids = imap.search(search_criteria)

  if email_ids.empty?
    puts "Nenhum novo comando encontrado."
    exit
  end

  email_ids.each do |message_id|
    msg = imap.fetch(message_id, 'RFC822')[0].attr['RFC822']
    mail = Mail.new(msg)

    subject = mail.subject
    # Prioriza texto puro, se não tiver, tenta html decodificado
    body = if mail.multipart?
             mail.text_part ? mail.text_part.decoded : mail.html_part.decoded
           else
             mail.body.decoded
           end

    # Sanitização básica do corpo (encoding)
    body = body.force_encoding('UTF-8').scrub

    puts "Processando: #{subject}"

    # Criação do Front Matter
    date = Time.now.strftime('%Y-%m-%d %H:%M:%S')
    filename_date = Time.now.strftime('%Y-%m-%d')
    slug = slugify(subject)
    # Se o slug ficar vazio (assunto com emojis?), gera um hash
    slug = "post-#{SecureRandom.hex(4)}" if slug.empty?
    
    filename = "#{filename_date}-#{slug}.markdown"
    filepath = File.join(POSTS_DIR, filename)

    markdown_content = <<~EOF
      ---
      layout: post
      title:  "#{subject.gsub('"', '\"')}"
      date:   #{date}
      ---
      
      #{body}
    EOF

    File.write(filepath, markdown_content)
    puts " -> Arquivo criado: #{filename}"

    # Marca como Lido/Deletado para não processar de novo
    imap.store(message_id, "+FLAGS", [:Seen, :Deleted])
  end

  imap.expunge # Remove permanentemente os deletados
  imap.logout
  imap.disconnect

rescue => e
  puts "ERRO CRÍTICO: #{e.message}"
  exit 1
end