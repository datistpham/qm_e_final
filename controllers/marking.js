const { insertObject, getDB } = require('../databaseHandler')

const marking= async (req, res)=> {
    const dbo = await getDB();
    try {
        const allClass = dbo.collection("HomeWork").findOneAndUpdate({ title: req.body.title,submitAss: {$elemMatch: {student: req.body.user_name}} }, {$set: {"submitAss.$.score": req.body.score}})
        return res.status(200).json({allClass})
    } catch (error) {
        return res.json({error: error.message})
    }
}

module.exports= marking