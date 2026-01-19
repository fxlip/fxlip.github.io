require 'mail'
require 'yaml'
require 'fileutils'
require 'date'
require 'securerandom'

# CONFIGURAÇÃO
POSTS_ROOT = "_posts" # Home
POSTS_DIR = "_root"   # Coleções
ASSETS_DIR = "files"

def slugify(text)
  text.to_s.downcase.strip.gsub(' ', '_').gsub(/[^\w-]/, '')
end

# NOVA FUNÇÃO: Limpeza de Corpo de E-mail
def extract_body(email)
  begin
    if email.multipart?
      # Prioriza a versão em Texto Puro para Markdown limpo
      part = email.text_part || email.html_part
      content = part ? part.decoded : email.body.decoded
    else
      content = email.body.decoded
    end
    
    # Limpeza de Encoding e Espaços
    content = content.force_encoding("UTF-8").scrub("")
    return content.strip
  rescue => e
    return "Erro ao extrair texto: #{e.message}"
  end
end

# CONFIGURAÇÃO IMAP
Mail.defaults do
  retriever_method :imap, {
    :address        => "imap.gmail.com",
    :port           => 993,
    :user_name      => ENV['EMAIL_USERNAME'],
    :password       => ENV['EMAIL_PASSWORD'],
    :enable_ssl     => true
  }
end

puts "[ SYSTEM_READY ] Conectando via IMAP..."

processed_count = 0
MAX_EMAILS = 5 

begin
  puts ">> Buscando os 30 últimos e-mails..."
  messages = Mail.find(count: 30, order: :asc, what: :last)
  messages = [messages] unless messages.is_a?(Array)

  if messages.empty?
    puts ">> Nenhum e-mail encontrado."
  else
    messages.reverse.each do |email|
      
      if processed_count >= MAX_EMAILS
        puts "!! LIMITE ATINGIDO. Encerrando."
        break
      end

      begin
        subject_str = email.subject.to_s.strip
        
        # Filtro de Ruído
        if subject_str.start_with?('[fxlip') || subject_str.include?('Run failed')
           next 
        end

        # LÓGICA DE ROTEAMENTO
        if subject_str.empty?
          command = 'quick_post'
          puts ">> [ANALISANDO] (Sem Assunto) -> Rota Default"
        else
          puts ">> [ANALISANDO] '#{subject_str}'"
          parts = subject_str.split('/')
          command_raw = parts[0]
          command = slugify(command_raw)
        end
        
        case command
        
        # --- ROTA 0: POST RÁPIDO (DEFAULT) ---
        when 'quick_post'
          puts "   -> COMANDO: POST NA HOME"
          
          timestamp_slug = Time.now.strftime('%H%M%S')
          slug = "nota-#{timestamp_slug}"
          display_title = "Nota Rápida #{Time.now.strftime('%d/%m %H:%M')}"
          date = DateTime.now
          filename = "#{date.strftime('%Y-%m-%d')}-#{slug}.md"
          filepath = File.join(POSTS_ROOT, filename)

          # EXTRAÇÃO LIMPA (USANDO A NOVA FUNÇÃO)
          body = extract_body(email)
          
          if email.attachments.any?
            img_dir = "assets/img/posts/#{slug}"
            FileUtils.mkdir_p(img_dir)
            email.attachments.each do |attachment|
              img_name = attachment.filename
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

          File.open(filepath, 'w') do |file|
            file.write(front_matter + "\n" + body)
          end
          puts "   [SUCESSO] Post criado: #{filepath}"
          
          email.mark_for_delete = true
          processed_count += 1

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
            real_ext = File.extname(attachment.filename)
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
          
          email.mark_for_delete = true 
          processed_count += 1

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

          # EXTRAÇÃO LIMPA
          body = extract_body(email)
          
          if email.attachments.any?
            img_dir = "assets/img/posts/#{slug}"
            FileUtils.mkdir_p(img_dir)
            email.attachments.each do |attachment|
              img_name = attachment.filename
              File.open("#{img_dir}/#{img_name}", "wb") { |f| f.write(attachment.body.decoded) }
              body += "\n\n![#{img_name}](/#{img_dir}/#{img_name})"
            end
          end

          front_matter = <<~HEREDOC
          ---
          layout: page
          title: "#{title_raw.gsub('"', '\"')}"
          date: #{date.to_s}
          permalink: /#{collection}/#{category}/#{tag}/#{slug}/
          categories: [#{category}]
          tags: [#{tag}]
          hide_footer: true
          ---
          HEREDOC

          File.open(filepath, 'w') do |file|
            file.write(front_matter + "\n" + body)
          end
          puts "   [SUCESSO] Post criado: #{filepath}"
          
          email.mark_for_delete = true
          processed_count += 1

        else
          puts "   [IGNORADO] Comando '#{command}' desconhecido."
        end

      rescue => e
        puts "!! ERRO INTERNO: #{e.message}"
      end
    end
  end

rescue => e
  puts "!! FALHA CRÍTICA: #{e.message}"
end