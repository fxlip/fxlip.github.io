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
SYSADMIN_DIR = File.join(ROOT, '_sysadmin')

# --- FUNÇÕES AUXILIARES ---
def slugify(text)
  return nil if text.nil? || text.strip.empty?
  text.to_s.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
end

puts "--- INICIANDO PROTOCOLO EMAIL-TO-GIT (ROUTING V2) ---"
puts "Hora do Sistema: #{Time.now}"

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

    now = Time.now
    subject = mail.subject
    
    # --- ROTEAMENTO INTELIGENTE ---
    # Verifica se o assunto segue o padrão: categoria/tag/titulo
    is_sysadmin = false
    category = nil
    tag = nil
    clean_title = nil

    if subject && subject.include?('/')
      parts = subject.split('/').map(&:strip)
      # Aceita apenas se tiver exatamente 3 partes (cat/tag/title)
      if parts.length == 3
        is_sysadmin = true
        category = parts[0].downcase
        tag = parts[1].downcase
        clean_title = parts[2]
      end
    end

    # Define diretório e título final
    if is_sysadmin
      display_title = clean_title
      target_dir = SYSADMIN_DIR
      FileUtils.mkdir_p(target_dir) # Cria a pasta _sysadmin se não existir
      puts " [ROUTE] Redirecionando para SYSADMIN: #{category}/#{tag}"
    else
      # Fluxo Padrão (Blog Post)
      if subject.nil? || subject.strip.empty?
        raw_slug = now.strftime('%Y%m%d-%H%M%S')
        display_title = raw_slug
      else
        display_title = subject.gsub('"', '\"')
      end
      target_dir = POSTS_DIR
      puts " [ROUTE] Redirecionando para POSTS (Padrão)"
    end

    # Slugify do título
    if is_sysadmin
      raw_slug = slugify(clean_title)
    else
      raw_slug = slugify(display_title)
    end
    
    if raw_slug.nil? || raw_slug.empty?
      raw_slug = "post-#{SecureRandom.hex(4)}"
    end

    # Corpo do Email
    body = if mail.multipart?
             mail.text_part ? mail.text_part.decoded : mail.html_part.decoded
           else
             mail.body.decoded
           end
    body = "" if body.nil?
    body = body.force_encoding('UTF-8').scrub

    # Definição do Arquivo
    post_date_str = now.strftime('%Y-%m-%d %H:%M:%S %z')
    filename_date = now.strftime('%Y-%m-%d')
    filename = "#{filename_date}-#{raw_slug}.md" # Extensão .md simplificada
    filepath = File.join(target_dir, filename)

    # Front Matter Dinâmico
    if is_sysadmin
      # Layout específico para sysadmin ou genérico page
      front_matter = <<~EOF
        ---
        layout: page
        title: "#{display_title}"
        date:   #{post_date_str}
        categories: [#{category}]
        tags: [#{tag}]
        ---
      EOF
    else
      # Layout padrão de blog
      front_matter = <<~EOF
        ---
        layout: post
        title:  "#{display_title}"
        date:   #{post_date_str}
        ---
      EOF
    end

    full_content = "#{front_matter}\n#{body}"

    File.write(filepath, full_content)
    puts " -> Arquivo criado: #{filepath}"

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