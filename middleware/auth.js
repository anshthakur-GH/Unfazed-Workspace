const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // Get token from header
    const token = req.header('Authorization');

    // Check if not token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Handle Bearer prefix if present
        const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;

        // Verify token
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);

        const username = decoded.username;

        // Map username to friendly name (preserving existing logic)
        let friendlyName = 'Unknown';
        if (username === 'Ansh_Unfazed') friendlyName = 'Ansh';
        else if (username === 'Ayush_Unfazed') friendlyName = 'Ayush';
        else friendlyName = username; // Fallback to username if no mapping found

        req.user = {
            id: decoded.id,
            username: username,
            name: friendlyName
        };

        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
