#!/usr/bin/env ruby
require 'net/http'
require 'uri'
require 'nokogiri'
require 'yaml'
require 'fileutils'

ROOT = File.expand_path(File.join(__dir__, '..'))
POSTS_DIR = File.join(ROOT, '_posts')
DATA_DIR = File.join(ROOT, '_data')
PREVIEWS_FILE = File.join(DATA_DIR, 'previews.yml')

def find_first_link(text)
  return nil unless text
  # match http(s) links
  m = text.match(/https?:\/\/[^)\s"'>]+/i)
  m && m[0]
end

def fetch_url(url, limit = 5)
  raise ArgumentError, 'too many redirects' if limit == 0
  uri = URI.parse(url)
  return nil unless uri.kind_of?(URI::HTTP)

  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = (uri.scheme == 'https')
  http.open_timeout = 8
  http.read_timeout = 10
  req = Net::HTTP::Get.new(uri.request_uri)
  req['User-Agent'] = 'Mozilla/5.0 (compatible; link-preview-bot/1.0)'

  res = http.request(req)
  case res
  when Net::HTTPSuccess
    return res.body
  when Net::HTTPRedirection
    location = res['location']
    return fetch_url(location, limit - 1) if location
    return nil
  else
    return nil
  end
rescue => e
  warn "fetch error for #{url}: #{e.message}"
  nil
end

def extract_preview(body, base_url)
  return nil unless body
  doc = Nokogiri::HTML(body)
  og = {}
  doc.css('meta').each do |m|
    prop = (m['property'] || m['name'] || '').to_s.downcase
    content = m['content'] || m['value']
    next unless prop && content
    if prop.start_with?('og:')
      key = prop.sub('og:', '')
      og[key] = content
    elsif prop == 'twitter:title' && !og['title']
      og['title'] = content
    elsif prop == 'description' && !og['description']
      og['description'] = content
    end
  end

  title = og['title'] || (doc.at('title') && doc.at('title').text.strip)
  desc = og['description'] || (doc.at('meta[name="description"]') && doc.at('meta[name="description"]')['content'])
  img = og['image']
  if img && base_url
    begin
      img = URI.join(base_url, img).to_s
    rescue
    end
  end

  { 'title' => title, 'description' => desc, 'image' => img }
end

previews = {}
Dir.mkdir(DATA_DIR) unless Dir.exist?(DATA_DIR)

Dir.glob(File.join(POSTS_DIR, '*')) do |post_path|
  next unless File.file?(post_path)
  filename = File.basename(post_path)
  slug = filename.sub(/^\d{4}-\d{2}-\d{2}-/, '').sub(/\.[^.]+$/, '')
  content = File.read(post_path)
  link = find_first_link(content)
  next unless link
  puts "Processing #{filename} -> #{link}"
  body = fetch_url(link)
  preview = extract_preview(body, link)
  if preview.nil?
    warn "warning: could not extract preview for #{link} (empty body or parse error)"
    preview = {}
  end
  preview['url'] = link
  previews[slug] = preview
  # small delay to be polite
  sleep 0.5
end

File.open(PREVIEWS_FILE, 'w') do |f|
  f.write(previews.to_yaml)
end

puts "Wrote #{PREVIEWS_FILE} with #{previews.keys.size} previews"
