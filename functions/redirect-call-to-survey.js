const nodeFetch = require('node-fetch');

async function getAuthentication(token, context) {

	console.log('Validating request token');

	const tokenValidationApi = `https://${context.ACCOUNT_SID}:${context.AUTH_TOKEN}@iam.twilio.com/v1/Accounts/${context.ACCOUNT_SID}/Tokens/validate`;

	const fetchResponse = await nodeFetch(tokenValidationApi, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			token
		})
	});

	const tokenResponse = await fetchResponse.json();
	return tokenResponse;
}

exports.handler = async function (context, event, callback) {
  const client = Twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);
  const response = new Twilio.Response();

  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  const tokenResponse = await getAuthentication(event.token, context);

  if (tokenResponse.valid) {
    const { callSid, language, taskSid } = event;
    const { POST_CALL_SURVEY_URL } = context;

    try {
      const updateCallResult = await client
      .calls(callSid)
      .update({
        url: (
          `${POST_CALL_SURVEY_URL}`
          + `?Language=${language}`
          + `&TaskSid=${taskSid}`
          + `&Step=greeting`
        )
      })
      console.log('Update call result:', updateCallResult)
      response.setBody({ 
        status: 200,
        message: `Call ${callSid} updated successfully`
      });
    } catch (error) {
      response.setStatusCode(500);
      response.setBody({ 
        status: 500,
        error
      });
    }
  } else {
		response.setStatusCode(401);
		response.setBody({
			status: 401,
			message: 'Your authentication token failed validation',
		});
  }

  callback(null, response);
};