const { insertObject, getDB } = require('../databaseHandler')

const get_member_class= async (req, res)=> {
    const dbo = await getDB();
    try {
        const allClass = await dbo.collection("Classes").findOne({ className: req.body.className })
        return res.status(200).json({allClass})
    } catch (error) {
        return res.json({error: error.message})
    }
}

module.exports= get_member_class