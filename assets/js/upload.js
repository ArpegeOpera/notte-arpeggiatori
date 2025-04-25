// Replace these with your Supabase credentials
const SUPABASE_URL = 'https://kfodrrjvlskvkzjnqfzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmb2Rycmp2bHNrdmt6am5xZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MTg2NzAsImV4cCI6MjA2MDk5NDY3MH0.FNJA93ggmRmQaD9OnpSnVFYB3EreeRpJ33zSTsxS28c';

// Debug: Log configuration
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY?.substring(0, 10) + '...');

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
    const signature = btoa(SUPABASE_ANON_KEY); // This is just for demo, not secure!
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

    if (selectedFiles.length === 0) {
        alert('Seleziona almeno un file');
        return;
    }

    try {
        const description = document.getElementById('description').value;
        // Create post record
        const postResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ user_id: userId, description })
        });
        if (!postResponse.ok) {
            throw new Error(`Failed to create post: ${postResponse.status}`);
        }
        const post = await postResponse.json();
        console.log('Created post:', post);

        // Upload each file
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const ext = file.name.split('.').pop();
            const filePath = `${post.id}/${Date.now()}_${i}.${ext}`;

            // Upload to Supabase Storage
            const formData = new FormData();
            formData.append('file', file);
            const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${filePath}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
                body: formData
            });
            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.status}`);
            }

            // Create media record
            const mediaUrl = `${SUPABASE_URL}/storage/v1/object/public/media/${filePath}`;
            const mediaResponse = await fetch(`${SUPABASE_URL}/rest/v1/media`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    post_id: post.id,
                    url: mediaUrl,
                    media_type: file.type.startsWith('image/') ? 'image' : 'video',
                    position: i
                })
            });
            if (!mediaResponse.ok) {
                throw new Error(`Failed to create media record: ${mediaResponse.status}`);
            }
        }

        // Redirect to feed on success
        window.location.href = 'feed.html';
    } catch (error) {
        console.error('Upload error:', error);
        alert('Si è verificato un errore durante il caricamento. Riprova più tardi.');
    }
}); 