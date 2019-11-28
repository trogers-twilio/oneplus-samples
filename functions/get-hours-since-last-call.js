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

  let calls;
  try {
    calls = await client.calls
      .list({
        from: e164PhoneNumber,
        limit: 2
      });
  } catch (error) {
    const message = (`Error getting calls for ${e164PhoneNumber}.`, error);
    return callback(message, null);
  }

  // Since this function will be called from Studio during an active call,
  // the second call in the array (index 1) is the most recent call before this one
  const mostRecentCall = calls[1];
  if (!mostRecentCall) {
    const message = `No calls found for phone number ${e164PhoneNumber}`;
    console.log(message);
    return callback(message, null);
  }
  console.log('Most recent call:', mostRecentCall);

  const startDate = mostRecentCall.dateCreated;

  const timeDifferenceMilliseconds = Date.now() - Date.parse(startDate);
  const timeDifferenceHours = timeDifferenceMilliseconds / 1000 / 3600;

  console.log(`Milliseconds since last call from ${e164PhoneNumber}:`, timeDifferenceMilliseconds);
  console.log(`Hours since last call from ${e164PhoneNumber}:`, timeDifferenceHours);
  
  const response = {
    hours: timeDifferenceHours
  };
  return callback(null, response);
};