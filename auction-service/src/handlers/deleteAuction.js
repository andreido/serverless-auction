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

const deleteAuction = async (event, context) => {
  const { id } = event.pathParameters;
  let deletedAuction;

  try {
    const result = await dynamodb
      .delete({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        ReturnValues: 'ALL_OLD'
      })
      .promise();
    deletedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  if (!deletedAuction) {
    throw new createError.NotFound(`Auction with ID "${id}" was not found!`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(deletedAuction)
  };
};

export const handler = commonMiddleware(deleteAuction);
