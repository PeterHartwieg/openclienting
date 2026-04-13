-- Set 512 KB file size limit on org-logos bucket and restrict to image MIME types
update storage.buckets
set file_size_limit = 524288,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
where id = 'org-logos';
