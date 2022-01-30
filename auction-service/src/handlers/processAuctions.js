import createError from 'http-errors';
import getExpiredAuctions from '../lib/getExpiredAuctions';
import closeAuction from '../lib/closeAuction';

const processAuctions = async (event, context) => {
  try {
    const expiredAuctions = await getExpiredAuctions();
    const closePromises = expiredAuctions.map((expiredAuction) =>
      closeAuction(expiredAuction.id)
    );
    await Promise.all(closePromises);

    return { closed: closePromises.length }; // not http response, so structure does not matter
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
};

export const handler = processAuctions;
