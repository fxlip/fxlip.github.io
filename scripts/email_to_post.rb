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

# Configuração Blindada (SSL + Timeouts)
Mail.defaults do
  retriever_method :pop3, {
    :address        => "pop.gmail.com",
    :port           => 995,
    :user_name      => ENV['EMAIL_USERNAME'],
    :password       => ENV['EMAIL_PASSWORD'],
    :enable_ssl     => true,
    :read_timeout   => 120, 
    :open_timeout   => 120
  }
end

puts "[ SYSTEM_READY ] Escaneando caixa de entrada..."

# Contador de segurança
processed_count = 0
MAX_EMAILS = 5

begin
  # Usamos Mail.all pois POP3 é limitado, mas controlamos o loop
  Mail.all.each do |email|
    
    # Circuit Breaker: Para após 5 e-mails para não estourar o tempo do Action
    if processed_count >= MAX_EMAILS
      puts "!! LIMITE DE SEGURANÇA ATINGIDO (#{MAX_EMAILS}). Parando por hoje."
      break
    end

    begin
      puts ">> [#{processed_count + 1}/#{MAX_EMAILS}] Analisando: #{email.subject}"
      
      raw_subject = email.subject.to_s.strip
      parts = raw_subject.split('/')
      command = slugify(parts[0]) 
      
      # === SWITCH DE SEGURANÇA (WHITELIST) ===
      case command
      
      # --- ROTA A: ARQUIVOS ---
      when 'files'
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
          puts "   [UPLOAD] #{filename} salvo em #{target_dir}"
        end
        
        # Marca e-mail processado para deleção (Limpeza Automática)
        email.mark_for_delete = true 
        processed_count += 1

      # --- ROTA B: CONTEÚDO ---
      when 'linux', 'stack', 'dev', 'log'
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

        # Sanitização de Encoding
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
        puts "   [POST] Criado em: #{filepath}"
        
        # Marca e-mail processado para deleção
        email.mark_for_delete = true
        processed_count += 1

      else
        puts "!! IGNORADO: '#{command}' não está na whitelist."
        # NÃO DELETAMOS e-mails ignorados (para você ver o erro e corrigir o assunto se necessário)
      end

    rescue => e
      puts "!! ERRO no e-mail '#{email.subject}': #{e.message}"
    end
  end

rescue => e
  puts "!! FALHA CRÍTICA DE CONEXÃO: #{e.message}"
end