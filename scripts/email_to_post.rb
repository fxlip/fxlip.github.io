require 'net/imap'
require 'mail'
require 'yaml'
require 'fileutils'
require 'date'
require 'securerandom'

# --- Configuração ---
POSTS_ROOT = "_posts"
POSTS_DIR  = "_root"
ASSETS_DIR = "files"
SITE_URL   = "https://fxlip.com"

USERNAME       = ENV['EMAIL_USERNAME']
PASSWORD       = ENV['EMAIL_PASSWORD']
ALLOWED_SENDER = ENV['ALLOWED_SENDER']
IMAP_SERVER    = 'imap.gmail.com'
PORT           = 993

MAX_POSTS_PER_RUN   = 10
MAX_RM_PER_RUN      = 2
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS  = %w[.jpg .jpeg .png .gif .webp .svg .pdf .txt .md .sh .py .rb .json .yml .yaml .csv .zip .tar .gz].freeze

# --- Helpers ---

def slugify(text)
  text.to_s.downcase.strip.gsub(' ', '_').gsub(/[^\w\-\.]/, '')
end

def extract_body(mail)
  content = mail.multipart? ? (mail.text_part || mail.html_part || mail).decoded : mail.decoded
  content.force_encoding('UTF-8').scrub('').strip
rescue => e
  "Erro ao extrair texto: #{e.message}"
end

def parse_flags(text)
  flags = {}
  text.each_line do |line|
    l = line.strip.downcase
    flags['hide'] = l.match?(/\bhide\s*:\s*false\b/) ? false : true if l.match?(/\bhide\b/)
    flags['pin']  = l.match?(/\bpin\s*:\s*false\b/)  ? false : true if l.match?(/\bpin\b/)
  end
  flags
end

def create_feed_post(body, extra_fm = {})
  slug = SecureRandom.hex(8)
  date = DateTime.now
  filepath = File.join(POSTS_ROOT, date.strftime('%Y/%m'), "#{date.strftime('%Y-%m-%d')}-#{slug}.md")
  FileUtils.mkdir_p(File.dirname(filepath))
  fm = {
    'layout'     => 'post',
    'title'      => slug,
    'date'       => date.to_s,
    'permalink'  => "/#{slug}",
    'categories' => ['feed'],
    'tags'       => ['quicklog']
  }.merge(extra_fm)
  File.write(filepath, "---\n#{YAML.dump(fm).sub(/^---\n/, '')}---\n\n#{body}")
  [slug, filepath]
end

def send_reply(slug)
  return unless USERNAME && PASSWORD && ALLOWED_SENDER
  mail = Mail.new do
    from    USERNAME
    to      ALLOWED_SENDER
    subject slug
    body    "#{SITE_URL}/#{slug}"
  end
  mail.delivery_method :smtp, {
    address:              'smtp.gmail.com',
    port:                 587,
    user_name:            USERNAME,
    password:             PASSWORD,
    authentication:       :plain,
    enable_starttls_auto: true
  }
  mail.deliver
  puts "   [REPLY] #{ALLOWED_SENDER} ← #{SITE_URL}/#{slug}"
rescue => e
  puts "   [REPLY] Falha: #{e.message}"
end

# --- Main ---

puts "[ SYSTEM_READY ] Conectando via IMAP..."

