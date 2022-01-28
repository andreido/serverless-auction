import { AUCTION_STATES } from '../../constants';

const schema = {
  type: 'object',
  properties: {
    queryStringParameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [...Object.values(AUCTION_STATES), '*'],
          default: '*'
        }
      }
    }
  },
  required: ['queryStringParameters']
};

export default schema;
