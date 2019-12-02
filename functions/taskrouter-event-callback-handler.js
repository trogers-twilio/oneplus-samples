const TaskEvents = {
  wrapup: 'task.wrapup',
}

const ChannelTypes = {
  whatsapp: 'whatsapp'
};

const successHandler = (callback, props) => {
  const response = {
    ...props,
    status: 200
  };
  return callback(null, response);
}

const sendChatSurveyRequest = async (client, attributes) => {
  const { name, toNumber } = attributes;
  console.log(`Sending survey request to ${name} from ${toNumber}`);
  try {
    const body = 'Would you be willing to take a brief two question survey? '
      + "Please reply 'yes' or 'no'.";
    const message = await client.messages
      .create({
        body,
        from: toNumber,
        to: name
      });
    console.log('Message sent. SID:', message && message.sid);
  } catch (error) {
    console.error('Error sending survey request.', error);
  }
};

const handleTaskWrapup = async (context, event, callback) => {
  const client = context.getTwilioClient();
  const { TaskAttributes } = event;

  const attributes = TaskAttributes && JSON.parse(TaskAttributes);
  if (!attributes) {
    return callback('No task attributes to evaluate', null);
  }
  const { channelType } = attributes;
  switch (channelType) {
    case ChannelTypes.whatsapp: {
      await sendChatSurveyRequest(client, attributes);
      return successHandler(callback);
    }
  }
};

exports.handler = async function(context, event, callback) {
  const { EventType, TaskQueueName, TaskSid } = event;
  console.log('EventType:', EventType);
  console.log('TaskQueueName:', TaskQueueName);

  switch (EventType) {
    case TaskEvents.wrapup:
      return handleTaskWrapup(context, event, callback);
    default:
      // nothing to do here
  }

  return successHandler(callback);
};
