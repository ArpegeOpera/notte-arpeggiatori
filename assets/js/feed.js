// Replace these with your Supabase credentials
const SUPABASE_URL = 'https://kfodrrjvlskvkzjnqfzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmb2Rycmp2bHNrdmt6am5xZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MTg2NzAsImV4cCI6MjA2MDk5NDY3MH0.FNJA93ggmRmQaD9OnpSnVFYB3EreeRpJ33zSTsxS28c';

// Check if user is logged in
if (!localStorage.getItem('user_id')) {
    window.location.href = 'index.html';
}

async function loadPosts() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=*,media(*),users(username,profile_url)&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const posts = await response.json();
        console.log('Loaded posts:', posts); // Debug log
        renderPosts(posts);
    } catch (error) {
        console.error('Error loading posts:', error);
        alert('Si è verificato un errore nel caricamento dei post.');
    }
}

function renderPosts(posts) {
    const container = document.getElementById('postsContainer');
    container.innerHTML = ''; // Clear existing posts

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'card';

        // User info
        const userInfo = document.createElement('div');
        userInfo.style.display = 'flex';
        userInfo.style.alignItems = 'center';
        userInfo.style.gap = '10px';
        userInfo.style.marginBottom = '1rem';

        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        avatar.src = post.users.profile_url || 'https://via.placeholder.com/40';
        avatar.alt = post.users.username;

        const username = document.createElement('span');
        username.textContent = post.users.username;

        userInfo.appendChild(avatar);
        userInfo.appendChild(username);
        card.appendChild(userInfo);

        // Media
        if (post.media && post.media.length > 0) {
            post.media.sort((a, b) => a.position - b.position);
            post.media.forEach(media => {
                const mediaElement = document.createElement(media.media_type === 'video' ? 'video' : 'img');
                mediaElement.className = 'media-preview';
                mediaElement.src = media.url;
                if (media.media_type === 'video') {
                    mediaElement.controls = true;
                }
                card.appendChild(mediaElement);
            });
        }

        // Description
        if (post.description) {
            const description = document.createElement('p');
            description.textContent = post.description;
            card.appendChild(description);
        }

        container.appendChild(card);
    });
}

// Load posts on page load
loadPosts(); 