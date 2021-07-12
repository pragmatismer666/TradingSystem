const { MongoClient, ObjectId } = require('mongodb')
const connectionUrl = "mongodb://admin:admin@159.65.57.176:27017/m_bot";
const dbName = 'm_bot';
let db;

const init = () =>
  MongoClient.connect(connectionUrl, { useNewUrlParser: true,useUnifiedTopology: true }).then((client) => {
    db = client.db(dbName)
  })

const insertItem = (item,coll_name) => {
  const tbl_user = db.collection(coll_name)
  return tbl_user.insertOne(item)
}

const getItems = (coll_name) => {
  const collection = db.collection(coll_name)
  return collection.find({}).toArray()
}

const getItemsAsync = async(coll_name) => {
  return await db.collection(coll_name).find({}).toArray()
}

const distinctItems = async(key,coll_name) => {
  return await db.collection(coll_name).distinct(key);
}

const distinctQuery = async(key,query,coll_name) => {
  return await db.collection(coll_name).distinct(key,query);
}

const findoneSync = (key,coll_name) => {
  const collection = db.collection(coll_name)
  return collection.find({_id:ObjectId(key)}).toArray()
}

const findone = async(key,coll_name) => {  
  return await db.collection(coll_name).find(key).toArray();
}

const updateQuantity = async(key,newvalue,coll_name) => {
  return await db.collection(coll_name).updateOne(key,{$set:newvalue})
}

const removeItems = async(key,coll_name) => {
  return await db.collection(coll_name).deleteOne(key);
}

module.exports = { init, insertItem, getItems, removeItems, distinctItems, distinctQuery, findone, updateQuantity, getItemsAsync}
