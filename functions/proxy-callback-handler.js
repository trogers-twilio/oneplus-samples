const getWorkerFullName = async (client, context, friendlyName) => {
  let workers;
  try {
    // If running this in a stateful backend, could list all the workers and cache them.
    // You could then search your local cache first, and if you don't find a matching worker,
    // fetch the full worker list again, update your cache, and again look for a match.
    workers = await client.taskrouter
      .workspaces(context.TWILIO_WORKSPACE_SID)
      .workers
      .list({ friendlyName });
    console.log('Retrieved workers');
  } catch (error) {
    console.error(`Error retrieving workers for friendlyName ${friendlyName}.`, error);
    return friendlyName;
  }

  if (!Array.isArray(workers) || workers.length === 0) {
    console.error('Did not find any workers matching friendlyName', friendlyName);
    return friendlyName;
  }
  if (workers.length > 1) {
    console.error('More than one worker matching friendlyName', friendlyName);
    return friendlyName;
  }

  const worker = workers[0];
  const workerAttributes = worker && JSON.parse(worker.attributes);
  const workerFullName = workerAttributes && workerAttributes.full_name;

  if (!workerFullName) {
    console.error('No full_name attribute for worker matching friendlyName', friendlyName);
    return friendlyName;
  }

  return workerFullName;
};

exports.handler = async function (context, event, callback) {
  const client = Twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);
  const response = {};

  const CHAT_MESSAGE_SID_PREFIX = 'IM';
  const CHAT_CHANNEL_SID_PREFIX = 'CH';
  
  const ChatMemberTypes = {
    agent: 'agent',
    guest: 'guest',
  };
  const ResourceStatuses = {
    delivered: 'delivered'
  };

  const {
    inboundParticipantSid,
    inboundResourceSid,
    inboundResourceStatus,
    interactionDateUpdated,
    interactionServiceSid,
    interactionSessionSid,
    outboundParticipantSid,
    outboundResourceSid,
    outboundResourceStatus,
  } = event;
  console.log('Received proxy event for session', interactionSessionSid);

  if (inboundResourceStatus !== ResourceStatuses.delivered
    || outboundResourceStatus !== ResourceStatuses.delivered
  ) {
    console.log('Waiting for message delivery. Nothing further to do.');
    return callback(null, response);
  }

  const chatMessageSid = inboundResourceSid.slice(0, 2) === CHAT_MESSAGE_SID_PREFIX
    ? inboundResourceSid
    : outboundResourceSid;

  let proxySession;
  try {
    // If running this in a stateful backend, could cache the proxySession so you
    // don't need to retrieve it again for future messages if you already have it
    proxySession = await client.proxy
      .services(interactionServiceSid)
      .sessions(interactionSessionSid)
      .fetch();
    console.log('Retrieved proxy session');
  } catch (error) {
    console.error(`Error retrieving proxy session ${interactionSessionSid}.`, error);
    return callback(error, null);
  }

  let proxyParticipants;
  try {
    // If running this in a stateful backend, could cache the proxyParticipants so you
    // don't need to retrieve them again for future messages if you already have them.
    proxyParticipants = await client.proxy
      .services(interactionServiceSid)
      .sessions(interactionSessionSid)
      .participants
      .list();
    console.log('Retrieved proxy participants');
  } catch (error) {
    console.error(`Error retrieving proxy participants for session ${interactionSessionSid}.`, error);
    return callback(error, null);
  }

  const chatChannelSid = proxySession && proxySession.uniqueName;
  if (!chatChannelSid || chatChannelSid.slice(0, 2) !== CHAT_CHANNEL_SID_PREFIX) {
    const error = `Proxy session uniqueName is not a chat channel sid: ${chatChannelSid}`;
    console.error(error);
    return callback(error, null);
  }

  let chatMembers;
  try {
    // If running this in a stateful backend, could cache the chatMembers so you
    // don't need to retrieve them again for future messages if you already have them.
    chatMembers = await client.chat
      .services(context.TWILIO_CHAT_SERVICE_SID)
      .channels(chatChannelSid)
      .members
      .list();
    console.log('Retrieved chat members');
  } catch (error) {
    console.error(`Error retrieving chat members for channel ${chatChannelSid}`, error);
    return callback(error, null);
  }
  
  let chatMessage;
  try {
    chatMessage = await client.chat
      .services(context.TWILIO_CHAT_SERVICE_SID)
      .channels(chatChannelSid)
      .messages(chatMessageSid)
      .fetch();
    console.log('Retrieved chat message');
  } catch (error) {
    console.error(`Error retrieving chat message ${chatMessageSid} on channel ${chatChannelSid}`, error);
    return callback(error, null);
  }

  const { attributes, body, from } = chatMessage;

  // If you're using a stateful backend and have cached the chat members but you don't
  // find a match, then update your cache with the current chat members list and
  // search again for a match.
  const chatMember = chatMembers.find(m => m.identity === from);
  const chatMemberAttributes = chatMember && JSON.parse(chatMember.attributes);
  const chatMemberType = chatMemberAttributes && chatMemberAttributes.member_type;
  
  let chatMemberName;
  switch (chatMemberType) {
    case ChatMemberTypes.agent: {
      chatMemberName = await getWorkerFullName(client, context, from);
      break;
    }
    case ChatMemberTypes.guest: {
      // If you're using a stateful backend and have cached the participants but you don't
      // find a match, then update your cache with the current proxy participant list and
      // search again for a match.
      const proxyParticipant = proxyParticipants.find(p => p.sid === inboundParticipantSid);
      chatMemberName = proxyParticipant && proxyParticipant.identifier;
      break;
    }
    default: {
      // If it's not the agent or the guest, then assuming message was automated
      chatMemberName = 'System';
    }
  }

  // This is the cleaned up chat message with a clearly identified sender and message
  // attributes. This could then be written to the appropriate RightNow record.
  const normalizedChatMessage = {
    timestamp: interactionDateUpdated,
    sender: chatMemberName,
    body,
    attributes
  };

  console.log(`New chat message:`);
  Object.keys(normalizedChatMessage).forEach(key => {
    console.log(`${key}: ${normalizedChatMessage[key]}`);
  })

  return callback(null, response);
};