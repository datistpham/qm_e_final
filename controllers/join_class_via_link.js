const { insertObject, getDB, ObjectId } = require('../databaseHandler')

const join_class_by_link=async (req, res)=> {
    const dbo = await getDB();
    try {
        const allClass = await dbo.collection("Classes").findOneAndUpdate({_id : ObjectId(req.body.class_id) }, {$push: {"studentsList": {name: req.body.user}}})
        return res.status(200).json({allClass})
    } catch (error) {
        return res.json({error: error.message})
    }
}
module.exports= join_class_by_link