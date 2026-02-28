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

MAX_POSTS_PER_RUN = 10
MAX_RM_PER_RUN = 2
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 # 10MB
ALLOWED_EXTENSIONS = %w[.jpg .jpeg .png .gif .webp .svg .pdf .txt .md .sh .py .rb .json .yml .yaml .csv .zip .tar .gz].freeze

def slugify(text)
  text.to_s.downcase.strip.gsub(' ', '_').gsub(/[^\w\-\.]/, '')
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

def parse_flags(text)
  flags = {}
  text.each_line do |line|
    l = line.strip.downcase
    if l =~ /\bhide\s*:\s*false\b/
      flags['hide'] = false
    elsif l =~ /\bhide\b/
      flags['hide'] = true
    end
    if l =~ /\bpin\s*:\s*false\b/
      flags['pin'] = false
    elsif l =~ /\bpin\b/
      flags['pin'] = true
    end
  end
  flags
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
           puts "   [SKIP] Ignorando e-mail de sistema."
           imap.uid_store(uid, "+FLAGS", [:Deleted])
           next 
        end

        # Validação exata de sender
        sender = email.from&.first.to_s.strip.downcase
        if ALLOWED_SENDER && !ALLOWED_SENDER.empty? && sender != ALLOWED_SENDER.downcase
          puts "   [BLOCKED] Sender não autorizado: #{sender}"
          imap.uid_store(uid, "+FLAGS", [:Deleted])
          next
        end

        success = false

        # --- LÓGICA DE DELEÇÃO (RM) ---
        if subject_str.upcase.start_with?('RM:')
          rm_count = (rm_count || 0) + 1
          if rm_count > MAX_RM_PER_RUN
            puts "   [RATE LIMIT] Máximo de #{MAX_RM_PER_RUN} deleções por execução."
            next
          end

          target_raw = subject_str[3..-1].strip.sub(/^\//, '')
          target = slugify(target_raw.gsub('/', '_'))

          puts ">> [COMANDO RM] Solicitado para: '#{target}'"

          if target.empty? || target == '/' || target.include?('_config') || target.include?('.git')
             puts "   [SECURITY BLOCK] Alvo inválido."
             imap.uid_store(uid, "+FLAGS", [:Deleted])
             next
          end

          candidates = []
          allowed_roots = [POSTS_ROOT, POSTS_DIR, ASSETS_DIR]

          # Busca apenas em paths expandidos e validados (sem glob fallback)
          full_path_candidate = File.expand_path(target, Dir.pwd)
          is_safe = allowed_roots.any? { |r| full_path_candidate.start_with?(File.expand_path(r, Dir.pwd)) }

          if is_safe && File.exist?(full_path_candidate) && !File.symlink?(full_path_candidate)
            candidates << full_path_candidate
          end

          if candidates.empty?
            allowed_roots.each do |root|
              possible_path = File.expand_path(File.join(root, target), Dir.pwd)
              is_safe = allowed_roots.any? { |r| possible_path.start_with?(File.expand_path(r, Dir.pwd)) }
              if is_safe && File.exist?(possible_path) && !File.symlink?(possible_path)
                candidates << possible_path
              end
            end
          end

          candidates.uniq!

          if candidates.empty?
            puts "   [404] Arquivo não encontrado: #{target}"
            success = true 
          elsif candidates.size > 1
            puts "   [AMBIGUOUS] Múltiplos arquivos encontrados."
            success = true 
          else
            file_to_delete = candidates.first
            File.delete(file_to_delete)
            puts "   [DELETED] #{file_to_delete}"
            
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

        else
          # --- LÓGICA DE CRIAÇÃO / REBUILD ---
          if subject_str.empty?
            command = 'quick_post'
          else
            parts = subject_str.split('/')
            command = slugify(parts[0])
          end

          is_rebuild = command =~ /\A[0-9a-f]{16}\z/ ? true : false

          unless is_rebuild
            post_count = (post_count || 0) + 1
            if post_count > MAX_POSTS_PER_RUN
              puts "   [RATE LIMIT] Máximo de #{MAX_POSTS_PER_RUN} posts por execução."
              next
            end
          end

          case command
          when 'quick_post'
            slug = SecureRandom.hex(8)
            title_text = slug

            date = DateTime.now
            filename = "#{date.strftime('%Y-%m-%d')}-#{slug}.md"
            subdir   = date.strftime('%Y/%m')
            filepath = File.join(POSTS_ROOT, subdir, filename)
            FileUtils.mkdir_p(File.dirname(filepath))
            body = extract_body(email)

            fm_data = {
              'layout' => 'post',
              'title' => title_text,
              'date' => date.to_s,
              'permalink' => "/#{slug}",
              'categories' => ['feed'],
              'tags' => ['quicklog']
            }
            front_matter = "---\n#{YAML.dump(fm_data).sub(/^---\n/, '')}---\n"
            File.open(filepath, 'w') do |file| file.write(front_matter + "\n" + body) end
            puts "   [SUCESSO] Post criado: #{filepath}"
            success = true

          when 'hide'
            slug = SecureRandom.hex(8)
            date = DateTime.now
            filename = "#{date.strftime('%Y-%m-%d')}-#{slug}.md"
            subdir   = date.strftime('%Y/%m')
            filepath = File.join(POSTS_ROOT, subdir, filename)
            FileUtils.mkdir_p(File.dirname(filepath))
            body = extract_body(email)

            fm_data = {
              'layout' => 'post',
              'title' => slug,
              'date' => date.to_s,
              'permalink' => "/#{slug}",
              'categories' => ['feed'],
              'tags' => ['quicklog'],
              'hide' => true
            }
            front_matter = "---\n#{YAML.dump(fm_data).sub(/^---\n/, '')}---\n"
            File.open(filepath, 'w') { |file| file.write(front_matter + "\n" + body) }
            puts "   [SUCESSO] Post oculto criado: #{filepath}"
            success = true

          when /\A[0-9a-f]{16}\z/
            # --- REBUILD: atualiza front matter de post existente pelo hash ---
            hash = command
            post_file = Dir.glob(File.join(POSTS_ROOT, "**/*-#{hash}.md")).first
            if post_file.nil?
              puts "   [404] Post com hash '#{hash}' não encontrado."
              success = true
            else
              body = extract_body(email)
              flags = parse_flags(body)
              if flags.empty?
                puts "   [SKIP] Nenhum flag reconhecido no corpo para #{hash}."
                success = true
              else
                raw = File.read(post_file)
                fm_parts = raw.split(/^---\n/, 3)
                if fm_parts.length >= 3
                  fm = YAML.safe_load(fm_parts[1]) || {}
                  flags.each { |k, v| fm[k] = v }
                  new_content = "---\n#{YAML.dump(fm).sub(/^---\n/, '')}---\n#{fm_parts[2]}"
                  File.write(post_file, new_content)
                  puts "   [REBUILD] #{post_file} atualizado com: #{flags.inspect}"
                  success = true
                else
                  puts "   [ERRO] Front matter inválido em #{post_file}"
                end
              end
            end

          when 'files'
            path_args = parts[1..-1]
            custom_name = path_args.last && path_args.last.include?('.') ? path_args.pop : nil
            sub_path = path_args.map { |p| slugify(p) }.join('/')
            target_dir = File.join(ASSETS_DIR, sub_path)

            # Validação de path traversal no diretório de destino
            expanded_target = File.expand_path(target_dir, Dir.pwd)
            unless expanded_target.start_with?(File.expand_path(ASSETS_DIR, Dir.pwd))
              puts "   [SECURITY BLOCK] Path inválido: #{target_dir}"
              next
            end

            FileUtils.mkdir_p(target_dir)

            email.attachments.each do |attachment|
               real_ext = File.extname(attachment.filename).downcase

               unless ALLOWED_EXTENSIONS.include?(real_ext)
                 puts "   [BLOCKED] Extensão não permitida: #{real_ext}"
                 next
               end

               if attachment.body.decoded.bytesize > MAX_ATTACHMENT_SIZE
                 puts "   [BLOCKED] Arquivo excede #{MAX_ATTACHMENT_SIZE / 1024 / 1024}MB"
                 next
               end

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
             title_raw = parts.last.to_s
             slug = slugify(title_raw)
             dir_path = File.join(POSTS_DIR, collection, category, tag)
             FileUtils.mkdir_p(dir_path)
             date = DateTime.now
             filename = "#{date.strftime('%Y-%m-%d')}-#{slug}.md"
             filepath = File.join(dir_path, filename)
             body = extract_body(email)

             fm_data = {
               'layout' => 'page',
               'title' => title_raw,
               'date' => date.to_s,
               'permalink' => "/#{collection}/#{category}/#{tag}/#{slug}/",
               'categories' => [collection],
               'tags' => [category, tag],
               'hide_footer' => true
             }
             front_matter = "---\n#{YAML.dump(fm_data).sub(/^---\n/, '')}---\n"
             File.open(filepath, 'w') do |file| file.write(front_matter + "\n" + body) end
             puts "   [SUCESSO] Post criado: #{filepath}"
             success = true
          else
             puts "   [IGNORADO] Comando desconhecido: #{command}"
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
  exit 1
end