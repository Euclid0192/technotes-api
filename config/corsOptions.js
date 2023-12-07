const allowedOrigins = require('./allowedOrigin')

/// Following cors format
const corsOptions = {
    origin: (origin, callback) => {
        /// if origin in allowed origins list
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            /// callback(error, allowed?)
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS!'), false)
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports = corsOptions