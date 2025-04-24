// Replace these with your Supabase credentials
const SUPABASE_URL = 'https://<YOUR_URL>.supabase.co';
const SUPABASE_ANON_KEY = '<YOUR_ANON_KEY>';

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