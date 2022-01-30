import jwt from 'jsonwebtoken';

/**
 * By default, API Gateway authorizations are cached (TTL) for 300 seconds
 *
 * This policy will authorize all requests to the same API Gateway instance where
 * the request is coming from, thus being efficient and optimizing costs
 *
 * A policy is generated only after the token has been verified!
 *
 * @param {string} principalId auth0 user_id
 * @param {string} methodArn arn:aws:execute-api:region:account-id:api-id/stage-name/HTTP-VERB/resource-path-specifier
 * @returns iam policy document and principalId
 */
const generatePolicy = (principalId, methodArn) => {
  const apiGatewayWildcard = methodArn.split('/', 2).join('/') + '/*'; // arn:aws:execute-api:region:account-id:api-id/stage-name/*

  /**
   * Allows the invocation of ANY lambda functions that are integrated in the
   * same target API Gateway as the function being triggered (iow: triggered
   * by http events in the same APIG)
   *
   * i.e. if you send a createAuction request and you are succesfully authorized,
   * then you will also be authorized to execute any other lambda function in the
   * auction service APIG for the next 300 seconds (won't have to re-authorize for
   * each request, which lowers the number of lambda executions for each user)
   */
  const policy = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: 'execute-api:Invoke',
          Resource: apiGatewayWildcard // any lambda function in the target API Gateway
        }
      ]
    }
  };

  return policy;
};

/**
 * An API Gateway Lambda authorizer that verifies the signature of the
 * authorization (Bearer) token in the headers of every incoming request
 * - Authorizers enable you to control access to your APIs using
 *   Cognito User Pools or (in our case) a Lambda function
 *
 * - When run, the authorizer will verify if the token's signature is valid
 *    - If the signature is valid, the request will be allowed through to
 *      execute a target lambda function (i.e. createAuction, placeBid, etc.)
 *      - The authorized request will contain the user details in the claims of that token
 *    - If the signature is invalud, then a 401-Unauthorized error is thrown
 */
const authorizer = async (event, context) => {
  if (!event.authorizationToken) throw 'Unauthorized';

  const token = event.authorizationToken.replace('Bearer ', '');

  try {
    const claims = jwt.verify(token, process.env.AUTH0_PUBLIC_KEY);
    const policy = generatePolicy(claims.principalId, event.methodArn); // claims.sub = auth0 user_id

    return {
      ...policy,
      context: claims // exposes the user details (jwt claims) in event.requestContext of target lambda function
    };
  } catch (error) {
    console.error(error);
    throw 'Unauthorized';
  }
};

export const handler = authorizer;
