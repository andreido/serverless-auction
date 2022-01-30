import middy from '@middy/core';
import httpBodyParser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';

const middlewares = [
  httpBodyParser(), // parses HTTP requests with a JSON body and converts the body into an object
  httpEventNormalizer(), // normalizes the API Gateway event by making sure event.queryStringParameters and event.pathParameters exist as EMPTY objects ({}) when no such parameters are provided (reduces room for error and if-statements)
  httpErrorHandler() // creates a proper HTTP response for errors that are created with the http-errors module and represents proper HTTP errors (results in cleaner HTTP error responses)
];

export default (handler) => middy(handler).use(middlewares);
