const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

/**
 * Declare CRUD for mongoose model
 * @param {mongoose.Model} model
 * @param {string} name
 *
 */

function declareCRUD(model, name) {
  const result = {
    /**
     * Get one document
     */
    ['get' + name]: function(conditions, populates = []) {
      const task = model.findOne(conditions);
      populates.forEach(field => {
        task.populate(field);
      });
      return task.lean().exec();
    },
    /**
     * Get Many
     */
    ['getMany' + name]: async function(query, { page, limit, populate }) {
      populate = populate || [];
      page = Number(page) || 0;
      limit = Number(limit) || 10;
      // create task
      const task = model
        .find(query)
        .skip(limit * page)
        .limit(limit);
      // populates
      populate.forEach(field => {
        task.populate(field);
      });
      const [list, count] = await Promise.all([
        task.lean().exec(),
        model.count(query)
      ]);
      // pager
      const pager = {
        page: page,
        total: count,
        page_size: limit,
        total_page: Math.ceil(count / limit)
      };
      return { data: list || [], pager };
    },
    ['create' + name]: function(docs) {
      return model.create(docs);
    },
    ['createMany' + name]: function(docs) {
      return model.insertMany(docs);
    },
    ['update' + name]: function(conditions, data, upsert = false) {
      return model.findOneAndUpdate(conditions, data, {
        new: true,
        setDefaultsOnInsert: true,
        upsert
      });
    },
    ['updateMany' + name]: function(conditions, data, create = false) {
      return model.updateMany(conditions, data, {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true
      });
    },
    ['delete' + name]: function(conditions) {
      return model.deleteOne(conditions);
    },
    ['deleteMany' + name]: function(conditions) {
      return model.deleteMany(conditions);
    }
  };

  return result;
}

/**
 * @param {mongoose.Schema} schema
 * @param {string} schemaName
 *
 */

function declareHook(schema, schemaName = '') {
  if (process.env.NODE_ENV === 'production') return;
  // pre updateOne
  schema.pre('updateOne', function(next) {
    _log(
      `{${schemaName}} pre updateOne`,
      '\n--conditions: \n',
      this.getQuery(),
      '\n--data: \n',
      this.getUpdate()
    );
    next();
  });
  // pre updateMany
  schema.pre('updateMany', function(next) {
    _log(
      `{${schemaName}} pre updateMany`,
      '\n--conditions: \n',
      this.getQuery(),
      '\n--data: \n',
      this.getUpdate()
    );
    next();
  });
  // pre save
  schema.pre('save', function(next) {
    _log(`{${schemaName}} pre save: \n`, this.toObject());
    if (schemaName === 'Tag') {
    }
    next();
  });
}

/**
 *
 * @param {{host:string,user:string,pass:string,dbName:string,port:number}} config
 * @param {*} options
 * @returns {mongoose.Mongoose}
 */

async function connectDatabase(config, options) {
  // make db connect
  const { host, user, pass, dbName, port } = config;
  let uri = `mongodb://${host}:${port}/${dbName}`;
  let options = options || {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    user,
    pass
  };
  options = params || options;

  // Connect mongoose
  return new Promise((resolve, reject) => {
    mongoose
      .connect(uri, options)
      .then(instance => {
        console.log('database connect success');
        resolve(instance);
      })
      .catch(error => {
        console.log('Connect database failure', '\n', error);
        reject();
      });
  });
}

module.exports = { connectDatabase, declareHook, declareCRUD };
