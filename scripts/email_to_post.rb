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
  puts ">> Buscando os 20 últimos e-mails..."
  
  # AUMENTADO PARA 20 PARA GARANTIR
  messages = Mail.find(count: 20, order: :asc, what: :last)
  messages = [messages] unless messages.is_a?(Array)

  if messages.empty?
    puts ">> Nenhum e-mail encontrado na caixa."
  else
    # Processa do mais novo para o mais antigo
    messages.reverse.each do |email|
      
      if processed_count >= MAX_EMAILS
        puts "!! LIMITE ATINGIDO. Encerrando."
        break
      end

      begin
        subject_str = email.subject.to_s.strip
        next if subject_str.empty?

        # LOG DE DEBUG (Para vermos o que está chegando)
        puts ">> [ANALISANDO] '#{subject_str}'"

        parts = subject_str.split('/')
        command_raw = parts[0]
        command = slugify(command_raw) 
        
        case command
        
        # --- ROTA A: ARQUIVOS ---
        when 'files'
          puts "   -> COMANDO IDENTIFICADO: UPLOAD DE ARQUIVO"
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
              desired_name = File.basename(custom_name, ".*")
              safe_name = slugify(desired_name)
              suffix = index > 0 ? "_#{index}" : ""
              filename = "#{safe_name}#{suffix}#{real_ext}"
            else
              prefix = attachment.content_type.start_with?('image/') ? 'img_' : 'doc_'
              filename = "#{prefix}#{SecureRandom.hex(4)}#{real_ext}"
            end
            File.open(File.join(target_dir, filename), "wb") { |f| f.write(attachment.body.decoded) }
            puts "   [SUCESSO] #{filename} salvo em #{target_dir}"
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
          # AGORA VAMOS VER PORQUE FALHOU
          puts "   [IGNORADO] Comando '#{command}' não está na whitelist. (Original: '#{parts[0]}')"
        end

      rescue => e
        puts "!! ERRO INTERNO no e-mail '#{email.subject}': #{e.message}"
      end
    end
  end

rescue => e
  puts "!! FALHA CRÍTICA DE CONEXÃO: #{e.message}"
end