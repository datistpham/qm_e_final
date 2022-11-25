const { insertObject, getDB } = require('../databaseHandler')

const get_mark= async (req, res)=> {
    const dbo = await getDB();
    try {
        const allClass = await dbo.collection("HomeWork").findOne({ title: req.body.title,submitAss: {$elemMatch: {student: req.body.user_name}} })
        return res.status(200).json({allClass})
    } catch (error) {
        return res.json({error: error.message})
    }
}

module.exports= get_mark