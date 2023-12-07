/// Using dotenv globally across all filess
require('dotenv').config()
require('express-async-errors')
const express = require('express')
const path = require('path')
const { logger, logEvents } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
/// Make our api pulic to every origin
const cors = require('cors')    
const corsOptions = require('./config/corsOptions')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')

const app = express();

console.log(process.env.NODE_ENV)

connectDB()

///
/// Middleware 
///

/// Logger middleware
app.use(logger)

/// Third party middleware: cors
app.use(cors(corsOptions))

/// Process json middleware
app.use(express.json())

/// Third party middleware: cookie-parser
app.use(cookieParser())

/// Tell express where to find static file
app.use('/', express.static(path.join(__dirname, 'public')));
/// app.use(express.static('public')) same as above

app.use('/', require('./routes/root'));
app.use('/auth', require('./routes/authRoutes'))
app.use('/users', require('./routes/userRoutes'))
app.use('/notes', require('./routes/noteRoutes'))

app.all('*', (req, res) => {
    res.status(404);

    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('json')) {
        res.json({ message: '404 Not Found'});
    } else {
        res.type('txt').send('404 Not Found');
    }
})

/// Error handler middleware
app.use(errorHandler)

const PORT = process.env.PORT || 3500;

mongoose.connection.once('open', () => {
    console.log('Connected to MongodDB')

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    })
})

mongoose.connection.on('error', (err) => {
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})

/// mongoose automatically find the collections based on model name
/// For example, model Tank -> collection tanks
/// e.g model User -> collection users, Note -> collection notess