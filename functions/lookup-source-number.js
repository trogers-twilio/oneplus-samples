exports.handler = async function (context, event, callback) {
  const client = Twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);

  const { phoneNumber } = event;
  console.log('Received request for phoneNumber', phoneNumber);

  if (!phoneNumber) {
    const message = `Request missing 'phoneNumber' parameter`;
    console.log(message);
    return callback(message, null);
  }

  const firstCharacter = phoneNumber.slice(0, 1);
  const e164StartingCharacter = '+';
  let e164PhoneNumber;
  if (firstCharacter !== e164StartingCharacter) {
    const indexOfE164StartingCharacter = phoneNumber.indexOf(e164StartingCharacter);
    e164PhoneNumber = indexOfE164StartingCharacter === -1
      ? undefined
      : phoneNumber.slice(indexOfE164StartingCharacter); 
  } else {
    e164PhoneNumber = phoneNumber;
  }

  if (!e164PhoneNumber) {
    const message = `Invalid 'phoneNumber' parameter: ${phoneNumber}. Must include an E.164 formatted number`;
    console.log(message);
    return callback(message, null);
  }

  let lookup;
  try {
    lookup = await client.lookups
      .phoneNumbers(phoneNumber)
      .fetch();
    console.log('Lookup response:', lookup);
  } catch (error) {
    const message = (`Error performing lookup for ${phoneNumber}.`, error);
    return callback(message, null);
  }
  
  const response = {
    ...lookup
  };
  delete response._version;
  delete response._solution;
  return callback(null, response);
};