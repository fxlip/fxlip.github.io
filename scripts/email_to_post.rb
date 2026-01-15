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
COLLECTION_DIR = File.join(ROOT, '_root') 

# --- HELPER: Slugify Limpo ---
def slugify(text)
  return nil if text.nil? || text.strip.empty?
  # Remove acentos, caracteres especiais e espaços
  text.to_s.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
end

puts "--- INICIANDO PROTOCOLO EMAIL-TO-GIT (HIERARCHY V6) ---"

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
    
    # Limpa Assunto
    raw_subject = mail.subject.to_s
    subject = raw_subject.gsub(/^(Re|Fwd): /i, '').strip
    
    puts " [PROCESS] Analisando: '#{subject}'"
    
    # --- LÓGICA DE ROTEAMENTO ---
    is_root_doc = false
    category = "geral"
    tag = "misc"
    clean_title = subject
    
    # Se houver barras, ativa o modo Root/Tree
    if subject.include?('/')
      parts = subject.split('/').map(&:strip)
      if parts.length == 3
        is_root_doc = true
        category = parts[0].downcase
        tag = parts[1].downcase
        clean_title = parts[2] # Mantém case original para o Título Visual
      end
    end

    if is_root_doc
      target_dir = COLLECTION_DIR
      FileUtils.mkdir_p(target_dir)
      
      # Gera slugs para URL
      url_cat = slugify(category)
      url_tag = slugify(tag)
      url_title = slugify(clean_title)
      
      # PERMALINK HIERÁRQUICO
      # Força: /root/categoria/tag/titulo/
      custom_permalink = "/root/#{url_cat}/#{url_tag}/#{url_title}/"
      
      front_matter = <<~EOF
        ---
        layout: page
        title: "#{clean_title}"
        date:   #{now.strftime('%Y-%m-%d %H:%M:%S %z')}
        categories: [#{category}]
        tags: [#{tag}]
        permalink: #{custom_permalink}
        ---
      EOF
      
      puts " [ROUTE] ROOT DETECTADO: #{custom_permalink}"
      filename_slug = url_title
    else
      # Blog Post Padrão
      target_dir = POSTS_DIR
      front_matter = <<~EOF
        ---
        layout: post
        title:  "#{subject.gsub('"', '\"')}"
        date:   #{now.strftime('%Y-%m-%d %H:%M:%S %z')}
        ---
      EOF
      
      puts " [ROUTE] POST PADRÃO"
      filename_slug = slugify(subject)
    end
    
    # Fallback de segurança para nome de arquivo
    if filename_slug.nil? || filename_slug.empty?
      filename_slug = "doc-#{SecureRandom.hex(4)}"
    end

    # Conteúdo
    body = if mail.multipart?
             mail.text_part ? mail.text_part.decoded : mail.html_part.decoded
           else
             mail.body.decoded
           end
    body = body.to_s.force_encoding('UTF-8').scrub
    body = "" if body.nil?

    # Nome do Arquivo (Apenas para organização interna, não afeta URL)
    filename = "#{now.strftime('%Y-%m-%d')}-#{filename_slug}.md"
    filepath = File.join(target_dir, filename)

    File.write(filepath, "#{front_matter}\n#{body}")
    puts " -> Criado em: #{filepath}"

    imap.store(message_id, "+FLAGS", [:Seen, :Deleted])
  end

  imap.expunge
  imap.logout
  imap.disconnect

rescue => e
  puts "ERRO FATAL: #{e.message}"
  puts e.backtrace.join("\n")
  exit 1
end