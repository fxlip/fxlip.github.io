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
SYSADMIN_DIR = File.join(ROOT, '_root')

# --- FUNÇÕES AUXILIARES ---
def slugify(text)
  return nil if text.nil? || text.strip.empty?
  text.to_s.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
end

puts "--- INICIANDO PROTOCOLO EMAIL-TO-GIT (DEBUG MODE V3) ---"
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
    
    # Normalização do Assunto (Remove prefixos de resposta como 'Re:', 'Fwd:')
    raw_subject = mail.subject.to_s
    subject = raw_subject.gsub(/^(Re|Fwd): /i, '').strip
    
    puts " [DEBUG] Assunto Detectado: '#{subject}'"
    
    # --- ROTEAMENTO INTELIGENTE ---
    is_sysadmin = false
    category = nil
    tag = nil
    clean_title = nil
    
    # Verifica a presença de barras para roteamento
    if subject.include?('/')
      parts = subject.split('/').map(&:strip)
      puts " [DEBUG] Partes identificadas: #{parts.inspect} (Total: #{parts.length})"
      
      if parts.length == 3
        is_sysadmin = true
        category = parts[0].downcase
        tag = parts[1].downcase
        clean_title = parts[2]
      else
        puts " [AVISO] Barras detectadas, mas formato incorreto. Esperado: cat/tag/titulo. Caindo para Post padrão."
      end
    end

    if is_sysadmin
      display_title = clean_title
      target_dir = SYSADMIN_DIR
      FileUtils.mkdir_p(target_dir)
      
      # Força o layout page explicitamente
      front_matter = <<~EOF
        ---
        layout: page
        title: "#{display_title}"
        date:   #{now.strftime('%Y-%m-%d %H:%M:%S %z')}
        categories: [#{category}]
        tags: [#{tag}]
        ---
      EOF
      
      puts " [ROUTE] MODO SYSADMIN ATIVADO -> #{category}/#{tag}"
      raw_slug = slugify(clean_title)
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
      
      puts " [ROUTE] MODO BLOG POST (PADRÃO)"
      raw_slug = slugify(display_title)
    end
    
    # Fallback para slug
    if raw_slug.nil? || raw_slug.empty?
      raw_slug = "post-#{SecureRandom.hex(4)}"
    end

    # Corpo do Email
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
    puts " -> Arquivo gravado em: #{filepath}"

    # Marca como lido e deleta
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