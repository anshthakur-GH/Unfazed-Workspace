const API_URL = 'http://127.0.0.1:5000/api';

async function testAuth() {
    try {
        console.log("1. Attempting Login...");

        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Ansh_Unfazed',
                password: '***REMOVED***'
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