begin
  imap = Net::IMAP.new(IMAP_SERVER, port: PORT, ssl: true)
  imap.login(USERNAME, PASSWORD)
  imap.select('INBOX')

  criteria = ['NOT', 'DELETED']
  criteria += ['FROM', ALLOWED_SENDER] if ALLOWED_SENDER && !ALLOWED_SENDER.empty?
  uids = imap.uid_search(criteria).last(30)

  if uids&.any?
    puts ">> Processando #{uids.size} mensagens..."
    post_count = 0
    rm_count   = 0

    uids.reverse.each do |uid|
      begin
        email       = Mail.new(imap.uid_fetch(uid, 'RFC822')[0].attr['RFC822'])
        subject_str = email.subject.to_s.strip
        sender      = email.from&.first.to_s.strip.downcase

        # Filtro de e-mails de sistema
        if subject_str.start_with?('[fxlip') || subject_str.include?('Run failed')
          puts "   [SKIP] E-mail de sistema."
          imap.uid_store(uid, "+FLAGS", [:Deleted])
          next
        end

        # Validação de sender
        if ALLOWED_SENDER && !ALLOWED_SENDER.empty? && sender != ALLOWED_SENDER.downcase
          puts "   [BLOCKED] Sender não autorizado: #{sender}"
          imap.uid_store(uid, "+FLAGS", [:Deleted])
          next
        end

        success = false

        # RM: deletar arquivo
        if subject_str.upcase.start_with?('RM:')
          rm_count += 1
          if rm_count > MAX_RM_PER_RUN
            puts "   [RATE LIMIT] Máximo de #{MAX_RM_PER_RUN} deleções por execução."
            next
          end

          target = slugify(subject_str[3..].strip.sub(/^\//, '').gsub('/', '_'))
          puts ">> [RM] Alvo: '#{target}'"

          if target.empty? || target.include?('_config') || target.include?('.git')
            puts "   [SECURITY BLOCK] Alvo inválido."
            imap.uid_store(uid, "+FLAGS", [:Deleted])
            next
          end

          allowed_roots = [POSTS_ROOT, POSTS_DIR, ASSETS_DIR]
          candidates = []

          [target, *allowed_roots.map { |r| File.join(r, target) }].each do |path|
            full = File.expand_path(path, Dir.pwd)
            safe = allowed_roots.any? { |r| full.start_with?(File.expand_path(r, Dir.pwd)) }
            candidates << full if safe && File.exist?(full) && !File.symlink?(full)
          end
          candidates.uniq!

          if candidates.empty?
            puts "   [404] Não encontrado: #{target}"
            success = true
          elsif candidates.size > 1
            puts "   [AMBIGUOUS] Múltiplos arquivos encontrados."
            success = true
          else
            file = candidates.first
            File.delete(file)
            puts "   [DELETED] #{file}"
            if file.end_with?('.md')
              slug_base = File.basename(file, '.md').split('-').drop(3).join('-')
              img_dir   = File.join("assets/img/posts", slug_base)
              FileUtils.remove_dir(img_dir) if Dir.exist?(img_dir) && puts("   [CLEANUP] Assets removidos.")
            end
            success = true
          end

        else
          # Criação / Rebuild
          parts   = subject_str.split('/')
          command = subject_str.empty? ? 'quick_post' : slugify(parts[0])

          unless command.match?(/\A[0-9a-f]{16}\z/)
            post_count += 1
            if post_count > MAX_POSTS_PER_RUN
              puts "   [RATE LIMIT] Máximo de #{MAX_POSTS_PER_RUN} posts por execução."
              next
            end
          end

          case command
          when 'quick_post'
            slug, path = create_feed_post(extract_body(email))
            puts "   [SUCESSO] Post criado: #{path}"
            success = true

          when 'hide'
            slug, path = create_feed_post(extract_body(email), 'hide' => true)
            puts "   [SUCESSO] Post oculto: #{path}"
            send_reply(slug)
            success = true

          when /\A[0-9a-f]{16}\z/
            post_file = Dir.glob(File.join(POSTS_ROOT, "**/*-#{command}.md")).first
            if post_file.nil?
              puts "   [404] Hash não encontrado: #{command}"
              success = true
            else
              flags = parse_flags(extract_body(email))
              if flags.empty?
                puts "   [SKIP] Nenhum flag reconhecido para #{command}."
                success = true
              else
                raw      = File.read(post_file)
                fm_parts = raw.split(/^---\n/, 3)
                if fm_parts.length >= 3
                  fm = (YAML.safe_load(fm_parts[1]) || {}).merge(flags.transform_keys(&:to_s))
                  File.write(post_file, "---\n#{YAML.dump(fm).sub(/^---\n/, '')}---\n#{fm_parts[2]}")
                  puts "   [REBUILD] #{post_file} ← #{flags.inspect}"
                  success = true
                else
                  puts "   [ERRO] Front matter inválido em #{post_file}"
                end
              end
            end

          when 'files'
            path_args   = parts[1..]
            custom_name = path_args.last&.include?('.') ? path_args.pop : nil
            target_dir  = File.join(ASSETS_DIR, path_args.map { |p| slugify(p) }.join('/'))

            unless File.expand_path(target_dir, Dir.pwd).start_with?(File.expand_path(ASSETS_DIR, Dir.pwd))
              puts "   [SECURITY BLOCK] Path inválido: #{target_dir}"
              next
            end

            FileUtils.mkdir_p(target_dir)
            email.attachments.each do |att|
              ext = File.extname(att.filename).downcase
              unless ALLOWED_EXTENSIONS.include?(ext)
                puts "   [BLOCKED] Extensão não permitida: #{ext}"
                next
              end
              if att.body.decoded.bytesize > MAX_ATTACHMENT_SIZE
                puts "   [BLOCKED] Arquivo excede #{MAX_ATTACHMENT_SIZE / 1024 / 1024}MB"
                next
              end
              base = custom_name ? slugify(File.basename(custom_name, '.*')) : "file_#{SecureRandom.hex(4)}"
              dest = File.join(target_dir, "#{base}#{ext}")
              File.binwrite(dest, att.body.decoded)
              puts "   [SUCESSO] Arquivo salvo: #{dest}"
            end
            success = true

          when 'linux', 'stack', 'dev', 'log', 'about', 'setup'
            collection = command
            category   = parts[1] ? slugify(parts[1]) : 'geral'
            tag        = parts[2] ? slugify(parts[2]) : 'misc'
            title_raw  = parts.last.to_s
            slug       = slugify(title_raw)
            date       = DateTime.now
            filepath   = File.join(POSTS_DIR, collection, category, tag, "#{date.strftime('%Y-%m-%d')}-#{slug}.md")
            FileUtils.mkdir_p(File.dirname(filepath))
            fm = {
              'layout'      => 'page',
              'title'       => title_raw,
              'date'        => date.to_s,
              'permalink'   => "/#{collection}/#{category}/#{tag}/#{slug}/",
              'categories'  => [collection],
              'tags'        => [category, tag],
              'hide_footer' => true
            }
            File.write(filepath, "---\n#{YAML.dump(fm).sub(/^---\n/, '')}---\n\n#{extract_body(email)}")
            puts "   [SUCESSO] Doc criado: #{filepath}"
            success = true

          else
            puts "   [IGNORADO] Comando desconhecido: #{command}"
          end
        end

        if success
          puts "   [LIXEIRA] Deletando e-mail UID #{uid}..."
          imap.uid_store(uid, "+FLAGS", [:Deleted])
          begin
            imap.uid_copy(uid, "[Gmail]/Lixeira")
          rescue
            imap.uid_copy(uid, "[Gmail]/Trash") rescue nil
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
