// Supabase URL and anon key are provided as globals in upload.html
console.log('SUPABASE_URL:', window.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', window.SUPABASE_ANON_KEY?.substring(0, 10) + '...');

// Check if user is logged in
const userId = localStorage.getItem('user_id');
if (!userId) {
    window.location.href = 'index.html';
}

// Get access token from localStorage or generate one
let accessToken = localStorage.getItem('access_token');
if (!accessToken) {
    // Generate a JWT token using the user ID
    accessToken = generateJWT(userId);
    localStorage.setItem('access_token', accessToken);
}

function generateJWT(userId) {
    // This is a simple JWT generation for demo purposes
    // In a production environment, this should be handled by your authentication server
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
        sub: userId,
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = btoa(window.SUPABASE_ANON_KEY); // This is just for demo, not secure!
    return `${header}.${payload}.${signature}`;
}

// Initialize DOM elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const preview = document.getElementById('preview');
let selectedFiles = [];

// Handle drag and drop
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
});

dropzone.addEventListener('dragleave', () => {
    dropzone.style.backgroundColor = '';
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.backgroundColor = '';
    handleFiles(e.dataTransfer.files);
});

// Handle click to select files
dropzone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(fileList) {
    // Convert FileList to Array and validate files
    const newFiles = Array.from(fileList).filter(file => {
        const isValid = file.type.startsWith('image/') || file.type.startsWith('video/');
        if (!isValid) {
            console.warn('Skipping invalid file:', file.name, file.type);
        }
        return isValid;
    });

    // Debug: Log files being added
    console.log('Adding files:', newFiles.map(f => ({ name: f.name, type: f.type })));

    selectedFiles.push(...newFiles);
    newFiles.forEach(createThumbnail);
}

function createThumbnail(file) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'thumbnail-container';
    thumbnail.style.position = 'relative';

    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.className = 'thumbnail';
        img.src = URL.createObjectURL(file);
        thumbnail.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.className = 'thumbnail';
        video.src = URL.createObjectURL(file);
        video.controls = true;
        thumbnail.appendChild(video);
    }

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.style.position = 'absolute';
    removeBtn.style.top = '5px';
    removeBtn.style.right = '5px';
    removeBtn.style.background = 'var(--color-red)';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '50%';
    removeBtn.style.width = '24px';
    removeBtn.style.height = '24px';
    removeBtn.style.color = 'white';
    removeBtn.style.cursor = 'pointer';

    removeBtn.addEventListener('click', () => {
        const index = selectedFiles.indexOf(file);
        if (index > -1) {
            selectedFiles.splice(index, 1);
            thumbnail.remove();
        }
    });

    thumbnail.appendChild(removeBtn);
    preview.appendChild(thumbnail);
}

// Handle form submit for uploading media
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // DEBUG: Validate file selection
    if (selectedFiles.length === 0) {
        alert('Seleziona almeno un file');
        return;
    }

    try {
        console.log('SUPABASE_URL', window.SUPABASE_URL); // DEBUG
        const description = document.getElementById('description').value;

        // Create post record using supabase-js v2
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .insert([{ user_id: userId, description }])
            .select('id')
            .single();
        if (postError) throw postError;
        console.log('Created post:', postData);

        // Upload each file
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const ext = file.name.split('.').pop();
            const timestamp = Date.now();
            const filePath = `${postData.id}/${timestamp}_${i}.${ext}`;

            console.log('Bucket path', filePath); // DEBUG

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('media')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type
                });
            if (uploadError) throw uploadError;
            console.log('Upload success:', uploadData);

            // Get public URL
            const { data: urlData, error: urlError } = await supabase
                .storage
                .from('media')
                .getPublicUrl(filePath);
            if (urlError) throw urlError;
            console.log('Public URL:', urlData.publicUrl);

            // Insert media record
            const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
            const { error: mediaError } = await supabase
                .from('media')
                .insert([{ post_id: postData.id, url: urlData.publicUrl, media_type: mediaType, position: i }]);
            if (mediaError) throw mediaError;
            console.log('Media record created at position', i);
        }

        // Redirect to feed on success
        window.location.href = 'feed.html';
    } catch (error) {
        console.error('Upload error:', error.message); // DEBUG
        alert('Si è verificato un errore durante il caricamento. Riprova più tardi.');
    }
}); 