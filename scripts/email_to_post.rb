require 'net/imap'
require 'mail'
require 'yaml'
require 'fileutils'
require 'date'
require 'securerandom'

# CONFIGURAÇÃO
POSTS_ROOT = "_posts"
POSTS_DIR = "_root"
ASSETS_DIR = "files"

# Credenciais
USERNAME = ENV['EMAIL_USERNAME']
PASSWORD = ENV['EMAIL_PASSWORD']
ALLOWED_SENDER = ENV['ALLOWED_SENDER'] 
IMAP_SERVER = 'imap.gmail.com'
PORT = 993

def slugify(text)
  text.to_s.downcase.strip.gsub(' ', '_').gsub(/[^\w\-\/\.]/, '') 
end

def extract_body(mail)
  begin
    if mail.multipart?
      part = mail.text_part || mail.html_part
      content = part ? part.decoded : mail.body.decoded
    else
      content = mail.body.decoded
    end
    content = content.force_encoding("UTF-8").scrub("")
    return content.strip
  rescue => e
    return "Erro ao extrair texto: #{e.message}"
  end
end

puts "[ SYSTEM_READY ] Conectando via IMAP..."

begin
  imap = Net::IMAP.new(IMAP_SERVER, port: PORT, ssl: true)
  imap.login(USERNAME, PASSWORD)
  imap.select('INBOX')

  search_criteria = ['NOT', 'DELETED']
  if ALLOWED_SENDER && !ALLOWED_SENDER.empty?
    search_criteria += ['FROM', ALLOWED_SENDER]
  end

  all_uids = imap.uid_search(search_criteria)
  target_uids = all_uids.last(30)

  if target_uids && target_uids.any?
    puts ">> Processando #{target_uids.size} mensagens..."
    
    target_uids.reverse.each do |uid|
      begin
        raw_data = imap.uid_fetch(uid, 'RFC822')[0].attr['RFC822']
        email = Mail.new(raw_data)
        subject_str = email.subject.to_s.strip
        
        # Filtro de Loop (Ignora e-mails do próprio sistema)
        if subject_str.start_with?('[fxlip') || subject_str.include?('Run failed')
           puts "   [SKIP] Ignorando e-mail de sistema."
           imap.uid_store(uid, "+FLAGS", [:Deleted])
           next 
        end

        success = false 

        # --- LÓGICA DE DELEÇÃO CORRIGIDA (V4.1) ---
        if subject_str.upcase.start_with?('RM:')
          # Remove "RM:", espaços e barras iniciais para normalizar
          target_raw = subject_str[3..-1].strip.sub(/^\//, '')
          target = target_raw.gsub('..', '').gsub('./', '')
          
          puts ">> [COMANDO RM] Solicitado para: '#{target}'"

          if target.empty? || target == '/' || target.include?('_config') || target.include?('.git')
             puts "   [SECURITY BLOCK] Alvo inválido."
             imap.uid_store(uid, "+FLAGS", [:Deleted]) 
             next
          end

          candidates = []
          allowed_roots = [POSTS_ROOT, POSTS_DIR, ASSETS_DIR] # ["_posts", "_root", "files"]
          
          # 1. BUSCA EXATA (Para quando você manda "files/img/foto.jpg")
          full_path_candidate = File.expand_path(target, Dir.pwd)
          # Verifica se o caminho cai dentro de uma das pastas permitidas
          is_safe = allowed_roots.any? { |r| full_path_candidate.start_with?(File.expand_path(r, Dir.pwd)) }
          
          if is_safe && File.exist?(full_path_candidate)
            candidates << full_path_candidate
          end

          # 2. BUSCA RELATIVA (Para quando você manda "img/foto.jpg")
          if candidates.empty?
            allowed_roots.each do |root|
              possible_path = File.join(Dir.pwd, root, target)
              if File.exist?(possible_path)
                candidates << possible_path
              end
            end
          end

          # 3. BUSCA PROFUNDA (Para quando você manda só "foto.jpg")
          if candidates.empty?
             allowed_roots.each do |root|
               filename_only = File.basename(target)
               found = Dir.glob(File.join(root, "**", filename_only))
               found.map! { |f| File.expand_path(f) }
               candidates.concat(found)
             end
          end
          
          candidates.uniq!

          if candidates.empty?
            puts "   [404] Arquivo não encontrado: #{target}"
            # Marca como sucesso para deletar o e-mail errado e não ficar em loop
            success = true 
          elsif candidates.size > 1
            puts "   [AMBIGUOUS] Múltiplos arquivos encontrados:"
            candidates.each { |c| puts "      - #{c}" }
            puts "   -> Seja mais específico no caminho."
            success = true 
          else
            file_to_delete = candidates.first
            File.delete(file_to_delete)
            puts "   [DELETED] #{file_to_delete}"
            
            # Limpeza de pasta de imagens associada (se for post)
            if file_to_delete.include?('.md')
              slug_base = File.basename(file_to_delete, '.md').split('-').drop(3).join('-')
              possible_img_dir = File.join("assets/img/posts", slug_base)
              if Dir.exist?(possible_img_dir)
                FileUtils.remove_dir(possible_img_dir)
                puts "   [CLEANUP] Assets removidos."
              end
            end
            success = true
          end

        # --- ROTINA DE CRIAÇÃO (MANTIDA) ---
        else
          # Se não for RM, segue o fluxo normal
          if subject_str.empty?
            command = 'quick_post'
          else
            parts = subject_str.split('/')
            command = slugify(parts[0])
          end

          case command
          when 'quick_post'
            slug = SecureRandom.hex(8)
            title_text = "Nota Rápida #{Time.now.strftime('%d/%m %H:%M')}"
            date = DateTime.now
            filename = "#{date.strftime('%Y-%m-%d')}-#{slug}.md"
            filepath = File.join(POSTS_ROOT, filename)
            body = extract_body(email)
            
            front_matter = <<~HEREDOC
            ---
            layout: post
            title: "#{title_text}"
            date: #{date.to_s}
            categories: [cotidiano]
            tags: [quicklog]
            ---
            HEREDOC
            File.open(filepath, 'w') do |file| file.write(front_matter + "\n" + body) end
            puts "   [SUCESSO] Post criado: #{filepath}"
            success = true

          when 'files'
            path_args = parts[1..-1]
            custom_name = path_args.last && path_args.last.include?('.') ? path_args.pop : nil
            sub_path = path_args.map { |p| slugify(p) }.join('/')
            target_dir = File.join(ASSETS_DIR, sub_path)
            FileUtils.mkdir_p(target_dir)
            
            email.attachments.each do |attachment|
               real_ext = File.extname(attachment.filename).downcase
               base_filename = custom_name ? slugify(File.basename(custom_name, ".*")) : "file_#{SecureRandom.hex(4)}"
               final_path = File.join(target_dir, "#{base_filename}#{real_ext}")
               File.open(final_path, "wb") { |f| f.write(attachment.body.decoded) }
               puts "   [SUCESSO] Arquivo salvo: #{final_path}"
            end
            success = true

          when 'linux', 'stack', 'dev', 'log', 'about', 'setup'
             collection = command
             category = parts[1] ? slugify(parts[1]) : 'geral'
             tag = parts[2] ? slugify(parts[2]) : 'misc'
             title_raw = parts.last
             slug = slugify(title_raw)
             dir_path = File.join(POSTS_DIR, collection, category, tag)
             FileUtils.mkdir_p(dir_path)
             date = DateTime.now
             filename = "#{date.strftime('%Y-%m-%d')}-#{slug}.md"
             filepath = File.join(dir_path, filename)
             body = extract_body(email)
             
             front_matter = <<~HEREDOC
             ---
             layout: page
             title: "#{title_raw.gsub('"', '\"')}"
             date: #{date.to_s}
             permalink: /#{collection}/#{category}/#{tag}/#{slug}/
             categories: [#{collection}]
             tags: [#{category}, #{tag}]
             hide_footer: true
             ---
             HEREDOC
             File.open(filepath, 'w') do |file| file.write(front_matter + "\n" + body) end
             puts "   [SUCESSO] Post criado: #{filepath}"
             success = true
          else
             puts "   [IGNORADO] Comando desconhecido: #{command}"
             # Não marca sucesso para não deletar e-mail que talvez tenha erro de digitação
          end
        end

        # --- LIMPEZA DE E-MAIL ---
        if success
           puts "   [LIXEIRA] Deletando e-mail UID #{uid}..."
           imap.uid_store(uid, "+FLAGS", [:Deleted])
           begin
             imap.uid_copy(uid, "[Gmail]/Lixeira")
           rescue
             begin
               imap.uid_copy(uid, "[Gmail]/Trash") 
             rescue
               # Falha silenciosa na cópia, mas a flag Deleted garante a exclusão no expunge
             end
           end
        end

      rescue => e
        puts "!! ERRO no UID #{uid}: #{e.message}"
      end
    end
    
    imap.expunge
  end
  imap.logout
  imap.disconnect
rescue => e
  puts "!! ERRO FATAL: #{e.message}"
end