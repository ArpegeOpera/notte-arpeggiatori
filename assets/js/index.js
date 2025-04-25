// Replace these with your Supabase credentials
const SUPABASE_URL = 'https://kfodrrjvlskvkzjnqfzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmb2Rycmp2bHNrdmt6am5xZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MTg2NzAsImV4cCI6MjA2MDk5NDY3MH0.FNJA93ggmRmQaD9OnpSnVFYB3EreeRpJ33zSTsxS28c';

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

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
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
            // Create new user
            const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ username })
            });
            userData = await createResponse.json();
        } else {
            userData = users[0];
        }

        // Generate and save access token
        const accessToken = generateJWT(userData.id);
        localStorage.setItem('access_token', accessToken);

        // Save user data to localStorage
        localStorage.setItem('user_id', userData.id);
        localStorage.setItem('username', userData.username);

        // Redirect to feed
        window.location.href = 'feed.html';
    } catch (error) {
        console.error('Error:', error);
        alert('Si è verificato un errore. Riprova più tardi.');
    }
}); 