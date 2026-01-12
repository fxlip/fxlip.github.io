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
  text.to_s.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
end

puts "--- INICIANDO PROTOCOLO EMAIL-TO-GIT (FORÇANDO BRT) ---"

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

    # --- CORREÇÃO DE FUSO HORÁRIO (Cálculo Manual) ---
    # O servidor está em UTC. Subtraímos 3 horas (3 * 3600 segundos) manualmente.
    # Isso garante que 22:00 UTC vire 19:00 (Visualmente BRT)
    utc_now = Time.now.utc
    br_time = utc_now - 10800 

    # Se não tiver assunto, usa o timestamp BRT ajustado
    subject = mail.subject
    if subject.nil? || subject.strip.empty?
      subject = br_time.strftime('%Y%m%d-%H%M%S') # Ex: 20260112-191500
    end

    body = if mail.multipart?
             mail.text_part ? mail.text_part.decoded : mail.html_part.decoded
           else
             mail.body.decoded
           end

    body = "" if body.nil?
    body = body.force_encoding('UTF-8').scrub

    puts "Processando: #{subject}"

    # Formata a data forçando a string do fuso para -0300
    # O Jekyll vai ler isso e entender que é horário de Brasília
    post_date = br_time.strftime('%Y-%m-%d %H:%M:%S -0300')
    filename_date = br_time.strftime('%Y-%m-%d')
    
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