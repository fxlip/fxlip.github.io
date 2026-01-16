#!/usr/bin/env ruby
require 'net/imap'
require 'mail'
require 'date'
require 'fileutils'
require 'securerandom'
require 'digest'

# --- CONFIGURAÇÕES ---
IMAP_SERVER = 'imap.gmail.com'
IMAP_PORT = 993
USERNAME = ENV['EMAIL_USERNAME']
PASSWORD = ENV['EMAIL_PASSWORD']
ALLOWED_SENDER = ENV['ALLOWED_SENDER']

ROOT = File.expand_path(File.join(__dir__, '..'))
POSTS_DIR = File.join(ROOT, '_posts')
COLLECTION_DIR = File.join(ROOT, '_root') 

# --- HELPER: Slugify ---
def slugify(text)
  return nil if text.nil? || text.strip.empty?
  text.to_s.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
end

puts "--- INICIANDO PROTOCOLO EMAIL-TO-GIT (CRYPTO FILESYSTEM V9 - SELF HEALING) ---"

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
    
    puts " [PROCESS] Analisando: '#{subject}'"
    
    # --- LÓGICA DE ROTEAMENTO ---
    is_root_doc = false
    category = "geral"
    tag = "misc"
    clean_title = subject
    
    if subject.include?('/')
      parts = subject.split('/').map(&:strip)
      if parts.length == 3
        is_root_doc = true
        category = parts[0].downcase
        tag = parts[1].downcase
        clean_title = parts[2]
      end
    end

    if is_root_doc
      target_dir = COLLECTION_DIR
      FileUtils.mkdir_p(target_dir) # Cria _root se não existir
      
      # URL Limpa
      url_cat = slugify(category)
      url_tag = slugify(tag)
      url_title = slugify(clean_title)
      custom_permalink = "/#{url_cat}/#{url_tag}/#{url_title}/"
      
      # NOME DO ARQUIVO: Hex Address (0x...)
      memory_address = "0x" + SecureRandom.hex(2).upcase
      filename_slug = memory_address

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
      
      puts " [ROUTE] ROOT (MEM ADDR: #{memory_address}) -> #{custom_permalink}"
    else
      # POSTS PADRÃO
      target_dir = POSTS_DIR
      
      # CORREÇÃO CRÍTICA: Garante que a pasta _posts existe
      FileUtils.mkdir_p(target_dir) 
      
      # NOME DO ARQUIVO: Hash MD5
      hash_slug = Digest::MD5.hexdigest("#{subject}#{now.to_f}")
      filename_slug = hash_slug

      front_matter = <<~EOF
        ---
        layout: post
        title:  "#{subject.gsub('"', '\"')}"
        date:   #{now.strftime('%Y-%m-%d %H:%M:%S %z')}
        ---
      EOF
      
      puts " [ROUTE] POST (MD5: #{hash_slug})"
    end
    
    body = if mail.multipart?
             mail.text_part ? mail.text_part.decoded : mail.html_part.decoded
           else
             mail.body.decoded
           end
    body = body.to_s.force_encoding('UTF-8').scrub
    body = "" if body.nil?

    filename = "#{now.strftime('%Y-%m-%d')}-#{filename_slug}.md"
    filepath = File.join(target_dir, filename)

    File.write(filepath, "#{front_matter}\n#{body}")
    puts " -> Artifact created: #{filepath}"

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