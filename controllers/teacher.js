const express = require('express')
const res = require('express/lib/response')
const { render } = require('express/lib/response')
const async = require('hbs/lib/async')
const multer = require('multer')
const path = require('path')
const { ObjectId } = require('mongodb')
const { insertObject, getDB, insertOne } = require('../databaseHandler')
const { requireTeacher } = require('../decentralization')
const { query } = require('express')
const router = express.Router()

router.use(express.static('public'))

router.get('/', requireTeacher, (req, res) => {
    const user = req.session["Teacher"]
    res.render('teacherIndex', { user: user })
})

var storages = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        var datetimestamp = Date.now()
        cb(null, file.fieldname + '_' + datetimestamp + path.extname(file.originalname))
    }
})

const fileFilters = (req, file, cb) => {
    var ext = path.extname(file.originalname)
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
        return cb(new Error('Please upload file png or jpg!'))
    }
    cb(null, true)
}

var uploads = multer({ storage: storages, fileFilter: fileFilters })

router.get('/profileTeacher', requireTeacher, async (req, res) => {
    const user = req.session["Teacher"]
    const dbo = await getDB()
    const tc = await dbo.collection("Teachers").findOne({ "userName": user.name })
    res.render('profileTeacher', { teacher: tc })
})

router.get('/editTeacher', requireTeacher, async (req, res) => {
    const user = req.session["Teacher"]
    const dbo = await getDB()
    const tc = await dbo.collection("Teachers").findOne({ "userName": user.name })
    res.render('editTeacher', { teacher: tc })
})

router.post('/editTeacher', uploads.array('myFile'), requireTeacher, async (req, res) => {
    const id = req.body.txtID
    const name = req.body.name
    const age = req.body.age
    const phone = req.body.phone
    const address = req.body.address
    const email = req.body.email
    const files = req.files
    const username = req.body.username

    const update = {
        $set: {
            name: name,
            age: age,
            address: address,
            phone_number: phone,
            email: email,
            files: files,
            userName: username
        }
    }

    const filter = { _id: ObjectId(id) }
    const dbo = await getDB();
    await dbo.collection("Teachers").updateOne(filter, update)
    const tc = await dbo.collection('Teachers').findOne({ _id: ObjectId(id) });

    res.redirect("profileTeacher")
})

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/homework')
    },
    filename: (req, file, cb) => {
        var datetimestamp = Date.now()
        cb(null, file.fieldname + '_' + datetimestamp + path.extname(file.originalname))
    }
})

const fileFilter = (req, file, cb) => {
    var ext = path.extname(file.originalname)
    if (ext !== '.doc' && ext !== '.docx' && ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
        return cb(new Error('Please upload doc png or docx!'))
    }
    cb(null, true)
}

var upload = multer({ storage: storage, fileFilter: fileFilter })

//Add Homework
router.get('/addHomework', requireTeacher, (req, res) => {
    const className = req.query.className
    console.log(className);
    res.render('addHomework', { className: className })
})



router.post('/addHomework', upload.array('myFiles'), requireTeacher, async (req, res) => {
    const dbo = await getDB();
    const className = req.body.className
    const title = req.body.title
    const files = req.files
    const comment = []
    const submitAss = []

    const assingment = {
        className: className,
        title: title,
        files: files,
        comment: comment,
        submitAss: submitAss
    }

    insertObject('HomeWork', assingment)
    res.redirect('detailClass?className=' + className)
})

router.get('/classesTeacher', requireTeacher, async (req, res) => {

    const user = req.session["Teacher"]
    const dbo = await getDB();
    const allClasses = await dbo.collection("Teachers").findOne({ userName: user.name })
    console.log("user", user)
    res.render('classesTeacher', { cls: allClasses, user: user })
})

//Detail homework
router.get('/detailHomework', requireTeacher, async (req, res) => {
    const title = req.query.title
    const user = req.session["Teacher"]
    const dbo = await getDB();
    const teacher = await dbo.collection("Teachers").findOne({ userName: user.name })

    const assignment = await dbo.collection('HomeWork').findOne({ title: title })
    console.log(title);
    res.render('detailHomework', { assignment: assignment, teacher: teacher })
})

