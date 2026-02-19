const { customFieldsService } = require("../../shared/services/custom-fields");

function listDefinitions(req, res, next) {
  try {
    const defs = customFieldsService.getDefinitions(req.query.entityType);
    res.json(defs);
  } catch (err) {
    next(err);
  }
}

function createDefinition(req, res, next) {
  try {
    const def = customFieldsService.defineField({
      entityType: req.body.entityType,
      name: req.body.name,
      fieldType: req.body.fieldType,
      options: req.body.options,
      createdBy: req.userId,
    });
    res.status(201).json(def);
  } catch (err) {
    next(err);
  }
}

function updateDefinition(req, res, next) {
  try {
    const def = customFieldsService.updateDefinition(parseInt(req.params.id, 10), req.body);
    res.json(def);
  } catch (err) {
    next(err);
  }
}

function removeDefinition(req, res, next) {
  try {
    customFieldsService.removeDefinition(parseInt(req.params.id, 10));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

function getValues(req, res, next) {
  try {
    const values = customFieldsService.getValues(req.params.entityType, parseInt(req.params.entityId, 10));
    res.json(values);
  } catch (err) {
    next(err);
  }
}

function setValues(req, res, next) {
  try {
    const values = customFieldsService.setValues(
      req.params.entityType,
      parseInt(req.params.entityId, 10),
      req.body.fields
    );
    res.json(values);
  } catch (err) {
    next(err);
  }
}

module.exports = { listDefinitions, createDefinition, updateDefinition, removeDefinition, getValues, setValues };
