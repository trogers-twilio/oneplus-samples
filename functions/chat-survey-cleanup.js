exports.handler = async function (context, event, callback) {
  const client = Twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);
  const {
    chatChannelAttributes,
    chatChannelSid,
    taskSid
  } = event;
  const {
    TWILIO_CHAT_SERVICE_SID,
    TWILIO_PROXY_SERVICE_SID,
    TWILIO_WORKSPACE_SID
  } = context;

  console.log('ChatChannelSid:', chatChannelSid);

  const parsedAttributes = chatChannelAttributes && JSON.parse(chatChannelAttributes);
  if (!parsedAttributes) {
    const message = 'No channel attributes available. Not proceeding with channel update';
    return callback(message, null);
  }
  console.log('Parsed ChatChannelAttributes:', parsedAttributes);

  const proxySessionSid = parsedAttributes && parsedAttributes.proxySession;

  console.log('Deleting proxy session', proxySessionSid);
  try {
    const proxyDeleteResponse = await client.proxy
      .services(TWILIO_PROXY_SERVICE_SID)
      .sessions(proxySessionSid)
      .remove()
    console.log(`Proxy session deleted`);
  } catch (error) {
    console.error('Error deleting proxy session.', error);
  }

  console.log(`Changing chat channel ${chatChannelSid} to INACTIVE`);
  parsedAttributes.status = 'INACTIVE';
  delete parsedAttributes.proxySession;
  try {
    const updateChatResponse = await client.chat
      .services(TWILIO_CHAT_SERVICE_SID)
      .channels(chatChannelSid)
      .update({ attributes: JSON.stringify(parsedAttributes)});
    console.log(`Chat channel ${updateChatResponse && updateChatResponse.sid} updated`);
  } catch (error) {
    console.error('Error updating chat channel.', error);
  }

  console.log(`Cancelling survey task ${taskSid}`);
  try {
    await client.taskrouter
      .workspaces(TWILIO_WORKSPACE_SID)
      .tasks(taskSid)
      .update({
        assignmentStatus: 'canceled',
        reason: 'Survey complete'
      });
    console.log('Survey task cancelled');
  } catch (error) {
    console.error(`Error cancelling task ${taskSid}.`, error);
  }
  
  const response = {
    status: 200
  };
  return callback(null, response);
};