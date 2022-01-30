const bodySchema = {
  type: 'object',
  properties: {
    amount: {
      type: 'number',
      default: 0,
      exclusiveMinimum: 0
    }
  },
  required: ['amount']
};

const pathParametersSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string'
    }
  },
  required: ['id']
};

const schema = {
  type: 'object',
  properties: {
    body: bodySchema,
    pathParameters: pathParametersSchema
  },
  required: ['body', 'pathParameters']
};

export default schema;
