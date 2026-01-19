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
IMAP_SERVER = 'imap.gmail.com'
PORT = 993

def slugify(text)
  text.to_s.downcase.strip.gsub(' ', '_').gsub(/[^\w-]/, '')
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

  puts ">> Buscando e-mails ativos..."
  all_uids = imap.uid_search(['NOT', 'DELETED'])
  target_uids = all_uids.last(30)

  if target_uids.empty? || target_uids.nil?
    puts ">> Nenhum e-mail novo encontrado."
  else
    puts ">> Analisando #{target_uids.size} mensagens..."
    
    target_uids.reverse.each do |uid|
      begin
        raw_data = imap.uid_fetch(uid, 'RFC822')[0].attr['RFC822']
        email = Mail.new(raw_data)
        subject_str = email.subject.to_s.strip
        
        # Filtro de Ruído
        if subject_str.start_with?('[fxlip') || subject_str.include?('Run failed')
           puts "   [LIXEIRA] Deletando notificação do GitHub..."
           imap.uid_store(uid, "+FLAGS", [:Deleted])
           next 
        end

        if subject_str.empty?
          command = 'quick_post'
          puts ">> [UID:#{uid}] (Sem Assunto) -> Rota Default"
        else
          puts ">> [UID:#{uid}] Analisando: '#{subject_str}'"
          parts = subject_str.split('/')
          command_raw = parts[0]
          command = slugify(command_raw)
        end
        
        success = false 

        case command
        
        # --- ROTA 0: POST RÁPIDO ---
        when 'quick_post'
          slug = SecureRandom.hex(16)
          display_title = "Nota Rápida #{Time.now.strftime('%d/%m %H:%M')}"
          date = DateTime.now
          filename = "#{date.strftime('%Y-%m-%d')}-#{slug}.md"
          filepath = File.join(POSTS_ROOT, filename)
          body = extract_body(email)
          
          if email.attachments.any?
            img_dir = "assets/img/posts/#{slug}"
            FileUtils.mkdir_p(img_dir)
            email.attachments.each do |attachment|
              ext = File.extname(attachment.filename).downcase
              base = slugify(File.basename(attachment.filename, ".*"))
              img_name = "#{base}#{ext}"
              File.open("#{img_dir}/#{img_name}", "wb") { |f| f.write(attachment.body.decoded) }
              body += "\n\n![#{img_name}](/#{img_dir}/#{img_name})"
            end
          end

          front_matter = <<~HEREDOC
          ---
          layout: post
          title: "#{display_title}"
          date: #{date.to_s}
          categories: [cotidiano]
          tags: [quicklog]
          ---
          HEREDOC
          File.open(filepath, 'w') do |file| file.write(front_matter + "\n" + body) end
          puts "   [SUCESSO] Post criado: #{filepath}"
          success = true

        # --- ROTA A: ARQUIVOS ---
        when 'files'
          puts "   -> COMANDO: UPLOAD DE ARQUIVO"
          path_args = parts[1..-1]
          custom_name = nil
          if path_args.last && path_args.last.include?('.')
            custom_name = path_args.pop 
          end
          sub_path = path_args.map { |p| slugify(p) }.join('/')
          target_dir = File.join(ASSETS_DIR, sub_path)
          FileUtils.mkdir_p(target_dir)

          email.attachments.each_with_index do |attachment, index|
            real_ext = File.extname(attachment.filename).downcase
            if custom_name
              base_filename = slugify(File.basename(custom_name, ".*"))
            else
              base_filename = attachment.content_type.start_with?('image/') ? 'img' : 'doc'
              base_filename += "_#{SecureRandom.hex(4)}" unless custom_name
            end
            final_filename = "#{base_filename}#{real_ext}"
            counter = 1
            while File.exist?(File.join(target_dir, final_filename))
              final_filename = "#{base_filename}_#{counter}#{real_ext}"
              counter += 1
            end
            File.open(File.join(target_dir, final_filename), "wb") { |f| f.write(attachment.body.decoded) }
            puts "   [SUCESSO] #{final_filename} salvo em #{target_dir}"
          end
          success = true

        # --- ROTA B: CONTEÚDO CUSTOM ---
        when 'linux', 'stack', 'dev', 'log'
          puts "   -> COMANDO: POST CUSTOM (#{command})"
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
          
          if email.attachments.any?
            img_dir = "assets/img/posts/#{slug}"
            FileUtils.mkdir_p(img_dir)
            email.attachments.each do |attachment|
              ext = File.extname(attachment.filename).downcase
              base = slugify(File.basename(attachment.filename, ".*"))
              img_name = "#{base}#{ext}"
              File.open("#{img_dir}/#{img_name}", "wb") { |f| f.write(attachment.body.decoded) }
              body += "\n\n![#{img_name}](/#{img_dir}/#{img_name})"
            end
          end

          # CORREÇÃO DE SEO: Hierarquia Plana em Categories
          # Removemos 'tags' e colocamos tudo na árvore de categorias
          front_matter = <<~HEREDOC
          ---
          layout: page
          title: "#{title_raw.gsub('"', '\"')}"
          date: #{date.to_s}
          permalink: /#{collection}/#{category}/#{tag}/#{slug}/
          categories: [#{collection}, #{category}, #{tag}]
          tags: []
          hide_footer: true
          ---
          HEREDOC
          
          File.open(filepath, 'w') do |file| file.write(front_matter + "\n" + body) end
          puts "   [SUCESSO] Post criado: #{filepath}"
          success = true

        else
          puts "   [IGNORADO] Comando '#{command}' desconhecido."
        end

        if success
           puts "   [DELETANDO] Movendo para a Lixeira..."
           imap.uid_store(uid, "+FLAGS", [:Deleted])
           begin
             imap.uid_copy(uid, "[Gmail]/Lixeira")
           rescue
             begin
               imap.uid_copy(uid, "[Gmail]/Trash") 
             rescue
             end
           end
        end

      rescue => e
        puts "!! ERRO no e-mail UID #{uid}: #{e.message}"
      end
    end
    
    imap.expunge
    puts "[ SYSTEM ] Limpeza concluída."
  end

  imap.logout
  imap.disconnect

rescue => e
  puts "!! FALHA CRÍTICA DE CONEXÃO: #{e.message}"
end