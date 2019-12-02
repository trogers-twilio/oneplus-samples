exports.handler = async function (context, event, callback) {
  const client = Twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);
  const {
    taskAttributes,
    taskChannel,
    workflowSid
  } = event;
  const {
    TWILIO_WORKSPACE_SID
  } = context;

  console.log('Creating task.')
  console.log(`Workflow: ${workflowSid}`);
  console.log(`TaskChannel: ${taskChannel}`);
  console.log(`TaskAttributes: ${taskAttributes}`);
  let task;
  try {
    task = await client.taskrouter
      .workspaces(TWILIO_WORKSPACE_SID)
      .tasks
      .create({
          attributes: taskAttributes,
          taskChannel,
          workflowSid
        });
    console.log('Created task', task.sid);
  } catch (error) {
    console.error('Error creating task.', error);
    return callback(error, null);
  }
  
  const response = {
    status: 200,
    taskSid: task.sid
  };
  return callback(null, response);
};