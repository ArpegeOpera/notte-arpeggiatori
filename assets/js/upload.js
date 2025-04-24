// Replace these with your Supabase credentials
const SUPABASE_URL = 'https://kfodrrjvlskvkzjnqfzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmb2Rycmp2bHNrdmt6am5xZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MTg2NzAsImV4cCI6MjA2MDk5NDY3MH0.FNJA93ggmRmQaD9OnpSnVFYB3EreeRpJ33zSTsxS28c';


// Check if user is logged in
if (!localStorage.getItem('user_id')) {
    window.location.href = 'index.html';
}

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const files = [];

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

function handleFiles(newFiles) {
    Array.from(newFiles).forEach(file => {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            files.push(file);
            createThumbnail(file);
        }
    });
}

function createThumbnail(file) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'thumbnail-container';

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
        const index = files.indexOf(file);
        if (index > -1) {
            files.splice(index, 1);
            thumbnail.remove();
        }
    });

    thumbnail.appendChild(removeBtn);
    preview.appendChild(thumbnail);
}

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (files.length === 0) {
        alert('Seleziona almeno un file');
        return;
    }

    try {
        // Create post
        const postResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: localStorage.getItem('user_id'),
                description: document.getElementById('description').value
            })
        });

        const post = await postResponse.json();
        console.log('Created post:', post); // Debug log

        // Upload media files
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${post.id}_${i}.${fileExt}`;

            // Upload to Supabase Storage
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${fileName}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            const { data } = await uploadResponse.json();
            const mediaUrl = `${SUPABASE_URL}/storage/v1/object/public/media/${fileName}`;

            // Create media record
            await fetch(`${SUPABASE_URL}/rest/v1/media`, {
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
        }

        // Redirect to feed
        window.location.href = 'feed.html';
    } catch (error) {
        console.error('Error:', error);
        alert('Si è verificato un errore durante il caricamento. Riprova più tardi.');
    }
}); 