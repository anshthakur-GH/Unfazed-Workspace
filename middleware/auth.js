const auth = (req, res, next) => {
    // Get token from header
    const token = req.header('Authorization');

    // Check if not token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Token format: "fake-jwt-token-USERNAME"
        // OR "Bearer fake-jwt-token-USERNAME" - handling both just in case, though frontend might just send raw token
        const cleanToken = token.replace('Bearer ', '');

        if (!cleanToken.startsWith('fake-jwt-token-')) {
            throw new Error('Invalid token format');
        }

        const username = cleanToken.replace('fake-jwt-token-', '');

        // Map username to friendly name
        let friendlyName = 'Unknown';
        if (username === 'Ansh_Unfazed') friendlyName = 'Ansh';
        else if (username === 'Navtej_unfazed') friendlyName = 'Navtej';
        else if (username === 'Ayush_Unfazed') friendlyName = 'Ayush';
        else if (username === 'AnshSaxena_Unfazed') friendlyName = 'Ansh Saxena';

        req.user = {
            username: username,
            name: friendlyName
        };

        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
