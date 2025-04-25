// Replace these with your Supabase credentials
const SUPABASE_URL = 'https://kfodrrjvlskvkzjnqfzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmb2Rycmp2bHNrdmt6am5xZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MTg2NzAsImV4cCI6MjA2MDk5NDY3MH0.FNJA93ggmRmQaD9OnpSnVFYB3EreeRpJ33zSTsxS28c';

// Redirect to feed if already logged in
const savedUserId = localStorage.getItem('user_id');
if (savedUserId) {
    window.location.href = 'feed.html';
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    // DEBUG: read optional profile URL
    const profileUrl = document.getElementById('profile-url').value.trim();

    const username = document.getElementById('username').value;

    try {
        // Check if user exists
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${username}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        let userData;
        const users = await response.json();

        if (users.length === 0) {
            // Create new user with optional profile_url
            const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ username, profile_url: profileUrl || null })
            });
            const created = await createResponse.json();
            userData = Array.isArray(created) ? created[0] : created;
        } else {
            userData = users[0];
            // DEBUG: update profile_url if provided by user
            if (profileUrl) {
                await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userData.id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ profile_url: profileUrl })
                });
                userData.profile_url = profileUrl;
            }
        }

        // Save user data and token to localStorage
        localStorage.setItem('user_id', userData.id);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('profile_url', userData.profile_url || '');
        localStorage.setItem('access_token', SUPABASE_ANON_KEY);

        // Redirect to feed
        window.location.href = 'feed.html';
    } catch (error) {
        console.error('Error:', error);
        alert('Si è verificato un errore. Riprova più tardi.');
    }
}); 