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
    ['getMany' + name]: async function(
      query,
      { page = 0, limit = 10, populate = [], pagination = true } = {}
    ) {
      if (pagination) {
        page = Number(page);
        limit = Number(limit);

        // skip and limit
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
          model.countDocuments(query)
        ]);
        // pager
        const pager = {
          page: page,
          total: count,
          page_size: limit,
          total_page: Math.ceil(count / limit)
        };
        return { data: list || [], pager };
      } else {
        return model
          .find(query)
          .lean()
          .exec();
      }
    },
    ['create' + name]: function(doc, mode = 'create') {
      if (mode === 'create') {
        return model.create(doc);
      } else if (mode === 'save') {
        const newObj = new model(doc);
        return newObj.save();
      }
    },
    ['createMany' + name]: function(docs) {
      return model.insertMany(docs);
    },
    ['update' + name]: function(conditions, data, options) {
      return model.findOneAndUpdate(conditions, data, {
        new: true,
        setDefaultsOnInsert: true,
        upsert: false,
        ...options
      });
    },
    ['updateMany' + name]: function(conditions, data, options = {}) {
      return model.updateMany(conditions, data, {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
        ...options
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

module.exports = { declareHook, declareCRUD };