router.get('/detailClass', requireTeacher, async (req, res) => {

    const className = req.query.className;
    const dbo = await getDB()
    const assignment = await dbo.collection('HomeWork').find({ className: className }).toArray();

    res.render('detailClass', { assignment: assignment, class: className });
})

router.get('/mark', requireTeacher, async (req, res) => {
    const title = req.query.title

    const dbo = await getDB()
    const mark = await dbo.collection('HomeWork').findOne({ title: title })
    res.render('mark', { mark: {...mark, title}, title: title })
})

router.get('/scoreStudent', requireTeacher, async (req, res) => {
    const student = req.query.student
    const className = req.query.className
    const title = req.query.title
    console.log("req query", req.query)
    const dbo = await getDB()
    const sub = await dbo.collection('HomeWork').findOne({ className: className })
    res.render('scoreStudent', { student:student, sub:sub, title: title })
})

router.post('/scoreStudent', requireTeacher, async (req, res) => {
    const title = req.body.txtTitle
    const score = req.body.score
    const student = req.body.txtStudent
    console.log(student);
    const dbo = await getDB()
    const a = await dbo.collection("HomeWork").findOne({title:title, 'submitAss.student':student});
    console.log(a);
    await dbo.collection("HomeWork").updateOne({title:title, student:student},{
        $set: {
            score:score
        }
    })

    res.redirect('/teacher/mark?title='+title)
})

router.post("/get_mark", async (req, res)=> {
    const dbo = await getDB();
    try {
        const allClass = await dbo.collection("HomeWork").findOne({ title: req.body.title,submitAss: {$elemMatch: {student: req.body.user_name}} })
        return res.status(200).json({allClass})
    } catch (error) {
        return res.json({error: error.message})
    }
})

router.post("/marking", async (req, res)=> {
    const dbo = await getDB();
    try {
        const allClass = dbo.collection("HomeWork").findOneAndUpdate({ title: req.body.title,submitAss: {$elemMatch: {student: req.body.user_name}} }, {$set: {"submitAss.$.score": req.body.score}})
        return res.status(200).json({allClass})
    } catch (error) {
        return res.json({error: error.message})
    }
})

router.post("/get/member", async (req, res)=> {
    const dbo = await getDB();
    try {
        const teacher = await dbo.collection('Teachers').find({ Classes: {$in: [req.body.className]} }).toArray();
        const member= await dbo.collection("Students").find({Classes: {$in: [req.body.className]}}).toArray()
        return res.status(200).json({ teacher, member})
    } catch (error) {
        return res.json({error: error.message})
    }
})

router.post("/join-class", async (req, res)=> {
    const dbo = await getDB();
    try {
        const allClass =await dbo.collection("Classes").updateOne({className : req.body.class_id }, {$push: {students: req.body.user}})
        return res.status(200).json({allClass})
    } catch (error) {
        return res.json({error: error.message})
    }
})

router.get('/members', requireTeacher, async (req, res) => {
    const className = req.query.className;
    const dbo = await getDB()
    const teacher = await dbo.collection('Teachers').find({ Classes: {$in: [className]} }).toArray();
    const member= await dbo.collection("Students").find({Classes: {$in: [className]}}).toArray()
    // for (let i = 0; i < student.length; i++) {
    //     const element = student[i];
    //     console.log(element);
    // }
    console.log(member)
    res.render('members', { teacher: teacher,member: member, class: className });
    
})

//Comment newspaper
router.post("/user-comment", async (req, res) => {
    console.log("connected comment");
    const account = req.session["Teacher"]

    const title = req.body.title;
    const comment = req.body.comment;
    console.log(title);
    console.log(comment);
    //date time current
    const d = new Date();
    var minutes = d.getMinutes();
    var formatDate = ""

    if (minutes > 9) {
        formatDate = [d.getHours(), d.getMinutes()].join(':') + ' ' + [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('/')
    } else {
        var minutes = '0' + minutes;
        formatDate = [d.getHours(), minutes].join(':') + ' ' + [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('/')
    }
    const date = formatDate;

    const db = await getDB();
    const user = await db.collection('Teachers').findOne({ 'userName': account.name })
    await db.collection('HomeWork').updateOne({ title: title }, {
        $push: {
            'comment': {
                "user": user.name,
                "comments": comment,
                "date": date
            }
        }
    })
    return;
})

module.exports = router;