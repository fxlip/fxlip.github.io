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

# --- FUNÇÕES AUXILIARES ---
def slugify(text)
  return nil if text.nil? || text.strip.empty?
  text.to_s.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
end

puts "--- INICIANDO PROTOCOLO EMAIL-TO-GIT (PERMALINK V5) ---"
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
    
    raw_subject = mail.subject.to_s
    subject = raw_subject.gsub(/^(Re|Fwd): /i, '').strip
    
    puts " [DEBUG] Assunto: '#{subject}'"
    
    # --- ROTEAMENTO INTELIGENTE ---
    is_collection_item = false
    category = nil
    tag = nil
    clean_title = nil
    
    if subject.include?('/')
      parts = subject.split('/').map(&:strip)
      
      if parts.length == 3
        is_collection_item = true
        category = parts[0].downcase
        tag = parts[1].downcase
        clean_title = parts[2]
      else
        puts " [AVISO] Formato incorreto. Esperado: cat/tag/titulo."
      end
    end

    if is_collection_item
      display_title = clean_title
      target_dir = COLLECTION_DIR
      FileUtils.mkdir_p(target_dir)
      
      raw_slug = slugify(clean_title)
      
      # PERMALINK MÁGICO: Força a URL exata que você quer
      custom_permalink = "/root/#{category}/#{tag}/#{raw_slug}/"
      
      front_matter = <<~EOF
        ---
        layout: page
        title: "#{display_title}"
        date:   #{now.strftime('%Y-%m-%d %H:%M:%S %z')}
        categories: [#{category}]
        tags: [#{tag}]
        permalink: #{custom_permalink}
        ---
      EOF
      
      puts " [ROUTE] ROOT -> #{category}/#{tag} (Link: #{custom_permalink})"
    else
      display_title = subject.empty? ? now.strftime('%Y%m%d-%H%M%S') : subject.gsub('"', '\"')
      target_dir = POSTS_DIR
      
      front_matter = <<~EOF
        ---
        layout: post
        title:  "#{display_title}"
        date:   #{now.strftime('%Y-%m-%d %H:%M:%S %z')}
        ---
      EOF
      
      puts " [ROUTE] BLOG POST (PADRÃO)"
      raw_slug = slugify(display_title)
    end
    
    if raw_slug.nil? || raw_slug.empty?
      raw_slug = "post-#{SecureRandom.hex(4)}"
    end

    body = if mail.multipart?
             mail.text_part ? mail.text_part.decoded : mail.html_part.decoded
           else
             mail.body.decoded
           end
    body = body.to_s.force_encoding('UTF-8').scrub
    body = "" if body.nil?

    filename = "#{now.strftime('%Y-%m-%d')}-#{raw_slug}.md"
    filepath = File.join(target_dir, filename)

    full_content = "#{front_matter}\n#{body}"

    File.write(filepath, full_content)
    puts " -> Arquivo gravado: #{filepath}"

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