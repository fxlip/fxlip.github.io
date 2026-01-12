#!/usr/bin/env ruby
require 'net/imap'
require 'mail'
require 'date'
require 'fileutils'
require 'securerandom'

# --- CONFIGURAÇÕES ---
IMAP_SERVER = 'imap.gmail.com'
IMAP_PORT = 993
USERNAME = ENV['EMAIL_USERNAME']
PASSWORD = ENV['EMAIL_PASSWORD']
ALLOWED_SENDER = ENV['ALLOWED_SENDER']

ROOT = File.expand_path(File.join(__dir__, '..'))
POSTS_DIR = File.join(ROOT, '_posts')

# --- FUNÇÕES AUXILIARES ---
def slugify(text)
  # Se o texto for nulo, retorna nil para ser tratado depois
  return nil if text.nil? || text.strip.empty?
  
  # Remove acentos, caracteres especiais e espaços
  text.to_s.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
end

puts "--- INICIANDO PROTOCOLO EMAIL-TO-GIT (SYSTEM TIMEZONE) ---"
puts "Hora do Sistema: #{Time.now}" # Log para confirmar se o TZ pegou

begin
  # Conexão IMAP
  imap = Net::IMAP.new(IMAP_SERVER, port: IMAP_PORT, ssl: true)
  imap.login(USERNAME, PASSWORD)
  imap.select('INBOX')

  # Filtro de Segurança: Apenas não lidos do seu e-mail
  search_criteria = ['UNSEEN', 'FROM', ALLOWED_SENDER]
  email_ids = imap.search(search_criteria)

  if email_ids.empty?
    puts "Nenhum novo comando encontrado."
    exit
  end

  email_ids.each do |message_id|
    msg = imap.fetch(message_id, 'RFC822')[0].attr['RFC822']
    mail = Mail.new(msg)

    # 1. Captura da Data/Hora (Usa o TZ do sistema definido no Workflow)
    now = Time.now
    
    # 2. Tratamento do Assunto
    subject = mail.subject
    
    # Se vier sem assunto, gera um ID baseado no tempo: 20260112-193000
    if subject.nil? || subject.strip.empty?
      raw_slug = now.strftime('%Y%m%d-%H%M%S')
      display_title = raw_slug # O título no post será o timestamp
    else
      raw_slug = slugify(subject)
      display_title = subject.gsub('"', '\"')
    end

    # Garante slug único se algo falhar
    if raw_slug.nil? || raw_slug.empty?
      raw_slug = "post-#{SecureRandom.hex(4)}"
    end

    # 3. Tratamento do Corpo (Texto ou HTML)
    body = if mail.multipart?
             mail.text_part ? mail.text_part.decoded : mail.html_part.decoded
           else
             mail.body.decoded
           end

    body = "" if body.nil?
    
    # Limpeza de encoding e caracteres estranhos
    body = body.force_encoding('UTF-8').scrub

    puts "Processando: #{display_title}"

    # 4. Definição do Arquivo
    # O date no front matter usa %z para gravar o offset (ex: -0300) explicitamente
    post_date_str = now.strftime('%Y-%m-%d %H:%M:%S %z')
    filename_date = now.strftime('%Y-%m-%d')
    
    filename = "#{filename_date}-#{raw_slug}.markdown"
    filepath = File.join(POSTS_DIR, filename)

    # 5. Criação do Markdown
    markdown_content = <<~EOF
      ---
      layout: post
      title:  "#{display_title}"
      date:   #{post_date_str}
      ---
      
      #{body}
    EOF

    File.write(filepath, markdown_content)
    puts " -> Arquivo criado: #{filename}"

    # 6. Marcar como Lido e Deletado
    imap.store(message_id, "+FLAGS", [:Seen, :Deleted])
  end

  # Limpeza final no servidor de e-mail
  imap.expunge
  imap.logout
  imap.disconnect

rescue => e
  puts "ERRO CRÍTICO: #{e.message}"
  puts e.backtrace.join("\n")
  exit 1
end