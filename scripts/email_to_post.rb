require 'mail'
require 'yaml'
require 'fileutils'
require 'date'
require 'securerandom'

# CONFIGURAÇÃO
POSTS_DIR = "_root"     # Onde ficam os conteúdos (linux, stack, etc)
ASSETS_DIR = "_root/files" # Onde ficam os arquivos binários (files)

# Função para sanitizar nomes (remove acentos, espaços -> underline)
def slugify(text)
  text.to_s.downcase.strip.gsub(' ', '_').gsub(/[^\w-]/, '')
end

# Processa cada e-mail não lido
Mail.defaults do
  retriever_method :pop3, :address    => "pop.gmail.com",
                          :port       => 995,
                          :user_name  => ENV['EMAIL_USER'],
                          :password   => ENV['EMAIL_PASSWORD'],
                          :enable_ssl => true
end

puts "[ SYSTEM_READY ] Escaneando caixa de entrada..."

Mail.all.each do |email|
  begin
    puts ">> Processando: #{email.subject}"
    
    # 1. DECODIFICAR O COMANDO (ASSUNTO)
    # Exemplo: linux/101/1/configs_hardware
    raw_subject = email.subject.to_s.strip
    parts = raw_subject.split('/')
    
    # Comando Primário (linux, files, stack...)
    command = slugify(parts[0]) 
    
    # --- ROTA A: ARQUIVOS (FILES) ---
    if command == 'files'
      # Ex: files/eventos/cpbr
      # Caminho destino: assets/docs/eventos/cpbr
      
      sub_path = parts[1..-1].map { |p| slugify(p) }.join('/')
      target_dir = File.join(ASSETS_DIR, sub_path)
      FileUtils.mkdir_p(target_dir)

      email.attachments.each do | attachment |
        filename = (attachment.content_type.start_with?('image/') ? 'img_' : 'doc_') + SecureRandom.hex(4) + File.extname(attachment.filename)
        File.open(File.join(target_dir, filename), "wb") { |f| f.write(attachment.body.decoded) }
        puts "   [UPLOAD] #{filename} salvo em #{target_dir}"
      end

    # --- ROTA B: CONTEÚDO (LINUX, STACK, ROOT...) ---
    else
      # Ex: linux/101/1/configs_hardware
      # Caminho destino: _root/linux/101/1/
      
      # Estrutura do Caminho
      collection = command # linux
      category = parts[1] ? slugify(parts[1]) : nil # 101
      tag = parts[2] ? slugify(parts[2]) : nil      # 1
      title_raw = parts.last
      slug = slugify(title_raw)

      # Monta o diretório físico
      # Se tiver cat e tag: _root/linux/101/1/
      dir_path = File.join(POSTS_DIR, collection)
      dir_path = File.join(dir_path, category) if category
      dir_path = File.join(dir_path, tag) if tag
      
      FileUtils.mkdir_p(dir_path)

      # Data e Nome do Arquivo
      date = DateTime.now
      filename = "#{date.strftime('%Y-%m-%d')}-#{slug}.md"
      filepath = File.join(dir_path, filename)

      # Extrai o corpo e processa imagens inline (se houver)
      body = email.body.decoded.force_encoding("UTF-8")
      
      # Se houver anexos no post (imagens ilustrativas), salvamos em assets/img/posts
      if email.attachments.any?
        img_dir = "assets/img/posts/#{slug}"
        FileUtils.mkdir_p(img_dir)
        email.attachments.each do |attachment|
          img_name = attachment.filename
          File.open("#{img_dir}/#{img_name}", "wb") { |f| f.write(attachment.body.decoded) }
          # Substitui no texto (Markdown básico)
          body += "\n\n![#{img_name}](/#{img_dir}/#{img_name})"
        end
      end

      # Monta o Front Matter Inteligente
      front_matter = <<~HEREDOC
      ---
      layout: page
      title: "#{title_raw}"
      date: #{date.to_s}
      permalink: /#{collection}/#{[category, tag, slug].compact.join('/')}/
      categories: [#{category}]
      tags: [#{tag}]
      hide_footer: true
      ---
      HEREDOC

      # Salva o arquivo final
      File.open(filepath, 'w') do |file|
        file.write(front_matter + "\n" + body)
      end
      
      puts "   [POST] Criado em: #{filepath}"
    end

    # Deleta o e-mail após processar (Modo Destrutivo)
    # email.mark_for_delete = true 

  rescue => e
    puts "!! ERRO ao processar #{email.subject}: #{e.message}"
  end
end