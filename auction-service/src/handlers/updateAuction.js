import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';

let options = {};
if (process.env.IS_OFFLINE) {
  options = {
    region: 'localhost',
    endpoint: `http://localhost:${process.env.DDB_LOCAL_PORT}`
  };
}

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

const updateAuction = async (event, context) => {
  const { id } = event.pathParameters;
  const fields = event.body;
  const keys = Object.keys(fields);
  const now = new Date();
  let updatedAuction;

  let updateExpression = keys.map((key) => `${key} = :${key}`).join(','); // 'a = :a,b = :b,c = :c'
  updateExpression = updateExpression + ',updatedAt = :updatedAt';
  updateExpression = 'SET ' + updateExpression; // 'SET a = :a,b = :b,c = :c'

  const expressionAttributeValues = keys.reduce(
    (attrs, key) => {
      const attrName = `:${key}`;
      const attrValue = fields[key];
      return { ...attrs, [attrName]: attrValue }; // { ':a': a, ':b': b, ':c': c }
    },
    { ':updatedAt': now.toISOString() }
  );

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: 'attribute_exists(id)',
    ReturnValues: 'ALL_NEW' // return all modified objects
  };

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction)
  };
};

export const handler = commonMiddleware(updateAuction);
