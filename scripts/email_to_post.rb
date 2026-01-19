require 'mail'
require 'yaml'
require 'fileutils'
require 'date'
require 'securerandom'

# CONFIGURAÇÃO
POSTS_DIR = "_root"
ASSETS_DIR = "files"

def slugify(text)
  text.to_s.downcase.strip.gsub(' ', '_').gsub(/[^\w-]/, '')
end

# CONFIGURAÇÃO IMAP (BLINDADA)
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
  # Busca os 30 últimos para garantir leitura profunda
  puts ">> Buscando os 30 últimos e-mails..."
  messages = Mail.find(count: 30, order: :asc, what: :last)
  messages = [messages] unless messages.is_a?(Array)

  if messages.empty?
    puts ">> Nenhum e-mail encontrado na caixa."
  else
    messages.reverse.each do |email|
      
      if processed_count >= MAX_EMAILS
        puts "!! LIMITE ATINGIDO. Encerrando."
        break
      end

      begin
        subject_str = email.subject.to_s.strip
        
        # Filtro de Ruído: Ignora notificações do GitHub ou e-mails vazios
        if subject_str.empty? || subject_str.start_with?('[fxlip') || subject_str.include?('Run failed')
           next 
        end

        puts ">> [ANALISANDO] '#{subject_str}'"

        parts = subject_str.split('/')
        command_raw = parts[0]
        command = slugify(command_raw) 
        
        case command
        
        # --- ROTA A: ARQUIVOS (COM AUTO-INCREMENTO) ---
        when 'files'
          puts "   -> COMANDO IDENTIFICADO: UPLOAD DE ARQUIVO"
          path_args = parts[1..-1]
          
          # Define nome base (do assunto ou padrão)
          custom_name = nil
          if path_args.last && path_args.last.include?('.')
            custom_name = path_args.pop 
          end
          
          sub_path = path_args.map { |p| slugify(p) }.join('/')
          target_dir = File.join(ASSETS_DIR, sub_path)
          FileUtils.mkdir_p(target_dir)

          email.attachments.each_with_index do |attachment, index|
            real_ext = File.extname(attachment.filename)
            
            # Define o nome base inicial
            if custom_name
              base_filename = slugify(File.basename(custom_name, ".*"))
            else
              base_filename = attachment.content_type.start_with?('image/') ? 'img' : 'doc'
              base_filename += "_#{SecureRandom.hex(4)}" unless custom_name
            end

            # --- LÓGICA DE COLISÃO (NOVO) ---
            # Verifica se arquivo existe e adiciona _1, _2, _3 até achar vaga
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

        # --- ROTA B: CONTEÚDO ---
        when 'linux', 'stack', 'dev', 'log'
          puts "   -> COMANDO IDENTIFICADO: POST (#{command})"
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

          body = email.body.decoded.force_encoding("UTF-8").scrub("") 
          
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
          puts "   [IGNORADO] Comando '#{command}' não está na whitelist."
        end

      rescue => e
        puts "!! ERRO INTERNO no e-mail '#{email.subject}': #{e.message}"
      end
    end
  end

rescue => e
  puts "!! FALHA CRÍTICA DE CONEXÃO: #{e.message}"
end