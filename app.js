const express = require('express')
const session = require('express-session')
const { checkUserRole } = require('./databaseHandler')
const { requiresLogin } = require('./decentralization')
const  join_class_by_link = require('./controllers/join_class_via_link')
const { ObjectId } = require('mongodb')
const { insertObject, getDB } = require('./databaseHandler')
const  get_member_class = require('./controllers/get_member_class')
const marking = require('./controllers/marking')
const get_mark = require('./controllers/get_mark')

const admz = require('adm-zip')

const app = express()

app.set('view engine', 'hbs')

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({ secret: '124447yd@@$%%#', cookie: { maxAge: 900000 }, saveUninitialized: false, resave: false }))

app.get('/', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})
app.post("/marking", marking)
app.post("/get_mark", get_mark)

app.post('/register', (req, res) => {
    const name = req.body.txtName
    const role = req.body.Role
    const pass = req.body.txtPassword
    const objectToInsert = {
        userName: name,
        role: role,
        password: pass
    }
    insertObject("Users", objectToInsert)
    res.redirect('/login')
})

app.post('/login', async(req, res) => {
    const name = req.body.txtName
    const pass = req.body.txtPass
    const role = await checkUserRole(name, pass)
    if (role == -1) {
        res.render('login')
    } else if (role == "Admin") {
        req.session["Admin"] = {
            name: name,
            role: role
        }
        res.redirect('/admin')

    } else if (role == "Student") {
        req.session["Student"] = {
            name: name,
            role: role
        }
        res.redirect('/student')
    } else if (role == "Teacher") {
        req.session["Teacher"] = {
            name: name,
            role: role
        }
        res.redirect('/teacher')
    }
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('login')
})


// download zip
app.get('/downloadzip', (req, res) => {
    var zp = new admz()
    const filename = req.query.filename

    zp.addLocalFile(__dirname + '/' + 'public/uploads' + '/' + filename)
    const file_downloaded = "" + filename.split('.')[0] + ".zip"

    const data = zp.toBuffer()

    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=${file_downloaded}`);
    res.set('Content-Length', data.length);
    res.send(data);
})

app.get('/downloadzipp', (req, res) => {
    var zp = new admz()
    const filename = req.query.filename

    zp.addLocalFile(__dirname + '/' + 'public/homework' + '/' + filename)
    const file_downloaded = "" + filename.split('.')[0] + ".zip"

    const data = zp.toBuffer()

    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=${file_downloaded}`);
    res.set('Content-Length', data.length);
    res.send(data);
})

const adminController = require('./controllers/admin')
app.use('/admin', adminController)

const studentController = require('./controllers/student')
app.use('/student', studentController)

const teacherController = require('./controllers/teacher')

app.use('/teacher', teacherController)
app.post("/get/member", get_member_class)
app.post("/join-class", join_class_by_link)

const PORT = process.env.PORT || 2000
app.listen(PORT)
console.log("Server is running! " + PORT)