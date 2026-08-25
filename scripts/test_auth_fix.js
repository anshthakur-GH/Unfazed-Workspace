require('dotenv').config();

const API_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';
const username = process.env.TEST_AUTH_USERNAME || process.env.SEED_USER_1_USERNAME || 'Ansh_Unfazed';
const password = process.env.TEST_AUTH_PASSWORD || process.env.SEED_USER_1_PASSWORD;

async function testAuth() {
    if (!password) {
        console.error("Error: TEST_AUTH_PASSWORD or SEED_USER_1_PASSWORD environment variable is required.");
        return;
    }

    try {
        console.log("1. Attempting Login...");

        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password
            })
        });

        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.success) {
            console.log("Login Successful! Token received.");
            const token = loginData.token;

            console.log("2. Attempting to Create Subspace with Token...");
            const subspaceRes = await fetch(`${API_URL}/subspaces`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    title: 'Test Subspace Autogen',
                    assignedTo: []
                })
            });

            const subspaceData = await subspaceRes.json();

            if (subspaceRes.ok) {
                console.log("Subspace Created Successfully:", subspaceData);

                // Cleanup
                console.log("3. Cleaning up (Deleting Subspace)...");
                const deleteRes = await fetch(`${API_URL}/subspaces/${subspaceData._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': token }
                });

                if (deleteRes.ok) {
                    console.log("Cleanup Successful.");
                } else {
                    console.error("Cleanup Failed");
                }
            } else {
                console.error("Subspace Creation Failed:", subspaceData);
            }

        } else {
            console.error("Login Failed:", loginData);
        }

    } catch (err) {
        console.error("Test Failed:", err.message);
    }
}

testAuth();
