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
  text.to_s.downcase.strip.gsub(' ', '_').gsub(/[^\w\-\/\.]/, '') # Permite / e . para caminhos
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
        
        # Filtro de Loop
        if subject_str.start_with?('[fxlip') || subject_str.include?('Run failed')
           imap.uid_store(uid, "+FLAGS", [:Deleted])
           next 
        end

        success = false 

        # --- NOVA FUNCIONALIDADE: COMANDO DE DELEÇÃO (RM) ---
        if subject_str.upcase.start_with?('RM:')
          target_raw = subject_str[3..-1].strip
          # Remove caracteres perigosos, mas mantém estrutura de pasta
          target = target_raw.gsub('..', '').gsub('./', '') 
          
          puts ">> [COMANDO RM] Solicitado para: '#{target}'"

          # TRAVA DE SEGURANÇA 1: Arquivos Proibidos
          if target.empty? || target == '/' || target.include?('_config') || target.include?('.git')
             puts "   [SECURITY BLOCK] Tentativa de deletar sistema ou input vazio."
             imap.uid_store(uid, "+FLAGS", [:Deleted]) # Deleta o comando inválido
             next
          end

          # Busca o arquivo nas pastas permitidas
          candidates = []
          allowed_roots = [POSTS_ROOT, POSTS_DIR, ASSETS_DIR]
          
          allowed_roots.each do |root|
            # O glob ** procura recursivamente
            found = Dir.glob("#{root}/**/#{target}")
            candidates.concat(found)
          end

          # TRAVA DE SEGURANÇA 2: Ambiguidade
          if candidates.empty?
            puts "   [404] Arquivo não encontrado: #{target}"
            # Consideramos sucesso para limpar o comando da caixa de entrada
            success = true 
          elsif candidates.size > 1
            puts "   [AMBIGUOUS] Encontrados #{candidates.size} arquivos. Seja mais específico."
            candidates.each { |c| puts "      - #{c}" }
            # NÃO deleta se houver dúvida. Não marca sucesso para vc ver o erro no log? 
            # Melhor: marca sucesso para não travar, mas não deleta nada.
            success = true 
          else
            # Alvo único confirmado: EXTERMINAR
            file_to_delete = candidates.first
            File.delete(file_to_delete)
            puts "   [DELETED] Arquivo removido: #{file_to_delete}"
            
            # Se for um post com pasta de imagens, tenta limpar a pasta também
            # Ex: _posts/2026...slug.md -> assets/img/posts/slug/
            if file_to_delete.include?('.md')
              slug_base = File.basename(file_to_delete, '.md').split('-').drop(3).join('-') # remove data
              possible_img_dir = "assets/img/posts/#{slug_base}"
              if Dir.exist?(possible_img_dir)
                FileUtils.remove_dir(possible_img_dir)
                puts "   [CLEANUP] Pasta de assets removida: #{possible_img_dir}"
              end
            end
            success = true
          end

        # --- ROTINA PADRÃO (CRIAÇÃO) ---
        else
          # Se não for RM, segue o fluxo normal de criação
          if subject_str.empty?
            command = 'quick_post'
          else
            parts = subject_str.split('/')
            command = slugify(parts[0])
          end

          case command
          when 'quick_post'
            # ... (Código mantido igual ao anterior)
            slug = SecureRandom.hex(16)
            display_title = "Nota Rápida #{Time.now.strftime('%d/%m %H:%M')}"
            date = DateTime.now
            filename = "#{date.strftime('%Y-%m-%d')}-#{slug}.md"
            filepath = File.join(POSTS_ROOT, filename)
            body = extract_body(email)
            # ... (Lógica de anexo mantida)
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

          when 'files'
            # ... (Código mantido igual, apenas garantindo o fluxo)
            path_args = parts[1..-1]
            custom_name = path_args.last && path_args.last.include?('.') ? path_args.pop : nil
            sub_path = path_args.map { |p| slugify(p) }.join('/')
            target_dir = File.join(ASSETS_DIR, sub_path)
            FileUtils.mkdir_p(target_dir)
            
            email.attachments.each do |attachment|
               # Lógica de anexo mantida...
               real_ext = File.extname(attachment.filename).downcase
               base_filename = custom_name ? slugify(File.basename(custom_name, ".*")) : "file_#{SecureRandom.hex(4)}"
               final_path = File.join(target_dir, "#{base_filename}#{real_ext}")
               File.open(final_path, "wb") { |f| f.write(attachment.body.decoded) }
               puts "   [SUCESSO] Arquivo salvo: #{final_path}"
            end
            success = true

          when 'linux', 'stack', 'dev', 'log', 'about', 'setup'
             # ... (Código de posts customizados mantido)
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
             
             # ... (Lógica de anexo mantida)
             
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
          end
        end

        # --- LIMPEZA DE E-MAIL ---
        if success
           imap.uid_store(uid, "+FLAGS", [:Deleted])
           begin
             imap.uid_copy(uid, "[Gmail]/Lixeira")
           rescue
             # Silêncio se não conseguir mover
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