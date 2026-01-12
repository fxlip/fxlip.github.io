#!/usr/bin/env ruby
require 'net/imap'
require 'mail'
require 'date'
require 'fileutils'
require 'securerandom'

# Configurações
IMAP_SERVER = 'imap.gmail.com'
IMAP_PORT = 993
USERNAME = ENV['EMAIL_USERNAME']
PASSWORD = ENV['EMAIL_PASSWORD']
ALLOWED_SENDER = ENV['ALLOWED_SENDER']

ROOT = File.expand_path(File.join(__dir__, '..'))
POSTS_DIR = File.join(ROOT, '_posts')

def slugify(text)
  return "post-#{SecureRandom.hex(4)}" if text.nil? || text.strip.empty?
  # Remove caracteres especiais e espaços
  text.to_s.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
end

puts "--- INICIANDO PROTOCOLO EMAIL-TO-GIT (BRT) ---"

begin
  imap = Net::IMAP.new(IMAP_SERVER, port: IMAP_PORT, ssl: true)
  imap.login(USERNAME, PASSWORD)
  imap.select('INBOX')

  search_criteria = ['UNSEEN', 'FROM', ALLOWED_SENDER]
  email_ids = imap.search(search_criteria)

  if email_ids.empty?
    puts "Nenhum novo comando encontrado."
    exit
  end

  email_ids.each do |message_id|
    msg = imap.fetch(message_id, 'RFC822')[0].attr['RFC822']
    mail = Mail.new(msg)

    # --- AJUSTE DE FUSO HORÁRIO (Brasília UTC-3) ---
    # O servidor do GitHub roda em UTC. Forçamos a conversão.
    now_br = Time.now.getlocal("-03:00")
    
    # TIMESTAMP COMO TÍTULO
    # Se não tiver assunto, usa: YYYYMMDD-HHMMSS (ex: 20260112-221500)
    subject = mail.subject
    if subject.nil? || subject.strip.empty?
      subject = now_br.strftime('%Y%m%d-%H%M%S')
    end

    body = if mail.multipart?
             mail.text_part ? mail.text_part.decoded : mail.html_part.decoded
           else
             mail.body.decoded
           end

    body = "" if body.nil?
    body = body.force_encoding('UTF-8').scrub

    puts "Processando: #{subject}"

    # Datas formatadas com o fuso correto
    post_date = now_br.strftime('%Y-%m-%d %H:%M:%S %z') # Formato Jekyll completo
    filename_date = now_br.strftime('%Y-%m-%d')
    
    slug = slugify(subject)
    
    filename = "#{filename_date}-#{slug}.markdown"
    filepath = File.join(POSTS_DIR, filename)

    markdown_content = <<~EOF
      ---
      layout: post
      title:  "#{subject.gsub('"', '\"')}"
      date:   #{post_date}
      ---
      
      #{body}
    EOF

    File.write(filepath, markdown_content)
    puts " -> Arquivo criado: #{filename}"

    imap.store(message_id, "+FLAGS", [:Seen, :Deleted])
  end

  imap.expunge
  imap.logout
  imap.disconnect

rescue => e
  puts "ERRO CRÍTICO: #{e.message}"
  puts e.backtrace.join("\n")
  exit 1
end